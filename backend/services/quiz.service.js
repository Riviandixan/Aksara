const { pool }            = require('../config/db');
const { generateContent } = require('../config/ai');

const XP_PER_CORRECT  = 10;
const PASS_THRESHOLD  = 70; // % minimum untuk unlock level berikutnya

// --- Prompt builder ---
function buildQuizPrompt(levelTitle, languageName, baseLevel) {
  return `
You are a language quiz generator for ${languageName} learners at ${baseLevel} level.
Generate exactly 5 quiz questions for the topic: "${levelTitle}".

Return ONLY a valid JSON array of 5 objects. Each object must have:
- "order_index": number (1-5)
- "type": one of "multiple_choice", "translate", "word_arrange"
- "question_data": object based on type:
  - multiple_choice: { "question": string, "options": [4 strings], "correct_answer": string }
  - translate: { "sentence": string (a sentence in ${languageName}), "correct_answer": string (the Indonesian translation of that sentence) }
  - word_arrange: { "words": [shuffled array of ${languageName} words WITHOUT any punctuation], "correct_answer": string (the correct ${languageName} sentence WITHOUT any punctuation) }

IMPORTANT rules:
- For "translate" type: the sentence MUST be in ${languageName}, and correct_answer MUST be the Indonesian (Bahasa Indonesia) translation.
- For "word_arrange" type: all words and the correct_answer MUST be in ${languageName}.
- For "multiple_choice" type: question and all options MUST be in ${languageName} or about ${languageName}.
- Mix the types. Make questions appropriate for the topic and level.
- Return ONLY the JSON array, no explanation, no markdown, no extra text.
- Ensure all strings are properly escaped for JSON (especially for non-Latin scripts like Korean, Japanese, etc.).
`.trim();
}

// --- Generate & simpan soal ke DB ---
async function generateQuizzes(userId, levelId) {
  // Verifikasi level milik user dan statusnya unlocked
  const [levelRows] = await pool.query(
    `SELECT l.id, l.title, l.status, lp.base_level,
            lang.name AS language_name
     FROM levels l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     JOIN languages lang ON lang.id = lp.language_id
     WHERE l.id = ? AND lp.user_id = ? LIMIT 1`,
    [levelId, userId]
  );
  const level = levelRows[0];
  if (!level) {
    const err = new Error('Level not found'); err.status = 404; throw err;
  }
  if (level.status === 'locked') {
    const err = new Error('Level is locked'); err.status = 403; throw err;
  }

  // Kalau soal sudah ada, langsung return (tidak generate ulang)
  const [existing] = await pool.query(
    'SELECT id, type, question_data, order_index FROM quizzes WHERE level_id = ? ORDER BY order_index',
    [levelId]
  );
  if (existing.length) return existing.map(sanitizeQuiz);

  // Generate via AI
  const result    = await generateContent(buildQuizPrompt(level.title, level.language_name, level.base_level));
  const rawText   = result.response.text();

  // Parse JSON — coba langsung dulu, lalu fallback regex
  let questions;
  try {
    const parsed = JSON.parse(rawText);
    // response_format json_object bisa wrap dalam object
    questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || Object.values(parsed)[0]);
  } catch {
    const match = rawText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (!match) {
      console.error('AI raw response:', rawText);
      throw new Error('AI returned invalid JSON format');
    }
    questions = JSON.parse(match[0]);
  }
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error('AI returned invalid JSON format');
  }

  // Bulk insert
  const values = questions.map((q) => [levelId, q.type, JSON.stringify(q.question_data), q.order_index]);
  await pool.query(
    'INSERT INTO quizzes (level_id, type, question_data, order_index) VALUES ?',
    [values]
  );

  const [inserted] = await pool.query(
    'SELECT id, type, question_data, order_index FROM quizzes WHERE level_id = ? ORDER BY order_index',
    [levelId]
  );
  return inserted.map(sanitizeQuiz);
}

// Kirim correct_answer ke client — learning path quiz butuh feedback langsung per soal
function sanitizeQuiz(quiz) {
  const data = typeof quiz.question_data === 'string'
    ? JSON.parse(quiz.question_data)
    : quiz.question_data;

  return { id: quiz.id, type: quiz.type, order_index: quiz.order_index, question_data: data };
}

