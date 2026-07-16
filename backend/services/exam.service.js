const { pool }            = require('../config/db');
const { generateContent } = require('../config/ai');

const EXAM_QUESTIONS  = 15;
const XP_PER_CORRECT  = 10;

function buildExamPrompt(languageName, baseLevel) {
  const levelDesc = baseLevel === 'intermediate'
    ? 'intermediate level (B1-B2): complex grammar, conditionals, passive voice, advanced vocabulary, longer sentences'
    : 'beginner level (A1-A2): basic vocabulary, simple present/past tense, short sentences'

  return `
You are a language exam generator for ${languageName} learners at ${levelDesc}.
Generate exactly ${EXAM_QUESTIONS} exam questions appropriate for this level.

Return a JSON object with a single key "questions" containing an array of ${EXAM_QUESTIONS} objects.
Each object must have:
- "order_index": number (1-${EXAM_QUESTIONS})
- "type": one of "multiple_choice", "translate", "word_arrange"
- "question_data": object based on type:
  - multiple_choice: { "question": string (a sentence or word IN ${languageName} script that the user must translate or identify — NOT a meta-question like 'Apa arti...'), "options": [4 Indonesian translation options], "correct_answer": string (the correct Indonesian translation, must match one of the options exactly) }
  - translate: { "sentence": string (in ${languageName} script/characters), "correct_answer": string (Indonesian translation) }
  - word_arrange: { "words": [shuffled ${languageName} words/characters WITHOUT punctuation], "correct_answer": string (correct ${languageName} sentence WITHOUT punctuation) }

CRITICAL:
- Write ALL ${languageName} text using actual ${languageName} characters/script directly (e.g. 你好, こんにちは, привет). NEVER use romanization or transliteration unless the language itself uses Latin script.
- Mix all 3 types evenly (5 each)
- ALL questions MUST match the difficulty of ${baseLevel} level
- No empty strings allowed — every field must have real content
`.trim();
}

async function generateExam(userId, languageId) {
  const [pathRows] = await pool.query(
    `SELECT lp.id, lp.base_level, l.name AS language_name
     FROM learning_paths lp
     JOIN languages l ON l.id = lp.language_id
     WHERE lp.user_id = ? AND lp.language_id = ?
     ORDER BY
       (SELECT COUNT(*) FROM levels lv WHERE lv.learning_path_id = lp.id AND lv.status = 'completed') DESC,
       FIELD(lp.base_level, 'intermediate', 'beginner'),
       lp.created_at DESC
     LIMIT 1`,
    [userId, languageId]
  );
  if (!pathRows[0]) {
    const err = new Error('Kamu belum memiliki jalur belajar untuk bahasa ini');
    err.status = 404; throw err;
  }
  const { base_level, language_name } = pathRows[0];

  const result  = await generateContent(buildExamPrompt(language_name, base_level));
  const rawText = result.response.text();

  let questions;
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else {
      questions = Object.values(parsed).find((v) => Array.isArray(v));
    }
  } catch {
    const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) throw new Error('AI returned invalid JSON format');
    questions = JSON.parse(match[0]);
  }
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error('AI returned invalid JSON format');
  }

  // Simpan soal + jawaban di server, expires 20 menit
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  const [ins] = await pool.query(
    'INSERT INTO exam_attempts (user_id, language_id, questions, expires_at) VALUES (?, ?, ?, ?)',
    [userId, languageId, JSON.stringify(questions), expiresAt]
  );
  const attemptId = ins.insertId;

  return {
    attempt_id:    attemptId,
    language_id:   languageId,
    language_name,
    base_level,
    total:         questions.length,
    time_limit:    600,
    // hanya kirim soal pertama, soal berikutnya diambil via /exam/question
    first_question: (() => {
      const q = questions[0];
      const { correct_answer, ...safeData } = q.question_data;
      return { order_index: q.order_index, type: q.type, question_data: safeData };
    })(),
  };
}

