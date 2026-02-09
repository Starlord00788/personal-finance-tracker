const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

class ReceiptService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/receipts');
    this.ensureUploadDirectory();
    
    // Configure multer for file uploads
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `receipt_${req.user.id}_${uniqueSuffix}_${sanitizedOriginalName}`);
      }
    });

    this.fileFilter = (req, file, cb) => {
      // Accept image files, PDFs, text files, and SVG for testing
      if (file.mimetype.startsWith('image/') || 
          file.mimetype === 'application/pdf' || 
          file.mimetype === 'text/plain' ||
          file.mimetype === 'text/html' ||
          file.mimetype === 'image/svg+xml') {
        cb(null, true);
      } else {
        cb(new Error('Only image files, PDFs, and text files are allowed'), false);
      }
    };

    this.upload = multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Single file upload
      }
    });
  }

  async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  getUploadMiddleware() {
    return this.upload.single('receipt');
  }

  async processReceipt(file, transactionId, userId) {
    try {
      if (!file) {
        throw new Error('No receipt file provided');
      }

      const receiptData = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
        transactionId,
        userId
      };

      // Store receipt information in database
      await this.saveReceiptToDatabase(receiptData);

      return {
        success: true,
        receipt: {
          id: receiptData.filename,
          filename: receiptData.filename,
          originalName: receiptData.originalName,
          size: receiptData.size,
          uploadedAt: receiptData.uploadedAt,
          url: `/uploads/receipts/${receiptData.filename}`
        }
      };
    } catch (error) {
      // Clean up uploaded file if processing fails
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', unlinkError);
        }
      }
      throw error;
    }
  }

  async saveReceiptToDatabase(receiptData) {
    await query(
      `INSERT INTO receipts (id, filename, original_name, file_path, file_size, 
       file_type, transaction_id, user_id, uploaded_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        receiptData.filename,
        receiptData.originalName,
        receiptData.path,
        receiptData.size,
        receiptData.mimetype,
        receiptData.transactionId,
        receiptData.userId,
        receiptData.uploadedAt.toISOString()
      ]
    );
  }

  async getReceiptsByTransaction(transactionId, userId) {
    const result = await query(
      'SELECT * FROM receipts WHERE transaction_id = ? AND user_id = ?',
      [transactionId, userId]
    );

    return result.rows.map(receipt => ({
      id: receipt.id,
      filename: receipt.filename,
      originalName: receipt.original_name,
      size: receipt.file_size,
      uploadedAt: receipt.uploaded_at,
      url: `/uploads/receipts/${receipt.filename}`
    }));
  }

  async getReceiptsByUser(userId) {
    const result = await query(
      'SELECT r.*, t.description as transaction_description FROM receipts r LEFT JOIN transactions t ON r.transaction_id = t.id WHERE r.user_id = ? ORDER BY r.uploaded_at DESC',
      [userId]
    );

    return result.rows.map(receipt => ({
      id: receipt.id,
      filename: receipt.filename,
      originalName: receipt.original_name,
      size: receipt.file_size,
      uploadedAt: receipt.uploaded_at,
      transactionId: receipt.transaction_id,
      transactionDescription: receipt.transaction_description,
      url: `/uploads/receipts/${receipt.filename}`
    }));
  }

  async deleteReceipt(receiptId, userId) {
    const result = await query(
      'SELECT file_path FROM receipts WHERE id = ? AND user_id = ?',
      [receiptId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Receipt not found');
    }

    const filePath = result.rows[0].file_path;

    // Delete from database
    await query(
      'DELETE FROM receipts WHERE id = ? AND user_id = ?',
      [receiptId, userId]
    );

    // Delete physical file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete receipt file:', error);
      // Don't throw here as database deletion was successful
    }

    return { success: true, message: 'Receipt deleted successfully' };
  }

  validateUpload(req, res, next) {
    this.getUploadMiddleware()(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  }
}

module.exports = ReceiptService;