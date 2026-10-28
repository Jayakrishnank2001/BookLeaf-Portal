const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/books', require('./book.routes'));
router.use('/tickets', require('./ticket.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;