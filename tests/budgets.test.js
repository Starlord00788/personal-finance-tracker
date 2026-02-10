const request = require('supertest');
const app = require('../app');

let authToken;
let expenseCategoryId;

const testUser = {
  first_name: 'BudgetTest',
  last_name: 'User',
  email: `budgettest_${Date.now()}@example.com`,
  password: 'Test@1234!'
};

let budgetId;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/users/register')
    .send(testUser);
  authToken = res.body.data.accessToken;

  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Budget Test Food', type: 'expense' });
  expenseCategoryId = catRes.body.data.id;

  // Create some transactions for budget tracking
  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      category_id: expenseCategoryId,
      amount: 150,
      type: 'expense',
      description: 'Weekly groceries',
      transaction_date: '2026-02-05'
    });
}, 60000);

describe('Budget Management API', () => {
  describe('POST /api/budgets', () => {
    it('should create a budget', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          name: 'February Food Budget',
          amount: 500,
          period: 'monthly',
          startDate: '2026-02-01',
          endDate: '2026-02-28',
          alertThreshold: 80
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(parseFloat(res.body.data.amount)).toBeCloseTo(500, 2);
      budgetId = res.body.data.id;
    });

    it('should reject overlapping budget for same category', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          name: 'Duplicate Budget',
          amount: 600,
          period: 'monthly',
          startDate: '2026-02-10',
          endDate: '2026-02-25'
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid date range', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          name: 'Bad Date Budget',
          amount: 100,
          period: 'monthly',
          startDate: '2026-03-31',
          endDate: '2026-03-01'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/budgets', () => {
    it('should list user budgets', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/budgets/summary', () => {
    it('should return budget summary', async () => {
      const res = await request(app)
        .get('/api/budgets/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/budgets/:id', () => {
    it('should get budget with spending info', async () => {
      const res = await request(app)
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('spent_amount');
      expect(res.body.data).toHaveProperty('utilization_percentage');
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update a budget', async () => {
      const res = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 600 })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete a budget', async () => {
      // Create one specifically for deletion
      const createRes = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: expenseCategoryId,
          name: 'Delete Me Budget',
          amount: 100,
          period: 'monthly',
          startDate: '2026-04-01',
          endDate: '2026-04-30'
        });

      const res = await request(app)
        .delete(`/api/budgets/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
