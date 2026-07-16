const router             = require('express').Router();
const languageController = require('../controllers/language.controller');
const { authenticate }   = require('../middlewares/auth.middleware');

router.get('/', authenticate, languageController.getAll);

module.exports = router;
