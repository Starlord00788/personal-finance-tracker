const TransactionRepository = require('../repositories/transactionRepository');

class AnomalyService {
  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  /**
   * Detect spending anomalies using statistical analysis
   * Uses z-score method to identify unusual transactions
   */
  async detectAnomalies(userId, options = {}) {
    const { lookbackDays = 90, zScoreThreshold = 2.0 } = options;

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const transactions = await this.transactionRepository.findByUser(userId, {
      start_date: startDate,
      end_date: endDate
    });

    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length < 5) {
      return {
        anomalies: [],
        summary: {
          analyzed: expenses.length,
          anomaliesFound: 0,
          message: 'Not enough transaction history for anomaly detection (minimum 5 expense transactions needed)'
        },
        categoryAnalysis: [],
        unusualPatterns: []
      };
    }

    // 1. Overall amount anomalies (z-score method)
    const amounts = expenses.map(t => parseFloat(t.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length);

    const amountAnomalies = expenses
      .map(t => {
        const amount = parseFloat(t.amount);
        const zScore = stdDev > 0 ? (amount - mean) / stdDev : 0;
        return { ...t, zScore, amount };
      })
      .filter(t => Math.abs(t.zScore) >= zScoreThreshold)
      .map(t => ({
        id: t.id,
        date: t.transaction_date,
        description: t.description,
        amount: t.amount,
        category: t.category_name,
        zScore: parseFloat(t.zScore.toFixed(2)),
        type: t.zScore > 0 ? 'unusually_high' : 'unusually_low',
        severity: Math.abs(t.zScore) > 3 ? 'high' : 'medium',
        message: t.zScore > 0
          ? `This expense ($${t.amount.toFixed(2)}) is ${t.zScore.toFixed(1)}x standard deviations above your average ($${mean.toFixed(2)})`
          : `This expense ($${t.amount.toFixed(2)}) is unusually low compared to your average ($${mean.toFixed(2)})`
      }));

    // 2. Category-level anomalies
    const categoryData = {};
    expenses.forEach(t => {
      const cat = t.category_name || 'Uncategorized';
      if (!categoryData[cat]) categoryData[cat] = [];
      categoryData[cat].push(parseFloat(t.amount));
    });

    const categoryAnomalies = [];
    for (const [category, catAmounts] of Object.entries(categoryData)) {
      if (catAmounts.length < 3) continue;

      const catMean = catAmounts.reduce((a, b) => a + b, 0) / catAmounts.length;
      const catStdDev = Math.sqrt(catAmounts.reduce((sum, x) => sum + Math.pow(x - catMean, 2), 0) / catAmounts.length);
      const catTotal = catAmounts.reduce((a, b) => a + b, 0);
      const catMax = Math.max(...catAmounts);

      // Check if any recent transactions are anomalous within this category
      const recentCatExpenses = expenses
        .filter(t => (t.category_name || 'Uncategorized') === category)
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(0, 5);

      const hasAnomaly = recentCatExpenses.some(t => {
        const z = catStdDev > 0 ? (parseFloat(t.amount) - catMean) / catStdDev : 0;
        return Math.abs(z) >= zScoreThreshold;
      });

      categoryAnomalies.push({
        category,
        transactionCount: catAmounts.length,
        averageAmount: parseFloat(catMean.toFixed(2)),
        totalSpent: parseFloat(catTotal.toFixed(2)),
        maxTransaction: parseFloat(catMax.toFixed(2)),
        standardDeviation: parseFloat(catStdDev.toFixed(2)),
        hasAnomaly,
        status: hasAnomaly ? 'anomaly_detected' : 'normal'
      });
    }

    // 3. Unusual spending patterns (day-of-week, frequency changes)
    const unusualPatterns = this._detectPatterns(expenses, mean);

    // 4. Velocity anomalies (sudden increase in transaction frequency)
    const velocityAnomalies = this._detectVelocityAnomalies(expenses);

    return {
      anomalies: amountAnomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)),
      summary: {
        analyzed: expenses.length,
        anomaliesFound: amountAnomalies.length,
        averageExpense: parseFloat(mean.toFixed(2)),
        standardDeviation: parseFloat(stdDev.toFixed(2)),
        threshold: zScoreThreshold,
        period: { startDate, endDate, days: lookbackDays }
      },
      categoryAnalysis: categoryAnomalies.sort((a, b) => b.totalSpent - a.totalSpent),
      unusualPatterns: [...unusualPatterns, ...velocityAnomalies]
    };
  }

  /**
   * Detect unusual spending patterns
   */
  _detectPatterns(expenses, overallMean) {
    const patterns = [];

    // Weekend vs weekday spending
    const weekdayExpenses = expenses.filter(t => {
      const day = new Date(t.transaction_date).getDay();
      return day >= 1 && day <= 5;
    });
    const weekendExpenses = expenses.filter(t => {
      const day = new Date(t.transaction_date).getDay();
      return day === 0 || day === 6;
    });

    if (weekdayExpenses.length > 0 && weekendExpenses.length > 0) {
      const weekdayAvg = weekdayExpenses.reduce((s, t) => s + parseFloat(t.amount), 0) / weekdayExpenses.length;
      const weekendAvg = weekendExpenses.reduce((s, t) => s + parseFloat(t.amount), 0) / weekendExpenses.length;

      if (weekendAvg > weekdayAvg * 1.5) {
        patterns.push({
          type: 'weekend_spending_spike',
          severity: 'medium',
          message: `Weekend spending ($${weekendAvg.toFixed(2)} avg) is ${((weekendAvg / weekdayAvg - 1) * 100).toFixed(0)}% higher than weekday spending ($${weekdayAvg.toFixed(2)} avg)`,
          data: { weekdayAvg: parseFloat(weekdayAvg.toFixed(2)), weekendAvg: parseFloat(weekendAvg.toFixed(2)) }
        });
      }
    }

    // Month-over-month spending increase
    const now = new Date();
    const thisMonth = expenses.filter(t => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = expenses.filter(t => {
      const d = new Date(t.transaction_date);
      const lastM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === lastM && d.getFullYear() === lastY;
    });

    if (thisMonth.length > 0 && lastMonth.length > 0) {
      const thisTotal = thisMonth.reduce((s, t) => s + parseFloat(t.amount), 0);
      const lastTotal = lastMonth.reduce((s, t) => s + parseFloat(t.amount), 0);
      const changePercent = ((thisTotal - lastTotal) / lastTotal * 100);

      if (changePercent > 30) {
        patterns.push({
          type: 'monthly_spending_increase',
          severity: changePercent > 50 ? 'high' : 'medium',
          message: `This month's spending ($${thisTotal.toFixed(2)}) is ${changePercent.toFixed(0)}% higher than last month ($${lastTotal.toFixed(2)})`,
          data: { thisMonth: parseFloat(thisTotal.toFixed(2)), lastMonth: parseFloat(lastTotal.toFixed(2)), changePercent: parseFloat(changePercent.toFixed(1)) }
        });
      }
    }

    return patterns;
  }

  /**
   * Detect velocity anomalies (sudden increase in transaction frequency)
   */
  _detectVelocityAnomalies(expenses) {
    const anomalies = [];

    // Group by week
    const weeklyCount = {};
    expenses.forEach(t => {
      const date = new Date(t.transaction_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyCount[weekKey] = (weeklyCount[weekKey] || 0) + 1;
    });

    const weeks = Object.entries(weeklyCount).sort((a, b) => b[0].localeCompare(a[0]));
    if (weeks.length >= 3) {
      const recentWeek = weeks[0][1];
      const avgPrevWeeks = weeks.slice(1).reduce((s, w) => s + w[1], 0) / (weeks.length - 1);

      if (recentWeek > avgPrevWeeks * 1.8 && recentWeek > 3) {
        anomalies.push({
          type: 'transaction_frequency_spike',
          severity: 'medium',
          message: `Recent week had ${recentWeek} transactions, which is ${((recentWeek / avgPrevWeeks - 1) * 100).toFixed(0)}% above the weekly average of ${avgPrevWeeks.toFixed(1)}`,
          data: { recentWeek, weeklyAverage: parseFloat(avgPrevWeeks.toFixed(1)) }
        });
      }
    }

    return anomalies;
  }
}

module.exports = AnomalyService;
