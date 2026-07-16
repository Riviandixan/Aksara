const { getBattleHistory, getRoomByCode } = require('../services/battle.service');
const { ok, fail } = require('../utils/response');

async function history(req, res) {
  try {
    const data = await getBattleHistory(req.user.id);
    ok(res, data);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

async function room(req, res) {
  try {
    const data = await getRoomByCode(req.params.code);
    if (!data) return fail(res, 'Room tidak ditemukan', 404);
    ok(res, data);
  } catch (err) {
    fail(res, err.message, 500);
  }
}

module.exports = { history, room };
