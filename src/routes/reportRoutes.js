const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

// GET /api/reports/monthly/:year/:month - Monthly income vs expenses report
router.get('/monthly/:year/:month', reportController.getMonthlyReport);

// GET /api/reports/yearly/:year - Yearly financial summary
router.get('/yearly/:year', reportController.getYearlyReport);

// GET /api/reports/custom?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Custom date range report
router.get('/custom', reportController.getCustomReport);

module.exports = router;
