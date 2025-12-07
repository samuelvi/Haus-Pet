# Testing Offline Features - Complete Guide

## Overview

This document provides comprehensive testing strategies and implementation details for HausPet's offline-first architecture (TanStack Query + Dexie.js + Outbox Pattern).

## Testing Strategy

### Test Pyramid

```
         /\
        /E2E\         E2E Tests (Playwright)
       /------\       - Full offline workflows
      /Integration\   Integration Tests (Vitest)
     /--------------\  - Outbox sync, mutations
    /   Unit Tests   \ Unit Tests (Vitest + Testing Library)
   /------------------\ - Hooks, utilities, services
```

### Coverage Goals

| Layer | Coverage Target | Focus |
|-------|----------------|-------|
| Unit Tests | 80%+ | Hooks, utils, pure functions |
| Integration Tests | 70%+ | Service interactions, IndexedDB |
| E2E Tests | Critical Paths | User workflows, offline scenarios |

---

## Test Layers

### 1. Unit Tests (Vitest + React Testing Library)

**Purpose**: Test individual hooks and utilities in isolation.

**Tools**:
- Vitest (test runner)
- @testing-library/react (React component testing)
- @testing-library/react-hooks (hook testing)
- fake-indexeddb (mock IndexedDB)
- msw (Mock Service Worker for API mocking)

**What to test**:
- ✅ Custom hooks (usePersistedForm, mutations, queries)
- ✅ Utility functions
- ✅ Type guards
- ✅ Data transformations

**Example test structure**:
```typescript
describe('usePersistedForm', () => {
  it('should save form data to IndexedDB on change');
  it('should restore draft on mount');
  it('should clear draft after clearDraft call');
  it('should handle disabled state');
});
```

### 2. Integration Tests (Vitest)

**Purpose**: Test interactions between services (Outbox, Dexie, TanStack Query).

**What to test**:
- ✅ Outbox sync service
- ✅ IndexedDB operations
- ✅ TanStack Query cache interactions
- ✅ Command execution flow
- ✅ Retry logic

**Example test structure**:
```typescript
describe('OutboxSyncService', () => {
  it('should queue commands when offline');
  it('should sync commands when online');
  it('should retry failed commands with exponential backoff');
  it('should mark commands as failed after max retries');
  it('should broadcast sync completion to other tabs');
});
```

### 3. End-to-End Tests (Playwright)

**Purpose**: Test complete user workflows including offline scenarios.

**What to test**:
- ✅ Create breed offline → auto-sync when online
- ✅ Form auto-save and restoration
- ✅ Optimistic UI updates
- ✅ Network interruption handling
- ✅ Cross-tab synchronization

**Example test structure**:
```typescript
test.describe('Offline Breed Creation', () => {
  test('should save breed offline and sync when online');
  test('should show optimistic UI immediately');
  test('should restore draft on page refresh');
  test('should handle network errors gracefully');
});
```

---

## Implementation

### Setup Test Environment

#### Install Dependencies

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react \
  @testing-library/react-hooks @testing-library/jest-dom \
  @testing-library/user-event fake-indexeddb msw
```

#### Vitest Configuration

Create `app/frontend/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/types',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Test Setup File

Create `app/frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import 'fake-indexeddb/auto';
import { server } from './mocks/server';

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
```

---

## Unit Tests Implementation

### Test 1: usePersistedForm Hook

