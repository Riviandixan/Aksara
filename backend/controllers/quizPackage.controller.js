const svc        = require('../services/quizPackage.service')
const { ok, fail } = require('../utils/response')

// Packages
const listPackages   = async (req, res) => { try { ok(res, await svc.listPackages({ userId: req.user.id, mine: req.query.mine === 'true', languageId: req.query.language_id, search: req.query.search })) } catch (e) { fail(res, e.message, e.status || 500) } }
const getPackage     = async (req, res) => { try { ok(res, await svc.getPackage(req.params.id, req.user.id)) } catch (e) { fail(res, e.message, e.status || 500) } }
const createPackage  = async (req, res) => { try { ok(res, await svc.createPackage(req.user.id, req.body), 'Package created', 201) } catch (e) { fail(res, e.message, e.status || 500) } }
const updatePackage  = async (req, res) => { try { ok(res, await svc.updatePackage(req.params.id, req.user.id, req.body)) } catch (e) { fail(res, e.message, e.status || 500) } }
const deletePackage  = async (req, res) => { try { await svc.deletePackage(req.params.id, req.user.id); ok(res, null, 'Deleted') } catch (e) { fail(res, e.message, e.status || 500) } }
const getQuestions   = async (req, res) => { try { ok(res, await svc.getPackageQuestions(req.params.id, req.user.id)) } catch (e) { fail(res, e.message, e.status || 500) } }
const submitAnswers  = async (req, res) => { try { ok(res, await svc.submitPackageAnswers(req.params.id, req.user.id, req.body.answers, req.body.time_taken ?? null)) } catch (e) { fail(res, e.message, e.status || 500) } }

// Question Bank
const listQuestions  = async (req, res) => { try { ok(res, await svc.listQuestions({ userId: req.user.id, languageId: req.query.language_id, type: req.query.type })) } catch (e) { fail(res, e.message, e.status || 500) } }
const createQuestion = async (req, res) => { try { ok(res, await svc.createQuestion(req.user.id, req.body), 'Question created', 201) } catch (e) { fail(res, e.message, e.status || 500) } }
const deleteQuestion = async (req, res) => { try { await svc.deleteQuestion(req.params.id, req.user.id); ok(res, null, 'Deleted') } catch (e) { fail(res, e.message, e.status || 500) } }

module.exports = { listPackages, getPackage, createPackage, updatePackage, deletePackage, getQuestions, submitAnswers, listQuestions, createQuestion, deleteQuestion }
