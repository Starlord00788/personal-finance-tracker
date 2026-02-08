const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middlewares/auth');
const {
  createCategoryValidation,
  updateCategoryValidation,
  getCategoriesValidation,
  categoryParamValidation
} = require('../validations/categoryValidation');

const router = express.Router();

// All category routes require authentication
router.use(authenticateToken);

// POST /api/categories - Create a new category
router.post(
  '/',
  createCategoryValidation,
  categoryController.createCategory
);

// GET /api/categories - Get user's categories (with optional type filter)
router.get(
  '/',
  getCategoriesValidation,
  categoryController.getCategories
);

// POST /api/categories/defaults - Initialize default categories
router.post(
  '/defaults',
  categoryController.initializeDefaults
);

// GET /api/categories/:id - Get category by ID
router.get(
  '/:id',
  categoryParamValidation,
  categoryController.getCategoryById
);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  updateCategoryValidation,
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category
router.delete(
  '/:id',
  categoryParamValidation,
  categoryController.deleteCategory
);

module.exports = router;