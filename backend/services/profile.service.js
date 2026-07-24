const { pool } = require('../config/db');

async function getPublicProfile(username) {
  const [[user]] = await pool.query(
    `SELECT id, username, avatar_url, xp, streak, created_at
     FROM users WHERE username = ? LIMIT 1`,
    [username]
  );
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

  // Bahasa aktif (learning paths)
  const [languages] = await pool.query(
    `SELECT lang.code, lang.name, lang.flag_emoji,
            COUNT(CASE WHEN l.status = 'completed' THEN 1 END) AS completed_levels,
            COUNT(l.id) AS total_levels
     FROM learning_paths lp
     JOIN languages lang ON lang.id = lp.language_id
     LEFT JOIN levels l ON l.learning_path_id = lp.id
     WHERE lp.user_id = ?
     GROUP BY lp.language_id, lang.code, lang.name, lang.flag_emoji`,
    [user.id]
  );

  // Badges yang sudah diraih
  const [badges] = await pool.query(
    `SELECT a.id, a.title, a.description, a.icon, a.category, ua.unlocked_at
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = ?
     ORDER BY ua.unlocked_at DESC`,
    [user.id]
  );

  // Riwayat battle (10 terakhir)
  const [battles] = await pool.query(
    `SELECT br.id, br.created_at, br.status,
            bp.score, bp.rank AS finish_rank,
            (SELECT COUNT(*) FROM battle_participants WHERE room_id = br.id) AS total_players
     FROM battle_participants bp
     JOIN battle_rooms br ON br.id = bp.room_id
     WHERE bp.user_id = ? AND br.status = 'finished'
     ORDER BY br.created_at DESC
     LIMIT 10`,
    [user.id]
  );

  // Stats ringkas
  const [[stats]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM levels l JOIN learning_paths lp ON lp.id = l.learning_path_id
        WHERE lp.user_id = ? AND l.status = 'completed') AS completed_levels,
       (SELECT COUNT(*) FROM battle_participants bp JOIN battle_rooms br ON br.id = bp.room_id
        WHERE bp.user_id = ? AND br.status = 'finished') AS total_battles,
       (SELECT COUNT(*) FROM battle_participants bp JOIN battle_rooms br ON br.id = bp.room_id
        WHERE bp.user_id = ? AND br.status = 'finished' AND bp.rank = 1) AS battle_wins`,
    [user.id, user.id, user.id]
  );

  // Followers (siapa yang follow user ini)
  const [followers] = await pool.query(
    `SELECT u.username, u.avatar_url
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC
     LIMIT 20`,
    [user.id]
  );

  // Following (siapa yang di-follow user ini)
  const [following] = await pool.query(
    `SELECT u.username, u.avatar_url
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC
     LIMIT 20`,
    [user.id]
  );

  return {
    username: user.username,
    avatar_url: user.avatar_url,
    xp: user.xp,
    streak: user.streak,
    joined_at: user.created_at,
    stats: {
      completed_levels: stats.completed_levels,
      total_battles: stats.total_battles,
      battle_wins: stats.battle_wins,
      total_badges: badges.length,
    },
    languages,
    badges,
    battle_history: battles,
    followers,
    following,
  };
}

module.exports = { getPublicProfile };
