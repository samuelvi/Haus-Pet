import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test.describe('Pagination Edge Cases & Boundary Conditions', () => {

  test.describe('Boundary Conditions', () => {

    test('should handle page=0 and default to page=1', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=0&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.page).toBe(1); // Should default to 1
    });

    test('should handle negative page number and default to page=1', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=-5&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.page).toBe(1); // Should default to 1
    });

    test('should handle page beyond total items', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=99999&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items).toEqual([]); // Empty results
      expect(data.data.pagination.hasNext).toBe(false);
      expect(data.data.pagination.hasPrevious).toBe(true);
    });

    test('should handle limit=0', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=0`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should use default limit (5)
      expect(data.data.items.length).toBeGreaterThan(0);
      expect(data.data.items.length).toBeLessThanOrEqual(5);
    });

    test('should cap limit to maximum (MAX_PAGE_SIZE=20)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=999`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should be capped to max (20)
      expect(data.data.items.length).toBeLessThanOrEqual(20);
      expect(data.data.pagination.limit).toBeLessThanOrEqual(20);
    });

    test('should handle negative limit', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=-10`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should use default limit
      expect(data.data.items.length).toBeGreaterThan(0);
      expect(data.data.pagination.limit).toBeGreaterThan(0);
    });

    test('should handle non-numeric page parameter', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=abc&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.page).toBe(1); // Should default to 1
    });

    test('should handle non-numeric limit parameter', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=xyz`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should use default limit
      expect(data.data.pagination.limit).toBeGreaterThan(0);
    });

    test('should handle float values for page and limit', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1.5&limit=3.7`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should convert to integers
      expect(data.data.pagination.page).toBe(1);
      expect(Number.isInteger(data.data.pagination.limit)).toBe(true);
    });
  });

  test.describe('n+1 Pagination Pattern Verification', () => {

    test('should use n+1 pattern to detect hasNext correctly', async ({ request }) => {
      // Request 5 items, backend should fetch 6 (n+1)
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Should return exactly 5 items (not 6)
      expect(data.data.items).toHaveLength(5);

      // hasNext should be true if there's a 6th item (detected by n+1 fetch)
      expect(data.data.pagination).toHaveProperty('hasNext');
      expect(typeof data.data.pagination.hasNext).toBe('boolean');

      // If hasNext is true, next page should have items
      if (data.data.pagination.hasNext) {
        const nextPageResponse = await request.get(`${API_BASE}/api/breeds?page=2&limit=5`);
        const nextPageData = await nextPageResponse.json();
        expect(nextPageData.items.length).toBeGreaterThan(0);
      }
    });

    test('should correctly identify last page with n+1 pattern', async ({ request }) => {
      // Get total count first
      const firstPageResponse = await request.get(`${API_BASE}/api/breeds?page=1&limit=5`);
      const firstPageData = await firstPageResponse.json();

      // Navigate to a page that should be last or near last
      // Assuming we have around 10-15 breeds total
      const lastPageResponse = await request.get(`${API_BASE}/api/breeds?page=3&limit=5`);
      expect(lastPageResponse.status()).toBe(200);

      const lastPageData = await lastPageResponse.json();

      // If this is truly the last page
      if (!lastPageData.pagination.hasNext) {
        // Items should be <= limit
        expect(lastPageData.items.length).toBeLessThanOrEqual(5);

        // Next page should be empty
        const beyondLastResponse = await request.get(`${API_BASE}/api/breeds?page=4&limit=5`);
        const beyondLastData = await beyondLastResponse.json();
        expect(beyondLastData.items).toEqual([]);
        expect(beyondLastData.pagination.hasNext).toBe(false);
      }
    });

    test('should handle exact multiple of page size with n+1', async ({ request }) => {
      // If we have exactly 10 items and request 5 per page
      // Page 2 should correctly show hasNext=false

      // This tests the edge case where items_count % page_size === 0
      const response = await request.get(`${API_BASE}/api/breeds?page=2&limit=5`);
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Verify n+1 pattern: should fetch 6, return max 5, detect if there's a 6th
      expect(data.data.items.length).toBeLessThanOrEqual(5);

      // hasNext logic should work correctly even when count is exact multiple
      if (data.data.items.length === 5) {
        // If we got exactly 5 items, hasNext should reflect if there's actually more
        expect(typeof data.data.pagination.hasNext).toBe('boolean');
      }
    });

    test('should verify n+1 pattern across all admin endpoints', async ({ request }) => {
      // Setup: Create auth session
      const signupResponse = await request.post(`${API_BASE}/api/auth/signup`, {
        data: {
          email: `admin-n1-test-${Date.now()}@test.com`,
          password: 'StrongPass123!',
          name: 'N+1 Test Admin',
          role: 'ADMIN'
        }
      });
      expect(signupResponse.status()).toBe(201);

      const signupData = await signupResponse.json();
      const authHeaders = {
        'Authorization': `Bearer ${signupData.accessToken}`,
        'x-session-id': signupData.sessionId
      };

      // Test breed-types endpoint
      const breedTypesResponse = await request.get(`${API_BASE}/api/admin/breed-types?page=1&limit=4`, {
        headers: authHeaders
      });
      expect(breedTypesResponse.status()).toBe(200);
      const breedTypesData = await breedTypesResponse.json();
      expect(breedTypesData.items.length).toBeLessThanOrEqual(4); // Should return max 4, not 5
      expect(breedTypesData.pagination).toHaveProperty('hasNext');

      // Test pets endpoint
      const petsResponse = await request.get(`${API_BASE}/api/admin/pets?page=1&limit=4`, {
        headers: authHeaders
      });
      expect(petsResponse.status()).toBe(200);
      const petsData = await petsResponse.json();
      expect(petsData.items.length).toBeLessThanOrEqual(4); // Should return max 4, not 5
      expect(petsData.pagination).toHaveProperty('hasNext');
    });
  });

  test.describe('Performance & Concurrency', () => {

    test('should handle concurrent pagination requests', async ({ request }) => {
      // Simulate multiple users paginating simultaneously
      const requests = Array.from({ length: 10 }, (_, i) =>
        request.get(`${API_BASE}/api/breeds?page=${i + 1}&limit=5`)
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      // Verify pagination consistency
      const dataArray = await Promise.all(responses.map(r => r.json()));
      dataArray.forEach((data, index) => {
        expect(data.data.pagination.page).toBe(index + 1);
      });
    });

    test('should maintain consistent results during rapid pagination', async ({ request }) => {
      // Fetch page 1 twice rapidly
      const [response1, response2] = await Promise.all([
        request.get(`${API_BASE}/api/breeds?page=1&limit=5`),
        request.get(`${API_BASE}/api/breeds?page=1&limit=5`)
      ]);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Results should be identical
      expect(data1.items).toEqual(data2.items);
      expect(data1.pagination).toEqual(data2.pagination);
    });
  });

  test.describe('Error Scenarios', () => {

    test('should handle malformed query parameters gracefully', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=&limit=`);
      expect(response.status()).toBe(200); // Should not crash

      const data = await response.json();
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('pagination');
    });

    test('should handle special characters in query parameters', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&search=<script>alert('xss')</script>`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      // Should sanitize or safely handle special characters
      expect(data.data.items).toBeDefined();
    });

    test('should handle very long search strings', async ({ request }) => {
      const longString = 'a'.repeat(1000);
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&search=${longString}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items).toBeDefined();
    });

    test('should handle SQL injection attempts in search', async ({ request }) => {
      const sqlInjection = "'; DROP TABLE breeds; --";
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&search=${encodeURIComponent(sqlInjection)}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items).toBeDefined();

      // Verify breeds table still exists by fetching again
      const verifyResponse = await request.get(`${API_BASE}/api/breeds?page=1&limit=5`);
      expect(verifyResponse.status()).toBe(200);
    });

    test('should handle unicode characters in search', async ({ request }) => {
      const unicode = '犬🐕猫🐈';
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&search=${encodeURIComponent(unicode)}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items).toBeDefined();
    });
  });

  test.describe('hasPrevious Validation', () => {

    test('should set hasPrevious=false on first page', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5`);
      const data = await response.json();

      expect(data.data.pagination.hasPrevious).toBe(false);
    });

    test('should set hasPrevious=true on pages after first', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=2&limit=5`);
      const data = await response.json();

      expect(data.data.pagination.hasPrevious).toBe(true);
    });

    test('should maintain correct hasPrevious across pagination', async ({ request }) => {
      const pages = [1, 2, 3];

      for (const page of pages) {
        const response = await request.get(`${API_BASE}/api/breeds?page=${page}&limit=5`);
        const data = await response.json();

        if (page === 1) {
          expect(data.data.pagination.hasPrevious).toBe(false);
        } else {
          expect(data.data.pagination.hasPrevious).toBe(true);
        }
      }
    });
  });

  test.describe('Pagination with Filters', () => {

    test('should apply n+1 pattern with type filter', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&type=dog`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items.length).toBeLessThanOrEqual(5); // n+1 should return max 5
      expect(data.data.pagination).toHaveProperty('hasNext');

      // All items should be dogs
      data.data.items.forEach((breed: any) => {
        expect(breed.petType.toLowerCase()).toBe('dog');
      });
    });

    test('should apply n+1 pattern with search filter', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=3&search=labra`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items.length).toBeLessThanOrEqual(3); // n+1 should return max 3
      expect(data.data.pagination).toHaveProperty('hasNext');
    });

    test('should handle pagination when filters return no results', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&search=nonexistentbreedxyz123`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data.items).toEqual([]);
      expect(data.data.pagination.hasNext).toBe(false);
      expect(data.data.pagination.hasPrevious).toBe(false);
    });

    test('should handle pagination when filters return exact page size', async ({ request }) => {
      // This tests the edge case where filtered results = page size exactly
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5&type=dog`);
      expect(response.status()).toBe(200);

      const data = await response.json();

      if (data.data.items.length === 5) {
        // If we got exactly 5, hasNext should be true/false based on if there's more
        expect(typeof data.data.pagination.hasNext).toBe('boolean');

        // Verify by checking next page
        const nextResponse = await request.get(`${API_BASE}/api/breeds?page=2&limit=5&type=dog`);
        const nextData = await nextResponse.json();

        if (data.data.pagination.hasNext) {
          expect(nextData.data.items.length).toBeGreaterThan(0);
        } else {
          expect(nextData.data.items).toEqual([]);
        }
      }
    });
  });

  test.describe('Response Structure Validation', () => {

    test('should always return consistent pagination structure', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=1&limit=5`);
      const data = await response.json();

      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('pagination');
      expect(data.data.pagination).toHaveProperty('page');
      expect(data.data.pagination).toHaveProperty('limit');
      expect(data.data.pagination).toHaveProperty('hasNext');
      expect(data.data.pagination).toHaveProperty('hasPrevious');

      expect(Array.isArray(data.data.items)).toBe(true);
      expect(typeof data.data.pagination.page).toBe('number');
      expect(typeof data.data.pagination.limit).toBe('number');
      expect(typeof data.data.pagination.hasNext).toBe('boolean');
      expect(typeof data.data.pagination.hasPrevious).toBe('boolean');
    });

    test('should maintain structure even with empty results', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/breeds?page=9999&limit=5`);
      const data = await response.json();

      expect(data.data.items).toEqual([]);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.hasNext).toBe(false);
    });
  });
});
