const { getLeaderboard } = require('../services/leaderboard.service')
const { ok, fail }       = require('../utils/response')

async function index(req, res) {
  try {
    const data = await getLeaderboard(req.user.id)
    ok(res, data)
  } catch (e) {
    fail(res, e.message, 500)
  }
}

module.exports = { index }
