# Testing Guide

This document provides a comprehensive guide to the testing strategy and implementation in the HausPet project.

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Critical Test Cases](#critical-test-cases)
- [Troubleshooting](#troubleshooting)

## Overview

The HausPet project implements a three-tier testing strategy:

1. **Unit Tests** - Fast, isolated tests using mocks
2. **Integration Tests** - API endpoint tests against real services
3. **Functional Tests** - End-to-end workflow tests

This approach ensures:
- Fast feedback during development (unit tests)
- Component interaction verification (integration tests)
- Complete business process validation (functional tests)

## Testing Philosophy

### Test Pyramid

```
        /\
       /  \      Functional Tests (Few, Slow, Complete workflows)
      /----\
     /      \    Integration Tests (Some, Medium, API + DB)
    /--------\
   /          \  Unit Tests (Many, Fast, Isolated components)
  /____________\
```

### Key Principles

1. **Isolated Testing:** Each test should be independent and not rely on others
2. **Clear Naming:** Test names describe what they verify
3. **Arrange-Act-Assert:** Tests follow a clear structure
4. **Real Environments:** Integration/functional tests use real databases
5. **Critical Paths First:** Focus on business-critical scenarios

## Test Structure

```
tests/
├── unit/                           # Vitest unit tests
│   └── utils/                      # Utility function tests
│       └── example.test.ts         # Example unit test
│
├── integration/                    # Playwright integration tests
│   ├── auth.spec.ts               # Authentication endpoints
│   ├── public-routes.spec.ts      # Public API routes
│   ├── admin-routes.spec.ts       # Admin-only routes + RBAC
│   ├── sponsorship.spec.ts        # Sponsorship endpoints
│   ├── sponsorship-edge-cases.spec.ts  # Edge cases & critical scenarios
│   └── event-sourcing.spec.ts     # Event store verification
│
└── functional/                     # Playwright functional tests
    ├── breed-crud.spec.ts         # Complete breed workflows
    └── pet-crud-event-sourcing.spec.ts  # Pet CRUD + event sourcing
```

## Running Tests

### Quick Reference

```sh
# Unit Tests
make test-unit              # Run once
make test-unit-watch        # Watch mode
make test-unit-coverage     # With coverage

# Integration Tests
make test-integration       # Full cycle: start env → test → cleanup

# Functional Tests
make test-functional        # Full cycle: start env → test → cleanup

# All Tests
make test                   # Run all three types sequentially
make test-all              # Same as above
```

### npm Scripts

```sh
# Unit Tests
npm run test:unit
npm run test:unit:watch
npm run test:unit:ui
npm run test:unit:coverage

# Integration Tests
npm run test:integration

# Functional Tests
npm run test:functional

# All Tests
npm test
```

### Test Environment Management

Integration and functional tests automatically manage the test environment:

```sh
# What happens when you run make test-integration:
1. Docker Compose starts test containers (API + DB on port 5433)
2. Waits for API to be ready (health check)
3. Runs integration tests
4. Tears down test environment (cleanup)
```

Manual control (if needed):
```sh
make test-up        # Start test environment
make test-down      # Stop test environment
make test-prune     # Stop + remove volumes
```

## Test Types

### 1. Unit Tests

**Purpose:** Test individual components in isolation

**Technology:** Vitest

**Characteristics:**
- Very fast (milliseconds)
- Use mocks for dependencies
- No external services required
- Run in watch mode during development

**Example:**

```typescript
// tests/unit/repositories/breed-repository.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BreedRepository } from '../../../src/repositories/breed.repository';

describe('BreedRepository', () => {
  let repository: BreedRepository;

  beforeEach(() => {
    // Setup with mocked dependencies
    repository = new BreedRepository(mockPrisma);
  });

  it('should return all breeds', async () => {
    // Arrange
    mockPrisma.breed.findMany.mockResolvedValue(mockBreeds);

    // Act
    const result = await repository.findAll();

    // Assert
    expect(result).toEqual(mockBreeds);
    expect(mockPrisma.breed.findMany).toHaveBeenCalledTimes(1);
  });
});
```

**What to Test:**
- Pure utility functions (string manipulation, formatting)
- Business logic calculations (without external dependencies)
- Validation functions
- Algorithm implementations
- Error handling logic

**What NOT to Test:**
- Repository methods → Use integration tests
- Database operations → Use integration tests
- API endpoints → Use integration/functional tests

### 2. Integration Tests

**Purpose:** Verify API endpoints and component interactions

**Technology:** Playwright (HTTP request library)

**Characteristics:**
- Medium speed (seconds)
- Real HTTP requests
- Real database (test environment)
- Isolated test environment

**Example:**

```typescript
// tests/integration/auth.spec.ts
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test('should login successfully', async ({ request }) => {
  const response = await request.post(`${API_BASE}/api/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      email: 'admin@hauspet.com',
      password: 'Admin123',
    },
  });

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.status).toBe('OK');
  expect(data.data.tokens).toHaveProperty('accessToken');
  expect(data.data.tokens).toHaveProperty('refreshToken');
});
```

**What to Test:**
- API endpoint responses
- Request/response validation
- Authentication & authorization
- Error handling & status codes
- Database interactions
- Edge cases & boundary conditions

### 3. Functional Tests

**Purpose:** Test complete business workflows end-to-end

**Technology:** Playwright

**Characteristics:**
- Slower (tens of seconds)
- Tests complete user journeys
- Verifies event sourcing
- Real database queries

**Example:**

```typescript
// tests/functional/pet-crud-event-sourcing.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test('CRITICAL: Should create PET_CREATED event when pet is created', async ({ request }) => {
  // Create pet
  const response = await request.post(`${API_BASE}/api/admin/pet`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-session-id': sessionId,
    },
    data: {
      name: 'Test Dog',
      type: 'dog',
      breed: 'Labrador',
    },
  });

  const data = await response.json();
  const petId = data.data.id;

  // Verify event was created in event store
  const events = await prisma.domainEvent.findMany({
    where: {
      aggregateId: petId,
      eventType: 'PET_CREATED',
    },
  });

  expect(events.length).toBe(1);
  expect(events[0].eventData).toMatchObject({
    name: 'Test Dog',
    type: 'dog',
  });
});
```

**What to Test:**
- Complete CRUD workflows
- Event sourcing behavior
- State consistency
- Multiple operations in sequence
- Read model synchronization

## Writing Tests

### Best Practices

#### 1. Test Naming

Use descriptive names that explain what is being tested:

```typescript
// ❌ Bad
test('test1', async () => { ... });

