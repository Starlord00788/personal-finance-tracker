const express = require('express');
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth').authenticateToken;

const router = express.Router();

// Send test email (for development/testing)
router.post('/test-email', auth, notificationController.sendTestEmail);

// Send welcome email (requires auth)
router.post('/send-welcome', auth, notificationController.sendWelcomeEmail);

// Send budget alert (requires auth)
router.post('/send-budget-alert', auth, notificationController.sendBudgetAlert);

// Test budget alert (legacy)
router.post('/test-budget-alert', auth, notificationController.sendTestBudgetAlert);

// Get user's notification settings
router.get('/settings', auth, notificationController.getNotificationSettings);

// Update user's notification settings
router.put('/settings', auth, notificationController.updateNotificationSettings);

module.exports = router;