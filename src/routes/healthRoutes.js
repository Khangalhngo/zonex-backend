const express = require('express');
const router = express.Router();
const { getSystemHealth, getDatabaseHealth } = require('../controllers/healthController');


router.get('/health', getSystemHealth);
router.get('/health/database', getDatabaseHealth);

module.exports = router; 