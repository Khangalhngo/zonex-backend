const pool = require('../config/database');

const getAllStates = async (req, res) => {
  try {
    const [states] = await pool.execute('SELECT * FROM states');
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllStates
}