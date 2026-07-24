const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { getAchievements } = require('../controllers/achievement.controller');

router.use(authenticate);
router.get('/', getAchievements);

module.exports = router;
