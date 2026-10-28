const router = require('express').Router();
const controller = require('../controllers/book.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.AUTHOR));

router.get('/', controller.listMine);
router.get('/:id', controller.getMine);

module.exports = router;