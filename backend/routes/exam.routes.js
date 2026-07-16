const router         = require('express').Router();
const examController = require('../controllers/exam.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/generate',  examController.generate);
router.get('/question',  examController.getQuestion);
router.post('/submit',   examController.submit);

module.exports = router;
