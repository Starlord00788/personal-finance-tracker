const express = require('express');
const budgetController = require('../controllers/budgetController');
const auth = require('../middlewares/auth').authenticateToken;
const {
  createBudgetValidation,
  updateBudgetValidation,
  getBudgetByIdValidation,
  deleteBudgetValidation,
  getBudgetUtilizationValidation,
  generateBudgetPeriodValidation
} = require('../validations/budgetValidation');

const router = express.Router();

// Create a new budget
router.post('/', auth, createBudgetValidation, budgetController.createBudget);

// Get all budgets for user (with optional 'current' filter)
router.get('/', auth, budgetController.getBudgets);

// Get budget utilization summary
router.get('/utilization', auth, getBudgetUtilizationValidation, budgetController.getBudgetUtilization);

// Get budget alerts
router.get('/alerts', auth, budgetController.getBudgetAlerts);

// Get budget summary
router.get('/summary', auth, budgetController.getBudgetSummary);

// Get budget recommendations
router.get('/recommendations', auth, budgetController.getBudgetRecommendations);

// Generate dates for a budget period
router.get('/period/generate', auth, generateBudgetPeriodValidation, budgetController.generateBudgetPeriod);

// Get specific budget by ID
router.get('/:id', auth, getBudgetByIdValidation, budgetController.getBudgetById);

// Update existing budget
router.put('/:id', auth, updateBudgetValidation, budgetController.updateBudget);

// Delete budget
router.delete('/:id', auth, deleteBudgetValidation, budgetController.deleteBudget);

module.exports = router;