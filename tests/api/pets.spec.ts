import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

// Configuration for the TEST database.
const pool = new Pool({
  host: 'localhost',
  port: 5433, // IMPORTANT: This is the port mapped in docker-compose.test.yaml
  user: 'user',
  password: 'password',
  database: 'hauspet_test_db',
});

// Our data fixture for the tests.
const testPets = [
  { breed: 'Test Siamese', type: 'cat' },
  { breed: 'Test Golden Retriever', type: 'dog' },
  { breed: 'Test Persian', type: 'cat' },
];

// This block runs before each test to set up the database.
test.beforeEach(async () => {
  const client = await pool.connect();
  try {
    // 1. Clean the table to ensure a fresh start.
    await client.query('TRUNCATE TABLE pet RESTART IDENTITY');

    // 2. Insert our test data (fixtures).
    for (const pet of testPets) {
      await client.query('INSERT INTO pet (breed, type) VALUES ($1, $2)', [pet.breed, pet.type]);
    }
  } finally {
    client.release();
  }
});

// This block runs after all tests to clean up the connection pool.
test.afterAll(async () => {
  await pool.end();
});

test.describe('Pet API Endpoints', () => {
  test('GET /api/pets/ should return all pets from the fixture', async ({ request }) => {
    // Act: Make the API request.
    const response = await request.get('/api/pets/');

    // Assert: Check the response.
    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Verify that the data matches our fixture, ignoring the generated 'id'.
    expect(body.data).toHaveLength(testPets.length);
    expect(body.data.map(p => ({ breed: p.breed, type: p.type }))).toEqual(expect.arrayContaining(testPets));
  });

  test('GET /api/pets/cat/ should return only cats', async ({ request }) => {
    // Arrange: Figure out how many cats are in our fixture.
    const expectedCats = testPets.filter(p => p.type === 'cat');

    // Act: Make the API request.
    const response = await request.get('/api/pets/cat/');

    // Assert: Check the response.
    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Verify that we only got the cats.
    expect(body.data).toHaveLength(expectedCats.length);
    expect(body.data[0].breed).toBe('Test Siamese');
    expect(body.data[1].breed).toBe('Test Persian');
  });

  test('POST /api/pets/dog/add should add a new dog', async ({ request }) => {
    // Arrange: Define the new dog to add.
    const newDog = { breed: 'Test Beagle' };

    // Act: Make the API request to add the new dog.
    const response = await request.post('/api/pets/dog/add', {
      data: newDog,
    });

    // Assert: Check the response from the POST request.
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.pet.breed).toBe(newDog.breed);
    expect(body.data.pet.type).toBe('dog');

    // Act & Assert: Verify that the new dog is now in the database by fetching all dogs.
    const getResponse = await request.get('/api/pets/dog/');
    const getBody = await getResponse.json();
    const dogsInDb = getBody.data.map(p => p.breed);
    expect(dogsInDb).toContain(newDog.breed);
  });
});
