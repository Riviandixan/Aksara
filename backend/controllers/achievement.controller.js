const { getUserAchievements } = require('../services/achievement.service');
const { ok } = require('../utils/response');

async function getAchievements(req, res, next) {
  try {
    const data = await getUserAchievements(req.user.id);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAchievements };
