const pool = require('../config/database');

const createClient = async (req, res) => {
  try {
    const { lastName, firstName, registerNo, organization, department, position, pnumber, editedAdmin, submittedAdmin, letterNo, state } = req.body;
    console.log("🚀 ~ :6 ~ createClient ~ req.body:", req.body)

    // Create the clients table if it does not exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lastName VARCHAR(255) NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        registerNo VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        department VARCHAR(255),
        position VARCHAR(255),
        pnumber VARCHAR(255),
        editedAdmin VARCHAR(255),
        submittedAdmin VARCHAR(255),
        letterNo VARCHAR(255),
        state INT,
        registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [result] = await pool.execute(
      'INSERT INTO clients (lastName, firstName,registerNo, organization, department, position, pnumber,  editedAdmin, submittedAdmin, letterNo, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lastName, firstName, registerNo, organization, department, position, pnumber, editedAdmin, submittedAdmin, letterNo, state]
    );
    console.log("result", result);
    res.status(201).json({ message: 'Client added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllClients = async (req, res) => {
  try {
    const [clients] = await pool.execute('SELECT * FROM clients');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const [clients] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(clients[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { lastName, firstName, registerNo, organization, department, position, editedAdmin, pnumber, letterNo, state } = req.body;
    const clientId = req.params.id;

    // Create client history table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS client_update_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        pnumber VARCHAR(255),
        changed_fields JSON,
        previous_values JSON,
        new_values JSON,
        edited_by VARCHAR(255),
        changed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // First, get the current values of the client
    const [currentClient] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [clientId]
    );

    if (currentClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const currentValues = currentClient[0];
    const newValues = {
      lastName,
      firstName,
      registerNo,
      organization,
      department,
      position,
      pnumber,
      letterNo,
      state
    };

    // Find which fields were changed
    const changedFields = [];
    const previousValues = {};
    const updatedValues = {};

    Object.keys(newValues).forEach(key => {
      if (newValues[key] !== undefined && newValues[key] !== currentValues[key]) {
        changedFields.push(key);
        previousValues[key] = currentValues[key];
        updatedValues[key] = newValues[key];
      }
    });

    // Update the client
    const [result] = await pool.execute(
      `UPDATE clients 
      SET lastName = ?, firstName = ?, registerNo = ?, organization = ?, 
        department = ?, position = ?, editedAdmin = ?, pnumber = ?, letterNo = ?, state = ?
      WHERE id = ?`,
      [lastName, firstName, registerNo, organization, department, position, editedAdmin, pnumber, letterNo, state, clientId]
    );

    // Log the changes in history table if any fields were changed
    if (changedFields.length > 0) {
      await pool.execute(
        `INSERT INTO client_update_history 
        (client_id, pnumber, changed_fields, previous_values, new_values, edited_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          pnumber,
          JSON.stringify(changedFields),
          JSON.stringify(previousValues),
          JSON.stringify(updatedValues),
          editedAdmin
        ]
      );
    }

    res.json({
      message: 'Client updated successfully',
      historyLogged: changedFields.length > 0,
      changes: changedFields
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClientState = async (req, res) => {
  try {
    const { state } = req.body;
    const clientId = req.params.id;

    // Create history table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS client_state_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        pnumber VARCHAR(255),
        previous_state INT,
        new_state INT,
        changed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        affected_clients INT
      )
    `);

    // First, get the current state and pnumber of the client
    const [currentClient] = await pool.execute(
      'SELECT state, pnumber FROM clients WHERE id = ?',
      [clientId]
    );

    if (currentClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const previousState = currentClient[0].state;
    const pnumber = currentClient[0].pnumber;

    // Update the client state
    const [result] = await pool.execute(
      `UPDATE clients 
      SET state = ?
      WHERE id = ?`,
      [state, clientId]
    );

    // Log the change in history table
    await pool.execute(
      `INSERT INTO client_state_history (client_id, pnumber, previous_state, new_state, affected_clients)
       VALUES (?, ?, ?, ?, ?)`,
      [clientId, pnumber, previousState, state, 1]
    );

    res.json({
      message: 'Client state updated successfully',
      historyLogged: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClientsStateByPnumber = async (req, res) => {
  try {
    const { pnumber } = req.body;

    // Create history table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS client_state_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pnumber VARCHAR(255) NOT NULL,
        previous_state INT,
        new_state INT,
        changed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        affected_clients INT
      )
    `);

    // First, get the current state of clients with this pnumber
    const [currentClients] = await pool.execute(
      'SELECT id, state FROM clients WHERE pnumber = ?',
      [pnumber]
    );

    // Update the clients state
    const [result] = await pool.execute(
      `UPDATE clients 
      SET state = 1
      WHERE pnumber = ?`,
      [pnumber]
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({ error: 'No clients found with the given pnumber' });
    }

    // Log the change in history table
    const previousState = currentClients.length > 0 ? currentClients[0].state : null;
    await pool.execute(
      `INSERT INTO client_state_history (pnumber, previous_state, new_state, affected_clients)
       VALUES (?, ?, ?, ?)`,
      [pnumber, previousState, 1, result.affectedRows]
    );

    res.json({
      message: `Updated state to 1 for ${result.affectedRows} clients successfully`,
      historyLogged: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientState,
  updateClientsStateByPnumber
}; 