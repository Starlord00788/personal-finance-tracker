const NotificationService = require('../services/notificationService');

const notificationService = new NotificationService();

class NotificationController {
  async sendTestEmail(req, res) {
    try {
      const { email, type = 'welcome' } = req.body;
      const user = req.user || { first_name: 'Test User', email: email };

      let result;
      switch (type) {
        case 'welcome':
          result = await notificationService.sendWelcomeEmail(user);
          break;
        case 'budget-alert':
          const budgetData = {
            categoryName: 'Dining Out',
            spentAmount: 450,
            budgetLimit: 400,
            percentageUsed: 112.5
          };
          result = await notificationService.sendBudgetAlert(user, budgetData);
          break;
        case 'monthly-report':
          const reportData = {
            month: 'January',
            year: 2024,
            totalIncome: 5000,
            totalExpenses: 3200,
            netAmount: 1800,
            topCategories: [
              { name: 'Food & Dining', amount: 800 },
              { name: 'Transportation', amount: 600 },
              { name: 'Entertainment', amount: 400 }
            ]
          };
          result = await notificationService.sendMonthlyReport(user, reportData);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid email type'
          });
      }

      res.json({
        success: true,
        message: 'Test email sent',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email'
      });
    }
  }

  async getNotificationSettings(req, res) {
    try {
      const settings = {
        emailEnabled: true,
        budgetAlerts: true,
        transactionAlerts: true,
        monthlyReports: true,
        weeklyDigest: false,
        pushNotifications: false
      };

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get notification settings'
      });
    }
  }

  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user.id;
      const settings = req.body;

      const allowedSettings = [
        'emailEnabled', 'budgetAlerts', 'transactionAlerts', 
        'monthlyReports', 'weeklyDigest', 'pushNotifications'
      ];

      const validSettings = {};
      for (const key in settings) {
        if (allowedSettings.includes(key) && typeof settings[key] === 'boolean') {
          validSettings[key] = settings[key];
        }
      }

      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: validSettings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings'
      });
    }
  }

  async sendWelcomeEmail(req, res) {
    try {
      const { email, name = 'User' } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required'
        });
      }

      const user = { email: email, first_name: name };
      const result = await notificationService.sendWelcomeEmail(user);

      res.json({
        success: true,
        message: 'Welcome email sent successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email'
      });
    }
  }

  async sendBudgetAlert(req, res) {
    try {
      const { email, budgetData } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required'
        });
      }

      if (!budgetData) {
        return res.status(400).json({
          success: false,
          message: 'Budget data is required'
        });
      }

      const user = { email: email, first_name: 'User' };
      const result = await notificationService.sendBudgetAlert(user, budgetData);

      res.json({
        success: true,
        message: 'Budget alert email sent successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send budget alert'
      });
    }
  }

  async sendTestBudgetAlert(req, res) {
    try {
      const user = req.user || { first_name: 'Test User', email: 'test@example.com' };
      
      const budgetData = {
        categoryName: 'Dining Out',
        spentAmount: 450,
        budgetLimit: 400,
        percentageUsed: 112.5
      };
      
      const result = await notificationService.sendBudgetAlert(user, budgetData);

      res.json({
        success: true,
        message: 'Test budget alert sent',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send test budget alert'
      });
    }
  }
}

module.exports = new NotificationController();