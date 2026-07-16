const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

function buildAvatarUrl(username) {
  const base = process.env.DICEBEAR_BASE_URL || 'https://api.dicebear.com/9.x/adventurer/svg';
  return `${base}?seed=${encodeURIComponent(username)}`;
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register({ username, email, password }) {
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
    [email, username]
  );
  if (existing.length) {
    const err = new Error('Email or username already taken');
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const avatarUrl = buildAvatarUrl(username);

  const [result] = await pool.query(
    'INSERT INTO users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)',
    [username, email, hashed, avatarUrl]
  );

  const token = signToken({ id: result.insertId, username });
  return { token, user: { id: result.insertId, username, email, avatar_url: avatarUrl } };
}

async function login({ email, password }) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password, avatar_url, xp, streak FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const user = rows[0];

  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const token = signToken({ id: user.id, username: user.username });
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
}

async function getProfile(userId) {
  const [rows] = await pool.query(
    'SELECT id, username, email, avatar_url, xp, streak, last_activity_date, created_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (!rows[0]) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const [dailyRows] = await pool.query(
    'SELECT COALESCE(SUM(xp_earned), 0) AS daily_xp FROM user_progress WHERE user_id = ? AND DATE(completed_at) = CURDATE()',
    [userId]
  );

  return { ...rows[0], daily_xp: Number(dailyRows[0].daily_xp) };
}

async function updateProfile(userId, { username }) {
  if (username) {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
      [username, userId]
    )
    if (existing.length) {
      const err = new Error('Username already taken'); err.status = 409; throw err
    }
    await pool.query('UPDATE users SET username = ? WHERE id = ?', [username, userId])
  }
}

async function updateAvatar(userId, avatarUrl) {
  await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId])
}

async function changePassword(userId, { current_password, new_password }) {
  const [rows] = await pool.query('SELECT password FROM users WHERE id = ? LIMIT 1', [userId])
  if (!rows[0]) { const err = new Error('User not found'); err.status = 404; throw err }

  const valid = await bcrypt.compare(current_password, rows[0].password)
  if (!valid) { const err = new Error('Password saat ini salah'); err.status = 400; throw err }

  const hashed = await bcrypt.hash(new_password, 12)
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId])
}

module.exports = { register, login, getProfile, updateAvatar, updateProfile, changePassword };
