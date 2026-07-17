const quizService  = require('../services/quiz.service');
const { ok, fail } = require('../utils/response');

async function getQuizzes(req, res, next) {
  try {
    const data = await quizService.generateQuizzes(req.user.id, req.params.levelId);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function getQuestion(req, res, next) {
  try {
    const { order_index } = req.query;
    if (!order_index) return fail(res, 'order_index is required', 400);
    const data = await quizService.getQuestion(req.user.id, req.params.levelId, Number(order_index));
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function checkAnswer(req, res, next) {
  try {
    const { quiz_id, answer } = req.body;
    if (!quiz_id || answer === undefined) return fail(res, 'quiz_id and answer are required', 400);
    const data = await quizService.checkAnswer(req.user.id, req.params.levelId, quiz_id, answer);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

async function submit(req, res, next) {
  try {
    const data = await quizService.submitAnswers(req.user.id, req.params.levelId, req.body.answers);
    ok(res, data, 'Quiz submitted');
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

module.exports = { getQuizzes, getQuestion, checkAnswer, submit };
