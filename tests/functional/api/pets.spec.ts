import { test, expect } from '@playwright/test';
import { Pool, PoolClient } from 'pg';
import { Pet, PetType } from '../../../src/domain/pet';

// Define a generic type for our API responses to make tests type-safe.
interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  data: T;
  message?: string;
}

// Configuration for the TEST database.
// When running inside Docker (via make test-run), use service name.
// When running from host (via GitHub Actions), use localhost with exposed port.
const pool = new Pool({
  host: process.env.DB_HOST || 'hauspet_test_db',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'hauspet_test_db',
});

// Our data fixture for the tests, typed using our domain model.
const testPets: Omit<Pet, 'id'>[] = [
  { breed: 'Test Siamese', type: PetType.Cat },
  { breed: 'Test Golden Retriever', type: PetType.Dog },
  { breed: 'Test Persian', type: PetType.Cat },
];

// This block runs before each test to set up the database.
test.beforeEach(async () => {
  const client: PoolClient = await pool.connect();
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
    const body = await response.json() as ApiResponse<Pet[]>;

    // Verify that the data matches our fixture, ignoring the generated 'id'.
    expect(body.data).toHaveLength(testPets.length);
    expect(body.data.map(p => ({ breed: p.breed, type: p.type }))).toEqual(expect.arrayContaining(testPets));
  });

  test('GET /api/pets/cat/ should return only cats', async ({ request }) => {
    // Arrange: Figure out how many cats are in our fixture.
    const expectedCats = testPets.filter(p => p.type === PetType.Cat);

    // Act: Make the API request.
    const response = await request.get('/api/pets/cat/');

    // Assert: Check the response.
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as ApiResponse<Pet[]>;

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
    const body = await response.json() as ApiResponse<{ message: string; pet: Pet }>;
    expect(body.data.pet.breed).toBe(newDog.breed);
    expect(body.data.pet.type).toBe(PetType.Dog);

    // Act & Assert: Verify that the new dog is now in the database by fetching all dogs.
    const getResponse = await request.get('/api/pets/dog/');
    const getBody = await getResponse.json() as ApiResponse<Pet[]>;
    const dogsInDb = getBody.data.map((p: Pet) => p.breed);
    expect(dogsInDb).toContain(newDog.breed);
  });
});
