const svc        = require('../services/notification.service');
const { ok, fail } = require('../utils/response');

const getAll       = async (req, res) => { try { ok(res, await svc.getAll(req.user.id)) } catch (e) { fail(res, e.message, 500) } }
const getUnread    = async (req, res) => { try { ok(res, { count: await svc.getUnreadCount(req.user.id) }) } catch (e) { fail(res, e.message, 500) } }
const markRead     = async (req, res) => { try { await svc.markRead(req.user.id, req.params.id); ok(res, null) } catch (e) { fail(res, e.message, 500) } }
const markAllRead  = async (req, res) => { try { await svc.markAllRead(req.user.id); ok(res, null) } catch (e) { fail(res, e.message, 500) } }
const remove       = async (req, res) => { try { await svc.remove(req.user.id, req.params.id); ok(res, null) } catch (e) { fail(res, e.message, 500) } }

module.exports = { getAll, getUnread, markRead, markAllRead, remove };
