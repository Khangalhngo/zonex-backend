const express = require('express');
const router = express.Router();
const { createClient, getAllClients, getClientById, updateClient, deleteClient, updateClientState } = require('../controllers/clientController');
const authenticateToken = require('../middleware/auth');

router.post('/register-client', createClient);
router.get('/clients', authenticateToken, getAllClients);
router.get('/clients/:id', authenticateToken, getClientById);
router.put('/clients/:id', authenticateToken, updateClient);
router.delete('/clients/:id', authenticateToken, deleteClient);
router.post('/:id/state', updateClientState);

module.exports = router; 