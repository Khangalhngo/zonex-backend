const express = require('express');
const router = express.Router();
const { getClientStatistics, } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

router.get('/statistics', getClientStatistics);


module.exports = router; 