// --- Submit & validasi jawaban ---
async function submitAnswers(userId, levelId, answers) {
  // Ambil semua soal beserta correct_answer
  const [quizzes] = await pool.query(
    'SELECT id, question_data FROM quizzes WHERE level_id = ?',
    [levelId]
  );
  if (!quizzes.length) {
    const err = new Error('No quizzes found for this level'); err.status = 404; throw err;
  }

  // Verifikasi level milik user
  const [levelRows] = await pool.query(
    `SELECT l.id, l.title, l.order_index, l.learning_path_id,
            lang.code AS language_code
     FROM levels l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     JOIN languages lang ON lang.id = lp.language_id
     WHERE l.id = ? AND lp.user_id = ? LIMIT 1`,
    [levelId, userId]
  );
  if (!levelRows[0]) {
    const err = new Error('Level not found'); err.status = 404; throw err;
  }
  const level = levelRows[0];

  // Normalize: lowercase, trim, collapse spaces, strip trailing punctuation
  const normalize = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '')

  // Hitung skor
  const quizMap = Object.fromEntries(
    quizzes.map((q) => {
      const data = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data;
      return [q.id, data.correct_answer];
    })
  );

  let correct = 0;
  const results = answers.map(({ quiz_id, answer }) => {
    const expected  = quizMap[quiz_id];
    const isCorrect = !!expected && normalize(answer) === normalize(expected);
    if (isCorrect) correct++;
    return { quiz_id, is_correct: isCorrect, correct_answer: quizMap[quiz_id] };
  });

  const score   = Math.round((correct / quizzes.length) * 100);
  const xpEarned = correct * XP_PER_CORRECT;
  const passed  = score >= PASS_THRESHOLD;

  // Simpan progress + update user XP & streak dalam transaksi
  let nextUnlocked = false;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Simpan progress
    await conn.query(
      'INSERT INTO user_progress (user_id, level_id, score, xp_earned) VALUES (?, ?, ?, ?)',
      [userId, levelId, score, xpEarned]
    );

    // Update level jadi completed
    await conn.query(
      "UPDATE levels SET status = 'completed' WHERE id = ?",
      [levelId]
    );

    // Unlock level berikutnya jika lulus
    if (passed) {
      const [upd] = await conn.query(
        `UPDATE levels SET status = 'unlocked'
         WHERE learning_path_id = ? AND order_index = ? AND status = 'locked'`,
        [level.learning_path_id, level.order_index + 1]
      );
      nextUnlocked = upd.affectedRows > 0;
    }

    // Update XP dan streak user (gunakan CURDATE() konsisten untuk hindari timezone mismatch)
    await conn.query(
      `UPDATE users SET
         xp = xp + ?,
         streak = CASE
           WHEN last_activity_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN streak + 1
           WHEN last_activity_date = CURDATE() THEN streak
           ELSE 1
         END,
         last_activity_date = CURDATE()
       WHERE id = ?`,
      [xpEarned, userId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Simpan quiz session
  const [sessionRes] = await pool.query(
    `INSERT INTO quiz_sessions (user_id, source_type, source_id, source_name, language_code, score, correct, total, xp_earned)
     VALUES (?, 'learning_path', ?, ?, ?, ?, ?, ?, ?)`,
    [userId, levelId, level.title, level.language_code, score, correct, quizzes.length, xpEarned]
  );
  const sessionId = sessionRes.insertId;

  if (answers.length) {
    const quizDataMap = Object.fromEntries(
      quizzes.map((q) => {
        const data = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data;
        return [q.id, { type: q.type, data }];
      })
    );
    const answerValues = answers.map(({ quiz_id, answer }) => {
      const q = quizDataMap[quiz_id];
      const { correct_answer, ...safeData } = q?.data || {};
      return [
        sessionId, quiz_id, q?.type || 'multiple_choice',
        JSON.stringify(safeData), answer || null, correct_answer || '',
        results.find((r) => r.quiz_id === quiz_id)?.is_correct ? 1 : 0,
      ];
    });
    await pool.query(
      'INSERT INTO session_answers (session_id, question_ref_id, question_type, question_data, user_answer, correct_answer, is_correct) VALUES ?',
      [answerValues]
    );
  }

  // Ambil data user terbaru untuk response
  const [userRows] = await pool.query(
    'SELECT xp, streak FROM users WHERE id = ?',
    [userId]
  );

  return {
    score,
    correct,
    total: quizzes.length,
    xp_earned: xpEarned,
    passed,
    next_level_unlocked: nextUnlocked,
    all_completed: passed && !nextUnlocked,
    user: userRows[0],
    results,
  };
}

module.exports = { generateQuizzes, submitAnswers };
