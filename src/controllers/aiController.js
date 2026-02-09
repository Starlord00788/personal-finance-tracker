const aiService = require('../services/aiService');
const TransactionRepository = require('../repositories/transactionRepository');
const BudgetRepository = require('../repositories/budgetRepository');

const transactionRepository = new TransactionRepository();
const budgetRepository = new BudgetRepository();

class AIController {
  async getSpendingInsights(req, res) {
    try {
      const userId = req.user.userId;
      const { timeframe = 'month' } = req.query;

      // Get user's transactions and budgets
      const transactions = await transactionRepository.getByUserId(userId);
      const budgets = await budgetRepository.getByUserId(userId);

      // Generate AI insights
      const insights = await aiService.getSpendingInsights(transactions, budgets, timeframe);

      res.json({
        success: true,
        data: {
          insights,
          metadata: {
            timeframe,
            transactionCount: transactions.length,
            budgetCount: budgets.length,
            aiEnabled: aiService.isEnabled
          }
        }
      });
    } catch (error) {
      console.error('Error getting spending insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate spending insights',
        error: error.message
      });
    }
  }

  async getBudgetRecommendations(req, res) {
    try {
      const userId = req.user.userId;

      // Get user's transactions and current budgets
      const transactions = await transactionRepository.getByUserId(userId);
      const currentBudgets = await budgetRepository.getByUserId(userId);

      // Generate budget recommendations
      const recommendations = await aiService.getBudgetRecommendations(transactions, currentBudgets);

      res.json({
        success: true,
        data: {
          recommendations,
          metadata: {
            currentBudgetCount: currentBudgets.length,
            transactionCount: transactions.length,
            aiEnabled: aiService.isEnabled
          }
        }
      });
    } catch (error) {
      console.error('Error getting budget recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate budget recommendations',
        error: error.message
      });
    }
  }

  async getFinancialGoalInsights(req, res) {
    try {
      const userId = req.user.userId;
      const { goals = [] } = req.body;

      // Get user's transactions
      const transactions = await transactionRepository.getByUserId(userId);

      // Generate goal insights
      const goalInsights = await aiService.getFinancialGoalInsights(transactions, goals);

      res.json({
        success: true,
        data: {
          goalInsights,
          metadata: {
            goalsAnalyzed: goals.length,
            transactionCount: transactions.length,
            aiEnabled: aiService.isEnabled
          }
        }
      });
    } catch (error) {
      console.error('Error getting financial goal insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial goal insights',
        error: error.message
      });
    }
  }

  async getFinancialSummary(req, res) {
    try {
      const userId = req.user.userId;

      // Get user's data
      const transactions = await transactionRepository.getByUserId(userId);
      const budgets = await budgetRepository.getByUserId(userId);

      // Calculate basic financial metrics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Monthly calculations - use transaction_date (actual DB field) and type field
      const monthlyTransactions = transactions.filter(t => 
        new Date(t.transaction_date) >= startOfMonth
      );

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const monthlyNet = monthlyIncome - monthlyExpenses;

      // Yearly calculations
      const yearlyTransactions = transactions.filter(t => 
        new Date(t.transaction_date) >= startOfYear
      );

      const yearlyIncome = yearlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const yearlyExpenses = yearlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Category breakdown
      const categorySpending = {};
      monthlyTransactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
          const category = transaction.category_name || 'Uncategorized';
          const amount = parseFloat(transaction.amount);
          categorySpending[category] = (categorySpending[category] || 0) + amount;
        });

      const topCategories = Object.entries(categorySpending)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 100) : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Budget utilization
      const budgetUtilization = budgets.map(budget => {
        const spent = categorySpending[budget.category_name] || 0;
        const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        return {
          category: budget.category_name || budget.name,
          budget: parseFloat(budget.amount),
          spent,
          remaining: Math.max(0, parseFloat(budget.amount) - spent),
          utilization: Math.round(utilization),
          status: utilization > 100 ? 'over_budget' : 
                 utilization > 80 ? 'near_limit' : 'on_track'
        };
      });

      res.json({
        success: true,
        data: {
          summary: {
            monthly: {
              income: monthlyIncome,
              expenses: monthlyExpenses,
              net: monthlyNet,
              transactionCount: monthlyTransactions.length
            },
            yearly: {
              income: yearlyIncome,
              expenses: yearlyExpenses,
              net: yearlyIncome - yearlyExpenses,
              transactionCount: yearlyTransactions.length
            },
            topCategories,
            budgetUtilization,
            savingsRate: monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0
          },
          metadata: {
            totalTransactions: transactions.length,
            totalBudgets: budgets.length,
            dataRange: {
              earliest: transactions.length > 0 ? 
                Math.min(...transactions.map(t => new Date(t.transaction_date).getTime())) : null,
              latest: transactions.length > 0 ? 
                Math.max(...transactions.map(t => new Date(t.transaction_date).getTime())) : null
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting financial summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial summary',
        error: error.message
      });
    }
  }

  async getAIStatus(req, res) {
    try {
      res.json({
        success: true,
        data: {
          aiEnabled: aiService.isEnabled,
          features: {
            spendingInsights: aiService.isEnabled,
            budgetRecommendations: aiService.isEnabled,
            goalInsights: aiService.isEnabled,
            fallbackMode: !aiService.isEnabled
          },
          message: aiService.isEnabled ? 
            'AI insights are fully enabled' : 
            'AI insights running in fallback mode (basic analytics only)'
        }
      });
    } catch (error) {
      console.error('Error getting AI status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI status',
        error: error.message
      });
    }
  }
}

module.exports = new AIController();