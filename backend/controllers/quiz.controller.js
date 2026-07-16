const quizService  = require('../services/quiz.service');
const { ok, fail } = require('../utils/response');

// GET /api/quizzes/:levelId — generate atau ambil soal
async function getQuizzes(req, res, next) {
  try {
    const data = await quizService.generateQuizzes(req.user.id, req.params.levelId);
    ok(res, data);
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

// POST /api/quizzes/:levelId/submit — submit jawaban
async function submit(req, res, next) {
  try {
    const data = await quizService.submitAnswers(req.user.id, req.params.levelId, req.body.answers);
    ok(res, data, 'Quiz submitted');
  } catch (err) {
    err.status ? fail(res, err.message, err.status) : next(err);
  }
}

module.exports = { getQuizzes, submit };
