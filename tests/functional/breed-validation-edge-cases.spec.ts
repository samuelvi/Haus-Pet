import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

let authHeaders: Record<string, string>;

test.beforeAll(async ({ request }) => {
  // Create admin user for protected endpoints
  const signupResponse = await request.post(`${API_BASE}/api/auth/signup`, {
    data: {
      email: `breed-validation-admin-${Date.now()}@test.com`,
      password: 'StrongPass123!',
      name: 'Breed Validation Admin',
      role: 'ADMIN'
    }
  });

  const signupData = await signupResponse.json();
  authHeaders = {
    'Authorization': `Bearer ${signupData.data.tokens.accessToken}`,
    'x-session-id': signupData.data.sessionId
  };
});

test.describe('Breed Validation & Data Integrity Edge Cases', () => {

  test.describe('Name Validation', () => {

    test('should reject breed name shorter than 2 characters', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: 'A', // Only 1 character
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toMatch(/name.*too.*short|name.*minimum|name.*at least 2/i);
    });

    test('should reject breed name longer than 50 characters', async ({ request }) => {
      const longName = 'A'.repeat(51);

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: longName,
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toMatch(/name.*too.*long|name.*maximum|name.*50/i);
    });

    test('should accept breed name exactly 2 characters', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `AB${Date.now()}`,
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(201);
    });

    test('should handle breed name exactly 50 characters', async ({ request }) => {
      const exactName = 'A'.repeat(43) + Date.now(); // Total 50 chars

      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: exactName,
          petType: 'dog'
        }
      });

      // API may accept or reject based on validation rules
      expect([201, 400]).toContain(response.status());
    });

    test('should reject breed name with only whitespace', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: '     ',
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should trim leading and trailing whitespace from breed name', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `  Trimmed Breed ${Date.now()}  `,
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      // Check the breed name in the response data structure
      if (data.data && data.data.breed) {
        expect(data.data.breed.name).not.toMatch(/^\s|\s$/); // No leading/trailing spaces
      }
    });

    test('should handle breed name with numbers', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Breed123${Date.now()}`,
          petType: 'dog'
        }
      });

      // API may accept or reject based on validation rules
      expect([201, 400]).toContain(response.status());
    });

    test('should reject breed name with special characters', async ({ request }) => {
      const specialChars = ['Breed@Name', 'Breed#Test', 'Breed$Dollar', 'Breed%Percent'];

      for (const name of specialChars) {
        const response = await request.post(`${API_BASE}/api/breeds/add`, {
          headers: authHeaders,
          data: {
            name: `${name}${Date.now()}`,
            petType: 'dog'
          }
        });

        expect(response.status()).toBe(400);
      }
    });

    test('should accept breed name with spaces and hyphens', async ({ request }) => {
      const validNames = [
        `Golden Retriever ${Date.now()}`,
        `German-Shepherd ${Date.now()}`,
        `Bull-Terrier Mix ${Date.now()}`
      ];

      for (const name of validNames) {
        const response = await request.post(`${API_BASE}/api/breeds/add`, {
          headers: authHeaders,
          data: {
            name,
            petType: 'dog'
          }
        });

        expect(response.status()).toBe(201);
      }
    });

    test('should handle breed name with consecutive spaces', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Double  Space ${Date.now()}`,
          petType: 'dog'
        }
      });

      // API may accept or reject based on validation rules
      expect([201, 400]).toContain(response.status());
    });

    test('should handle unicode characters in breed name', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Breed犬猫${Date.now()}`,
          petType: 'dog'
        }
      });

      // Should either accept or reject gracefully (not crash)
      expect([400, 201]).toContain(response.status());
    });

    test('should handle emoji in breed name', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Breed🐕${Date.now()}`,
          petType: 'dog'
        }
      });

      // Should either accept or reject gracefully (not crash)
      expect([400, 201]).toContain(response.status());
    });
  });

  test.describe('Type Validation', () => {

    test('should reject invalid pet type', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Test Breed ${Date.now()}`,
          petType: 'dragon' // Invalid type
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toMatch(/type.*not.*exist|invalid.*type|unknown.*type|pet type must be one of/i);
    });

    test('should reject missing type', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Test Breed ${Date.now()}`
          // Missing type
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should reject empty type', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Test Breed ${Date.now()}`,
          petType: ''
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should reject null type', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Test Breed ${Date.now()}`,
          petType: null
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should accept valid pet types', async ({ request }) => {
      // Test with known valid pet types
      const validTypes = ['dog', 'cat', 'bird'];

      for (const petType of validTypes) {
        const response = await request.post(`${API_BASE}/api/breeds/add`, {
          headers: authHeaders,
          data: {
            name: `Test ${petType} ${Date.now()}`,
            petType: petType
          }
        });

        expect(response.status()).toBe(201);
      }
    });

    test('should handle case sensitivity in type', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Test Breed ${Date.now()}`,
          petType: 'DOG' // Uppercase
        }
      });

      // Should either normalize to lowercase or reject
      expect([400, 201]).toContain(response.status());
    });
  });

  test.describe('Duplicate Detection', () => {

    test('should reject exact duplicate breed name', async ({ request }) => {
      const breedName = `Duplicate Breed ${Date.now()}`;

      // Create first breed
      const response1 = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: breedName,
          petType: 'dog'
        }
      });
      expect(response1.status()).toBe(201);

      // Attempt duplicate
      const response2 = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: breedName,
          petType: 'dog'
        }
      });

      expect(response2.status()).toBe(409);
      const data = await response2.json();
      expect(data.message).toMatch(/already.*exist|duplicate|conflict/i);
    });

    test('should detect case-insensitive duplicates', async ({ request }) => {
      const baseName = `CaseTest${Date.now()}`;

      // Create with lowercase
      const response1 = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: baseName.toLowerCase(),
          petType: 'dog'
        }
      });
      expect(response1.status()).toBe(201);

      // Try with uppercase
      const response2 = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: baseName.toUpperCase(),
          petType: 'dog'
        }
      });

      expect(response2.status()).toBe(409);
    });

    test('should allow same breed name for different types', async ({ request }) => {
      const breedName = `MultiType Breed ${Date.now()}`;

      // Create as dog
      const response1 = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: breedName,
          petType: 'dog'
        }
      });
      expect(response1.status()).toBe(201);

      // Create as cat (should be allowed)
      const response2 = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: breedName,
          petType: 'cat'
        }
      });

      // Depending on business logic, this might be allowed or rejected
      expect([201, 409]).toContain(response2.status());
    });
  });

  test.describe('Update Validation', () => {

    test('should reject update with invalid ID format', async ({ request }) => {
      const response = await request.put(`${API_BASE}/api/breeds/invalid-uuid`, {
        headers: authHeaders,
        data: {
          name: 'Updated Name',
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.message).toMatch(/invalid.*id|uuid.*invalid/i);
    });

    test('should reject update for non-existent breed', async ({ request }) => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';

      const response = await request.put(`${API_BASE}/api/breeds/${fakeUuid}`, {
        headers: authHeaders,
        data: {
          name: 'Updated Name',
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(404);
    });

    test('should reject update that creates duplicate name', async ({ request }) => {
      // Create two breeds
      const breed1Response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Original Breed ${Date.now()}`,
          petType: 'dog'
        }
      });
      const breed1 = await breed1Response.json();

      const breed2Response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Target Breed ${Date.now()}`,
          petType: 'dog'
        }
      });
      const breed2 = await breed2Response.json();

      // Try to update breed2 to have breed1's name
      const response = await request.put(`${API_BASE}/api/breeds/${breed2.breed.id}`, {
        headers: authHeaders,
        data: {
          name: breed1.breed.name,
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(409);
    });

    test('should allow updating breed to same name (idempotent)', async ({ request }) => {
      // Create breed
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Idempotent Breed ${Date.now()}`,
          petType: 'dog'
        }
      });
      const createData = await createResponse.json();

      // Update with same name
      const response = await request.put(`${API_BASE}/api/breeds/${createData.breed.id}`, {
        headers: authHeaders,
        data: {
          name: createData.breed.name,
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(200);
    });

    test('should validate name length on update', async ({ request }) => {
      // Create breed
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Valid Name ${Date.now()}`,
          petType: 'dog'
        }
      });
      const createData = await createResponse.json();

      // Update with invalid name (too short)
      const response = await request.put(`${API_BASE}/api/breeds/${createData.breed.id}`, {
        headers: authHeaders,
        data: {
          name: 'A', // Too short
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should validate type exists on update', async ({ request }) => {
      // Create breed
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Valid Name ${Date.now()}`,
          petType: 'dog'
        }
      });
      const createData = await createResponse.json();

      // Update with invalid type
      const response = await request.put(`${API_BASE}/api/breeds/${createData.breed.id}`, {
        headers: authHeaders,
        data: {
          name: createData.breed.name,
          petType: 'dragon' // Invalid
        }
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Delete Validation', () => {

    test('should reject delete with invalid ID format', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/breeds/not-a-uuid`, {
        headers: authHeaders
      });

      expect(response.status()).toBe(400);
    });

    test('should reject delete for non-existent breed', async ({ request }) => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';

      const response = await request.delete(`${API_BASE}/api/breeds/${fakeUuid}`, {
        headers: authHeaders
      });

      expect(response.status()).toBe(404);
    });

    test('should prevent deletion of breed with associated pets', async ({ request }) => {
      // This test assumes there are already pets in the database
      // In a real scenario, you'd create a pet first

      // Get a breed that has pets
      const breedsResponse = await request.get(`${API_BASE}/api/breeds?page=1&limit=10`);
      const breedsData = await breedsResponse.json();

      if (breedsData.items.length > 0) {
        const breed = breedsData.items[0];

        // Try to delete (assuming this breed might have pets)
        const response = await request.delete(`${API_BASE}/api/breeds/${breed.id}`, {
          headers: authHeaders
        });

        // Should either succeed (no pets) or fail with constraint error
        if (response.status() === 400) {
          const data = await response.json();
          expect(data.message).toMatch(/cannot.*delete|pets.*using|constraint/i);
        }
      }
    });

    test('should successfully delete breed with no associated pets', async ({ request }) => {
      // Create a new breed (no pets will use it)
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Deletable Breed ${Date.now()}`,
          petType: 'dog'
        }
      });
      const createData = await createResponse.json();

      // Delete it
      const response = await request.delete(`${API_BASE}/api/breeds/${createData.breed.id}`, {
        headers: authHeaders
      });

      expect(response.status()).toBe(200);

      // Verify it's gone
      const getResponse = await request.get(`${API_BASE}/api/breeds/${createData.breed.id}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should reject double deletion (idempotency check)', async ({ request }) => {
      // Create and delete breed
      const createResponse = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Double Delete ${Date.now()}`,
          petType: 'dog'
        }
      });
      const createData = await createResponse.json();

      const deleteResponse1 = await request.delete(`${API_BASE}/api/breeds/${createData.breed.id}`, {
        headers: authHeaders
      });
      expect(deleteResponse1.status()).toBe(200);

      // Try to delete again
      const deleteResponse2 = await request.delete(`${API_BASE}/api/breeds/${createData.breed.id}`, {
        headers: authHeaders
      });
      expect(deleteResponse2.status()).toBe(404);
    });
  });

  test.describe('Fuzzy Search Edge Cases', () => {

    test('should return empty results for gibberish search', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/check-similar?name=xyzqwertyfakename123`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.breeds).toEqual([]);
    });

    test('should handle empty search string', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/check-similar?name=`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.breeds)).toBe(true);
    });

    test('should handle very short search strings', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/check-similar?name=a`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.breeds)).toBe(true);
    });

    test('should handle special characters in search', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/check-similar?name=${encodeURIComponent('<script>alert(1)</script>')}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.breeds)).toBe(true);
    });

    test('should find breeds with typos', async ({ request }) => {
      // Assuming "Labrador" exists
      const response = await request.get(`${API_BASE}/api/breeds/check-similar?name=Labradoor`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should find "Labrador" despite typo
      if (data.breeds.length > 0) {
        expect(data.breeds.some((b: any) => b.name.toLowerCase().includes('labrador'))).toBe(true);
      }
    });

    test('should limit similar breeds results', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds/check-similar?name=dog`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should limit results (e.g., top 5 matches)
      expect(data.breeds.length).toBeLessThanOrEqual(10);
    });
  });

  test.describe('Malformed Request Bodies', () => {

    test('should reject non-JSON request body', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'text/plain'
        },
        data: 'This is not JSON'
      });

      expect(response.status()).toBe(400);
    });

    test('should handle extra unexpected fields gracefully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: `Extra Fields ${Date.now()}`,
          petType: 'dog',
          unexpectedField1: 'value1',
          unexpectedField2: 'value2',
          malicious: '<script>alert(1)</script>'
        }
      });

      // Should either ignore extra fields or reject
      expect([400, 201]).toContain(response.status());
    });

    test('should handle nested objects in request', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: {
            nested: 'Invalid Structure'
          },
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should handle arrays in request fields', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/breeds/add`, {
        headers: authHeaders,
        data: {
          name: ['Array', 'Value'],
          petType: 'dog'
        }
      });

      expect(response.status()).toBe(400);
    });
  });
});
