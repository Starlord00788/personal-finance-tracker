const TransactionRepository = require('../repositories/transactionRepository');
const CategoryRepository = require('../repositories/categoryRepository');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();
  }

  async createTransaction(userId, transactionData) {
    const {
      category_id, amount, currency = 'USD', type, description,
      transaction_date, is_recurring = false, recurring_frequency, notes,
      is_refund = false
    } = transactionData;

    // Verify category belongs to user
    const category = await this.categoryRepository.findById(category_id);
    if (!category || category.user_id !== userId) {
      throw new Error('Invalid category');
    }

    // Verify transaction type matches category type
    // Allow refunds: a refund on an expense category is valid (treated as negative expense / reversal)
    if (!is_refund && category.type !== type) {
      throw new Error(`Transaction type must match category type (${category.type})`);
    }

    const transaction = await this.transactionRepository.create({
      id: uuidv4(),
      user_id: userId,
      category_id,
      amount: parseFloat(amount),
      currency,
      type,
      description: is_refund ? `[REFUND] ${(description?.trim() || 'Refund')}` : (description?.trim() || null),
      transaction_date,
      is_recurring,
      recurring_frequency: is_recurring ? recurring_frequency : null,
      notes: notes?.trim() || null
    });

    return transaction;
  }

  async getUserTransactions(userId, filters = {}) {
    return await this.transactionRepository.findByUser(userId, filters);
  }

  async getTransactionById(id, userId) {
    const transaction = await this.transactionRepository.findById(id);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.user_id !== userId) {
      throw new Error('Access denied');
    }
    
    return transaction;
  }

  async updateTransaction(id, userId, updateData) {
    const transaction = await this.getTransactionById(id, userId);
    
    // If category is being updated, verify it belongs to user and type matches
    if (updateData.category_id) {
      const category = await this.categoryRepository.findById(updateData.category_id);
      if (!category || category.user_id !== userId) {
        throw new Error('Invalid category');
      }
      
      const transactionType = updateData.type || transaction.type;
      if (category.type !== transactionType) {
        throw new Error(`Transaction type must match category type (${category.type})`);
      }
    }

    const processedData = { ...updateData };
    
    if (processedData.amount) {
      processedData.amount = parseFloat(processedData.amount);
    }
    
    if (processedData.description) {
      processedData.description = processedData.description.trim();
    }
    
    if (processedData.notes) {
      processedData.notes = processedData.notes.trim();
    }

    const updated = await this.transactionRepository.updateById(id, processedData);
    return updated;
  }

  async deleteTransaction(id, userId) {
    await this.getTransactionById(id, userId);
    return await this.transactionRepository.deleteById(id);
  }

  async getMonthlyOverview(userId, year, month) {
    const stats = await this.transactionRepository.getMonthlyStats(userId, year, month);
    
    const overview = {
      income: { count: 0, total: parseFloat(stats.total_income) || 0, average: 0 },
      expense: { count: 0, total: parseFloat(stats.total_expenses) || 0, average: 0 },
      balance: 0,
      transaction_count: parseInt(stats.transaction_count) || 0
    };
    
    overview.balance = overview.income.total - overview.expense.total;
    
    return overview;
  }

  async getCategoryBreakdown(userId, from_date, to_date) {
    return await this.transactionRepository.getCategoryStats(userId, from_date, to_date);
  }

  async getRecentActivity(userId, limit = 10) {
    return await this.transactionRepository.getRecentTransactions(userId, limit);
  }

  async getDashboardData(userId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get current month overview
    const monthlyOverview = await this.getMonthlyOverview(userId, currentYear, currentMonth);
    
    // Get recent transactions
    const recentTransactions = await this.getRecentActivity(userId, 5);
    
    // Get this month's category breakdown
    const firstDayOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    const categoryBreakdown = await this.getCategoryBreakdown(userId, firstDayOfMonth, lastDayOfMonth);
    
    return {
      monthly_overview: monthlyOverview,
      recent_transactions: recentTransactions,
      category_breakdown: categoryBreakdown
    };
  }
}

module.exports = TransactionService;