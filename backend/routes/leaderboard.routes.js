const router = require('express').Router()
const { authenticate } = require('../middlewares/auth.middleware')
const { index }        = require('../controllers/leaderboard.controller')

router.get('/', authenticate, index)

module.exports = router
