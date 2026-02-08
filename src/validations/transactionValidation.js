const { body, param, query } = require('express-validator');

const createTransactionValidation = [
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isLength({ min: 1 })
    .withMessage('Valid category ID is required'),
    
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code (e.g., USD)')
    .toUpperCase(),
    
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('transaction_date')
    .isISO8601()
    .withMessage('Transaction date must be a valid date (YYYY-MM-DD)'),
    
  body('is_recurring')
    .optional()
    .isBoolean()
    .withMessage('is_recurring must be true or false'),
    
  body('recurring_frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Recurring frequency must be daily, weekly, monthly, or yearly'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

const updateTransactionValidation = [
  param('id')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isLength({ min: 1 })
    .withMessage('Invalid transaction ID'),
    
  body('category_id')
    .optional()
    .notEmpty()
    .withMessage('Category ID cannot be empty')
    .isLength({ min: 1 })
    .withMessage('Valid category ID is required'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
    
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code (e.g., USD)')
    .toUpperCase(),
    
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
    
  body('transaction_date')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date (YYYY-MM-DD)'),
    
  body('is_recurring')
    .optional()
    .isBoolean()
    .withMessage('is_recurring must be true or false'),
    
  body('recurring_frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Recurring frequency must be daily, weekly, monthly, or yearly'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

const getTransactionsValidation = [
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
    
  query('category_id')
    .optional()
    .notEmpty()
    .withMessage('Category ID cannot be empty')
    .isLength({ min: 1 })
    .withMessage('Invalid category ID'),
    
  query('from_date')
    .optional()
    .isISO8601()
    .withMessage('from_date must be a valid date (YYYY-MM-DD)'),
    
  query('to_date')
    .optional()
    .isISO8601()
    .withMessage('to_date must be a valid date (YYYY-MM-DD)'),
    
  query('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('min_amount must be a positive number'),
    
  query('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('max_amount must be a positive number'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort_by')
    .optional()
    .isIn(['transaction_date', 'amount', 'created_at'])
    .withMessage('sort_by must be transaction_date, amount, or created_at'),
    
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sort_order must be asc or desc')
];

const transactionParamValidation = [
  param('id')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isLength({ min: 1 })
    .withMessage('Invalid transaction ID')
];

const monthlyStatsValidation = [
  param('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
    
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
];

module.exports = {
  createTransactionValidation,
  updateTransactionValidation,
  getTransactionsValidation,
  transactionParamValidation,
  monthlyStatsValidation
};