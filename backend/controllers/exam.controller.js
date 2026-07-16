const examService  = require('../services/exam.service');
const { ok, fail } = require('../utils/response');

async function generate(req, res, next) {
  try {
    const { language_id } = req.query;
    if (!language_id) return fail(res, 'language_id is required', 400);
    const data = await examService.generateExam(req.user.id, language_id);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function getQuestion(req, res, next) {
  try {
    const { attempt_id, order_index } = req.query;
    if (!attempt_id || !order_index) return fail(res, 'attempt_id and order_index are required', 400);
    const data = await examService.getQuestion(req.user.id, attempt_id, order_index);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function submit(req, res, next) {
  try {
    const { attempt_id, answers, time_taken } = req.body;
    if (!attempt_id || !Array.isArray(answers)) return fail(res, 'attempt_id and answers are required', 400);
    const data = await examService.submitExam(req.user.id, { attempt_id, answers, time_taken });
    ok(res, data, 'Exam submitted');
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

module.exports = { generate, getQuestion, submit };
