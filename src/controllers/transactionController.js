const TransactionService = require('../services/transactionService');
const { validationResult } = require('express-validator');

const transactionService = new TransactionService();

class TransactionController {
  async createTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const transaction = await transactionService.createTransaction(req.user.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTransactions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const transactions = await transactionService.getUserTransactions(req.user.id, req.query);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTransactionById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const transaction = await transactionService.getTransactionById(req.params.id, req.user.id);
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      const statusCode = error.message === 'Transaction not found' ? 404 : 
                        error.message === 'Access denied' ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const transaction = await transactionService.updateTransaction(
        req.params.id,
        req.user.id,
        req.body
      );
      
      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      const statusCode = error.message === 'Transaction not found' ? 404 : 
                        error.message === 'Access denied' ? 403 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      await transactionService.deleteTransaction(req.params.id, req.user.id);
      
      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      const statusCode = error.message === 'Transaction not found' ? 404 : 
                        error.message === 'Access denied' ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async getMonthlyStats(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { year, month } = req.params;
      const stats = await transactionService.getMonthlyOverview(
        req.user.id,
        parseInt(year),
        parseInt(month)
      );
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getDashboard(req, res) {
    try {
      const dashboard = await transactionService.getDashboardData(req.user.id);
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new TransactionController();