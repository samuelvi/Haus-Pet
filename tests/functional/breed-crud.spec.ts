import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';
const AUTH_CREDENTIALS = {
  email: 'admin@hauspet.com',
  password: 'Admin123',
};

let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;
let validBreedId: string; // Store a valid UUID from the database

/**
 * Helper: Login and get auth tokens
 */
async function login() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(AUTH_CREDENTIALS),
  });

  const data = await response.json();
  authTokens = data.data.tokens;
  sessionId = data.data.sessionId;
}

test.describe('Breed CRUD Integration Tests', () => {
  test.beforeAll(async () => {
    // Login once for all tests that need authentication
    await login();

    // Get a valid breed ID from the database for UUID-based tests
    const response = await fetch(`${API_BASE}/api/breeds`);
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      validBreedId = data.data[0].id;
    }
  });

  test.describe('GET /api/breeds - List all breeds', () => {
    test('should return array of breeds with 200 status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Verify breed structure
      const breed = data.data[0];
      expect(breed).toHaveProperty('id');
      expect(breed).toHaveProperty('name');
      expect(breed).toHaveProperty('animalType');
      expect(['cat', 'dog', 'bird']).toContain(breed.animalType);
    });
  });

  test.describe('GET /api/breeds/:id - Get breed by ID', () => {
    test('should return breed with valid ID', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/${validBreedId}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id');
      expect(data.data.id).toBe(validBreedId);
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('animalType');
    });

    test('should return 404 for non-existent breed', async ({ request }) => {
      // Use a valid UUID format but non-existent ID
      const fakeUuid = '019aa791-0000-0000-0000-000000000000';
      const response = await request.get(`${API_BASE}/api/breeds/${fakeUuid}`);

      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('not found');
    });

    test('should return 400 for invalid ID format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/abc`);

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('Invalid breed ID');
    });

    test('should return 400 for negative ID', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/-1`);

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });
  });

  test.describe('POST /api/breeds/add - Create breed', () => {
    test('should create breed with valid data and authentication', async ({ request }) => {
      const newBreed = {
        name: 'Test Breed ' + Date.now(),
        animalType: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.breed).toHaveProperty('id');
      expect(data.data.breed.name).toBe(newBreed.name);
      expect(data.data.breed.animalType).toBe(newBreed.animalType);
    });

    test('should return 401 without authentication', async ({ request }) => {
      const newBreed = {
        name: 'Unauthorized Breed',
        animalType: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: { 'Content-Type': 'application/json' },
        data: newBreed,
      });

      expect(response.status()).toBe(401);
    });

    test('should return 400 for name too short', async ({ request }) => {
      const newBreed = {
        name: 'A', // Too short (< 2 characters)
        animalType: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('at least 2 characters');
    });

    test('should return 400 for name too long', async ({ request }) => {
      const newBreed = {
        name: 'A'.repeat(51), // Too long (> 50 characters)
        animalType: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('not exceed 50 characters');
    });

    test('should return 400 for invalid characters in name', async ({ request }) => {
      const newBreed = {
        name: 'Invalid@Breed!123', // Contains invalid characters
        animalType: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('letters, numbers, spaces, and hyphens');
    });

    test('should return 400 for invalid animal type', async ({ request }) => {
      const newBreed = {
        name: 'Valid Breed',
        animalType: 'fish', // Invalid type
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('Animal type must be one of');
    });

    test('should return 400 for missing name', async ({ request }) => {
      const newBreed = {
        animalType: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should return 400 for missing animal type', async ({ request }) => {
      const newBreed = {
        name: 'Test Breed',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should trim whitespace from name', async ({ request }) => {
      const newBreed = {
        name: '  Trimmed Breed ' + Date.now() + '  ',
        animalType: 'bird',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.breed.name).toBe(newBreed.name.trim()); // Should be trimmed
    });

    test('should return 409 for duplicate breed', async ({ request }) => {
      const duplicateBreed = {
        name: 'Labrador', // Already exists in seed data
        animalType: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: duplicateBreed,
      });

      expect(response.status()).toBe(409);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('already exists');
    });
  });

  test.describe('PUT /api/breeds/:id - Update breed', () => {
    let testBreedId: string;

    test.beforeAll(async ({ request }) => {
      // Create a breed for update tests
      const newBreed = {
        name: 'Breed For Update ' + Date.now(),
        animalType: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      const data = await response.json();
      testBreedId = data.data.breed.id;
    });

    test('should update breed with valid data and authentication', async ({ request }) => {
      const updatedData = {
        name: 'Updated Breed ' + Date.now(),
        animalType: 'dog',
      };

      const response = await request.put(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updatedData,
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.breed.id).toBe(testBreedId);
      expect(data.data.breed.name).toBe(updatedData.name);
      expect(data.data.breed.animalType).toBe(updatedData.animalType);
    });

    test('should return 401 without authentication', async ({ request }) => {
      const updatedData = {
        name: 'Unauthorized Update',
        animalType: 'bird',
      };

      const response = await request.put(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: { 'Content-Type': 'application/json' },
        data: updatedData,
      });

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent breed', async ({ request }) => {
      const updatedData = {
        name: 'Non Existent',
        animalType: 'dog',
      };

      // Use a valid UUID format but non-existent ID
      const fakeUuid = '019aa791-0000-0000-0000-000000000000';
      const response = await request.put(`${API_BASE}/api/breeds/${fakeUuid}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updatedData,
      });

      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('not found');
    });

    test('should return 400 for invalid name validation', async ({ request }) => {
      const updatedData = {
        name: 'X', // Too short
        animalType: 'cat',
      };

      const response = await request.put(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updatedData,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should return 400 for invalid ID format', async ({ request }) => {
      const updatedData = {
        name: 'Valid Breed',
        animalType: 'dog',
      };

      const response = await request.put(`${API_BASE}/api/breeds/invalid`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updatedData,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.message).toContain('Invalid breed ID');
    });
  });

  test.describe('DELETE /api/breeds/:id - Delete breed', () => {
    let testBreedId: string;

    test.beforeEach(async ({ request }) => {
      // Create a breed for each delete test
      const newBreed = {
        name: 'Breed For Delete ' + Date.now(),
        animalType: 'bird',
      };

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newBreed,
      });

      const data = await response.json();
      testBreedId = data.data.breed.id;
    });

    test('should delete breed with valid ID and authentication', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/breeds/${testBreedId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.message).toContain('deleted successfully');

      // Verify breed is actually deleted
      const getResponse = await request.get(`${API_BASE}/api/breeds/${testBreedId}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/breeds/${testBreedId}`);

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent breed', async ({ request }) => {
      // Use a valid UUID format but non-existent ID
      const fakeUuid = '019aa791-0000-0000-0000-000000000000';
      const response = await request.delete(`${API_BASE}/api/breeds/${fakeUuid}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('not found');
    });

    test('should return 400 for invalid ID format', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/breeds/abc`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.message).toContain('Invalid breed ID');
    });
  });
});
