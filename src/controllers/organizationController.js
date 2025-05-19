const pool = require('../config/database');

const getAllOrganizations = async (req, res) => {
  try {
    const [organizations] = await pool.execute('SELECT * FROM organizations');
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllOrganizations
};