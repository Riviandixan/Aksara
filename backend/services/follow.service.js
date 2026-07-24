const { pool } = require('../config/db');
const { push } = require('./notification.service');

async function follow(followerId, followingId) {
  if (followerId === followingId) {
    const e = new Error('Tidak bisa follow diri sendiri'); e.status = 400; throw e;
  }

  const [result] = await pool.query(
    'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
    [followerId, followingId]
  );

  // Hanya kirim notif jika benar-benar baru (bukan duplicate)
  if (result.affectedRows > 0) {
    const [[follower]] = await pool.query(
      'SELECT username, avatar_url FROM users WHERE id = ? LIMIT 1',
      [followerId]
    );
    if (follower) {
      // Cek apakah target sudah follow balik (followback)
      const [[isFollowBack]] = await pool.query(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
        [followingId, followerId]
      );

      push(followingId, {
        type: 'new_follower',
        title: isFollowBack ? 'Ikuti Balik!' : 'Pengikut Baru!',
        message: isFollowBack
          ? `@${follower.username} mengikuti balik kamu`
          : `@${follower.username} mulai mengikutimu`,
        icon: 'Users',
      }).catch(() => { });
    }
  }
}

async function unfollow(followerId, followingId) {
  await pool.query(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );
}

async function getFollowStatus(viewerId, targetUserId) {
  const [[row]] = await pool.query(
    'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
    [viewerId, targetUserId]
  );
  // Apakah target sudah follow balik viewer?
  const [[back]] = await pool.query(
    'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
    [targetUserId, viewerId]
  );
  const [[counts]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id  = ?) AS following`,
    [targetUserId, targetUserId]
  );
  return {
    is_following: !!row,   // viewer sudah follow target
    is_followed_by: !!back,  // target sudah follow viewer (followback)
    followers: counts.followers,
    following: counts.following,
  };
}

// Feed aktivitas dari orang yang di-follow (50 item terbaru)
async function getFeed(userId) {
  const [rows] = await pool.query(
    `SELECT af.id, af.type, af.data, af.created_at,
            u.username, u.avatar_url
     FROM activity_feed af
     JOIN follows f ON f.following_id = af.user_id AND f.follower_id = ?
     JOIN users u ON u.id = af.user_id
     ORDER BY af.created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    username: r.username,
    avatar_url: r.avatar_url,
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
    created_at: r.created_at,
  }));
}

// Dipanggil dari service lain untuk push event ke feed
async function pushFeed(userId, type, data) {
  await pool.query(
    'INSERT INTO activity_feed (user_id, type, data) VALUES (?, ?, ?)',
    [userId, type, JSON.stringify(data)]
  );
}

module.exports = { follow, unfollow, getFollowStatus, getFeed, pushFeed };