// ✅ Good
test('should create sponsorship with new user', async () => { ... });
test('CRITICAL: should NOT create duplicate users', async () => { ... });
```

#### 2. Test Structure (AAA Pattern)

```typescript
test('should update pet and create event', async ({ request }) => {
  // Arrange - Set up test data
  const petId = await createTestPet();
  const updateData = { name: 'Updated Name' };

  // Act - Perform the action
  const response = await request.patch(`/api/admin/pet/${petId}`, {
    data: updateData,
  });

  // Assert - Verify the results
  expect(response.status()).toBe(200);
  const events = await getEvents(petId);
  expect(events).toContainEqual(expect.objectContaining({
    eventType: 'PET_UPDATED',
  }));
});
```

#### 3. Test Independence

Each test should be independent:

```typescript
// ✅ Good - Each test creates its own data
test.beforeEach(async ({ request }) => {
  testPetId = await createTestPet();
});

test('should update pet', async ({ request }) => {
  // Uses fresh testPetId from beforeEach
  await request.patch(`/api/admin/pet/${testPetId}`, ...);
});

test('should delete pet', async ({ request }) => {
  // Uses fresh testPetId from beforeEach
  await request.delete(`/api/admin/pet/${testPetId}`, ...);
});
```

#### 4. Meaningful Assertions

```typescript
// ❌ Weak assertion
expect(response.status()).toBeTruthy();

