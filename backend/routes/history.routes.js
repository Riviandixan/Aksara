const router = require('express').Router()
const { authenticate } = require('../middlewares/auth.middleware')
const c = require('../controllers/history.controller')

router.use(authenticate)

router.get('/',       c.getHistory)
router.get('/stats',  c.getStats)
router.get('/:id',    c.getHistoryDetail)

module.exports = router
