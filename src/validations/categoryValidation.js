const { body, param, query } = require('express-validator');

const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Category name must be between 1 and 255 characters'),
    
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
    
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #6366f1)'),
    
  body('icon')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon must be between 1 and 50 characters')
];

const updateCategoryValidation = [
  param('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isLength({ min: 1 })
    .withMessage('Invalid category ID'),
    
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Category name must be between 1 and 255 characters'),
    
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
    
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #6366f1)'),
    
  body('icon')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon must be between 1 and 50 characters')
];

const getCategoriesValidation = [
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense')
];

const categoryParamValidation = [
  param('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isLength({ min: 1 })
    .withMessage('Invalid category ID')
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  getCategoriesValidation,
  categoryParamValidation
};