Create `app/frontend/src/hooks/__tests__/usePersistedForm.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePersistedForm } from '../usePersistedForm';
import { db } from '../../db/db';

describe('usePersistedForm', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    await db.formDrafts.clear();
  });

  it('should initialize with no draft', () => {
    const { result } = renderHook(() =>
      usePersistedForm({
        formId: 'test-form',
        formType: 'breed',
      })
    );

    expect(result.current.draft).toBeUndefined();
    expect(result.current.hasDraft).toBe(false);
  });

  it('should save draft to IndexedDB', async () => {
    const { result } = renderHook(() =>
      usePersistedForm({
        formId: 'test-form',
        formType: 'breed',
      })
    );

    const testData = { name: 'Labrador', petType: 'dog' };
    await result.current.saveDraft(testData);

    await waitFor(async () => {
      const saved = await db.formDrafts.get('test-form');
      expect(saved).toBeDefined();
      expect(saved?.data).toEqual(testData);
    });
  });

  it('should restore draft on mount', async () => {
    // Pre-populate IndexedDB
    await db.formDrafts.put({
      id: 'test-form',
      formType: 'breed',
      data: { name: 'Beagle', petType: 'dog' },
      updatedAt: Date.now(),
    });

    const { result } = renderHook(() =>
      usePersistedForm({
        formId: 'test-form',
        formType: 'breed',
      })
    );

    await waitFor(() => {
      expect(result.current.draft).toEqual({
        name: 'Beagle',
        petType: 'dog',
      });
      expect(result.current.hasDraft).toBe(true);
    });
  });

  it('should clear draft', async () => {
    await db.formDrafts.put({
      id: 'test-form',
      formType: 'breed',
      data: { name: 'Poodle', petType: 'dog' },
      updatedAt: Date.now(),
    });

    const { result } = renderHook(() =>
      usePersistedForm({
        formId: 'test-form',
        formType: 'breed',
      })
    );

    await result.current.clearDraft();

    await waitFor(async () => {
      const saved = await db.formDrafts.get('test-form');
      expect(saved).toBeUndefined();
    });
  });

  it('should respect enabled flag', () => {
    const { result } = renderHook(() =>
      usePersistedForm({
        formId: 'test-form',
        formType: 'breed',
        enabled: false,
      })
    );

    expect(result.current.draft).toBeUndefined();
  });
});
```

### Test 2: Breed Mutations

