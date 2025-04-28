const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authenticateToken = require('../middleware/auth');

router.post('/pre-request', authenticateToken, requestController.createRequest);
router.get('/pending-requests', authenticateToken, requestController.getPendingRequestsWithClientData);
router.post('/update-pnumber', authenticateToken, requestController.updateClientPnumber);
router.get('/accepted-requests', authenticateToken, requestController.getAcceptedRequestsWithClientData);

module.exports = router;