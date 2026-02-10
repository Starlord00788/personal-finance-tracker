const request = require('supertest');
const app = require('../app');

let authToken;
let categoryId;
let incomeCategoryId;

const testUser = {
  first_name: 'CatTest',
  last_name: 'User',
  email: `cattest_${Date.now()}@example.com`,
  password: 'Test@1234!'
};

beforeAll(async () => {
  // Register and login
  const res = await request(app)
    .post('/api/users/register')
    .send(testUser);
  authToken = res.body.data.accessToken;
}, 60000);

describe('Category Management API', () => {
  describe('POST /api/categories', () => {
    it('should create an expense category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Groceries', type: 'expense', color: '#ef4444', icon: 'cart' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Groceries');
      expect(res.body.data.type).toBe('expense');
      categoryId = res.body.data.id;
    });

    it('should create an income category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Salary', type: 'income', color: '#22c55e', icon: 'briefcase' })
        .expect(201);

      expect(res.body.success).toBe(true);
      incomeCategoryId = res.body.data.id;
    });

    it('should reject duplicate category name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Groceries', type: 'expense' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid category type', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Invalid', type: 'invalid' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/categories', () => {
    it('should list user categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/categories?type=income')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach(cat => {
        expect(cat.type).toBe('income');
      });
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      const res = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Groceries', color: '#f97316' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Groceries');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should soft-delete a category', async () => {
      // Create a category to delete
      const createRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete', type: 'expense' });

      const res = await request(app)
        .delete(`/api/categories/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});

module.exports = { getCategoryId: () => categoryId, getIncomeCategoryId: () => incomeCategoryId, getAuthToken: () => authToken };
