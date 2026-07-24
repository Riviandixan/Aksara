const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { doFollow, doUnfollow, status, feed } = require('../controllers/follow.controller');

router.get('/feed',                    authenticate, feed);
router.get('/:username/status',        authenticate, status);
router.post('/:username/follow',       authenticate, doFollow);
router.delete('/:username/unfollow',   authenticate, doUnfollow);

module.exports = router;
