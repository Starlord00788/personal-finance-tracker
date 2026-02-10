const TransactionRepository = require('../repositories/transactionRepository');
const BudgetRepository = require('../repositories/budgetRepository');
const CategoryRepository = require('../repositories/categoryRepository');

class ReportService {
  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.budgetRepository = new BudgetRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Generate monthly income vs expenses report
   */
  async getMonthlyReport(userId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const transactions = await this.transactionRepository.findByUser(userId, {
      start_date: startDate,
      end_date: endDate
    });

    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // Category breakdown for expenses
    const expenseByCategory = {};
    expenses.forEach(t => {
      const cat = t.category_name || 'Uncategorized';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + parseFloat(t.amount);
    });

    // Category breakdown for income
    const incomeByCategory = {};
    income.forEach(t => {
      const cat = t.category_name || 'Uncategorized';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + parseFloat(t.amount);
    });

    // Daily spending trend
    const dailySpending = {};
    const dailyIncome = {};
    transactions.forEach(t => {
      const rawDate = t.transaction_date;
      const date = rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : String(rawDate).split('T')[0];
      if (t.type === 'expense') {
        dailySpending[date] = (dailySpending[date] || 0) + parseFloat(t.amount);
      } else {
        dailyIncome[date] = (dailyIncome[date] || 0) + parseFloat(t.amount);
      }
    });

    return {
      period: { year, month, startDate, endDate },
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netSavings: parseFloat(netSavings.toFixed(2)),
        savingsRate: parseFloat(savingsRate),
        transactionCount: transactions.length,
        incomeCount: income.length,
        expenseCount: expenses.length,
        averageExpense: expenses.length > 0 ? parseFloat((totalExpenses / expenses.length).toFixed(2)) : 0,
        averageIncome: income.length > 0 ? parseFloat((totalIncome / income.length).toFixed(2)) : 0
      },
      expenseByCategory: Object.entries(expenseByCategory)
        .map(([category, amount]) => ({
          category,
          amount: parseFloat(amount.toFixed(2)),
          percentage: totalExpenses > 0 ? parseFloat(((amount / totalExpenses) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.amount - a.amount),
      incomeByCategory: Object.entries(incomeByCategory)
        .map(([category, amount]) => ({
          category,
          amount: parseFloat(amount.toFixed(2)),
          percentage: totalIncome > 0 ? parseFloat(((amount / totalIncome) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.amount - a.amount),
      dailyTrend: {
        spending: dailySpending,
        income: dailyIncome
      },
      topExpenses: expenses
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 10)
        .map(t => ({
          description: t.description,
          amount: parseFloat(parseFloat(t.amount).toFixed(2)),
          category: t.category_name,
          date: t.transaction_date instanceof Date ? t.transaction_date.toISOString().split('T')[0] : t.transaction_date
        }))
    };
  }

  /**
   * Generate yearly financial summary report
   */
  async getYearlyReport(userId, year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const transactions = await this.transactionRepository.findByUser(userId, {
      start_date: startDate,
      end_date: endDate
    });

    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
      monthlyData[m] = { income: 0, expenses: 0, transactions: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const month = date.getMonth() + 1;
      if (monthlyData[month]) {
        monthlyData[month].transactions++;
        if (t.type === 'income') {
          monthlyData[month].income += parseFloat(t.amount);
        } else {
          monthlyData[month].expenses += parseFloat(t.amount);
        }
      }
    });

    const totalIncome = transactions.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Category breakdown
    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category_name || 'Uncategorized';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(t.amount);
    });

    return {
      period: { year, startDate, endDate },
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netSavings: parseFloat((totalIncome - totalExpenses).toFixed(2)),
        savingsRate: totalIncome > 0 ? parseFloat(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)) : 0,
        totalTransactions: transactions.length,
        monthlyAverageIncome: parseFloat((totalIncome / 12).toFixed(2)),
        monthlyAverageExpenses: parseFloat((totalExpenses / 12).toFixed(2))
      },
      monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
        month: parseInt(month),
        monthName: new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' }),
        income: parseFloat(data.income.toFixed(2)),
        expenses: parseFloat(data.expenses.toFixed(2)),
        net: parseFloat((data.income - data.expenses).toFixed(2)),
        transactions: data.transactions
      })),
      categoryBreakdown: Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({
          category,
          amount: parseFloat(amount.toFixed(2)),
          percentage: totalExpenses > 0 ? parseFloat(((amount / totalExpenses) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.amount - a.amount)
    };
  }

  /**
   * Generate custom date range report
   */
  async getCustomReport(userId, startDate, endDate) {
    const transactions = await this.transactionRepository.findByUser(userId, {
      start_date: startDate,
      end_date: endDate
    });

    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const categoryBreakdown = {};
    expenses.forEach(t => {
      const cat = t.category_name || 'Uncategorized';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(t.amount);
    });

    return {
      period: { startDate, endDate },
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netSavings: parseFloat((totalIncome - totalExpenses).toFixed(2)),
        transactionCount: transactions.length
      },
      categoryBreakdown: Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({
          category,
          amount: parseFloat(amount.toFixed(2)),
          percentage: totalExpenses > 0 ? parseFloat(((amount / totalExpenses) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.amount - a.amount),
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.transaction_date instanceof Date ? t.transaction_date.toISOString().split('T')[0] : t.transaction_date,
        description: t.description,
        amount: parseFloat(parseFloat(t.amount).toFixed(2)),
        type: t.type,
        category: t.category_name,
        currency: t.currency
      }))
    };
  }
}

module.exports = ReportService;