// ✅ Strong assertion
expect(response.status()).toBe(201);
expect(data.data).toHaveProperty('id');
expect(data.data.email).toBe('test@example.com');
expect(data.data.role).toBe('USER');
```

#### 5. Testing Error Cases

```typescript
test('should return 400 for invalid email', async ({ request }) => {
  const response = await request.post('/api/auth/signup', {
    data: {
      email: 'invalid-email',  // Invalid format
      password: 'SecurePass123!',
      name: 'Test User',
    },
  });

  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.status).toBe('ERROR');
  expect(data.message).toContain('email');
});
```

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('ComponentName', () => {
  let component: ComponentType;
  let mockDependency: MockType;

  beforeEach(() => {
    mockDependency = createMock();
    component = new ComponentType(mockDependency);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('methodName', () => {
    it('should handle normal case', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(expectedValue);

      // Act
      const result = await component.methodName(input);

      // Assert
      expect(result).toEqual(expectedValue);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });

    it('should handle error case', async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(component.methodName(input)).rejects.toThrow('Test error');
    });
  });
});
```

### Integration Test Template

```typescript
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test.describe('Feature Name', () => {
  let authTokens: { accessToken: string };
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    // Setup - Login or create test data
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'admin@hauspet.com', password: 'Admin123' },
    });
    const data = await response.json();
    authTokens = data.data.tokens;
    sessionId = data.data.sessionId;
  });

  test('should perform action successfully', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/endpoint`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.accessToken}`,
        'x-session-id': sessionId,
      },
      data: { /* test data */ },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.status).toBe('OK');
    // More assertions...
  });

  test('should reject invalid input', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/endpoint`, {
      data: { /* invalid data */ },
    });

    expect(response.status()).toBe(400);
  });
});
```

## Critical Test Cases

### 1. Duplicate User Prevention

**Why Critical:** Prevents data corruption and ensures referential integrity

```typescript
test('CRITICAL: should NOT create duplicate users', async ({ request }) => {
  const email = 'same@example.com';

  // First sponsorship
  const response1 = await request.post('/api/sponsorships', {
    data: { petId, email, name: 'User', amount: 25 },
  });
  const userId1 = (await response1.json()).data.user.id;

  // Second sponsorship with SAME email
  const response2 = await request.post('/api/sponsorships', {
    data: { petId, email, name: 'User', amount: 50 },
  });
  const userId2 = (await response2.json()).data.user.id;

  // CRITICAL: Must use the same user ID
  expect(userId1).toBe(userId2);
});
```

### 2. Event Sourcing Integrity

**Why Critical:** Ensures audit trail and state reconstruction

```typescript
test('CRITICAL: Should store PET_CREATED event', async ({ request }) => {
  // Create pet
  const response = await request.post('/api/admin/pet', {
    data: { name: 'Test Pet', type: 'dog', breed: 'Labrador' },
  });
  const petId = (await response.json()).data.id;

  // Verify event was created
  const events = await prisma.domainEvent.findMany({
    where: { aggregateId: petId, eventType: 'PET_CREATED' },
  });

  expect(events.length).toBe(1);
  expect(events[0].eventData).toMatchObject({
    name: 'Test Pet',
    type: 'dog',
  });
});
```

### 3. Role-Based Access Control

**Why Critical:** Security - prevents unauthorized access

```typescript
test('should deny regular user from admin route', async ({ request }) => {
  // Login as regular user
  const loginResponse = await request.post('/api/auth/login', {
    data: { email: 'user@example.com', password: 'UserPass123!' },
  });
  const { tokens, sessionId } = (await loginResponse.json()).data;

  // Try to access admin route
  const response = await request.post('/api/admin/pet', {
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'x-session-id': sessionId,
    },
    data: { name: 'Pet', type: 'dog', breed: 'Lab' },
  });

  expect(response.status()).toBe(403);
});
```

### 4. Concurrent Request Handling

**Why Critical:** Prevents race conditions

```typescript
test('should handle concurrent sponsorships correctly', async ({ request }) => {
  // Create 5 concurrent sponsorships
  const promises = Array(5).fill(null).map((_, i) =>
    request.post('/api/sponsorships', {
      data: {
        petId,
        email: `concurrent${i}@example.com`,
        amount: 20,
      },
    })
  );

  const responses = await Promise.all(promises);

  // All should succeed
  responses.forEach(r => expect(r.status()).toBe(201));

  // Verify total is correct
  const pet = await getPet(petId);
  expect(pet.totalSponsored).toBe(100); // 5 * 20
});
```

### 5. Data Consistency

**Why Critical:** Ensures database integrity

```typescript
test('CRITICAL: totalSponsored must increment correctly', async ({ request }) => {
  // Get initial state
  const initialPet = await getPet(petId);
  const initialTotal = initialPet.totalSponsored;

  // Create sponsorship
  await request.post('/api/sponsorships', {
    data: { petId, email: 'test@example.com', amount: 100 },
  });

  // Verify increment
  const updatedPet = await getPet(petId);
  expect(updatedPet.totalSponsored).toBe(initialTotal + 100);
});
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Problem:** Test environment fails to start because port 5433 is in use

