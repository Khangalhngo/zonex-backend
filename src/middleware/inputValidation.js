const { body, param, query, validationResult } = require('express-validator');

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for different routes
const authValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must be at least 8 characters and contain uppercase, lowercase, number and special character'),
    validateInput
  ],
  login: [
    body('username').trim().notEmpty(),
    body('password').notEmpty(),
    validateInput
  ],
  updatePassword: [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('New password must be at least 8 characters and contain uppercase, lowercase, number and special character'),
    validateInput
  ]
};

const clientValidation = {
  create: [
    body('lastName').trim().notEmpty().isLength({ max: 255 }),
    body('firstName').trim().notEmpty().isLength({ max: 255 }),
    body('registerNo').trim().notEmpty().isLength({ max: 255 }),
    body('organization').optional().trim().isLength({ max: 255 }),
    body('department').optional().trim().isLength({ max: 255 }),
    body('position').optional().trim().isLength({ max: 255 }),
    body('pnumber').optional().trim().isLength({ max: 255 }),
    validateInput
  ],
  update: [
    param('id').isInt(),
    body('lastName').optional().trim().isLength({ max: 255 }),
    body('firstName').optional().trim().isLength({ max: 255 }),
    body('organization').optional().trim().isLength({ max: 255 }),
    body('department').optional().trim().isLength({ max: 255 }),
    body('position').optional().trim().isLength({ max: 255 }),
    validateInput
  ],
  delete: [
    param('id').isInt(),
    validateInput
  ]
};

module.exports = {
  authValidation,
  clientValidation
}; 