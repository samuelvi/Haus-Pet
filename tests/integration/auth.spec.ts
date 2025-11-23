import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

let createdUserId: string;
let accessToken: string;
let refreshToken: string;
let sessionId: string;

test.describe('Authentication Integration Tests', () => {
  test.describe('POST /api/auth/signup - User Registration', () => {
    test('should create new user with valid data', async ({ request }) => {
      const uniqueEmail = `testuser${Date.now()}@example.com`;

      const response = await request.post(`${API_BASE}/api/auth/signup`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: uniqueEmail,
          password: 'SecurePass123!',
          name: 'Test User',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user.email).toBe(uniqueEmail.toLowerCase());
      expect(data.data.user.name).toBe('Test User');
      expect(data.data.user.role).toBe('USER');

      createdUserId = data.data.user.id;
    });

    test('should return 400 for invalid email format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/signup`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('email');
    });

    test('should return 400 for weak password', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/signup`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: `testuser${Date.now()}@example.com`,
          password: '123',
          name: 'Test User',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('password');
    });

    test('should return 409 for duplicate email', async ({ request }) => {
      const duplicateEmail = `duplicate${Date.now()}@example.com`;

      // Create first user
      await request.post(`${API_BASE}/api/auth/signup`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: duplicateEmail,
          password: 'SecurePass123!',
          name: 'First User',
        },
      });

      // Try to create duplicate
      const response = await request.post(`${API_BASE}/api/auth/signup`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: duplicateEmail,
          password: 'SecurePass123!',
          name: 'Second User',
        },
      });

      expect(response.status()).toBe(409);
      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('already exists');
    });
  });

  test.describe('POST /api/auth/login - User Login', () => {
    test.beforeAll(async ({ request }) => {
      // Create a user for login tests
      const testEmail = `logintest${Date.now()}@example.com`;
      await request.post(`${API_BASE}/api/auth/signup`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: testEmail,
          password: 'LoginPass123!',
          name: 'Login Test User',
        },
      });
    });

    test('should login successfully with correct credentials', async ({ request }) => {
      const testEmail = 'admin@hauspet.com'; // Use existing admin user

      const response = await request.post(`${API_BASE}/api/auth/login`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: testEmail,
          password: 'Admin123',
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user.email).toBe(testEmail);
      expect(data.data.tokens).toHaveProperty('accessToken');
      expect(data.data.tokens).toHaveProperty('refreshToken');
      expect(data.data).toHaveProperty('sessionId');

      accessToken = data.data.tokens.accessToken;
      refreshToken = data.data.tokens.refreshToken;
      sessionId = data.data.sessionId;
    });

    test('should return 401 for wrong password', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/login`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'admin@hauspet.com',
          password: 'WrongPassword123!',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should return 404 for non-existent email', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/login`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      });

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });
  });

  test.describe('GET /api/auth/me - Get Current User', () => {
    test('should return current user with valid authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('email');
      expect(data.data).toHaveProperty('role');
    });

    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/auth/me`);

      expect(response.status()).toBe(401);
    });

    test('should return 401 with invalid token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid_token_here',
          'x-session-id': 'invalid-session',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/auth/refresh - Refresh Token', () => {
    test('should refresh tokens with valid refresh token', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/refresh`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          refreshToken: refreshToken,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.tokens).toHaveProperty('accessToken');
      expect(data.data.tokens).toHaveProperty('refreshToken');
      expect(data.data.tokens.accessToken).not.toBe(accessToken); // Should be different
    });

    test('should return 401 with invalid refresh token', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/refresh`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          refreshToken: 'invalid_refresh_token',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/auth/logout - Logout', () => {
    test('should logout successfully with valid session', async ({ request }) => {
      // First login to get fresh tokens
      const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'admin@hauspet.com',
          password: 'Admin123',
        },
      });

      const loginData = await loginResponse.json();
      const token = loginData.data.tokens.accessToken;
      const session = loginData.data.sessionId;

      const response = await request.post(`${API_BASE}/api/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-session-id': session,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
    });

    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/auth/logout`);

      expect(response.status()).toBe(401);
    });
  });
});
