const router                  = require('express').Router();
const authController          = require('../controllers/auth.controller');
const { validate, authenticate } = require('../middlewares/auth.middleware');
const authValidator           = require('../validators/auth.validator');

router.post('/register', validate(authValidator.register), authController.register);
router.post('/login',    validate(authValidator.login),    authController.login);
router.get('/me',        authenticate,                     authController.me);
router.patch('/avatar',   authenticate, authController.updateAvatar);
router.patch('/profile',  authenticate, authController.updateProfile);
router.patch('/password', authenticate, authController.changePassword);

module.exports = router;
