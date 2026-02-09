const BudgetRepository = require('../repositories/budgetRepository');

class BudgetService {
  constructor() {
    this.budgetRepository = new BudgetRepository();
  }

  async createBudget(userId, budgetData) {
    const { categoryId, name, amount, period, startDate, endDate, alertThreshold } = budgetData;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }

    // Check for overlapping budgets for the same category
    const existingBudgets = await this.budgetRepository.findByCategory(userId, categoryId);
    const hasOverlap = existingBudgets.some(budget => {
      const budgetStart = new Date(budget.start_date);
      const budgetEnd = new Date(budget.end_date);
      return (start <= budgetEnd && end >= budgetStart);
    });

    if (hasOverlap) {
      throw new Error('A budget for this category already exists in the specified date range');
    }

    const budget = await this.budgetRepository.create({
      user_id: userId,
      category_id: categoryId,
      name,
      amount: parseFloat(amount),
      period,
      start_date: startDate,
      end_date: endDate,
      alert_threshold: alertThreshold || 80
    });

    return budget;
  }

  async getBudgetsByUser(userId) {
    return await this.budgetRepository.findByUser(userId);
  }

  async getCurrentBudgets(userId) {
    const budgets = await this.budgetRepository.findCurrentBudgets(userId);
    
    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await this.budgetRepository.calculateSpentAmount(
          budget.id,
          budget.start_date,
          budget.end_date,
          budget.category_id
        );

        const utilizationPercentage = (spentAmount / budget.amount) * 100;
        const remainingAmount = Math.max(0, budget.amount - spentAmount);

        return {
          ...budget,
          spent_amount: spentAmount,
          remaining_amount: remainingAmount,
          utilization_percentage: utilizationPercentage.toFixed(2),
          is_over_budget: spentAmount > budget.amount,
          is_near_limit: utilizationPercentage >= budget.alert_threshold
        };
      })
    );

    return budgetsWithSpending;
  }

  async getBudgetById(id, userId) {
    const budget = await this.budgetRepository.findById(id);
    
    if (!budget || budget.user_id !== userId) {
      return null;
    }

    // Calculate current spending
    const spentAmount = await this.budgetRepository.calculateSpentAmount(
      budget.id,
      budget.start_date,
      budget.end_date,
      budget.category_id
    );

    const utilizationPercentage = (spentAmount / budget.amount) * 100;
    const remainingAmount = Math.max(0, budget.amount - spentAmount);

    return {
      ...budget,
      spent_amount: spentAmount,
      remaining_amount: remainingAmount,
      utilization_percentage: utilizationPercentage.toFixed(2),
      is_over_budget: spentAmount > budget.amount,
      is_near_limit: utilizationPercentage >= budget.alert_threshold
    };
  }

  async updateBudget(id, userId, updateData) {
    const budget = await this.budgetRepository.findById(id);
    
    if (!budget || budget.user_id !== userId) {
      throw new Error('Budget not found');
    }

    // Validate date updates if provided
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || budget.start_date;
      const endDate = updateData.endDate || budget.end_date;
      
      if (new Date(startDate) >= new Date(endDate)) {
        throw new Error('Start date must be before end date');
      }
    }

    const allowedUpdates = ['name', 'amount', 'start_date', 'end_date', 'alert_threshold', 'is_active'];
    const filteredUpdates = {};

    Object.keys(updateData).forEach(key => {
      const snakeKey = this.camelToSnake(key);
      if (allowedUpdates.includes(snakeKey)) {
        filteredUpdates[snakeKey] = updateData[key];
      }
    });

    if (filteredUpdates.amount) {
      filteredUpdates.amount = parseFloat(filteredUpdates.amount);
    }

    return await this.budgetRepository.updateById(id, filteredUpdates);
  }

  async deleteBudget(id, userId) {
    const budget = await this.budgetRepository.findById(id);
    
    if (!budget || budget.user_id !== userId) {
      throw new Error('Budget not found');
    }

    return await this.budgetRepository.deleteById(id);
  }

  async getBudgetUtilization(userId, period = null) {
    return await this.budgetRepository.getBudgetUtilization(userId, period);
  }

  async checkBudgetAlerts(userId) {
    const alerts = await this.budgetRepository.getBudgetAlerts(userId, 80);
    
    // Find budgets that need attention
    const criticalAlerts = alerts.filter(alert => alert.utilization_percentage >= 100);
    const warningAlerts = alerts.filter(alert => 
      alert.utilization_percentage >= 80 && alert.utilization_percentage < 100
    );

    return {
      critical: criticalAlerts,
      warning: warningAlerts,
      total: alerts.length
    };
  }

  async getBudgetSummary(userId) {
    const currentBudgets = await this.getCurrentBudgets(userId);
    
    const summary = {
      total_budgets: currentBudgets.length,
      total_budget_amount: 0,
      total_spent: 0,
      total_remaining: 0,
      over_budget_count: 0,
      near_limit_count: 0,
      budgets_by_status: {
        on_track: [],
        near_limit: [],
        over_budget: []
      }
    };

    currentBudgets.forEach(budget => {
      summary.total_budget_amount += budget.amount;
      summary.total_spent += budget.spent_amount;
      summary.total_remaining += budget.remaining_amount;

      if (budget.is_over_budget) {
        summary.over_budget_count++;
        summary.budgets_by_status.over_budget.push(budget);
      } else if (budget.is_near_limit) {
        summary.near_limit_count++;
        summary.budgets_by_status.near_limit.push(budget);
      } else {
        summary.budgets_by_status.on_track.push(budget);
      }
    });

    return summary;
  }

  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  generateBudgetPeriodDates(period, year = null, month = null) {
    const now = new Date();
    const currentYear = year || now.getFullYear();
    const currentMonth = month !== null ? month : now.getMonth();

    switch (period.toLowerCase()) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return {
          start_date: weekStart.toISOString().split('T')[0],
          end_date: weekEnd.toISOString().split('T')[0]
        };

      case 'monthly':
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        return {
          start_date: monthStart.toISOString().split('T')[0],
          end_date: monthEnd.toISOString().split('T')[0]
        };

      case 'quarterly':
        const quarter = Math.floor(currentMonth / 3);
        const quarterStart = new Date(currentYear, quarter * 3, 1);
        const quarterEnd = new Date(currentYear, quarter * 3 + 3, 0);
        return {
          start_date: quarterStart.toISOString().split('T')[0],
          end_date: quarterEnd.toISOString().split('T')[0]
        };

      case 'yearly':
        return {
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`
        };

      default:
        throw new Error('Invalid period. Use: weekly, monthly, quarterly, or yearly');
    }
  }
}

module.exports = BudgetService;