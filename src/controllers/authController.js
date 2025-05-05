const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const jwt = require('jsonwebtoken');

// Constants for security settings
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Helper function to check if account is locked
const isAccountLocked = async (username) => {
  const [failedAttempts] = await pool.execute(
    `SELECT COUNT(*) as count, MAX(attempt_time) as last_attempt 
     FROM login_history 
     WHERE username = ? AND attempt_status = 'failed' 
     AND attempt_time > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [username, LOCKOUT_DURATION / (60 * 1000)]
  );

  return failedAttempts[0].count >= MAX_LOGIN_ATTEMPTS;
};

// Helper function to validate password complexity
const validatePassword = (password) => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }
  return { valid: true };
};

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Create login history table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        attempt_status ENUM('success', 'failed') NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if account is locked
    if (await isAccountLocked(username)) {
      return res.status(429).json({
        error: 'Account temporarily locked due to multiple failed attempts. Please try again later.'
      });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (users.length === 0) {
      // Log failed attempt
      await pool.execute(
        'INSERT INTO login_history (username, attempt_status, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        [username, 'failed', ipAddress, userAgent]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      // Log failed attempt
      await pool.execute(
        'INSERT INTO login_history (username, attempt_status, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        [username, 'failed', ipAddress, userAgent]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log successful attempt
    await pool.execute(
      'INSERT INTO login_history (username, attempt_status, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [username, 'success', ipAddress, userAgent]
    );

    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(users[0]);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get user from database
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  updatePassword
}; 