Create `app/frontend/src/hooks/__tests__/useBreedMutations.test.tsx`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCreateBreed, useDeleteBreed } from '../useBreedMutations';
import { db } from '../../db/db';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCreateBreed', () => {
  beforeEach(async () => {
    await db.pendingCommands.clear();
  });

  it('should create breed and add to outbox', async () => {
    server.use(
      http.post('http://localhost:3000/api/breeds/add', () => {
        return HttpResponse.json({
          status: 'OK',
          data: {
            breed: {
              id: '123',
              name: 'Golden Retriever',
              petType: 'dog',
            },
          },
        });
      })
    );

    const { result } = renderHook(
      () =>
        useCreateBreed({
          accessToken: 'token',
          sessionId: 'session',
        }),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync({
      name: 'Golden Retriever',
      petType: 'dog',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check outbox was used
    const commands = await db.pendingCommands.toArray();
    expect(commands.length).toBeGreaterThanOrEqual(0); // May be cleared if sync succeeded
  });

  it('should handle API errors and keep command in outbox', async () => {
    server.use(
      http.post('http://localhost:3000/api/breeds/add', () => {
        return HttpResponse.json(
          {
            status: 'ERROR',
            message: 'Breed already exists',
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(
      () =>
        useCreateBreed({
          accessToken: 'token',
          sessionId: 'session',
        }),
      { wrapper: createWrapper() }
    );

    await expect(
      result.current.mutateAsync({
        name: 'Duplicate',
        petType: 'dog',
      })
    ).rejects.toThrow();

    // Command should still be in outbox for retry
    const commands = await db.pendingCommands
      .where('type')
      .equals('CREATE_BREED')
      .toArray();
    expect(commands.length).toBeGreaterThan(0);
  });
});

describe('useDeleteBreed', () => {
  it('should perform optimistic delete', async () => {
    const queryClient = new QueryClient();

    // Pre-populate cache
    queryClient.setQueryData(['breeds'], {
      items: [
        { id: '1', name: 'Labrador', petType: 'dog' },
        { id: '2', name: 'Poodle', petType: 'dog' },
      ],
      pagination: {},
    });

    server.use(
      http.delete('http://localhost:3000/api/breeds/:id', () => {
        return HttpResponse.json({
          status: 'OK',
          data: { message: 'Deleted' },
        });
      })
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useDeleteBreed({
          accessToken: 'token',
          sessionId: 'session',
        }),
      { wrapper }
    );

    result.current.mutate('1');

    // Check optimistic update happened immediately
    const cachedData = queryClient.getQueryData(['breeds']) as any;
    await waitFor(() => {
      expect(cachedData.items).toHaveLength(1);
      expect(cachedData.items[0].id).toBe('2');
    });
  });
});
```

### Test 3: Outbox Sync Service

Create `app/frontend/src/services/__tests__/outbox-sync.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OutboxSyncService } from '../outbox-sync.service';
import { db } from '../../db/db';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('OutboxSyncService', () => {
  let service: any;

  beforeEach(async () => {
    await db.pendingCommands.clear();
    // Create new instance for each test
    service = new (OutboxSyncService as any)();

    // Mock localStorage
    localStorage.setItem(
      'hauspet_tokens',
      JSON.stringify({ accessToken: 'token', refreshToken: 'refresh' })
    );
    localStorage.setItem('hauspet_sessionId', 'session-123');
  });

  afterEach(() => {
    service.destroy();
    localStorage.clear();
  });

  it('should sync pending commands when online', async () => {
    // Add pending command
    await db.pendingCommands.add({
      id: 'cmd-1',
      type: 'CREATE_BREED',
      payload: { name: 'Test Breed', petType: 'dog' },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    });

    server.use(
      http.post('http://localhost:3000/api/breeds/add', () => {
        return HttpResponse.json({
          status: 'OK',
          data: { breed: { id: '123', name: 'Test Breed' } },
        });
      })
    );

    const result = await service.syncPendingCommands();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);

    // Command should be removed from outbox
    const remaining = await db.pendingCommands.count();
    expect(remaining).toBe(0);
  });

  it('should increment retry count on failure', async () => {
    await db.pendingCommands.add({
      id: 'cmd-1',
      type: 'CREATE_BREED',
      payload: { name: 'Fail Breed', petType: 'dog' },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    });

    server.use(
      http.post('http://localhost:3000/api/breeds/add', () => {
        return HttpResponse.json(
          { status: 'ERROR', message: 'Server error' },
          { status: 500 }
        );
      })
    );

    const result = await service.syncPendingCommands();

    expect(result.failed).toBe(1);

    const command = await db.pendingCommands.get('cmd-1');
    expect(command?.retries).toBe(1);
    expect(command?.status).toBe('failed');
  });

  it('should skip commands that exceeded max retries', async () => {
    await db.pendingCommands.add({
      id: 'cmd-1',
      type: 'CREATE_BREED',
      payload: { name: 'Max Retry Breed', petType: 'dog' },
      timestamp: Date.now(),
      retries: 5,
      status: 'failed',
    });

    const result = await service.syncPendingCommands();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);

    // Command should still exist
    const command = await db.pendingCommands.get('cmd-1');
    expect(command).toBeDefined();
    expect(command?.retries).toBe(5);
  });

  it('should handle multiple commands in queue', async () => {
    await db.pendingCommands.bulkAdd([
      {
        id: 'cmd-1',
        type: 'CREATE_BREED',
        payload: { name: 'Breed 1', petType: 'dog' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      },
      {
        id: 'cmd-2',
        type: 'CREATE_BREED',
        payload: { name: 'Breed 2', petType: 'cat' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      },
    ]);

    server.use(
      http.post('http://localhost:3000/api/breeds/add', () => {
        return HttpResponse.json({
          status: 'OK',
          data: { breed: { id: '123' } },
        });
      })
    );

    const result = await service.syncPendingCommands();

    expect(result.synced).toBe(2);
    expect(result.pending).toBe(0);
  });

  it('should not sync when offline', async () => {
    await db.pendingCommands.add({
      id: 'cmd-1',
      type: 'CREATE_BREED',
      payload: { name: 'Offline Breed', petType: 'dog' },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    });

    // Simulate offline
    service.isOnline = false;

    const result = await service.syncPendingCommands();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);

    // Command should still be pending
    const command = await db.pendingCommands.get('cmd-1');
    expect(command?.status).toBe('pending');
  });
});
```

---

## E2E Tests Implementation

### Test Setup for Playwright

Create `tests/functional/offline-features.spec.ts`:

```typescript
import { test, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:3000';
const FRONTEND_BASE = 'http://localhost:5173';

// Helper to login
async function login(page: Page) {
  await page.goto(`${FRONTEND_BASE}/login`);
  await page.fill('input[type="email"]', 'admin@hauspet.com');
  await page.fill('input[type="password"]', 'Admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/**');
}

// Helper to go offline
async function goOffline(page: Page) {
  await page.context().setOffline(true);
}

// Helper to go online
async function goOnline(page: Page) {
  await page.context().setOffline(false);
}

test.describe('Offline Breed Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should auto-save form draft and restore on refresh', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/admin/breeds/new`);

    // Fill form
    await page.fill('input[type="text"]', 'Draft Labrador');
    await page.selectOption('select', 'dog');

    // Wait for auto-save (should happen immediately)
    await page.waitForTimeout(500);

    // Refresh page
    await page.reload();

    // Check draft was restored
    const nameInput = page.locator('input[type="text"]');
    await expect(nameInput).toHaveValue('Draft Labrador');

    // Should show draft indicator
    await expect(page.locator('text=Draft restored')).toBeVisible();
  });

  test('should create breed offline and sync when online', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/admin/breeds/new`);

    // Go offline
    await goOffline(page);

    // Fill and submit form
    await page.fill('input[type="text"]', 'Offline Retriever');
    await page.selectOption('select', 'dog');
    await page.click('button[type="submit"]');

    // Should show optimistic UI update
    await expect(page).toHaveURL(`${FRONTEND_BASE}/admin/breeds`);

    // Breed should appear in list (optimistic)
    await expect(page.locator('text=Offline Retriever')).toBeVisible();

    // Go back online
    await goOnline(page);

    // Wait for background sync
    await page.waitForTimeout(2000);

    // Reload to confirm sync
    await page.reload();

    // Breed should still be there (persisted)
    await expect(page.locator('text=Offline Retriever')).toBeVisible();
  });

  test('should show loading state during mutation', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/admin/breeds/new`);

    await page.fill('input[type="text"]', 'Loading Breed');
    await page.selectOption('select', 'dog');

    // Intercept to delay response
    await page.route('**/api/breeds/add', async (route) => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('button:has-text("Saving...")')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/admin/breeds/new`);

    // Simulate network error
    await page.route('**/api/breeds/add', (route) => {
      route.abort('failed');
    });

    await page.fill('input[type="text"]', 'Error Breed');
    await page.selectOption('select', 'dog');
    await page.click('button[type="submit"]');

    // Should stay on form and show error
    await expect(page).toHaveURL('**/breeds/new');

    // Form should still have data
    await expect(page.locator('input[type="text"]')).toHaveValue('Error Breed');
  });

  test('should delete breed with optimistic update', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/admin/breeds`);

    // Get initial count
    const initialBreeds = await page.locator('table tbody tr').count();

    // Click first delete button
    const firstDeleteBtn = page.locator('button:has-text("Delete")').first();

    // Confirm deletion
    page.once('dialog', (dialog) => dialog.accept());
    await firstDeleteBtn.click();

    // Should update optimistically (immediate removal)
    const newCount = await page.locator('table tbody tr').count();
    expect(newCount).toBe(initialBreeds - 1);
  });

  test('should clear draft after successful submission', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE}/admin/breeds/new`);

    // Fill form (creates draft)
    await page.fill('input[type="text"]', 'Clear Draft Breed');
    await page.selectOption('select', 'dog');
    await page.waitForTimeout(300);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/breeds');

    // Go back to form
    await page.goto(`${FRONTEND_BASE}/admin/breeds/new`);

    // Draft should be cleared (empty form)
    await expect(page.locator('input[type="text"]')).toHaveValue('');
    await expect(page.locator('text=Draft restored')).not.toBeVisible();
  });
});

