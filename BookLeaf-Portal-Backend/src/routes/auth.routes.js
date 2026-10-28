const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { loginSchema } = require('../validators/auth.validator');

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;