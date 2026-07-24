const router           = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const c                = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/',              c.getAll);
router.get('/unread-count',  c.getUnread);
router.patch('/read-all',    c.markAllRead);
router.patch('/:id/read',    c.markRead);
router.delete('/:id',        c.remove);

module.exports = router;
