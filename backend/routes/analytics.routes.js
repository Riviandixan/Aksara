const router = require('express').Router()
const { authenticate } = require('../middlewares/auth.middleware')
const c = require('../controllers/analytics.controller')

router.use(authenticate)
router.get('/', c.getAnalytics)

module.exports = router
