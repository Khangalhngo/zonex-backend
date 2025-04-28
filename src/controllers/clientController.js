const pool = require('../config/database');

const createClient = async (req, res) => {
  try {
    const { lastName, firstName, registerNo, organization, department, position, editedAdmin, submittedAdmin, letterNo, state } = req.body;
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
        editedAdmin VARCHAR(255),
        submittedAdmin VARCHAR(255),
        letterNo VARCHAR(255),
        state INT,
        registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [result] = await pool.execute(
      'INSERT INTO clients (lastName, firstName,registerNo, organization, department, position, editedAdmin, submittedAdmin, letterNo, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lastName, firstName, registerNo, organization, department, position, editedAdmin, submittedAdmin, letterNo, state]
    );

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

    const [result] = await pool.execute(
      `UPDATE clients 
      SET lastName = ?, firstName = ?, registerNo = ?, organization = ?, 
        department = ?, position = ?, editedAdmin = ?, pnumber = ?, letterNo = ?, state = ?
      WHERE id = ?`,
      [lastName, firstName, registerNo, organization, department, position, editedAdmin, pnumber, letterNo, state, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client updated successfully' });
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

    const [result] = await pool.execute(
      `UPDATE clients 
      SET state = ?
      WHERE id = ?`,
      [state, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client state updated successfully' });
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
  updateClientState
}; 