const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Энэ IP хаягнаас хэт их хүсэлт ирсэн тул та дараа дахин оролдоно уу.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 5 requests per windowMs
  message: 'Энэ IP хаягнаас хэт их хүсэлт ирсэн тул та дараа дахин оролдоно уу.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter
}; 