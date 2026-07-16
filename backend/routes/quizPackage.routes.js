const router = require('express').Router()
const { authenticate } = require('../middlewares/auth.middleware')
const c = require('../controllers/quizPackage.controller')

router.use(authenticate)

// Packages
router.get('/',         c.listPackages)
router.get('/:id',      c.getPackage)
router.post('/',        c.createPackage)
router.patch('/:id',    c.updatePackage)
router.delete('/:id',   c.deletePackage)

// Package Quiz
router.get('/:id/questions', c.getQuestions)
router.post('/:id/submit',   c.submitAnswers)

// Question Bank
router.get('/bank/questions',      c.listQuestions)
router.post('/bank/questions',     c.createQuestion)
router.delete('/bank/questions/:id', c.deleteQuestion)

module.exports = router
