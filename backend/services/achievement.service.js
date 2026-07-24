const { pool } = require('../config/db');
const { push }  = require('./notification.service');

/**
 * Cek & unlock achievement yang belum diraih user.
 * Dipanggil setelah quiz/exam/battle selesai.
 * @returns {Array} daftar achievement baru yang baru saja di-unlock
 */
async function checkAchievements(userId) {
  // Ambil stats user sekaligus achievement yang sudah dimiliki
  const [[user]] = await pool.query(
    'SELECT xp, streak FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (!user) return [];

  const [[{ completed_levels }]] = await pool.query(
    `SELECT COUNT(*) AS completed_levels
     FROM levels l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     WHERE lp.user_id = ? AND l.status = 'completed'`,
    [userId]
  );

  const [[{ total_exams }]] = await pool.query(
    `SELECT COUNT(*) AS total_exams FROM quiz_sessions
     WHERE user_id = ? AND source_type = 'exam'`,
    [userId]
  );

  const [[{ exam_ace }]] = await pool.query(
    `SELECT COUNT(*) AS exam_ace FROM quiz_sessions
     WHERE user_id = ? AND source_type = 'exam' AND score >= 90`,
    [userId]
  );

  const [[{ total_battles }]] = await pool.query(
    `SELECT COUNT(*) AS total_battles FROM battle_participants bp
     JOIN battle_rooms br ON br.id = bp.room_id
     WHERE bp.user_id = ? AND br.status = 'finished'`,
    [userId]
  );

  const [[{ battle_wins }]] = await pool.query(
    `SELECT COUNT(*) AS battle_wins FROM battle_participants bp
     JOIN battle_rooms br ON br.id = bp.room_id
     WHERE bp.user_id = ? AND br.status = 'finished' AND bp.rank = 1`,
    [userId]
  );

  const [[{ total_languages }]] = await pool.query(
    `SELECT COUNT(DISTINCT language_id) AS total_languages
     FROM learning_paths WHERE user_id = ?`,
    [userId]
  );

  const [owned] = await pool.query(
    'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
    [userId]
  );
  const ownedIds = new Set(owned.map((r) => r.achievement_id));

  // Ambil semua achievement
  const [all] = await pool.query('SELECT * FROM achievements');

  const toUnlock = all.filter((ach) => {
    if (ownedIds.has(ach.id)) return false;
    switch (ach.category) {
      case 'xp': return user.xp >= ach.threshold;
      case 'streak': return user.streak >= ach.threshold;
      case 'level': return completed_levels >= ach.threshold;
      case 'exam': return ach.code === 'exam_ace' ? exam_ace >= 1 : total_exams >= ach.threshold;
      case 'battle': return ach.code === 'battle_win' ? battle_wins >= 1 : total_battles >= ach.threshold;
      case 'language': return total_languages >= ach.threshold;
      default: return false;
    }
  });

  if (!toUnlock.length) return [];

  const values = toUnlock.map((a) => [userId, a.id]);
  await pool.query(
    'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES ?',
    [values]
  );

  // Kirim notifikasi untuk setiap achievement baru
  await Promise.all(toUnlock.map((a) =>
    push(userId, {
      type:    'achievement',
      title:   'Badge Baru Terbuka! 🏅',
      message: `Kamu meraih badge "${a.title}" — ${a.description}`,
      icon:    a.icon || 'Medal',
    })
  ));

  return toUnlock;
}

async function getUserAchievements(userId) {
  const [all] = await pool.query('SELECT * FROM achievements ORDER BY category, threshold');
  const [owned] = await pool.query(
    'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?',
    [userId]
  );
  const ownedMap = Object.fromEntries(owned.map((r) => [r.achievement_id, r.unlocked_at]));

  return all.map((a) => ({
    ...a,
    unlocked: !!ownedMap[a.id],
    unlocked_at: ownedMap[a.id] || null,
  }));
}

module.exports = { checkAchievements, getUserAchievements };
