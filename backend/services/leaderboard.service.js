const { pool } = require('../config/db')

async function getLeaderboard(currentUserId, limit = 10) {
  const [rows] = await pool.query(
    `SELECT id, username, avatar_url, xp, streak
     FROM users
     ORDER BY xp DESC, streak DESC
     LIMIT ?`,
    [limit]
  )

  const ranked = rows.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    username: u.username,
    avatar_url: u.avatar_url,
    xp: u.xp,
    streak: u.streak,
    isMe: u.id === currentUserId,
  }))

  // Posisi user saat ini jika tidak masuk top limit
  const myRank = ranked.find((u) => u.isMe)
  if (!myRank) {
    const [[me]] = await pool.query(
      `SELECT COUNT(*) + 1 AS rank FROM users WHERE xp > (SELECT xp FROM users WHERE id = ?)`,
      [currentUserId]
    )
    const [[meData]] = await pool.query(
      `SELECT id, username, avatar_url, xp, streak FROM users WHERE id = ?`,
      [currentUserId]
    )
    if (meData) {
      ranked.push({ rank: me.rank, ...meData, isMe: true, outOfTop: true })
    }
  }

  return ranked
}

module.exports = { getLeaderboard }