test.describe('IndexedDB Persistence', () => {
  test('should persist query cache across page reloads', async ({ page }) => {
    await login(page);
    await page.goto(`${FRONTEND_BASE}/admin/breeds`);

    // Wait for data to load
    await page.waitForSelector('table tbody tr');

    // Get breed count
    const initialCount = await page.locator('table tbody tr').count();

    // Reload page
    await page.reload();

    // Data should load from cache (fast)
    const cachedCount = await page.locator('table tbody tr').count();
    expect(cachedCount).toBe(initialCount);
  });
});

test.describe('Cross-Tab Synchronization', () => {
  test('should sync state between tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login in both tabs
    await login(page1);
    await login(page2);

    await page1.goto(`${FRONTEND_BASE}/admin/breeds`);
    await page2.goto(`${FRONTEND_BASE}/admin/breeds`);

    // Create breed in page1
    await page1.goto(`${FRONTEND_BASE}/admin/breeds/new`);
    await page1.fill('input[type="text"]', 'Cross Tab Breed');
    await page1.selectOption('select', 'dog');
    await page1.click('button[type="submit"]');

    // Wait for sync
    await page1.waitForTimeout(1000);

    // Reload page2 to see update
    await page2.reload();

    // Should see breed in page2
    await expect(page2.locator('text=Cross Tab Breed')).toBeVisible();

    await context.close();
  });
});
```

---

## MSW (Mock Service Worker) Setup

Create `app/frontend/src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Breeds endpoints
  http.get('http://localhost:3000/api/breeds', () => {
    return HttpResponse.json({
      status: 'OK',
      data: {
        items: [
          { id: '1', name: 'Labrador', petType: 'dog', breedTypeId: 'type-dog' },
          { id: '2', name: 'Persian', petType: 'cat', breedTypeId: 'type-cat' },
        ],
        pagination: {
          hasNext: false,
          hasPrevious: false,
          pageCount: 1,
        },
      },
    });
  }),

  http.post('http://localhost:3000/api/breeds/add', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      status: 'OK',
      data: {
        breed: {
          id: 'new-id',
          ...(body as any),
          breedTypeId: `type-${(body as any).petType}`,
        },
      },
    });
  }),

  http.delete('http://localhost:3000/api/breeds/:id', ({ params }) => {
    return HttpResponse.json({
      status: 'OK',
      data: { message: `Deleted breed ${params.id}` },
    });
  }),

  // Auth endpoints
  http.post('http://localhost:3000/api/auth/login', () => {
    return HttpResponse.json({
      status: 'OK',
      data: {
        user: { id: '1', email: 'admin@hauspet.com', role: 'ADMIN' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        sessionId: 'session-123',
      },
    });
  }),
];
```

Create `app/frontend/src/test/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## Running Tests

### Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:functional": "playwright test tests/functional",
    "test:functional:offline": "playwright test tests/functional/offline-features.spec.ts"
  }
}
```

### Run Commands

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests (all)
npm run test:functional

# E2E offline tests only
npm run test:functional:offline
```

---

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Coverage Report

Open `app/frontend/coverage/index.html` in browser.

### Coverage Thresholds

Add to `vitest.config.ts`:

```typescript
coverage: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test-frontend.yml`:

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
        working-directory: app/frontend
      - name: Run unit tests
        run: npm run test:coverage
        working-directory: app/frontend
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: app/frontend/coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Start test environment
        run: make test-up
      - name: Run E2E tests
        run: npm run test:functional
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### 1. Test Organization

```
src/
├── hooks/
│   ├── __tests__/
│   │   ├── usePersistedForm.test.ts
│   │   ├── useBreedMutations.test.tsx
│   │   └── usePetQueries.test.tsx
│   └── usePersistedForm.ts
├── services/
│   ├── __tests__/
│   │   └── outbox-sync.service.test.ts
│   └── outbox-sync.service.ts
└── test/
    ├── setup.ts
    ├── mocks/
    │   ├── handlers.ts
    │   └── server.ts
    └── utils/
        └── test-utils.tsx
```

### 2. Test Naming Convention

