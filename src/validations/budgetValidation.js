const { body, param, query } = require('express-validator');

const createBudgetValidation = [
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID(4)
    .withMessage('Invalid category ID format'),
    
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Budget name must be between 1 and 255 characters'),
    
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('period')
    .isIn(['weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
    .withMessage('Period must be weekly, monthly, quarterly, yearly, or custom'),
    
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
    
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
    
  body('alertThreshold')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Alert threshold must be between 0 and 100')
];

const updateBudgetValidation = [
  param('id')
    .notEmpty()
    .withMessage('Budget ID is required')
    .isUUID(4)
    .withMessage('Invalid budget ID format'),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Budget name must be between 1 and 255 characters'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
    
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
    
  body('alertThreshold')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Alert threshold must be between 0 and 100'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false')
];

const getBudgetByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Budget ID is required')
    .isUUID(4)
    .withMessage('Invalid budget ID format')
];

const deleteBudgetValidation = [
  param('id')
    .notEmpty()
    .withMessage('Budget ID is required')
    .isUUID(4)
    .withMessage('Invalid budget ID format')
];

const getBudgetUtilizationValidation = [
  query('period')
    .optional()
    .isIn(['weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be weekly, monthly, quarterly, or yearly')
];

const generateBudgetPeriodValidation = [
  query('period')
    .notEmpty()
    .withMessage('Period is required')
    .isIn(['weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be weekly, monthly, quarterly, or yearly'),
    
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2050 })
    .withMessage('Year must be between 2000 and 2050'),
    
  query('month')
    .optional()
    .isInt({ min: 0, max: 11 })
    .withMessage('Month must be between 0 (January) and 11 (December)')
];

module.exports = {
  createBudgetValidation,
  updateBudgetValidation,
  getBudgetByIdValidation,
  deleteBudgetValidation,
  getBudgetUtilizationValidation,
  generateBudgetPeriodValidation
};