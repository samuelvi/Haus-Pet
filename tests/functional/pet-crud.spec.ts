import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';
const AUTH_CREDENTIALS = {
  email: 'admin@hauspet.com',
  password: 'Admin123',
};

let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;

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

test.describe('Pet CRUD Integration Tests', () => {
  test.beforeAll(async () => {
    // Login once for all tests that need authentication
    await login();
  });

  test.describe('GET /api/pets - List all pets', () => {
    test('should return array of pets with 200 status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Verify pet structure
      const pet = data.data[0];
      expect(pet).toHaveProperty('id');
      expect(pet).toHaveProperty('breed');
      expect(pet).toHaveProperty('type');
      expect(['cat', 'dog', 'bird']).toContain(pet.type);
    });
  });

  test.describe('GET /api/pets/:id - Get pet by ID', () => {
    test('should return pet with valid ID', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets/1`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id', 1);
      expect(data.data).toHaveProperty('breed');
      expect(data.data).toHaveProperty('type');
    });

    test('should return 404 for non-existent pet', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets/99999`);

      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('not found');
    });

    test('should return 400 for invalid ID format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets/abc`);

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('Invalid pet ID');
    });

    test('should return 400 for negative ID', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets/-1`);

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });
  });

  test.describe('POST /api/pets/add - Create pet', () => {
    test('should create pet with valid data and authentication', async ({ request }) => {
      const newPet = {
        breed: 'Test Breed ' + Date.now(),
        type: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.pet).toHaveProperty('id');
      expect(data.data.pet.breed).toBe(newPet.breed);
      expect(data.data.pet.type).toBe(newPet.type);
    });

    test('should return 401 without authentication', async ({ request }) => {
      const newPet = {
        breed: 'Unauthorized Breed',
        type: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: { 'Content-Type': 'application/json' },
        data: newPet,
      });

      expect(response.status()).toBe(401);
    });

    test('should return 400 for breed too short', async ({ request }) => {
      const newPet = {
        breed: 'A', // Too short (< 2 characters)
        type: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('at least 2 characters');
    });

    test('should return 400 for breed too long', async ({ request }) => {
      const newPet = {
        breed: 'A'.repeat(51), // Too long (> 50 characters)
        type: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('not exceed 50 characters');
    });

    test('should return 400 for invalid characters in breed', async ({ request }) => {
      const newPet = {
        breed: 'Invalid@Breed!123', // Contains invalid characters
        type: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('letters, spaces, and hyphens');
    });

    test('should return 400 for invalid type', async ({ request }) => {
      const newPet = {
        breed: 'Valid Breed',
        type: 'fish', // Invalid type
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
      expect(data.message).toContain('Type must be one of');
    });

    test('should return 400 for missing breed', async ({ request }) => {
      const newPet = {
        type: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should return 400 for missing type', async ({ request }) => {
      const newPet = {
        breed: 'Test Breed',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should trim whitespace from breed', async ({ request }) => {
      const newPet = {
        breed: '  Trimmed Breed  ',
        type: 'bird',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.pet.breed).toBe('Trimmed Breed'); // Should be trimmed
    });

    test('should return 409 for duplicate breed', async ({ request }) => {
      const duplicateBreed = {
        breed: 'Labrador', // Already exists in seed data
        type: 'dog',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
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

  test.describe('PUT /api/pets/:id - Update pet', () => {
    let testPetId: number;

    test.beforeAll(async ({ request }) => {
      // Create a pet for update tests
      const newPet = {
        breed: 'Pet For Update ' + Date.now(),
        type: 'cat',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      const data = await response.json();
      testPetId = data.data.pet.id;
    });

    test('should update pet with valid data and authentication', async ({ request }) => {
      const updatedData = {
        breed: 'Updated Breed ' + Date.now(),
        type: 'dog',
      };

      const response = await request.put(`${API_BASE}/api/pets/${testPetId}`, {
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
      expect(data.data.pet.id).toBe(testPetId);
      expect(data.data.pet.breed).toBe(updatedData.breed);
      expect(data.data.pet.type).toBe(updatedData.type);
    });

    test('should return 401 without authentication', async ({ request }) => {
      const updatedData = {
        breed: 'Unauthorized Update',
        type: 'bird',
      };

      const response = await request.put(`${API_BASE}/api/pets/${testPetId}`, {
        headers: { 'Content-Type': 'application/json' },
        data: updatedData,
      });

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent pet', async ({ request }) => {
      const updatedData = {
        breed: 'Non Existent',
        type: 'dog',
      };

      const response = await request.put(`${API_BASE}/api/pets/99999`, {
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

    test('should return 400 for invalid breed validation', async ({ request }) => {
      const updatedData = {
        breed: 'X', // Too short
        type: 'cat',
      };

      const response = await request.put(`${API_BASE}/api/pets/${testPetId}`, {
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
        breed: 'Valid Breed',
        type: 'dog',
      };

      const response = await request.put(`${API_BASE}/api/pets/invalid`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updatedData,
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.message).toContain('Invalid pet ID');
    });
  });

  test.describe('DELETE /api/pets/:id - Delete pet', () => {
    let testPetId: number;

    test.beforeEach(async ({ request }) => {
      // Create a pet for each delete test
      const newPet = {
        breed: 'Pet For Delete ' + Date.now(),
        type: 'bird',
      };

      const response = await request.post(`${API_BASE}/api/pets/add`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: newPet,
      });

      const data = await response.json();
      testPetId = data.data.pet.id;
    });

    test('should delete pet with valid ID and authentication', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/pets/${testPetId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data.message).toContain('deleted successfully');

      // Verify pet is actually deleted
      const getResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/pets/${testPetId}`);

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent pet', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/pets/99999`, {
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
      const response = await request.delete(`${API_BASE}/api/pets/abc`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.message).toContain('Invalid pet ID');
    });
  });
});
