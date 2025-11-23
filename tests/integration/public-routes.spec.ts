import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test.describe('Public Routes (No Authentication Required)', () => {
  test.describe('GET /api/pets - List all pets (Public)', () => {
    test('should return pets without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should return pets with pagination', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets?page=1&limit=5`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    test('should filter pets by type', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets?type=dog`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      data.data.forEach((pet: any) => {
        expect(pet.type).toBe('dog');
      });
    });

    test('should return 400 for invalid type filter', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets?type=invalid`);

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should return pets with totalSponsored field', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets`);
      const data = await response.json();

      if (data.data.length > 0) {
        const pet = data.data[0];
        expect(pet).toHaveProperty('totalSponsored');
        expect(typeof pet.totalSponsored).toBe('number');
        expect(pet.totalSponsored).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('GET /api/pets/:id - Get pet by ID (Public)', () => {
    let testPetId: string;

    test.beforeAll(async ({ request }) => {
      // Get a pet ID from the list
      const response = await request.get(`${API_BASE}/api/pets`);
      const data = await response.json();
      if (data.data.length > 0) {
        testPetId = data.data[0].id;
      }
    });

    test('should return pet details without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets/${testPetId}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id');
      expect(data.data.id).toBe(testPetId);
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('type');
      expect(data.data).toHaveProperty('breed');
      expect(data.data).toHaveProperty('totalSponsored');
    });

    test('should return 404 for non-existent pet', async ({ request }) => {
      const fakeUuid = '019aa791-0000-0000-0000-000000000000';
      const response = await request.get(`${API_BASE}/api/pets/${fakeUuid}`);

      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });

    test('should return 400 for invalid pet ID format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets/invalid-id`);

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.status).toBe('ERROR');
    });
  });

  test.describe('GET /api/breeds - List all breeds (Public)', () => {
    test('should return breeds without authentication', async ({ request }) => {
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
      expect(breed).toHaveProperty('petType');
      expect(['cat', 'dog', 'bird']).toContain(breed.petType);
    });

    test('should return all breeds consistently', async ({ request }) => {
      const response1 = await request.get(`${API_BASE}/api/breeds`);
      const response2 = await request.get(`${API_BASE}/api/breeds`);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.data.length).toBe(data2.data.length);
    });
  });

  test.describe('GET /api/breeds/:id - Get breed by ID (Public)', () => {
    let validBreedId: string;

    test.beforeAll(async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds`);
      const data = await response.json();
      validBreedId = data.data[0].id;
    });

    test('should return breed without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/${validBreedId}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.data).toHaveProperty('id');
      expect(data.data.id).toBe(validBreedId);
    });

    test('should return 404 for non-existent breed', async ({ request }) => {
      const fakeUuid = '019aa791-0000-0000-0000-000000000000';
      const response = await request.get(`${API_BASE}/api/breeds/${fakeUuid}`);

      expect(response.status()).toBe(404);
    });

    test('should return 400 for invalid breed ID', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/invalid`);

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/sponsorships/recent - Recent sponsorships (Public)', () => {
    test('should return recent sponsorships without authentication', async ({ request }) => {
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

    test('should limit results appropriately', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/sponsorships/recent`);
      const data = await response.json();

      expect(data.data.length).toBeLessThanOrEqual(10);
    });

    test('should include user and pet information', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/sponsorships/recent`);
      const data = await response.json();

      if (data.data.length > 0) {
        const sponsorship = data.data[0];
        expect(sponsorship).toHaveProperty('user');
        expect(sponsorship).toHaveProperty('pet');
        expect(sponsorship).toHaveProperty('amount');
        expect(sponsorship).toHaveProperty('currency');
        expect(sponsorship.user).toHaveProperty('name');
        expect(sponsorship.pet).toHaveProperty('name');
      }
    });
  });

  test.describe('GET /api/sponsorships/pet/:petId - Sponsorships by pet (Public)', () => {
    let testPetId: string;

    test.beforeAll(async ({ request }) => {
      // Get a pet that has sponsorships
      const petsResponse = await request.get(`${API_BASE}/api/pets`);
      const petsData = await petsResponse.json();
      const petWithSponsorships = petsData.data.find((p: any) => p.totalSponsored > 0);
      if (petWithSponsorships) {
        testPetId = petWithSponsorships.id;
      } else {
        testPetId = petsData.data[0].id;
      }
    });

    test('should return sponsorships without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/sponsorships/pet/${testPetId}`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should return empty array for pet with no sponsorships', async ({ request }) => {
      // Get a pet without sponsorships
      const petsResponse = await request.get(`${API_BASE}/api/pets`);
      const petsData = await petsResponse.json();
      const petWithoutSponsorships = petsData.data.find((p: any) => p.totalSponsored === 0);

      if (petWithoutSponsorships) {
        const response = await request.get(
          `${API_BASE}/api/sponsorships/pet/${petWithoutSponsorships.id}`
        );

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('OK');
        expect(data.data).toEqual([]);
      }
    });

    test('should return 400 for invalid pet ID', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/sponsorships/pet/invalid`);

      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /api/sponsorships - Create sponsorship (Public)', () => {
    let testPetId: string;

    test.beforeAll(async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/pets`);
      const data = await response.json();
      testPetId = data.data[0].id;
    });

    test('should create sponsorship without authentication', async ({ request }) => {
      const uniqueEmail = `public${Date.now()}@example.com`;

      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: uniqueEmail,
          name: 'Public Sponsor',
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
    });

    test('should validate email format on public sponsorship', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: 'invalid-email',
          name: 'Test',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should validate amount on public sponsorship', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `test${Date.now()}@example.com`,
          name: 'Test',
          amount: -10,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle zero amount rejection', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `test${Date.now()}@example.com`,
          name: 'Test',
          amount: 0,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle large sponsorship amounts', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `large${Date.now()}@example.com`,
          name: 'Large Donor',
          amount: 10000,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.amount).toBe(10000);
    });
  });

  test.describe('Health Check and Status (Public)', () => {
    test('should return health check status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/health`);

      expect(response.status()).toBe(200);
    });
  });
});
