const router           = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { history, room } = require('../controllers/battle.controller');

router.use(authenticate);

router.get('/history',    history);
router.get('/room/:code', room);

module.exports = router;
