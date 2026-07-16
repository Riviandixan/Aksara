const svc = require('../services/history.service')
const { ok, fail } = require('../utils/response')

const getHistory = async (req, res) => {
  try {
    ok(res, await svc.getHistory(req.user.id, { limit: req.query.limit, offset: req.query.offset }))
  } catch (e) { fail(res, e.message, e.status || 500) }
}

const getHistoryDetail = async (req, res) => {
  try {
    ok(res, await svc.getHistoryDetail(req.params.id, req.user.id))
  } catch (e) { fail(res, e.message, e.status || 500) }
}

const getStats = async (req, res) => {
  try {
    ok(res, await svc.getStats(req.user.id))
  } catch (e) { fail(res, e.message, e.status || 500) }
}

module.exports = { getHistory, getHistoryDetail, getStats }
