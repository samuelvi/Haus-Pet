import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;
let testPetId: string;

test.describe('Sponsorship Edge Cases and Critical Scenarios', () => {
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

    // Create a test pet
    const petResponse = await request.post(`${API_BASE}/api/admin/pet`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.accessToken}`,
        'x-session-id': sessionId,
      },
      data: {
        name: 'Edge Case Test Pet',
        type: 'dog',
        breed: 'Labrador',
        photoUrl: 'https://example.com/dog.jpg',
      },
    });

    const petData = await petResponse.json();
    testPetId = petData.data.id;
  });

  test.describe('Duplicate User Prevention', () => {
    test('CRITICAL: Same email should NOT create duplicate users', async ({ request }) => {
      const email = `duplicate${Date.now()}@example.com`;

      // First sponsorship
      const response1 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: email,
          name: 'Duplicate Test User',
          amount: 25,
          currency: 'USD',
        },
      });

      expect(response1.status()).toBe(201);
      const data1 = await response1.json();
      const userId1 = data1.data.user.id;

      // Second sponsorship with SAME email (different amount/pet is OK)
      const response2 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: email, // SAME EMAIL
          name: 'Duplicate Test User',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response2.status()).toBe(201);
      const data2 = await response2.json();
      const userId2 = data2.data.user.id;

      // CRITICAL: Both sponsorships must use the SAME user ID
      expect(userId1).toBe(userId2);
      expect(data1.data.user.email).toBe(data2.data.user.email);
    });

    test('CRITICAL: Email case-insensitivity should prevent duplicates', async ({ request }) => {
      const baseEmail = `casetest${Date.now()}@example.com`;

      // First sponsorship with lowercase
      const response1 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: baseEmail.toLowerCase(),
          name: 'Case Test User',
          amount: 30,
          currency: 'USD',
        },
      });

      const data1 = await response1.json();
      const userId1 = data1.data.user.id;

      // Second sponsorship with UPPERCASE
      const response2 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: baseEmail.toUpperCase(),
          name: 'Case Test User',
          amount: 40,
          currency: 'USD',
        },
      });

      const data2 = await response2.json();
      const userId2 = data2.data.user.id;

      // Should use the same user regardless of email case
      expect(userId1).toBe(userId2);
    });

    test('CRITICAL: Multiple sponsorships from same user to different pets', async ({
      request,
    }) => {
      // Create a second pet
      const pet2Response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Second Pet for Multi-Sponsor',
          type: 'cat',
          breed: 'Persian',
          photoUrl: 'https://example.com/cat.jpg',
        },
      });

      const pet2Data = await pet2Response.json();
      const pet2Id = pet2Data.data.id;

      const email = `multisponsor${Date.now()}@example.com`;

      // Sponsor first pet
      const response1 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: email,
          name: 'Multi Sponsor User',
          amount: 50,
          currency: 'USD',
        },
      });

      const data1 = await response1.json();
      const userId1 = data1.data.user.id;

      // Sponsor second pet with SAME email
      const response2 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: pet2Id,
          email: email,
          name: 'Multi Sponsor User',
          amount: 75,
          currency: 'USD',
        },
      });

      const data2 = await response2.json();
      const userId2 = data2.data.user.id;

      // MUST use the same user ID
      expect(userId1).toBe(userId2);
    });
  });

  test.describe('Total Sponsored Amount Consistency', () => {
    test('CRITICAL: totalSponsored must increment correctly with multiple sponsorships', async ({
      request,
    }) => {
      // Create a fresh pet
      const petResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Total Sponsored Test Pet',
          type: 'bird',
          breed: 'Parrot',
          photoUrl: 'https://example.com/parrot.jpg',
        },
      });

      const petData = await petResponse.json();
      const freshPetId = petData.data.id;

      // Get initial state
      const initialPetResponse = await request.get(`${API_BASE}/api/pets/${freshPetId}`);
      const initialPetData = await initialPetResponse.json();
      expect(initialPetData.data.totalSponsored).toBe(0);

      // Create multiple sponsorships
      const amounts = [25, 50, 75, 100];
      let expectedTotal = 0;

      for (const amount of amounts) {
        await request.post(`${API_BASE}/api/sponsorships`, {
          headers: { 'Content-Type': 'application/json' },
          data: {
            petId: freshPetId,
            email: `sponsor${amount}${Date.now()}@example.com`,
            name: `Sponsor ${amount}`,
            amount: amount,
            currency: 'USD',
          },
        });

        expectedTotal += amount;

        // Verify after each sponsorship
        const checkResponse = await request.get(`${API_BASE}/api/pets/${freshPetId}`);
        const checkData = await checkResponse.json();
        expect(checkData.data.totalSponsored).toBe(expectedTotal);
      }
    });

    test('CRITICAL: totalSponsored must handle large amounts without overflow', async ({
      request,
    }) => {
      // Create a fresh pet
      const petResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Large Amount Test Pet',
          type: 'dog',
          breed: 'Husky',
          photoUrl: 'https://example.com/husky.jpg',
        },
      });

      const petData = await petResponse.json();
      const largePetId = petData.data.id;

      // Create large sponsorship
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: largePetId,
          email: `large${Date.now()}@example.com`,
          name: 'Large Donor',
          amount: 999999,
          currency: 'USD',
        },
      });

      const checkResponse = await request.get(`${API_BASE}/api/pets/${largePetId}`);
      const checkData = await checkResponse.json();
      expect(checkData.data.totalSponsored).toBe(999999);
    });
  });

  test.describe('Concurrent Sponsorship Handling', () => {
    test('should handle multiple concurrent sponsorships correctly', async ({ request }) => {
      // Create a fresh pet
      const petResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Concurrent Test Pet',
          type: 'cat',
          breed: 'Maine Coon',
          photoUrl: 'https://example.com/mainecoon.jpg',
        },
      });

      const petData = await petResponse.json();
      const concurrentPetId = petData.data.id;

      // Create multiple concurrent sponsorships
      const sponsorshipPromises = Array(5)
        .fill(null)
        .map((_, i) =>
          request.post(`${API_BASE}/api/sponsorships`, {
            headers: { 'Content-Type': 'application/json' },
            data: {
              petId: concurrentPetId,
              email: `concurrent${i}${Date.now()}@example.com`,
              name: `Concurrent Sponsor ${i}`,
              amount: 20,
              currency: 'USD',
            },
          })
        );

      const responses = await Promise.all(sponsorshipPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(201);
      });

      // Verify total is correct
      const checkResponse = await request.get(`${API_BASE}/api/pets/${concurrentPetId}`);
      const checkData = await checkResponse.json();
      expect(checkData.data.totalSponsored).toBe(100); // 5 * 20
    });
  });

  test.describe('Boundary Values and Limits', () => {
    test('should handle minimum valid amount (1)', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `min${Date.now()}@example.com`,
          name: 'Min Amount Sponsor',
          amount: 1,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.amount).toBe(1);
    });

    test('should reject zero amount', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `zero${Date.now()}@example.com`,
          name: 'Zero Amount',
          amount: 0,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should reject negative amount', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `negative${Date.now()}@example.com`,
          name: 'Negative Amount',
          amount: -50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle decimal amounts correctly', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `decimal${Date.now()}@example.com`,
          name: 'Decimal Amount Sponsor',
          amount: 25.5,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.amount).toBe(25.5);
    });

    test('should validate currency format', async ({ request }) => {
      const validCurrencies = ['USD', 'EUR', 'GBP'];

      for (const currency of validCurrencies) {
        const response = await request.post(`${API_BASE}/api/sponsorships`, {
          headers: { 'Content-Type': 'application/json' },
          data: {
            petId: testPetId,
            email: `currency${currency}${Date.now()}@example.com`,
            name: `${currency} Sponsor`,
            amount: 50,
            currency: currency,
          },
        });

        expect(response.status()).toBe(201);
      }
    });

    test('should reject invalid currency', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `invalidcurrency${Date.now()}@example.com`,
          name: 'Invalid Currency',
          amount: 50,
          currency: 'INVALID',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Data Integrity', () => {
    test('should maintain referential integrity between sponsorship and pet', async ({
      request,
    }) => {
      const sponsorEmail = `integrity${Date.now()}@example.com`;

      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: sponsorEmail,
          name: 'Integrity Test',
          amount: 50,
          currency: 'USD',
        },
      });

      const data = await response.json();
      const sponsorshipId = data.data.id;

      // Verify sponsorship appears in pet's sponsorship list
      const petSponsorshipsResponse = await request.get(
        `${API_BASE}/api/sponsorships/pet/${testPetId}`
      );
      const petSponsorshipsData = await petSponsorshipsResponse.json();

      const foundSponsorship = petSponsorshipsData.data.find(
        (s: any) => s.id === sponsorshipId
      );
      expect(foundSponsorship).toBeDefined();
      expect(foundSponsorship.petId).toBe(testPetId);
    });

    test('should maintain referential integrity between sponsorship and user', async ({
      request,
    }) => {
      const sponsorEmail = `userintegrity${Date.now()}@example.com`;

      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: sponsorEmail,
          name: 'User Integrity Test',
          amount: 75,
          currency: 'USD',
        },
      });

      const data = await response.json();
      const userId = data.data.user.id;

      // Create another sponsorship with the same email
      const response2 = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: sponsorEmail,
          name: 'User Integrity Test',
          amount: 25,
          currency: 'USD',
        },
      });

      const data2 = await response2.json();

      // Both sponsorships should reference the same user
      expect(data2.data.user.id).toBe(userId);
    });
  });

  test.describe('Input Sanitization', () => {
    test('should trim whitespace from email', async ({ request }) => {
      const email = `whitespace${Date.now()}@example.com`;

      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `  ${email}  `, // Email with whitespace
          name: 'Whitespace Test',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.user.email).toBe(email.toLowerCase()); // Should be trimmed and lowercase
    });

    test('should trim whitespace from name', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `nametrim${Date.now()}@example.com`,
          name: '  Test Name  ',
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data.user.name).toBe('Test Name'); // Should be trimmed
    });

    test('should reject empty name after trimming', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `emptyname${Date.now()}@example.com`,
          name: '   ', // Only whitespace
          amount: 50,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});
