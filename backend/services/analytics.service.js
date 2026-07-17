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

  // Battle — ringkasan
  const [[battleSummary]] = await pool.query(
    `SELECT
       COUNT(*)                                        AS total_battles,
       COALESCE(SUM(bp.correct), 0)                   AS total_correct,
       COALESCE(SUM(br.question_count), 0)            AS total_questions,
       COUNT(CASE WHEN bp.rank = 1 THEN 1 END)        AS total_wins,
       COALESCE(ROUND(AVG(bp.score)), 0)              AS avg_score
     FROM battle_participants bp
     JOIN battle_rooms br ON br.id = bp.room_id
     WHERE bp.user_id = ? AND br.status = 'finished'`,
    [userId]
  )
  battleSummary.win_rate = battleSummary.total_battles
    ? Math.round((battleSummary.total_wins / battleSummary.total_battles) * 100)
    : 0
  battleSummary.accuracy = battleSummary.total_questions
    ? Math.round((battleSummary.total_correct / battleSummary.total_questions) * 100)
    : 0

  // Battle — tren skor 30 hari
  const [battleTrend] = await pool.query(
    `SELECT DATE(br.finished_at) AS date,
            ROUND(AVG(bp.score)) AS avg_score,
            COUNT(*) AS battles
     FROM battle_participants bp
     JOIN battle_rooms br ON br.id = bp.room_id
     WHERE bp.user_id = ? AND br.status = 'finished'
       AND br.finished_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE(br.finished_at)
     ORDER BY date`,
    [userId]
  )

  // Battle — riwayat 10 terakhir
  const [battleHistory] = await pool.query(
    `SELECT br.finished_at, br.question_count, l.name AS language_name,
            bp.score, bp.correct, bp.rank,
            (SELECT COUNT(*) FROM battle_participants WHERE room_id = br.id) AS total_players
     FROM battle_participants bp
     JOIN battle_rooms br ON br.id = bp.room_id
     LEFT JOIN languages l ON l.id = br.language_id
     WHERE bp.user_id = ? AND br.status = 'finished'
     ORDER BY br.finished_at DESC
     LIMIT 10`,
    [userId]
  )

  return { summary, scoreTrend, perLanguage, perType, weeklyActivity, battleSummary, battleTrend, battleHistory }
}

module.exports = { getAnalytics }
