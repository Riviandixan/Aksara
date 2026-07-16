const authService  = require('../services/auth.service');
const { ok, fail } = require('../utils/response');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    ok(res, data, 'Registered successfully', 201);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    ok(res, user);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function updateAvatar(req, res, next) {
  try {
    const { avatar_url } = req.body
    if (!avatar_url) return fail(res, 'avatar_url is required', 400)
    await authService.updateAvatar(req.user.id, avatar_url)
    ok(res, { avatar_url })
  } catch (err) {
    next(err)
  }
}

async function updateProfile(req, res, next) {
  try {
    const { username } = req.body
    if (!username?.trim()) return fail(res, 'username is required', 400)
    await authService.updateProfile(req.user.id, { username })
    ok(res, { username })
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err)
  }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) return fail(res, 'current_password and new_password are required', 400)
    if (new_password.length < 6) return fail(res, 'Password baru minimal 6 karakter', 400)
    await authService.changePassword(req.user.id, { current_password, new_password })
    ok(res, null, 'Password berhasil diubah')
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err)
  }
}

module.exports = { register, login, me, updateAvatar, updateProfile, changePassword };
