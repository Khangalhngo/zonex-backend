const express = require('express');
const router = express.Router();
const { getAllOrganizations } = require('../controllers/organizationController');
const authenticateToken = require('../middleware/auth');


router.get('/organizations', authenticateToken, getAllOrganizations);

module.exports = router; 