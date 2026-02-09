const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/insights', aiController.getSpendingInsights);
router.get('/budget-recommendations', aiController.getBudgetRecommendations);
router.post('/goal-insights', aiController.getFinancialGoalInsights);
router.get('/summary', aiController.getFinancialSummary);
router.get('/status', aiController.getAIStatus);

module.exports = router;