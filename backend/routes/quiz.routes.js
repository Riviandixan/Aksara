const router                     = require('express').Router();
const quizController             = require('../controllers/quiz.controller');
const { authenticate, validate } = require('../middlewares/auth.middleware');
const { submitAnswers }          = require('../validators/quiz.validator');

router.use(authenticate);

router.get('/:levelId',        quizController.getQuizzes);
router.post('/:levelId/submit', validate(submitAnswers), quizController.submit);

module.exports = router;
