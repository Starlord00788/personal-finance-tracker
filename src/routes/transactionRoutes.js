const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middlewares/auth');
const {
  createTransactionValidation,
  updateTransactionValidation,
  getTransactionsValidation,
  transactionParamValidation,
  monthlyStatsValidation
} = require('../validations/transactionValidation');

const router = express.Router();

// All transaction routes require authentication
router.use(authenticateToken);

// POST /api/transactions - Create a new transaction
router.post(
  '/',
  createTransactionValidation,
  transactionController.createTransaction
);

// GET /api/transactions - Get user's transactions with filtering
router.get(
  '/',
  getTransactionsValidation,
  transactionController.getTransactions
);

// GET /api/transactions/dashboard - Get dashboard data
router.get(
  '/dashboard',
  transactionController.getDashboard
);

// GET /api/transactions/stats/:year/:month - Get monthly statistics
router.get(
  '/stats/:year/:month',
  monthlyStatsValidation,
  transactionController.getMonthlyStats
);

// GET /api/transactions/:id - Get transaction by ID
router.get(
  '/:id',
  transactionParamValidation,
  transactionController.getTransactionById
);

// PUT /api/transactions/:id - Update transaction
router.put(
  '/:id',
  updateTransactionValidation,
  transactionController.updateTransaction
);

// DELETE /api/transactions/:id - Delete transaction
router.delete(
  '/:id',
  transactionParamValidation,
  transactionController.deleteTransaction
);

module.exports = router;