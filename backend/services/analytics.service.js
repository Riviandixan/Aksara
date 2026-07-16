const { pool } = require('../config/db')

async function getAnalytics(userId) {
  // Ringkasan
  const [[summary]] = await pool.query(
    `SELECT
       COUNT(*)                        AS total_sessions,
       COALESCE(SUM(correct), 0)       AS total_correct,
       COALESCE(SUM(total), 0)         AS total_questions,
       COALESCE(ROUND(AVG(score)), 0)  AS avg_score,
       COALESCE(SUM(xp_earned), 0)     AS total_xp,
       COALESCE(SUM(time_taken), 0)    AS total_time,
       COUNT(CASE WHEN score >= 70 THEN 1 END) AS passed_sessions
     FROM quiz_sessions WHERE user_id = ?`,
    [userId]
  )
  summary.accuracy = summary.total_questions
    ? Math.round((summary.total_correct / summary.total_questions) * 100)
    : 0

  // Tren skor 30 hari terakhir
  const [scoreTrend] = await pool.query(
    `SELECT DATE(played_at) AS date, ROUND(AVG(score)) AS avg_score
     FROM quiz_sessions
     WHERE user_id = ? AND played_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE(played_at)
     ORDER BY date`,
    [userId]
  )

  // Performa per bahasa
  const [perLanguage] = await pool.query(
    `SELECT language_code, COUNT(*) AS sessions, ROUND(AVG(score)) AS avg_score,
            SUM(correct) AS correct, SUM(total) AS total
     FROM quiz_sessions WHERE user_id = ?
     GROUP BY language_code`,
    [userId]
  )

  // Performa per jenis soal
  const [perType] = await pool.query(
    `SELECT sa.question_type AS type, COUNT(*) AS total,
            SUM(sa.is_correct) AS correct
     FROM session_answers sa
     JOIN quiz_sessions qs ON qs.id = sa.session_id
     WHERE qs.user_id = ?
     GROUP BY sa.question_type`,
    [userId]
  )

  // Aktivitas harian (7 hari terakhir)
  const [weeklyActivity] = await pool.query(
    `SELECT DATE(played_at) AS date, COUNT(*) AS sessions, SUM(xp_earned) AS xp
     FROM quiz_sessions
     WHERE user_id = ? AND played_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY DATE(played_at)
     ORDER BY date`,
    [userId]
  )

  return { summary, scoreTrend, perLanguage, perType, weeklyActivity }
}

module.exports = { getAnalytics }