async function submitExam(userId, { attempt_id, answers, time_taken }) {
  // Ambil soal dari server (bukan dari frontend)
  const [attemptRows] = await pool.query(
    'SELECT questions, language_id, expires_at FROM exam_attempts WHERE id = ? AND user_id = ? LIMIT 1',
    [attempt_id, userId]
  );
  if (!attemptRows[0]) {
    const err = new Error('Sesi ujian tidak ditemukan atau sudah kadaluarsa'); err.status = 404; throw err;
  }
  if (new Date() > new Date(attemptRows[0].expires_at)) {
    await pool.query('DELETE FROM exam_attempts WHERE id = ?', [attempt_id]);
    const err = new Error('Sesi ujian sudah kadaluarsa'); err.status = 410; throw err;
  }

  const serverQuestions = typeof attemptRows[0].questions === 'string'
    ? JSON.parse(attemptRows[0].questions)
    : attemptRows[0].questions;
  const language_id = attemptRows[0].language_id;

  const [langRows] = await pool.query('SELECT code, name FROM languages WHERE id = ? LIMIT 1', [language_id]);
  if (!langRows[0]) { const err = new Error('Language not found'); err.status = 404; throw err; }

  const normalize = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '');

  // Map jawaban user by order_index
  const answerMap = {};
  for (const a of answers) answerMap[a.order_index] = a.answer || '';

  let correctCount = 0;
  const evaluations = serverQuestions.map((q) => {
    const expected  = q.question_data?.correct_answer;
    const userAns   = answerMap[q.order_index] || '';
    const isCorrect = !!expected && normalize(userAns) === normalize(expected);
    if (isCorrect) correctCount++;

    let question_summary = ''
    if (q.type === 'multiple_choice') question_summary = q.question_data?.question || ''
    else if (q.type === 'translate')  question_summary = q.question_data?.sentence || ''
    else if (q.type === 'word_arrange') question_summary = `Susun: ${(q.question_data?.words || []).join(', ')}`

    return { order_index: q.order_index, type: q.type, question_summary, user_answer: userAns, correct_answer: expected, is_correct: isCorrect };
  });

  const total    = serverQuestions.length;
  const score    = total ? Math.round((correctCount / total) * 100) : 0;
  const xpEarned = correctCount * XP_PER_CORRECT;
  const grade    = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'E';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
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
    const [sessionRes] = await conn.query(
      `INSERT INTO quiz_sessions (user_id, source_type, source_id, source_name, language_code, score, correct, total, xp_earned, time_taken)
       VALUES (?, 'exam', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, language_id, `Ujian ${langRows[0].name}`, langRows[0].code, score, correctCount, total, xpEarned, time_taken || null]
    );
    const sessionId = sessionRes.insertId;

    if (evaluations.length) {
      const answerRows = evaluations.map((ev) => [
        sessionId, ev.order_index, ev.type,
        JSON.stringify({ question_summary: ev.question_summary }),
        ev.user_answer || null, ev.correct_answer || '', ev.is_correct ? 1 : 0,
      ]);
      await conn.query(
        `INSERT INTO session_answers (session_id, question_ref_id, question_type, question_data, user_answer, correct_answer, is_correct) VALUES ?`,
        [answerRows]
      );
    }

    // Hapus attempt setelah submit
    await conn.query('DELETE FROM exam_attempts WHERE id = ?', [attempt_id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }

  const [userRows] = await pool.query('SELECT xp, streak FROM users WHERE id = ?', [userId]);
  return { score, correct_count: correctCount, total, xp_earned: xpEarned, grade, passed: score >= 60, evaluations, user: userRows[0] };
}

async function getQuestion(userId, attemptId, orderIndex) {
  const [rows] = await pool.query(
    'SELECT questions, expires_at FROM exam_attempts WHERE id = ? AND user_id = ? LIMIT 1',
    [attemptId, userId]
  );
  if (!rows[0]) { const e = new Error('Sesi ujian tidak ditemukan'); e.status = 404; throw e; }
  if (new Date() > new Date(rows[0].expires_at)) {
    await pool.query('DELETE FROM exam_attempts WHERE id = ?', [attemptId]);
    const e = new Error('Sesi ujian sudah kadaluarsa'); e.status = 410; throw e;
  }
  const questions = typeof rows[0].questions === 'string'
    ? JSON.parse(rows[0].questions) : rows[0].questions;
  const q = questions.find((q) => q.order_index === Number(orderIndex));
  if (!q) { const e = new Error('Soal tidak ditemukan'); e.status = 404; throw e; }
  const { correct_answer, ...safeData } = q.question_data;
  return { order_index: q.order_index, type: q.type, question_data: safeData, total: questions.length };
}

module.exports = { generateExam, getQuestion, submitExam };
