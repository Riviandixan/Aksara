const { getPublicProfile } = require('../services/profile.service');
const { ok } = require('../utils/response');

async function show(req, res, next) {
  try {
    const data = await getPublicProfile(req.params.username);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
