import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

let testPetId: string;
let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;

test.describe('Sponsorship Integration Tests', () => {
  test.beforeAll(async ({ request }) => {
    // Login as admin
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'admin@hauspet.com',
        password: 'Admin123',
      },
    });

    const loginData = await loginResponse.json();
    authTokens = loginData.data.tokens;
    sessionId = loginData.data.sessionId;

    // Create a test pet for sponsorship tests
    const petResponse = await request.post(`${API_BASE}/api/admin/pet`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.accessToken}`,
        'x-session-id': sessionId,
      },
      data: {
        name: 'SponsorTest Pet',
        type: 'dog',
        breed: 'Labrador',
        photoUrl: 'https://example.com/photo.jpg',
      },
    });

    const petData = await petResponse.json();
    testPetId = petData.data.id;
  });

  test.describe('POST /api/sponsorships - Create Sponsorship', () => {
    test('should create sponsorship for new user', async ({ request }) => {
      const uniqueEmail = `sponsor${Date.now()}@example.com`;

      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: uniqueEmail,
          name: 'John Sponsor',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id');
      expect(data.data.petId).toBe(testPetId);
      expect(data.data.amount).toBe(50);
      expect(data.data.currency).toBe('USD');
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user.email).toBe(uniqueEmail.toLowerCase());
      expect(data.data.user.name).toBe('John Sponsor');
    });

    test('CRITICAL: should NOT create duplicate user when same email sponsors twice', async ({ request }) => {
      const sameEmail = `repeated${Date.now()}@example.com`;

      // First sponsorship
      const firstResponse = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: sameEmail,
          name: 'Jane Sponsor',
          amount: 25,
          currency: 'USD',
        },
      });

      expect(firstResponse.status()).toBe(201);
      const firstData = await firstResponse.json();
      const firstUserId = firstData.data.user.id;

      // Second sponsorship with SAME email
      const secondResponse = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: sameEmail, // Same email!
          name: 'Jane Sponsor', // Even if name is same
          amount: 30,
          currency: 'USD',
        },
      });

      expect(secondResponse.status()).toBe(201);
      const secondData = await secondResponse.json();
      const secondUserId = secondData.data.user.id;

      // CRITICAL: User IDs should be IDENTICAL (same user)
      expect(secondUserId).toBe(firstUserId);

      // Verify both sponsorships exist
      expect(firstData.data.amount).toBe(25);
      expect(secondData.data.amount).toBe(30);

      // Verify total sponsored amount increased correctly
      const petResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      const petData = await petResponse.json();
      expect(petData.data.totalSponsored).toBeGreaterThanOrEqual(55); // 25 + 30
    });

    test('should increment totalSponsored on pet correctly', async ({ request }) => {
      // Get initial pet state
      const initialPetResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      const initialPetData = await initialPetResponse.json();
      const initialTotal = initialPetData.data.totalSponsored || 0;

      // Create sponsorship
      const sponsorAmount = 100;
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `increment${Date.now()}@example.com`,
          name: 'Increment Test',
          amount: sponsorAmount,
          currency: 'USD',
        },
      });

      // Get updated pet state
      const updatedPetResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      const updatedPetData = await updatedPetResponse.json();
      const updatedTotal = updatedPetData.data.totalSponsored;

      // Verify increment
      expect(updatedTotal).toBe(initialTotal + sponsorAmount);
    });

    test('should return 400 for invalid pet ID', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: 'invalid-pet-id',
          email: `test${Date.now()}@example.com`,
          name: 'Test User',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should return 404 for non-existent pet', async ({ request }) => {
      const fakeUuid = '019aa791-0000-0000-0000-000000000000';

      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: fakeUuid,
          email: `test${Date.now()}@example.com`,
          name: 'Test User',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(404);
    });

    test('should return 400 for negative amount', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `test${Date.now()}@example.com`,
          name: 'Test User',
          amount: -50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 for invalid email format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: 'invalid-email',
          name: 'Test User',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/sponsorships/pet/:petId - Get Sponsorships by Pet', () => {
    test('should return all sponsorships for a pet', async ({ request }) => {
      // Create a sponsorship first
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `listtest${Date.now()}@example.com`,
          name: 'List Test',
          amount: 75,
          currency: 'USD',
        },
      });

      const response = await request.get(`${API_BASE}/api/sponsorships/pet/${testPetId}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Verify structure
      const sponsorship = data.data[0];
      expect(sponsorship).toHaveProperty('id');
      expect(sponsorship).toHaveProperty('petId');
      expect(sponsorship).toHaveProperty('userId');
      expect(sponsorship).toHaveProperty('amount');
      expect(sponsorship).toHaveProperty('currency');
      expect(sponsorship).toHaveProperty('user');
    });

    test('should return empty array for pet with no sponsorships', async ({ request }) => {
      // Create a new pet without sponsorships
      const petResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'No Sponsors Pet',
          type: 'cat',
          breed: 'Persian',
          photoUrl: 'https://example.com/cat.jpg',
        },
      });

      const petData = await petResponse.json();
      const noSponsorPetId = petData.data.id;

      const response = await request.get(`${API_BASE}/api/sponsorships/pet/${noSponsorPetId}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });
  });

  test.describe('GET /api/sponsorships/recent - Get Recent Sponsorships', () => {
    test('should return recent sponsorships ordered by date', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/sponsorships/recent`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);

      // Verify ordering (most recent first)
      if (data.data.length > 1) {
        const first = new Date(data.data[0].createdAt);
        const second = new Date(data.data[1].createdAt);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });

    test('should limit results to default limit', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/sponsorships/recent`);

      const data = await response.json();
      expect(data.data.length).toBeLessThanOrEqual(10); // Default limit
    });
  });
});
