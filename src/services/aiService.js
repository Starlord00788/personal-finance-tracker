const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = null;
    this.isEnabled = false;
    this.quotaExhausted = false;
    
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.isEnabled = true;
        console.log('✅ OpenAI API initialized successfully');
      } else {
        console.log('ℹ️  OpenAI API key not configured — using fallback AI insights');
      }
    } catch (error) {
      console.log('ℹ️  OpenAI unavailable — using fallback AI insights');
    }
  }

  async getSpendingInsights(transactions, budgets = [], timeframe = 'month') {
    if (!this.isEnabled || this.quotaExhausted) {
      return this.getFallbackInsights(transactions, budgets);
    }

    try {
      const spendingData = this.prepareSpendingData(transactions, budgets, timeframe);
      
      const prompt = `Analyze the following personal spending data and provide insights and recommendations:

Spending Data:
${JSON.stringify(spendingData, null, 2)}

Please provide:
1. Top spending categories analysis
2. Spending trends and patterns
3. Budget utilization analysis (if budgets exist)
4. Personalized recommendations for saving money
5. Risk areas to monitor
6. Opportunities for financial optimization

Response should be in JSON format with the following structure:
{
  "summary": "Brief overview of spending patterns",
  "topCategories": [{"category": "name", "amount": number, "percentage": number}],
  "trends": ["trend insight 1", "trend insight 2"],
  "budgetAnalysis": "analysis of budget usage",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskAreas": ["risk area 1", "risk area 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "savingsPotential": number
}`;

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a financial advisor AI specializing in personal finance analysis. Provide actionable insights based on spending data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);

    } catch (error) {
      this.handleAIError(error, 'spending insights');
      return this.getFallbackInsights(transactions, budgets);
    }
  }

  async getBudgetRecommendations(transactions, currentBudgets = []) {
    if (!this.isEnabled || this.quotaExhausted) {
      return this.getFallbackBudgetRecommendations(transactions, currentBudgets);
    }

    try {
      const spendingByCategory = this.calculateCategorySpending(transactions);
      
      const prompt = `Based on the following spending data, suggest optimal budget allocations:

Current Spending by Category:
${JSON.stringify(spendingByCategory, null, 2)}

Current Budgets:
${JSON.stringify(currentBudgets, null, 2)}

Please suggest budget recommendations in JSON format:
{
  "recommendedBudgets": [
    {"category": "category_name", "recommendedAmount": number, "reasoning": "why this amount"}
  ],
  "adjustments": [
    {"category": "category_name", "currentBudget": number, "recommended": number, "change": "increase/decrease", "reasoning": "explanation"}
  ],
  "newCategories": ["category1", "category2"],
  "totalBudgetRecommendation": number
}`;

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a financial planning AI that helps create realistic and effective budgets based on spending patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        max_tokens: 800,
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);

    } catch (error) {
      this.handleAIError(error, 'budget recommendations');
      return this.getFallbackBudgetRecommendations(transactions, currentBudgets);
    }
  }

  async getFinancialGoalInsights(transactions, goals = []) {
    if (!this.isEnabled || this.quotaExhausted) {
      return this.getFallbackGoalInsights(transactions, goals);
    }

    try {
      const monthlyIncome = this.calculateMonthlyIncome(transactions);
      const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
      const netIncome = monthlyIncome - monthlyExpenses;

      const prompt = `Analyze financial goals progress based on this data:

Monthly Income: $${monthlyIncome}
Monthly Expenses: $${monthlyExpenses}
Net Monthly Income: $${netIncome}

Current Goals:
${JSON.stringify(goals, null, 2)}

Provide insights in JSON format:
{
  "goalProgress": [
    {"goal": "goal_name", "feasibility": "realistic/challenging/unrealistic", "timeToAchieve": "time estimate", "recommendations": "specific advice"}
  ],
  "suggestedGoals": [
    {"type": "emergency_fund/retirement/vacation", "target": number, "timeframe": "months/years", "monthlyContribution": number}
  ],
  "savingsCapacity": number,
  "priorityRecommendations": ["priority 1", "priority 2"]
}`;

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a financial goal planning AI that helps users set and achieve realistic financial objectives."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        max_tokens: 700,
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);

    } catch (error) {
      this.handleAIError(error, 'goal insights');
      return this.getFallbackGoalInsights(transactions, goals);
    }
  }

  handleAIError(error, context) {
    if (error?.code === 'insufficient_quota' || error?.status === 429) {
      if (!this.quotaExhausted) {
        console.log('ℹ️  OpenAI quota exceeded — switching to fallback AI insights');
        this.quotaExhausted = true;
      }
    } else {
      console.log(`ℹ️  OpenAI unavailable for ${context} — using fallback`);
    }
  }

  // Helper method to prepare spending data
  prepareSpendingData(transactions, budgets, timeframe) {
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= startDate && t.type === 'expense'
    );

    const categorySpending = {};
    let totalSpent = 0;

    filteredTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      const amount = parseFloat(transaction.amount);
      categorySpending[category] = (categorySpending[category] || 0) + amount;
      totalSpent += amount;
    });

    return {
      timeframe,
      totalSpent,
      transactionCount: filteredTransactions.length,
      categorySpending,
      budgets,
      period: `${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`
    };
  }

  calculateCategorySpending(transactions, months = 3) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    
    const filteredTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= startDate && t.type === 'expense'
    );

    const categoryTotals = {};
    filteredTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      const amount = parseFloat(transaction.amount);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    return categoryTotals;
  }

  calculateMonthlyIncome(transactions) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const income = transactions
      .filter(t => new Date(t.transaction_date) >= startDate && t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return income;
  }

  calculateMonthlyExpenses(transactions) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const expenses = transactions
      .filter(t => new Date(t.transaction_date) >= startDate && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return expenses;
  }

  // Fallback methods when OpenAI API is not available
  getFallbackInsights(transactions, budgets) {
    const categorySpending = this.calculateCategorySpending(transactions);
    const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);

    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalSpent) * 100)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      summary: `Basic analysis of ${transactions.length} transactions totaling $${totalSpent.toFixed(2)}`,
      topCategories,
      trends: [
        "Analysis based on recent spending patterns",
        "Consider reviewing high-spending categories"
      ],
      budgetAnalysis: budgets.length > 0 ? 
        "Budget analysis available with AI insights enabled" : 
        "No budgets found for analysis",
      recommendations: [
        "Track spending in top categories more closely",
        "Consider setting budgets for major expense categories",
        "Review monthly spending patterns"
      ],
      riskAreas: [
        "High spending categories need monitoring",
        "Consider budget limits for major expenses"
      ],
      opportunities: [
        "Enable AI insights for detailed recommendations",
        "Set up budget tracking for better control"
      ],
      savingsPotential: Math.round(totalSpent * 0.1) // Estimate 10% savings potential
    };
  }

  getFallbackBudgetRecommendations(transactions, currentBudgets) {
    const categorySpending = this.calculateCategorySpending(transactions);
    
    const recommendedBudgets = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        category,
        recommendedAmount: Math.round(amount * 1.1), // 10% buffer
        reasoning: "Based on average spending plus 10% buffer"
      }))
      .slice(0, 10);

    return {
      recommendedBudgets,
      adjustments: currentBudgets.map(budget => ({
        category: budget.category_name,
        currentBudget: budget.amount,
        recommended: Math.round((categorySpending[budget.category_name] || 0) * 1.1),
        change: "adjust",
        reasoning: "Based on actual spending patterns"
      })),
      newCategories: Object.keys(categorySpending).filter(category => 
        !currentBudgets.find(b => b.category_name === category)
      ).slice(0, 5),
      totalBudgetRecommendation: Math.round(
        Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0) * 1.2
      )
    };
  }

  getFallbackGoalInsights(transactions, goals) {
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const netIncome = monthlyIncome - monthlyExpenses;

    return {
      goalProgress: goals.map(goal => ({
        goal: goal.name || 'Financial Goal',
        feasibility: netIncome > 0 ? 'realistic' : 'challenging',
        timeToAchieve: "Detailed analysis available with AI insights",
        recommendations: "Enable AI insights for personalized goal planning"
      })),
      suggestedGoals: [
        {
          type: "emergency_fund",
          target: monthlyExpenses * 3,
          timeframe: "6-12 months",
          monthlyContribution: Math.round(netIncome * 0.2)
        }
      ],
      savingsCapacity: Math.max(0, Math.round(netIncome * 0.8)),
      priorityRecommendations: [
        "Build emergency fund first",
        "Enable AI insights for detailed goal planning"
      ]
    };
  }
}

module.exports = new AIService();