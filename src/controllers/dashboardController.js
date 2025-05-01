const pool = require('../config/database');

const getClientStatistics = async (req, res) => {
  try {
    // Get total count of clients
    const [totalCount] = await pool.execute('SELECT COUNT(*) as total FROM clients');

    // Get count of clients by state with state names
    const [stateCounts] = await pool.execute(`
      SELECT 
        s.id as state_id,
        s.name as state_name,
        COUNT(c.id) as count
      FROM states s
      LEFT JOIN clients c ON s.id = c.state
      GROUP BY s.id, s.name
      ORDER BY s.id
    `);

    // Get today's client updates with state names
    const [recentUpdates] = await pool.execute(`
      SELECT 
        c.id,
        c.lastName,
        c.firstName,
        c.pnumber,
        c.state,
        s.name as state_name,
        c.updated_date
      FROM clients c
      LEFT JOIN states s ON c.state = s.id
      WHERE DATE(c.updated_date) = CURDATE()
      ORDER BY c.updated_date DESC
      LIMIT 5
    `);

    // Get today's login attempts
    const [recentLogins] = await pool.execute(`
      SELECT 
        username,
        attempt_status,
        attempt_time,
        ip_address
      FROM login_history
      WHERE DATE(attempt_time) = CURDATE()
      ORDER BY attempt_time DESC
      LIMIT 5
    `);

    // Format the response
    const response = {
      totalClients: totalCount[0].total,
      stateStatistics: stateCounts.map(item => ({
        state_id: item.state_id,
        state_name: item.state_name,
        count: item.count
      })),
      todaysUpdates: recentUpdates.map(item => ({
        id: item.id,
        name: `${item.lastName} ${item.firstName}`,
        pnumber: item.pnumber,
        state_id: item.state,
        state_name: item.state_name,
        updatedAt: item.updated_date
      })),
      todaysLogins: recentLogins.map(item => ({
        username: item.username,
        status: item.attempt_status,
        time: item.attempt_time,
        ip: item.ip_address
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getClientStatistics
};
