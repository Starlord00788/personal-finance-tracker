const BudgetService = require('../services/budgetService');
const { validationResult } = require('express-validator');

const budgetService = new BudgetService();

class BudgetController {
  async createBudget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const budget = await budgetService.createBudget(userId, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget
      });
    } catch (error) {
      if (error.message.includes('overlapping') || error.message.includes('exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('date')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create budget'
      });
    }
  }

  async getBudgets(req, res) {
    try {
      const userId = req.user.id;
      const { current } = req.query;

      let budgets;
      if (current === 'true') {
        budgets = await budgetService.getCurrentBudgets(userId);
      } else {
        budgets = await budgetService.getBudgetsByUser(userId);
      }

      res.json({
        success: true,
        data: budgets,
        count: budgets.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get budgets'
      });
    }
  }

  async getBudgetById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const budget = await budgetService.getBudgetById(id, userId);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get budget'
      });
    }
  }

  async updateBudget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const budget = await budgetService.updateBudget(id, userId, req.body);

      res.json({
        success: true,
        message: 'Budget updated successfully',
        data: budget
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('date')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update budget'
      });
    }
  }

  async deleteBudget(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await budgetService.deleteBudget(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      res.json({
        success: true,
        message: 'Budget deleted successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete budget'
      });
    }
  }

  async getBudgetUtilization(req, res) {
    try {
      const userId = req.user.id;
      const { period } = req.query;

      const utilization = await budgetService.getBudgetUtilization(userId, period);

      res.json({
        success: true,
        data: utilization
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get budget utilization'
      });
    }
  }

  async getBudgetAlerts(req, res) {
    try {
      const userId = req.user.id;
      const alerts = await budgetService.checkBudgetAlerts(userId);

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get budget alerts'
      });
    }
  }

  async getBudgetSummary(req, res) {
    try {
      const userId = req.user.id;
      const summary = await budgetService.getBudgetSummary(userId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get budget summary'
      });
    }
  }

  async generateBudgetPeriod(req, res) {
    try {
      const { period, year, month } = req.query;

      if (!period) {
        return res.status(400).json({
          success: false,
          message: 'Period is required'
        });
      }

      const dates = budgetService.generateBudgetPeriodDates(
        period,
        year ? parseInt(year) : null,
        month !== undefined ? parseInt(month) : null
      );

      res.json({
        success: true,
        data: {
          period,
          ...dates
        }
      });
    } catch (error) {
      if (error.message.includes('Invalid period')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate budget period'
      });
    }
  }

  async getBudgetRecommendations(req, res) {
    try {
      const userId = req.user.id;
      
      const currentBudgets = await budgetService.getCurrentBudgets(userId);
      const utilization = await budgetService.getBudgetUtilization(userId, 'monthly');

      const recommendations = [];

      utilization.forEach(budget => {
        const utilizationPct = parseFloat(budget.utilization_percentage);
        
        if (utilizationPct > 100) {
          recommendations.push({
            type: 'reduce_spending',
            budget_id: budget.id,
            budget_name: budget.name,
            category: budget.category_name,
            message: `You're ${(utilizationPct - 100).toFixed(1)}% over budget. Consider reducing spending in ${budget.category_name}.`,
            priority: 'high',
            suggested_action: 'Reduce spending or increase budget amount'
          });
        } else if (utilizationPct > 80) {
          recommendations.push({
            type: 'monitor_spending',
            budget_id: budget.id,
            budget_name: budget.name,
            category: budget.category_name,
            message: `You're using ${utilizationPct.toFixed(1)}% of your ${budget.category_name} budget. Monitor spending closely.`,
            priority: 'medium',
            suggested_action: 'Monitor spending to avoid going over budget'
          });
        } else if (utilizationPct < 30) {
          recommendations.push({
            type: 'adjust_budget',
            budget_id: budget.id,
            budget_name: budget.name,
            category: budget.category_name,
            message: `You're only using ${utilizationPct.toFixed(1)}% of your ${budget.category_name} budget. Consider reducing the budget amount.`,
            priority: 'low',
            suggested_action: 'Consider reducing budget amount and reallocating to other categories'
          });
        }
      });

      if (currentBudgets.length === 0) {
        recommendations.push({
          type: 'create_budget',
          message: 'Create your first budget to track spending and reach financial goals.',
          priority: 'high',
          suggested_action: 'Create budgets for your top spending categories'
        });
      }

      res.json({
        success: true,
        data: {
          recommendations,
          total_recommendations: recommendations.length,
          high_priority: recommendations.filter(r => r.priority === 'high').length,
          medium_priority: recommendations.filter(r => r.priority === 'medium').length,
          low_priority: recommendations.filter(r => r.priority === 'low').length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get budget recommendations'
      });
    }
  }
}

module.exports = new BudgetController();