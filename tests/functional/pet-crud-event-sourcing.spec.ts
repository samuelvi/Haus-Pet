import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:3000';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://user:password@localhost:5433/hauspet_test_db',
});

let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;

test.describe('Pet CRUD with Event Sourcing - Functional Tests', () => {
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
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.describe('CREATE: Pet Creation with Event Sourcing', () => {
    test('CRITICAL: Should create PET_CREATED event when pet is created', async ({ request }) => {
      const petData = {
        name: 'Event Create Test Dog',
        type: 'dog',
        breed: 'Golden Retriever',
        photoUrl: 'https://example.com/golden.jpg',
      };

      // Create pet
      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: petData,
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      const petId = data.data.id;

      // Verify event was created in event store
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: petId,
          aggregateType: 'Pet',
          eventType: 'PET_CREATED',
        },
      });

      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.aggregateId).toBe(petId);
      expect(event.eventType).toBe('PET_CREATED');

      // Verify event data matches creation data
      const eventData = event.eventData as any;
      expect(eventData.name).toBe(petData.name);
      expect(eventData.type).toBe(petData.type);
      expect(eventData.breed).toBe(petData.breed);
      expect(eventData.photoUrl).toBe(petData.photoUrl);

      // Verify timestamp is recent
      const eventTime = new Date(event.timestamp).getTime();
      const now = Date.now();
      expect(now - eventTime).toBeLessThan(5000); // Within 5 seconds
    });

    test('Should initialize pet with zero totalSponsored', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Zero Total Pet',
          type: 'cat',
          breed: 'Persian',
          photoUrl: 'https://example.com/persian.jpg',
        },
      });

      const data = await response.json();
      const petId = data.data.id;

      // Verify in read model
      const petResponse = await request.get(`${API_BASE}/api/pets/${petId}`);
      const petData = await petResponse.json();

      expect(petData.data.totalSponsored).toBe(0);
    });
  });

  test.describe('UPDATE: Pet Update with Event Sourcing', () => {
    let testPetId: string;

    test.beforeEach(async ({ request }) => {
      // Create a pet for each test
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
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

    test('CRITICAL: Should create PET_UPDATED event when pet is updated', async ({ request }) => {
      const updateData = {
        name: 'Updated Pet Name',
        breed: 'Labrador',
      };

      // Update pet
      const response = await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updateData,
      });

      expect(response.status()).toBe(200);

      // Verify PET_UPDATED event was created
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          aggregateType: 'Pet',
          eventType: 'PET_UPDATED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const updateEvent = events[0];
      const eventData = updateEvent.eventData as any;
      expect(eventData.name).toBe(updateData.name);
      expect(eventData.breed).toBe(updateData.breed);
    });

    test('CRITICAL: Should maintain event history with both CREATE and UPDATE events', async ({
      request,
    }) => {
      // Update the pet
      await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'History Test Update',
        },
      });

      // Get all events for this pet
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          aggregateType: 'Pet',
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Should have at least CREATE and UPDATE events
      expect(events.length).toBeGreaterThanOrEqual(2);

      // First event should be PET_CREATED
      expect(events[0].eventType).toBe('PET_CREATED');

      // Should have at least one PET_UPDATED
      const updateEvents = events.filter(e => e.eventType === 'PET_UPDATED');
      expect(updateEvents.length).toBeGreaterThan(0);

      // Events should be in chronological order
      for (let i = 1; i < events.length; i++) {
        const prevTime = new Date(events[i - 1].timestamp).getTime();
        const currTime = new Date(events[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    test('Should update read model immediately after update', async ({ request }) => {
      const updateData = {
        name: 'Read Model Test',
        breed: 'Poodle',
      };

      // Update pet
      await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: updateData,
      });

      // Immediately read from read model
      const petResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      const petData = await petResponse.json();

      // Read model should reflect the update
      expect(petData.data.name).toBe(updateData.name);
      expect(petData.data.breed).toBe(updateData.breed);
    });

    test('Should handle partial updates correctly', async ({ request }) => {
      // Get original data
      const originalResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      const originalData = await originalResponse.json();
      const originalBreed = originalData.data.breed;

      // Update only name
      await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Partial Update Test',
        },
      });

      // Verify name changed but breed didn't
      const updatedResponse = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      const updatedData = await updatedResponse.json();

      expect(updatedData.data.name).toBe('Partial Update Test');
      expect(updatedData.data.breed).toBe(originalBreed); // Should remain unchanged
    });
  });

  test.describe('DELETE: Pet Deletion with Event Sourcing', () => {
    let testPetId: string;

    test.beforeEach(async ({ request }) => {
      // Create a pet for each test
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Delete Test Pet',
          type: 'bird',
          breed: 'Parakeet',
          photoUrl: 'https://example.com/parakeet.jpg',
        },
      });

      const createData = await createResponse.json();
      testPetId = createData.data.id;
    });

    test('CRITICAL: Should create PET_DELETED event when pet is deleted', async ({ request }) => {
      // Delete pet
      const response = await request.delete(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(200);

      // Verify PET_DELETED event was created
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          aggregateType: 'Pet',
          eventType: 'PET_DELETED',
        },
      });

      expect(events.length).toBe(1);
      expect(events[0].aggregateId).toBe(testPetId);
    });

    test('CRITICAL: Should preserve event history after deletion', async ({ request }) => {
      // Update pet before deletion
      await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Pre-Deletion Update',
        },
      });

      // Delete pet
      await request.delete(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      // Get all events for this pet
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          aggregateType: 'Pet',
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Should have CREATE, UPDATE, and DELETE events
      expect(events.length).toBeGreaterThanOrEqual(3);
      expect(events[0].eventType).toBe('PET_CREATED');
      expect(events.find(e => e.eventType === 'PET_UPDATED')).toBeDefined();
      expect(events[events.length - 1].eventType).toBe('PET_DELETED');
    });

    test('Should remove pet from read model after deletion', async ({ request }) => {
      // Delete pet
      await request.delete(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      // Try to get pet from read model
      const response = await request.get(`${API_BASE}/api/pets/${testPetId}`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('SPONSORSHIP: Pet Sponsorship with Event Sourcing', () => {
    let testPetId: string;

    test.beforeEach(async ({ request }) => {
      // Create a pet for each test
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Sponsorship Event Test Pet',
          type: 'cat',
          breed: 'Siamese',
          photoUrl: 'https://example.com/siamese.jpg',
        },
      });

      const createData = await createResponse.json();
      testPetId = createData.data.id;
    });

    test('CRITICAL: Should create PET_SPONSORED event when pet is sponsored', async ({
      request,
    }) => {
      // Create sponsorship
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `sponsor${Date.now()}@example.com`,
          name: 'Event Test Sponsor',
          amount: 100,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      // Verify PET_SPONSORED event was created
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          aggregateType: 'Pet',
          eventType: 'PET_SPONSORED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const sponsorEvent = events[events.length - 1]; // Get latest
      const eventData = sponsorEvent.eventData as any;
      expect(eventData.amount).toBe(100);
      expect(eventData.currency).toBe('USD');
    });

    test('CRITICAL: Should create SPONSORSHIP_CREATED event for the sponsorship', async ({
      request,
    }) => {
      // Create sponsorship
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `sponsorshipcreated${Date.now()}@example.com`,
          name: 'Sponsorship Create Test',
          amount: 75,
          currency: 'EUR',
        },
      });

      const data = await response.json();
      const sponsorshipId = data.data.id;

      // Verify SPONSORSHIP_CREATED event
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: sponsorshipId,
          aggregateType: 'Sponsorship',
          eventType: 'SPONSORSHIP_CREATED',
        },
      });

      expect(events.length).toBe(1);

      const event = events[0];
      const eventData = event.eventData as any;
      expect(eventData.petId).toBe(testPetId);
      expect(eventData.amount).toBe(75);
      expect(eventData.currency).toBe('EUR');
    });

    test('CRITICAL: Multiple sponsorships should create multiple events', async ({ request }) => {
      // Create first sponsorship
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `multi1${Date.now()}@example.com`,
          name: 'Multi Sponsor 1',
          amount: 50,
          currency: 'USD',
        },
      });

      // Create second sponsorship
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `multi2${Date.now()}@example.com`,
          name: 'Multi Sponsor 2',
          amount: 75,
          currency: 'USD',
        },
      });

      // Get all PET_SPONSORED events for this pet
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          aggregateType: 'Pet',
          eventType: 'PET_SPONSORED',
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      expect(events.length).toBeGreaterThanOrEqual(2);

      // Verify amounts in events
      const amounts = events.map(e => (e.eventData as any).amount);
      expect(amounts).toContain(50);
      expect(amounts).toContain(75);
    });
  });

  test.describe('Event Sourcing: State Reconstruction', () => {
    test('CRITICAL: Should be able to reconstruct pet state from events', async ({ request }) => {
      // Create pet
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Reconstruction Test Pet',
          type: 'dog',
          breed: 'Bulldog',
          photoUrl: 'https://example.com/bulldog.jpg',
        },
      });

      const createData = await createResponse.json();
      const petId = createData.data.id;

      // Perform multiple updates
      await request.patch(`${API_BASE}/api/admin/pet/${petId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: { name: 'First Update' },
      });

      await request.patch(`${API_BASE}/api/admin/pet/${petId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: { name: 'Final Update' },
      });

      // Add sponsorship
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: petId,
          email: `reconstruct${Date.now()}@example.com`,
          name: 'Reconstruct Sponsor',
          amount: 200,
          currency: 'USD',
        },
      });

      // Get all events
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: petId,
          aggregateType: 'Pet',
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Get current state from read model
      const petResponse = await request.get(`${API_BASE}/api/pets/${petId}`);
      const petData = await petResponse.json();

      // Verify event history matches current state
      expect(events.length).toBeGreaterThanOrEqual(4); // CREATE + 2 UPDATES + SPONSORED

      // Latest update event should match current name
      const updateEvents = events.filter(e => e.eventType === 'PET_UPDATED');
      const lastUpdate = updateEvents[updateEvents.length - 1];
      const lastUpdateData = lastUpdate.eventData as any;
      expect(petData.data.name).toBe(lastUpdateData.name);

      // Total sponsored should match sum of sponsorship events
      const sponsorEvents = events.filter(e => e.eventType === 'PET_SPONSORED');
      const totalFromEvents = sponsorEvents.reduce((sum, e) => sum + (e.eventData as any).amount, 0);
      expect(petData.data.totalSponsored).toBe(totalFromEvents);
    });
  });
});
