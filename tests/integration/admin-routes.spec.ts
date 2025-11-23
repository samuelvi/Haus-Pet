import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

let adminTokens: { accessToken: string; refreshToken: string };
let adminSessionId: string;
let userTokens: { accessToken: string; refreshToken: string };
let userSessionId: string;

test.describe('Admin Routes and Role-Based Access Control', () => {
  test.beforeAll(async ({ request }) => {
    // Login as admin
    const adminLoginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'admin@hauspet.com',
        password: 'Admin123',
      },
    });

    const adminLoginData = await adminLoginResponse.json();
    adminTokens = adminLoginData.data.tokens;
    adminSessionId = adminLoginData.data.sessionId;

    // Create and login as regular user
    const uniqueEmail = `user${Date.now()}@example.com`;
    await request.post(`${API_BASE}/api/auth/signup`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: uniqueEmail,
        password: 'UserPass123!',
        name: 'Regular User',
      },
    });

    const userLoginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: uniqueEmail,
        password: 'UserPass123!',
      },
    });

    const userLoginData = await userLoginResponse.json();
    userTokens = userLoginData.data.tokens;
    userSessionId = userLoginData.data.sessionId;
  });

  test.describe('POST /api/admin/pet - Create Pet (Admin Only)', () => {
    test('should allow admin to create pet', async ({ request }) => {
      const petData = {
        name: 'Admin Pet ' + Date.now(),
        type: 'dog',
        breed: 'Labrador',
        photoUrl: 'https://example.com/dog.jpg',
      };

      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: petData,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe(petData.name);
    });

    test('should deny regular user from creating pet', async ({ request }) => {
      const petData = {
        name: 'Unauthorized Pet',
        type: 'cat',
        breed: 'Persian',
        photoUrl: 'https://example.com/cat.jpg',
      };

      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
        data: petData,
      });

      expect(response.status()).toBe(403);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('Forbidden');
    });

    test('should deny unauthenticated user from creating pet', async ({ request }) => {
      const petData = {
        name: 'No Auth Pet',
        type: 'bird',
        breed: 'Parrot',
        photoUrl: 'https://example.com/bird.jpg',
      };

      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: { 'Content-Type': 'application/json' },
        data: petData,
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('PATCH /api/admin/pet/:id - Update Pet (Admin Only)', () => {
    let testPetId: string;

    test.beforeEach(async ({ request }) => {
      // Create a pet as admin
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: {
          name: 'Update Test Pet',
          type: 'dog',
          breed: 'Beagle',
          photoUrl: 'https://example.com/beagle.jpg',
        },
      });

      const createData = await createResponse.json();
      testPetId = createData.data.id;
    });

    test('should allow admin to update pet', async ({ request }) => {
      const updateData = {
        name: 'Updated Pet Name',
        breed: 'Golden Retriever',
      };

      const response = await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: updateData,
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.breed).toBe(updateData.breed);
    });

    test('should deny regular user from updating pet', async ({ request }) => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      const response = await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
        data: updateData,
      });

      expect(response.status()).toBe(403);
    });

    test('should deny unauthenticated user from updating pet', async ({ request }) => {
      const response = await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: { 'Content-Type': 'application/json' },
        data: { name: 'No Auth Update' },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('DELETE /api/admin/pet/:id - Delete Pet (Admin Only)', () => {
    let testPetId: string;

    test.beforeEach(async ({ request }) => {
      // Create a pet as admin
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: {
          name: 'Delete Test Pet',
          type: 'cat',
          breed: 'Siamese',
          photoUrl: 'https://example.com/siamese.jpg',
        },
      });

      const createData = await createResponse.json();
      testPetId = createData.data.id;
    });

    test('should allow admin to delete pet', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');

      // Verify pet is deleted
      const getResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should deny regular user from deleting pet', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
      });

      expect(response.status()).toBe(403);

      // Verify pet still exists
      const getResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      expect(getResponse.status()).toBe(200);
    });

    test('should deny unauthenticated user from deleting pet', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/admin/pet/${testPetId}`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/breeds/add - Create Breed (Admin Only)', () => {
    test('should allow admin to create breed', async ({ request }) => {
      const breedData = {
        name: 'Admin Breed ' + Date.now(),
        petType: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: breedData,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.breed.name).toBe(breedData.name);
    });

    test('should deny regular user from creating breed', async ({ request }) => {
      const breedData = {
        name: 'Unauthorized Breed',
        petType: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
        data: breedData,
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('PUT /api/breeds/:id - Update Breed (Admin Only)', () => {
    let testBreedId: string;

    test.beforeEach(async ({ request }) => {
      // Create a breed as admin
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: {
          name: 'Update Breed Test ' + Date.now(),
          petType: 'dog',
        },
      });

      const createData = await createResponse.json();
      testBreedId = createData.data.breed.id;
    });

    test('should allow admin to update breed', async ({ request }) => {
      const updateData = {
        name: 'Updated Breed Name',
        petType: 'cat',
      };

      const response = await request.put(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: updateData,
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.breed.name).toBe(updateData.name);
    });

    test('should deny regular user from updating breed', async ({ request }) => {
      const response = await request.put(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
        data: { name: 'Unauthorized Update', petType: 'bird' },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('DELETE /api/breeds/:id - Delete Breed (Admin Only)', () => {
    let testBreedId: string;

    test.beforeEach(async ({ request }) => {
      // Create a breed as admin
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
        data: {
          name: 'Delete Breed Test ' + Date.now(),
          petType: 'bird',
        },
      });

      const createData = await createResponse.json();
      testBreedId = createData.data.breed.id;
    });

    test('should allow admin to delete breed', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
      });

      expect(response.status()).toBe(200);

      // Verify breed is deleted
      const getResponse = await request.get(`${API_BASE}/api/breeds/${testBreedId}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should deny regular user from deleting breed', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
      });

      expect(response.status()).toBe(403);

      // Verify breed still exists
      const getResponse = await request.get(`${API_BASE}/api/breeds/${testBreedId}`);
      expect(getResponse.status()).toBe(200);
    });
  });

  test.describe('Role Verification', () => {
    test('should return correct role for admin user', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          'x-session-id': adminSessionId,
        },
      });

      const data = await response.json();
      expect(data.data.role).toBe('ADMIN');
    });

    test('should return correct role for regular user', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${userTokens.accessToken}`,
          'x-session-id': userSessionId,
        },
      });

      const data = await response.json();
      expect(data.data.role).toBe('USER');
    });
  });

  test.describe('Token Expiration and Session Management', () => {
    test('should reject expired or invalid admin token', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_expired_token',
          'x-session-id': 'invalid-session',
        },
        data: {
          name: 'Test Pet',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'https://example.com/dog.jpg',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should require session ID for admin operations', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminTokens.accessToken}`,
          // Missing x-session-id
        },
        data: {
          name: 'Test Pet',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'https://example.com/dog.jpg',
        },
      });

      expect(response.status()).toBe(401);
    });
  });
});
