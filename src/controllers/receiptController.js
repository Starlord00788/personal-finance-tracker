const ReceiptService = require('../services/receiptService');
const TransactionService = require('../services/transactionService');
const { query } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const receiptService = new ReceiptService();
const transactionService = new TransactionService();

class ReceiptController {
  async uploadReceipt(req, res) {
    try {
      const { transactionId } = req.body;
      const userId = req.user.id;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
      }

      // Verify the transaction belongs to the user
      const transaction = await transactionService.getTransactionById(transactionId, userId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No receipt file uploaded'
        });
      }

      const result = await receiptService.processReceipt(req.file, transactionId, userId);

      res.status(201).json({
        success: true,
        message: 'Receipt uploaded successfully',
        data: result.receipt
      });
    } catch (error) {
      if (error.message === 'Transaction not found' || error.message === 'Access denied') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to upload receipt'
      });
    }
  }

  async getReceiptsByTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      // Verify the transaction belongs to the user
      const transaction = await transactionService.getTransactionById(transactionId, userId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const receipts = await receiptService.getReceiptsByTransaction(transactionId, userId);

      res.json({
        success: true,
        data: receipts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get receipts'
      });
    }
  }

  async getUserReceipts(req, res) {
    try {
      const userId = req.user.id;
      const receipts = await receiptService.getReceiptsByUser(userId);

      res.json({
        success: true,
        data: receipts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get receipts'
      });
    }
  }

  async deleteReceipt(req, res) {
    try {
      const { receiptId } = req.params;
      const userId = req.user.id;

      const result = await receiptService.deleteReceipt(receiptId, userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message === 'Receipt not found') {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete receipt'
      });
    }
  }

  async getReceiptFile(req, res) {
    try {
      const { filename } = req.params;
      const userId = req.user.id;

      const result = await query(
        'SELECT file_path FROM receipts WHERE filename = ? AND user_id = ?',
        [filename, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found'
        });
      }

      const filePath = result.rows[0].file_path;

      try {
        await fs.access(filePath);
        res.sendFile(path.resolve(filePath));
      } catch (error) {
        res.status(404).json({
          success: false,
          message: 'Receipt file not found on disk'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to serve receipt file'
      });
    }
  }
}

module.exports = new ReceiptController();