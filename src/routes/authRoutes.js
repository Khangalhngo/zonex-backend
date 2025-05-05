const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { authValidation } = require('../middleware/inputValidation');

// Apply rate limiting and validation to auth routes
router.post('/register', authLimiter, authValidation.register, authController.register);
router.post('/login', authLimiter, authValidation.login, authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.put('/update-password', authenticateToken, authValidation.updatePassword, authController.updatePassword);

module.exports = router; 