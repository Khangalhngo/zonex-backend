const express = require('express');
const router = express.Router();
const { createClient, getAllClients, getClientById, updateClient, deleteClient, updateClientState, updateClientsStateByPnumber } = require('../controllers/clientController');
const authenticateToken = require('../middleware/auth');

router.post('/register-client', createClient);
router.get('/clients', authenticateToken, getAllClients);
router.get('/clients/:id', authenticateToken, getClientById);
router.put('/clients/:id', authenticateToken, updateClient);
router.delete('/clients/:id', authenticateToken, deleteClient);
router.post('/:id/state', updateClientState);
router.post('/clients/reserve', updateClientsStateByPnumber);

module.exports = router; 