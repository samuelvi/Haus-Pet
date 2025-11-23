import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:3000';
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://user:password@localhost:5433/hauspet_test_db',
});

let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;
let testPetId: string;

test.describe('Event Sourcing Integration Tests', () => {
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

  test.describe('PET_CREATED Event', () => {
    test('should store PET_CREATED event when creating a pet', async ({ request }) => {
      // Create a pet
      const response = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Event Test Dog',
          type: 'dog',
          breed: 'Poodle',
          photoUrl: 'https://example.com/poodle.jpg',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      testPetId = data.data.id;

      // Query event store directly
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          eventType: 'PET_CREATED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const createdEvent = events[0];
      expect(createdEvent.aggregateType).toBe('Pet');
      expect(createdEvent.aggregateId).toBe(testPetId);
      expect(createdEvent.eventType).toBe('PET_CREATED');

      // Verify event data
      const eventData = createdEvent.eventData as any;
      expect(eventData.name).toBe('Event Test Dog');
      expect(eventData.type).toBe('dog');
      expect(eventData.breed).toBe('Poodle');
      expect(eventData.photoUrl).toBe('https://example.com/poodle.jpg');
    });
  });

  test.describe('PET_UPDATED Event', () => {
    test('should store PET_UPDATED event when updating a pet', async ({ request }) => {
      // Update the pet
      const response = await request.patch(`${API_BASE}/api/admin/pet/${testPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Updated Event Dog',
          breed: 'Golden Retriever',
        },
      });

      expect(response.status()).toBe(200);

      // Query event store
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          eventType: 'PET_UPDATED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const updatedEvent = events[0];
      expect(updatedEvent.aggregateType).toBe('Pet');
      expect(updatedEvent.eventType).toBe('PET_UPDATED');

      const eventData = updatedEvent.eventData as any;
      expect(eventData.name).toBe('Updated Event Dog');
      expect(eventData.breed).toBe('Golden Retriever');
    });
  });

  test.describe('PET_SPONSORED Event', () => {
    test('should store PET_SPONSORED event when sponsoring a pet', async ({ request }) => {
      // Create sponsorship
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `eventsource${Date.now()}@example.com`,
          name: 'Event Sponsor',
          amount: 100,
          currency: 'USD',
        },
      });

      expect(response.status()).toBe(201);

      // Query event store
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: testPetId,
          eventType: 'PET_SPONSORED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const sponsoredEvent = events[events.length - 1]; // Get latest
      expect(sponsoredEvent.aggregateType).toBe('Pet');
      expect(sponsoredEvent.eventType).toBe('PET_SPONSORED');

      const eventData = sponsoredEvent.eventData as any;
      expect(eventData.amount).toBe(100);
      expect(eventData.currency).toBe('USD');
    });
  });

  test.describe('SPONSORSHIP_CREATED Event', () => {
    test('should store SPONSORSHIP_CREATED event when creating sponsorship', async ({ request }) => {
      // Create sponsorship
      const response = await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: testPetId,
          email: `sponsorship${Date.now()}@example.com`,
          name: 'Sponsorship Test',
          amount: 50,
          currency: 'EUR',
        },
      });

      expect(response.status()).toBe(201);

      const data = await response.json();
      const sponsorshipId = data.data.id;

      // Query event store
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: sponsorshipId,
          eventType: 'SPONSORSHIP_CREATED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const createdEvent = events[0];
      expect(createdEvent.aggregateType).toBe('Sponsorship');
      expect(createdEvent.eventType).toBe('SPONSORSHIP_CREATED');

      const eventData = createdEvent.eventData as any;
      expect(eventData.petId).toBe(testPetId);
      expect(eventData.amount).toBe(50);
      expect(eventData.currency).toBe('EUR');
    });
  });

  test.describe('PET_DELETED Event', () => {
    test('should store PET_DELETED event when deleting a pet', async ({ request }) => {
      // Create a pet to delete
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Delete Test Pet',
          type: 'cat',
          breed: 'Siamese',
          photoUrl: 'https://example.com/siamese.jpg',
        },
      });

      const createData = await createResponse.json();
      const deletePetId = createData.data.id;

      // Delete the pet
      const response = await request.delete(`${API_BASE}/api/admin/pet/${deletePetId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });

      expect(response.status()).toBe(200);

      // Query event store
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: deletePetId,
          eventType: 'PET_DELETED',
        },
      });

      expect(events.length).toBeGreaterThan(0);

      const deletedEvent = events[0];
      expect(deletedEvent.aggregateType).toBe('Pet');
      expect(deletedEvent.eventType).toBe('PET_DELETED');
    });
  });

  test.describe('Event Ordering and Sequence', () => {
    test('should store events in correct chronological order', async ({ request }) => {
      // Create a pet
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Sequence Test Pet',
          type: 'bird',
          breed: 'Parakeet',
          photoUrl: 'https://example.com/parakeet.jpg',
        },
      });

      const createData = await createResponse.json();
      const sequencePetId = createData.data.id;

      // Update the pet
      await request.patch(`${API_BASE}/api/admin/pet/${sequencePetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Updated Sequence Pet',
        },
      });

      // Sponsor the pet
      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: sequencePetId,
          email: `sequence${Date.now()}@example.com`,
          name: 'Sequence Sponsor',
          amount: 75,
          currency: 'USD',
        },
      });

      // Query all events for this pet
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: sequencePetId,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      expect(events.length).toBeGreaterThanOrEqual(3);

      // Verify event sequence
      expect(events[0].eventType).toBe('PET_CREATED');
      expect(events[1].eventType).toBe('PET_UPDATED');
      expect(events[2].eventType).toBe('PET_SPONSORED');

      // Verify timestamps are in order
      for (let i = 1; i < events.length; i++) {
        const prevTime = new Date(events[i - 1].timestamp).getTime();
        const currTime = new Date(events[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  test.describe('Event Replay and Aggregate Reconstruction', () => {
    test('should be able to rebuild aggregate state from events', async ({ request }) => {
      // Create a pet
      const createResponse = await request.post(`${API_BASE}/api/admin/pet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Replay Test Pet',
          type: 'dog',
          breed: 'Beagle',
          photoUrl: 'https://example.com/beagle.jpg',
        },
      });

      const createData = await createResponse.json();
      const replayPetId = createData.data.id;

      // Perform multiple operations
      await request.patch(`${API_BASE}/api/admin/pet/${replayPetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
        data: {
          name: 'Replay Updated Pet',
        },
      });

      await request.post(`${API_BASE}/api/sponsorships`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          petId: replayPetId,
          email: `replay${Date.now()}@example.com`,
          name: 'Replay Sponsor',
          amount: 200,
          currency: 'USD',
        },
      });

      // Get all events
      const events = await prisma.domainEvent.findMany({
        where: {
          aggregateId: replayPetId,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Get current state from read model
      const petResponse = await request.get(`${API_BASE}/api/pets/${replayPetId}`);
      const petData = await petResponse.json();

      // Verify events can reconstruct the current state
      expect(events.length).toBeGreaterThanOrEqual(3);

      // Verify final state matches events
      const createEvent = events.find(e => e.eventType === 'PET_CREATED');
      const updateEvent = events.find(e => e.eventType === 'PET_UPDATED');
      const sponsorEvent = events.find(e => e.eventType === 'PET_SPONSORED');

      expect(createEvent).toBeDefined();
      expect(updateEvent).toBeDefined();
      expect(sponsorEvent).toBeDefined();

      // Final state should reflect update event
      const updateData = updateEvent!.eventData as any;
      expect(petData.data.name).toBe(updateData.name);

      // Total sponsored should reflect sponsorship
      const sponsorData = sponsorEvent!.eventData as any;
      expect(petData.data.totalSponsored).toBeGreaterThanOrEqual(sponsorData.amount);
    });
  });
});
