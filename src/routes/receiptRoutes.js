const express = require('express');
const receiptController = require('../controllers/receiptController');
const ReceiptService = require('../services/receiptService');
const auth = require('../middlewares/auth').authenticateToken;

const router = express.Router();
const receiptService = new ReceiptService();

// Upload receipt for a transaction
router.post('/upload', 
  auth, 
  receiptService.validateUpload.bind(receiptService), 
  receiptController.uploadReceipt
);

// Get receipts for a specific transaction
router.get('/transaction/:transactionId', auth, receiptController.getReceiptsByTransaction);

// Get all receipts for the authenticated user
router.get('/user', auth, receiptController.getUserReceipts);

// Delete a receipt
router.delete('/:receiptId', auth, receiptController.deleteReceipt);

// Serve receipt files (protected route)
router.get('/file/:filename', auth, receiptController.getReceiptFile);

module.exports = router;