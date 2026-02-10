const express = require('express');
const multer = require('multer');
const router = express.Router();
const { statementController, anomalyController } = require('../controllers/statementController');
const { authenticateToken } = require('../middlewares/auth');

// Use memory storage for CSV parsing (no need to save to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

router.use(authenticateToken);

// POST /api/statements/preview - Preview/parse CSV without importing
router.post('/preview', (req, res, next) => {
  upload.single('statement')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, statementController.previewStatement);

// POST /api/statements/import - Import CSV bank statement
router.post('/import', (req, res, next) => {
  upload.single('statement')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, statementController.importStatement);

// GET /api/statements/anomalies - Detect spending anomalies
router.get('/anomalies', anomalyController.getAnomalies);

module.exports = router;
