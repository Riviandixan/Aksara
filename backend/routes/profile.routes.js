const router = require('express').Router();
const { show } = require('../controllers/profile.controller');

router.get('/:username', show);

module.exports = router;
