const { pool } = require('../config/db');

/**
 * Kirim notifikasi ke satu user.
 * Dipanggil dari service lain (achievement, quiz, battle, exam).
 */
async function push(userId, { type, title, message, icon = 'Bell' }) {
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, icon) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, icon]
  );
}

async function getAll(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return rows;
}

async function getUnreadCount(userId) {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return Number(count);
}

async function markRead(userId, notifId) {
  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notifId, userId]
  );
}

async function markAllRead(userId) {
  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
    [userId]
  );
}

async function remove(userId, notifId) {
  await pool.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [notifId, userId]
  ); 
}

module.exports = { push, getAll, getUnreadCount, markRead, markAllRead, remove };
