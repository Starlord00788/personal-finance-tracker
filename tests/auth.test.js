const request = require('supertest');
const app = require('../app');

let authToken;
let testUserId;
const testUser = {
  first_name: 'Test',
  last_name: 'User',
  email: `test_${Date.now()}@example.com`,
  password: 'Test@1234!'
};

describe('User Authentication API', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email);
      authToken = res.body.data.accessToken;
      testUserId = res.body.data.user.id;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ ...testUser, email: 'weak@example.com', password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ email: 'nope@example.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      authToken = res.body.data.accessToken;
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'WrongPass@1' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'nouser@example.com', password: 'Test@1234!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ first_name: 'Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password with correct current password', async () => {
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: testUser.password, newPassword: 'NewPass@1234!', confirmPassword: 'NewPass@1234!' })
        .expect(200);

      expect(res.body.success).toBe(true);
      // Update password for cleanup
      testUser.password = 'NewPass@5678!';
    });

    it('should reject wrong current password', async () => {
      const res = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'Wrong@1234!', newPassword: 'Another@1234!', confirmPassword: 'Another@1234!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});

module.exports = { getAuthToken: () => authToken, getTestUser: () => testUser };
