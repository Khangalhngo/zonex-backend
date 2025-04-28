const pool = require('../config/database');

const createRequest = async (req, res) => {
  try {
    // Create the requests table if it does not exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS request (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clientId INT NOT NULL,
        pnumber VARCHAR(45) NOT NULL,
        request_sent_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        request_accept_date DATETIME DEFAULT NULL
      )
    `);

    const { clientId, pnumber } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO request (clientId, pnumber) VALUES (?, ?)',
      [clientId, pnumber]
    );

    res.status(201).json({
      message: 'Request created successfully',
      requestId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingRequestsWithClientData = async (req, res) => {
  try {
    const [results] = await pool.execute('CALL GetPendingRequestsWithClientData()');

    // MySQL stored procedures return results in an array where the first element contains the result set
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClientPnumber = async (req, res) => {
  try {
    const { clientId, pnumber } = req.body;

    // Call the stored procedure with current date for request_accept_date
    const [result] = await pool.execute(
      'CALL UpdateClientPnumber(?, ?, NOW())',
      [clientId, pnumber]
    );

    if (result[0].status === 'Error') {
      return res.status(404).json({ error: result[0].message });
    }

    res.json({ message: result[0].message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAcceptedRequestsWithClientData = async (req, res) => {
  try {
    const [results] = await pool.execute(`
      SELECT * FROM clients c 
      INNER JOIN request r ON r.clientId = c.id 
      WHERE r.request_accept_date IS NOT NULL
    `);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRequest,
  getPendingRequestsWithClientData,
  updateClientPnumber,
  getAcceptedRequestsWithClientData
};
