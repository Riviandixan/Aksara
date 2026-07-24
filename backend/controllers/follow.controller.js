const { follow, unfollow, getFollowStatus, getFeed } = require('../services/follow.service');
const { pool } = require('../config/db');
const { ok } = require('../utils/response');

async function doFollow(req, res, next) {
  try {
    const [[target]] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [req.params.username]);
    if (!target) { const e = new Error('User not found'); e.status = 404; throw e; }
    await follow(req.user.id, target.id);
    ok(res, { message: 'Followed' });
  } catch (err) { next(err); }
}

async function doUnfollow(req, res, next) {
  try {
    const [[target]] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [req.params.username]);
    if (!target) { const e = new Error('User not found'); e.status = 404; throw e; }
    await unfollow(req.user.id, target.id);
    ok(res, { message: 'Unfollowed' });
  } catch (err) { next(err); }
}

async function status(req, res, next) {
  try {
    const [[target]] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [req.params.username]);
    if (!target) { const e = new Error('User not found'); e.status = 404; throw e; }
    const data = await getFollowStatus(req.user.id, target.id);
    ok(res, data);
  } catch (err) { next(err); }
}

async function feed(req, res, next) {
  try {
    const data = await getFeed(req.user.id);
    ok(res, data);
  } catch (err) { next(err); }
}

module.exports = { doFollow, doUnfollow, status, feed };
