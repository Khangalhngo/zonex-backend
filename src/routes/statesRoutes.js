const express = require('express');
const router = express.Router();
const statesController = require('../controllers/stateController');

router.get('/states', statesController.getAllStates);

module.exports = router; 