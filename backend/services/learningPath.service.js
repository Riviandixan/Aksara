const { pool }           = require('../config/db');
const { generateContent } = require('../config/ai');

// --- AI Prompt ---
function buildPrompt(languageName, baseLevel) {
  return `
You are a language learning curriculum designer.
Generate a structured learning path for a ${baseLevel} student learning ${languageName}.

Return ONLY a valid JSON array of 8 topic objects, no explanation, no markdown.
Each object must have:
- "order_index": number (1-8)
- "title": short topic name (max 5 words)
- "description": one sentence explaining what will be learned

Example format:
[{"order_index":1,"title":"Greetings & Introductions","description":"Learn basic greetings and how to introduce yourself."}]
`.trim();
}

// --- Generate via Gemini & simpan ke DB ---
async function generateLearningPath(userId, languageId, baseLevel) {
  // Cek apakah path untuk bahasa ini sudah ada
  const [existing] = await pool.query(
    'SELECT id FROM learning_paths WHERE user_id = ? AND language_id = ? AND base_level = ? LIMIT 1',
    [userId, languageId, baseLevel]
  );
  if (existing.length) {
    const err = new Error('Learning path for this language already exists');
    err.status = 409;
    throw err;
  }

  // Ambil nama bahasa untuk prompt
  const [langRows] = await pool.query(
    'SELECT name FROM languages WHERE id = ? LIMIT 1',
    [languageId]
  );
  if (!langRows[0]) {
    const err = new Error('Language not found');
    err.status = 404;
    throw err;
  }

  // Generate topics dari AI
  const result  = await generateContent(buildPrompt(langRows[0].name, baseLevel));
  const rawText = result.response.text();

  // Toleran terhadap teks tambahan — ekstrak array JSON
  const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!match) throw new Error('AI returned invalid JSON format');
  const topics = JSON.parse(match[0]);

  // Simpan ke DB dalam satu transaksi
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [path] = await conn.query(
      'INSERT INTO learning_paths (user_id, language_id, base_level) VALUES (?, ?, ?)',
      [userId, languageId, baseLevel]
    );
    const pathId = path.insertId;

    // Bulk insert levels — Level 1 langsung unlocked, sisanya locked
    const levelValues = topics.map((t) => [
      pathId,
      t.order_index,
      t.title,
      t.description,
      t.order_index === 1 ? 'unlocked' : 'locked',
    ]);
    await conn.query(
      'INSERT INTO levels (learning_path_id, order_index, title, description, status) VALUES ?',
      [levelValues]
    );

    await conn.commit();
    return getLearningPath(userId, pathId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// --- Ambil learning path beserta levels ---
async function getLearningPath(userId, pathId) {
  const [paths] = await pool.query(
    `SELECT lp.id, lp.base_level, lp.created_at,
            l.id AS language_id, l.name AS language_name, l.flag_emoji
     FROM learning_paths lp
     JOIN languages l ON l.id = lp.language_id
     WHERE lp.id = ? AND lp.user_id = ? LIMIT 1`,
    [pathId, userId]
  );
  if (!paths[0]) {
    const err = new Error('Learning path not found');
    err.status = 404;
    throw err;
  }

  const [levels] = await pool.query(
    'SELECT id, order_index, title, description, status FROM levels WHERE learning_path_id = ? ORDER BY order_index',
    [pathId]
  );

  return { ...paths[0], levels };
}

// --- Ambil semua learning path milik user ---
async function getUserLearningPaths(userId) {
  const [paths] = await pool.query(
    `SELECT lp.id, lp.base_level, lp.created_at,
            l.id AS language_id, l.name AS language_name, l.flag_emoji,
            COUNT(lv.id)                                        AS total_levels,
            SUM(lv.status = 'completed')                        AS completed_levels
     FROM learning_paths lp
     JOIN languages l  ON l.id  = lp.language_id
     LEFT JOIN levels lv ON lv.learning_path_id = lp.id
     WHERE lp.user_id = ?
     GROUP BY lp.id
     ORDER BY lp.created_at DESC`,
    [userId]
  );
  return paths;
}

module.exports = { generateLearningPath, getLearningPath, getUserLearningPaths };
