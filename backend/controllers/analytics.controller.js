const svc = require('../services/analytics.service')
const { ok, fail } = require('../utils/response')

const getAnalytics = async (req, res) => {
  try {
    ok(res, await svc.getAnalytics(req.user.id))
  } catch (e) { fail(res, e.message, e.status || 500) }
}

module.exports = { getAnalytics }