**Solution:**
```sh
# Find process using port 5433
lsof -i :5433

# Kill the process
kill -9 <PID>

# Or use test-prune to clean up
make test-prune
```

#### 2. Tests Timeout

**Problem:** Tests hang or timeout

**Solution:**
```sh
# Check if test environment is running
docker ps | grep hauspet_test

# View container logs
docker logs hauspet_api_test

# Restart test environment
make test-down
make test-up
```

#### 3. Database Connection Errors

**Problem:** Tests fail with "database connection refused"

**Solution:**
```sh
# Check database is running
docker ps | grep hauspet_test_db

# View database logs
docker logs hauspet_test_db

# Restart test environment with fresh database
make test-prune
make test-up
```

#### 4. Stale Test Data

**Problem:** Tests fail due to existing data

**Solution:**
```sh
# Clean test database volumes
make test-prune

# Run tests (will create fresh database)
make test-integration
```

#### 5. Unit Tests Failing

**Problem:** Unit tests fail but code works

**Solution:**
- Check if mocks are properly configured
- Verify mock return values match expected types
- Clear mock state between tests with `vi.clearAllMocks()`
- Check for missing `await` on async operations

### Debug Tips

#### Enable Verbose Logging

```sh
# Vitest with verbose output
npm run test:unit -- --reporter=verbose

# Playwright with trace
npx playwright test --trace on
```

#### Run Single Test File

```sh
# Unit test
npm run test:unit tests/unit/repositories/breed-repository.test.ts

# Integration test
npx playwright test tests/integration/auth.spec.ts
```

#### Run Single Test

```sh
# Vitest
npm run test:unit -- --grep "should return all breeds"

# Playwright
npx playwright test --grep "should login successfully"
```

#### Interactive Debugging

```sh
# Vitest UI
npm run test:unit:ui

# Playwright debug mode
npx playwright test --debug
```

## Coverage Goals

- **Unit Tests:** >80% coverage for repositories and services
- **Integration Tests:** All API endpoints covered
- **Functional Tests:** All critical business workflows covered

Check coverage:
```sh
make test-unit-coverage
```

The coverage report will be generated in `coverage/` directory.

## Continuous Integration

All tests should pass before merging code:

```sh
# Run all tests
make test

# Or individually
make test-unit
make test-integration
make test-functional
```

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/write-tests)
- [Event Sourcing Testing](https://eventstore.com/blog/testing-event-sourcing-applications/)
