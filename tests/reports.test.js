const request = require('supertest');
const app = require('../app');

let authToken;
let expenseCategoryId;
let incomeCategoryId;

const testUser = {
  first_name: 'ReportTest',
  last_name: 'User',
  email: `reporttest_${Date.now()}@example.com`,
  password: 'Test@1234!'
};

beforeAll(async () => {
  const res = await request(app)
    .post('/api/users/register')
    .send(testUser);
  authToken = res.body.data.accessToken;

  const expCat = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Report Groceries', type: 'expense' });
  expenseCategoryId = expCat.body.data.id;

  const incCat = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Report Salary', type: 'income' });
  incomeCategoryId = incCat.body.data.id;

  // Create test transactions
  const transactions = [
    { category_id: incomeCategoryId, amount: 5000, type: 'income', description: 'Salary', transaction_date: '2026-02-01' },
    { category_id: expenseCategoryId, amount: 200, type: 'expense', description: 'Groceries', transaction_date: '2026-02-03' },
    { category_id: expenseCategoryId, amount: 150, type: 'expense', description: 'More groceries', transaction_date: '2026-02-10' },
    { category_id: expenseCategoryId, amount: 80, type: 'expense', description: 'Dining out', transaction_date: '2026-02-15' },
  ];

  for (const txn of transactions) {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send(txn);
  }
}, 60000);

describe('Report Generation API', () => {
  describe('GET /api/reports/monthly/:year/:month', () => {
    it('should generate a monthly report', async () => {
      const res = await request(app)
        .get('/api/reports/monthly/2026/02')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('summary');
      expect(data.summary).toHaveProperty('totalIncome');
      expect(data.summary).toHaveProperty('totalExpenses');
      expect(data.summary).toHaveProperty('netSavings');
      expect(data.summary).toHaveProperty('savingsRate');
      expect(data.summary.totalIncome).toBeGreaterThan(0);
      expect(data.summary.totalExpenses).toBeGreaterThan(0);
      expect(data).toHaveProperty('expenseByCategory');
      expect(data).toHaveProperty('incomeByCategory');
      expect(data).toHaveProperty('dailyTrend');
      expect(data).toHaveProperty('topExpenses');
    });

    it('should return empty report for month with no data', async () => {
      const res = await request(app)
        .get('/api/reports/monthly/2026/12')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.transactionCount).toBe(0);
    });
  });

  describe('GET /api/reports/yearly/:year', () => {
    it('should generate a yearly report', async () => {
      const res = await request(app)
        .get('/api/reports/yearly/2026')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('monthlyBreakdown');
      expect(data.monthlyBreakdown).toHaveLength(12);
      expect(data).toHaveProperty('categoryBreakdown');
      expect(data.summary.totalTransactions).toBeGreaterThan(0);
    });
  });

  describe('GET /api/reports/custom', () => {
    it('should generate a custom date range report', async () => {
      const res = await request(app)
        .get('/api/reports/custom?startDate=2026-02-01&endDate=2026-02-28')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.transactionCount).toBeGreaterThan(0);
    });

    it('should require startDate and endDate', async () => {
      const res = await request(app)
        .get('/api/reports/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});

describe('Currency API', () => {
  describe('GET /api/currencies/supported', () => {
    it('should return supported currencies', async () => {
      const res = await request(app)
        .get('/api/currencies/supported')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('USD');
      expect(res.body.data).toHaveProperty('EUR');
    });
  });

  describe('POST /api/currencies/convert', () => {
    it('should convert between currencies', async () => {
      const res = await request(app)
        .post('/api/currencies/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('convertedAmount');
      expect(res.body.data).toHaveProperty('exchangeRate');
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('timestamp');
  });
});
