const { pool } = require('../config/db')

async function getHistory(userId, { limit = 20, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT id, source_type, source_id, source_name, language_code,
            score, correct, total, xp_earned, time_taken, played_at
     FROM quiz_sessions
     WHERE user_id = ?
     ORDER BY played_at DESC
     LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  )

  const [[{ total_count }]] = await pool.query(
    'SELECT COUNT(*) AS total_count FROM quiz_sessions WHERE user_id = ?',
    [userId]
  )

  return { sessions: rows, total: total_count, limit: Number(limit), offset: Number(offset) }
}

async function getHistoryDetail(sessionId, userId) {
  const [[session]] = await pool.query(
    `SELECT id, source_type, source_id, source_name, language_code,
            score, correct, total, xp_earned, time_taken, played_at
     FROM quiz_sessions WHERE id = ? AND user_id = ?`,
    [sessionId, userId]
  )
  if (!session) { const e = new Error('Session not found'); e.status = 404; throw e }

  const [answers] = await pool.query(
    `SELECT question_ref_id, question_type, question_data, user_answer, correct_answer, is_correct
     FROM session_answers WHERE session_id = ?`,
    [sessionId]
  )

  return {
    ...session,
    answers: answers.map((a) => ({
      ...a,
      question_data: typeof a.question_data === 'string' ? JSON.parse(a.question_data) : a.question_data,
      is_correct: !!a.is_correct,
    }))
  }
}

async function getStats(userId) {
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                          AS total_sessions,
       COALESCE(SUM(xp_earned), 0)       AS total_xp,
       COALESCE(ROUND(AVG(score)), 0)    AS avg_score,
       COALESCE(SUM(correct), 0)         AS total_correct,
       COALESCE(SUM(total), 0)           AS total_questions
     FROM quiz_sessions WHERE user_id = ?`,
    [userId]
  )
  return stats
}

module.exports = { getHistory, getHistoryDetail, getStats }