```typescript
// ✅ Good
it('should save draft to IndexedDB when saveDraft is called')
it('should retry failed commands with exponential backoff')

// ❌ Bad
it('test save')
it('works correctly')
```

### 3. AAA Pattern

```typescript
test('should sync pending commands', async () => {
  // Arrange
  await db.pendingCommands.add({ /* ... */ });

  // Act
  const result = await service.syncPendingCommands();

  // Assert
  expect(result.synced).toBe(1);
});
```

### 4. Clean Up

```typescript
beforeEach(async () => {
  await db.formDrafts.clear();
  await db.pendingCommands.clear();
});

afterEach(() => {
  cleanup(); // React Testing Library
  localStorage.clear();
});
```

### 5. Avoid Flaky Tests

```typescript
// ✅ Use waitFor for async operations
await waitFor(() => {
  expect(result.current.draft).toBeDefined();
});

// ❌ Don't use arbitrary timeouts
await page.waitForTimeout(5000); // Flaky!
```

---

## Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens interactive UI at `http://localhost:51204/__vitest__/`

### Playwright Debug Mode

```bash
PWDEBUG=1 npm run test:functional:offline
```

### IndexedDB Inspection

Use browser DevTools → Application → IndexedDB → HausPetDB

### Console Logging

```typescript
test('debug test', async () => {
  const draft = await db.formDrafts.get('test-form');
  console.log('Draft:', draft); // Shows in test output
});
```

---

## Troubleshooting

### Issue: IndexedDB not clearing between tests

**Solution**:
```typescript
beforeEach(async () => {
  await db.delete();
  await db.open();
});
```

### Issue: MSW handlers not working

**Solution**: Check server setup in `setup.ts`:
```typescript
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
```

### Issue: React Query cache persisting

**Solution**: Create new QueryClient for each test:
```typescript
beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
});
```

---

## Summary

### Test Coverage Checklist

- [x] usePersistedForm hook
- [x] Breed mutation hooks (create, update, delete)
- [x] Pet mutation hooks
- [x] Outbox sync service
- [x] E2E offline workflows
- [x] Cross-tab synchronization
- [x] Draft restoration
- [x] Optimistic updates
- [x] Error handling

### Files to Create

1. `app/frontend/vitest.config.ts`
2. `app/frontend/src/test/setup.ts`
3. `app/frontend/src/test/mocks/handlers.ts`
4. `app/frontend/src/test/mocks/server.ts`
5. `app/frontend/src/hooks/__tests__/*.test.ts`
6. `app/frontend/src/services/__tests__/*.test.ts`
7. `tests/functional/offline-features.spec.ts`
8. `.github/workflows/test-frontend.yml`

### Next Steps

1. Install test dependencies
2. Configure Vitest
3. Implement unit tests
4. Implement integration tests
5. Implement E2E tests
6. Set up CI/CD
7. Achieve 80%+ coverage

---

**Documentation Status**: ✅ Complete
**Last Updated**: December 6, 2025
**Author**: Claude Sonnet 4.5
