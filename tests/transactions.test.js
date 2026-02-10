const request = require('supertest');
const app = require('../app');

let authToken;
let expenseCategoryId;
let incomeCategoryId;
let transactionId;

const testUser = {
  first_name: 'TxnTest',
  last_name: 'User',
  email: `txntest_${Date.now()}@example.com`,
  password: 'Test@1234!'
};

beforeAll(async () => {
  // Register
  const res = await request(app)
    .post('/api/users/register')
    .send(testUser);
  authToken = res.body.data.accessToken;

  // Create categories
  const expCat = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Txn Test Groceries', type: 'expense' });
  expenseCategoryId = expCat.body.data.id;

  const incCat = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Txn Test Salary', type: 'income' });
  incomeCategoryId = incCat.body.data.id;
}, 60000);

describe('Transaction Management API', () => {
  describe('POST /api/transactions', () => {
    it('should create an expense transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 42.50,
          type: 'expense',
          description: 'Weekly grocery shopping',
          transaction_date: '2026-02-01'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.amount)).toBeCloseTo(42.50, 2);
      expect(res.body.data.type).toBe('expense');
      transactionId = res.body.data.id;
    });

    it('should create an income transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: incomeCategoryId,
          amount: 3000.00,
          type: 'income',
          description: 'Monthly salary',
          transaction_date: '2026-02-01'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.amount)).toBeCloseTo(3000, 2);
    });

    it('should handle decimal precision correctly', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 19.99,
          type: 'expense',
          description: 'Precision test',
          transaction_date: '2026-02-02'
        })
        .expect(201);

      expect(parseFloat(res.body.data.amount)).toBeCloseTo(19.99, 2);
    });

    it('should reject mismatched category type', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 100,
          type: 'income', // expense category but income type
          description: 'Should fail',
          transaction_date: '2026-02-01'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject negative or zero amount', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 0,
          type: 'expense',
          description: 'Zero amount',
          transaction_date: '2026-02-01'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 50 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should create a refund transaction on expense category', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 15.00,
          type: 'income',  // refund on expense category
          description: 'Return item',
          transaction_date: '2026-02-03',
          is_refund: true
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toContain('[REFUND]');
    });

    it('should support different currencies', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 100,
          currency: 'EUR',
          type: 'expense',
          description: 'Euro transaction',
          transaction_date: '2026-02-04'
        })
        .expect(201);

      expect(res.body.data.currency).toBe('EUR');
    });
  });

  describe('GET /api/transactions', () => {
    it('should list user transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/transactions?type=expense')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      res.body.data.forEach(txn => {
        expect(txn.type).toBe('expense');
      });
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/transactions?start_date=2026-02-01&end_date=2026-02-28')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should filter by amount range', async () => {
      const res = await request(app)
        .get('/api/transactions?min_amount=100&max_amount=5000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      res.body.data.forEach(txn => {
        expect(parseFloat(txn.amount)).toBeGreaterThanOrEqual(100);
        expect(parseFloat(txn.amount)).toBeLessThanOrEqual(5000);
      });
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get transaction by ID', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(transactionId);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .get('/api/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update a transaction', async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 55.75, description: 'Updated grocery shopping' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.amount)).toBeCloseTo(55.75, 2);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      // Create one to delete
      const createRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category_id: expenseCategoryId,
          amount: 10,
          type: 'expense',
          description: 'To be deleted',
          transaction_date: '2026-02-01'
        });

      const res = await request(app)
        .delete(`/api/transactions/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/transactions/stats/:year/:month', () => {
    it('should return monthly statistics', async () => {
      const res = await request(app)
        .get('/api/transactions/stats/2026/02')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('income');
      expect(res.body.data).toHaveProperty('expense');
      expect(res.body.data).toHaveProperty('balance');
    });
  });

  describe('GET /api/transactions/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app)
        .get('/api/transactions/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('monthly_overview');
      expect(res.body.data).toHaveProperty('recent_transactions');
      expect(res.body.data).toHaveProperty('category_breakdown');
    });
  });
});
