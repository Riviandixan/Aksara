const router                  = require('express').Router();
const learningPathController  = require('../controllers/learningPath.controller');
const { authenticate, validate } = require('../middlewares/auth.middleware');
const { selectLanguage }      = require('../validators/learningPath.validator');

router.use(authenticate); // semua route di bawah butuh login

router.post('/',    validate(selectLanguage), learningPathController.generate);
router.get('/',                               learningPathController.getAll);
router.get('/:id',                            learningPathController.getOne);

module.exports = router;
