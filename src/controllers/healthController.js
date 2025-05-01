const pool = require('../config/database');
const os = require('os');

const getSystemHealth = async (req, res) => {
  try {
    // Get database connection status
    const [dbStatus] = await pool.execute('SELECT 1');
    const dbHealthy = dbStatus.length > 0;

    // Get system metrics
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
      },
      cpu: {
        cores: os.cpus().length,
        load: os.loadavg()
      },
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        connections: {
          total: pool._allConnections ? pool._allConnections.length : 0,
          free: pool._freeConnections ? pool._freeConnections.length : 0
        }
      }
    };

    // Check if system is healthy
    const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();
    if (memoryUsage > 0.9 || !dbHealthy) {
      systemHealth.status = 'unhealthy';
    }

    res.json(systemHealth);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getDatabaseHealth = async (req, res) => {
  try {
    // Get detailed database statistics
    const [tableStats] = await pool.execute(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        (data_length + index_length) as total_size
      FROM information_schema.tables
      WHERE table_schema = ?
    `, [process.env.DB_NAME]);

    const [connectionStats] = await pool.execute(`
      SHOW STATUS WHERE Variable_name IN (
        'Threads_connected',
        'Threads_running',
        'Max_used_connections'
      )
    `);

    const dbHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tables: tableStats.map(table => ({
        name: table.table_name,
        rows: table.table_rows,
        size: {
          data: table.data_length,
          index: table.index_length,
          total: table.total_size
        }
      })),
      connections: connectionStats.reduce((acc, stat) => {
        acc[stat.Variable_name] = stat.Value;
        return acc;
      }, {})
    };

    res.json(dbHealth);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getSystemHealth,
  getDatabaseHealth
}; 