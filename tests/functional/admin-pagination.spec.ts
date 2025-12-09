import { test, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:3000';
const FRONTEND_BASE = 'http://localhost';
const AUTH_CREDENTIALS = {
  email: 'admin@hauspet.com',
  password: 'Admin123',
};

let authTokens: { accessToken: string; refreshToken: string };
let sessionId: string;

/**
 * Helper: Login via API and get auth tokens
 */
async function loginAPI() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(AUTH_CREDENTIALS),
  });

  const data = await response.json();
  authTokens = data.data.tokens;
  sessionId = data.data.sessionId;
}

/**
 * Helper: Login via frontend UI
 */
async function loginUI(page: Page) {
  await page.goto(`${FRONTEND_BASE}/login`);
  await page.fill('input[type="email"]', AUTH_CREDENTIALS.email);
  await page.fill('input[type="password"]', AUTH_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL(/\/(admin|gallery)/, { timeout: 10000 });
}

test.describe('Admin Pagination Tests', () => {
  test.beforeAll(async () => {
    // Login once for API tests
    await loginAPI();
  });

  test.describe('Breeds Pagination (/admin/breeds)', () => {
    test('should paginate breeds with ADMIN_PAGE_SIZE=4', async ({ request }) => {
      // Page 1
      const response1 = await request.get(`${API_BASE}/api/breeds?page=1&limit=4`);
      expect(response1.status()).toBe(200);

      const data1 = await response1.json();
      expect(data1.status).toBe('OK');
      expect(data1.data.data.items).toHaveLength(4);
      expect(data1.data.data.pagination).toEqual({
        page: 1,
        limit: 4,
        hasNext: true,
        hasPrevious: false,
      });

      // Page 2
      const response2 = await request.get(`${API_BASE}/api/breeds?page=2&limit=4`);
      expect(response2.status()).toBe(200);

      const data2 = await response2.json();
      expect(data2.status).toBe('OK');
      expect(data2.data.data.items.length).toBeGreaterThan(0);
      expect(data2.data.data.items.length).toBeLessThanOrEqual(4);
      expect(data2.data.data.pagination.page).toBe(2);
      expect(data2.data.data.pagination.hasPrevious).toBe(true);

      // Verify items are different between pages
      const page1Ids = data1.data.data.items.map((item: any) => item.id);
      const page2Ids = data2.data.data.items.map((item: any) => item.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0); // No overlap
    });

    test('should navigate pagination in UI', async ({ page }) => {
      await loginUI(page);
      await page.goto(`${FRONTEND_BASE}/admin/breeds`);

      // Wait for breeds to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Count items on first page
      const rowsPage1 = await page.locator('table tbody tr').count();
      expect(rowsPage1).toBeLessThanOrEqual(4);

      // Check if Next button exists and pagination info
      const paginationInfo = await page.locator('text=/Page \\d+/').textContent();
      expect(paginationInfo).toContain('Page 1');

      // Click Next if available
      const nextButton = page.locator('button:has-text("Next")');
      const isNextEnabled = await nextButton.isEnabled();

      if (isNextEnabled) {
        // Get first item name on page 1
        const firstItemPage1 = await page.locator('table tbody tr:first-child td:first-child').textContent();

        await nextButton.click();

        // Wait for page change
        await page.waitForTimeout(500);
        await page.waitForSelector('table tbody tr', { timeout: 5000 });

        // Verify we're on page 2
        const paginationInfo2 = await page.locator('text=/Page \\d+/').textContent();
        expect(paginationInfo2).toContain('Page 2');

        // Verify content changed
        const firstItemPage2 = await page.locator('table tbody tr:first-child td:first-child').textContent();
        expect(firstItemPage2).not.toBe(firstItemPage1);

        // Click Previous
        const prevButton = page.locator('button:has-text("Previous")');
        await prevButton.click();

        await page.waitForTimeout(500);
        await page.waitForSelector('table tbody tr', { timeout: 5000 });

        // Verify we're back on page 1
        const paginationInfo3 = await page.locator('text=/Page \\d+/').textContent();
        expect(paginationInfo3).toContain('Page 1');
      }
    });

    test('should filter and reset pagination', async ({ page }) => {
      await loginUI(page);
      await page.goto(`${FRONTEND_BASE}/admin/breeds`);

      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Apply filter
      const dogFilter = page.locator('button:has-text("Dogs")');
      await dogFilter.click();

      await page.waitForTimeout(500);

      // Verify pagination reset to page 1
      const paginationInfo = await page.locator('text=/Page \\d+/').textContent();
      expect(paginationInfo).toContain('Page 1');
    });
  });

  test.describe('Breed Types Pagination (/admin/breed-types)', () => {
    test('should paginate breed types with ADMIN_PAGE_SIZE=4', async ({ request }) => {
      // Page 1
      const response1 = await request.get(`${API_BASE}/api/admin/breed-types?page=1&limit=4`, {
        headers: {
          'Authorization': `Bearer ${authTokens.accessToken}`,
          'x-session-id': sessionId,
        },
      });
      expect(response1.status()).toBe(200);

      const data1 = await response1.json();
      expect(data1.status).toBe('OK');
      expect(data1.data.data.items.length).toBeGreaterThan(0);
      expect(data1.data.data.items.length).toBeLessThanOrEqual(4);
      expect(data1.data.data.pagination.page).toBe(1);
      expect(data1.data.data.pagination.limit).toBe(4);

      // If there's a next page, test it
      if (data1.data.data.pagination.hasNext) {
        const response2 = await request.get(`${API_BASE}/api/admin/breed-types?page=2&limit=4`, {
          headers: {
            'Authorization': `Bearer ${authTokens.accessToken}`,
            'x-session-id': sessionId,
          },
        });
        expect(response2.status()).toBe(200);

        const data2 = await response2.json();
        expect(data2.data.data.pagination.page).toBe(2);
        expect(data2.data.data.pagination.hasPrevious).toBe(true);

        // Verify different items
        const page1Ids = data1.data.data.items.map((item: any) => item.id);
        const page2Ids = data2.data.data.items.map((item: any) => item.id);
        const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(intersection).toHaveLength(0);
      }
    });

    test('should navigate pagination in UI', async ({ page }) => {
      await loginUI(page);
      await page.goto(`${FRONTEND_BASE}/admin/breed-types`);

      // Wait for breed types to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      // Check pagination controls exist
      const hasPaginationInfo = await page.locator('text=/Page \\d+/').count();

      if (hasPaginationInfo > 0) {
        const paginationInfo = await page.locator('text=/Page \\d+/').textContent();
        expect(paginationInfo).toContain('Page');

        // Try navigating if Next is enabled
        const nextButton = page.locator('button:has-text("Next")');
        const isNextEnabled = await nextButton.isEnabled();

        if (isNextEnabled) {
          await nextButton.click();
          await page.waitForTimeout(500);

          const paginationInfo2 = await page.locator('text=/Page \\d+/').textContent();
          expect(paginationInfo2).toContain('Page 2');
        }
      }
    });
  });

  test.describe('Pets Pagination (/admin/pets)', () => {
    test('should paginate pets with ADMIN_PAGE_SIZE=4', async ({ request }) => {
      // Get pets page 1
      const response1 = await request.get(`${API_BASE}/api/pets/read-model?page=1&limit=4`);
      expect(response1.status()).toBe(200);

      const data1 = await response1.json();
      expect(data1.status).toBe('OK');

      if (data1.data.data.items && data1.data.data.items.length > 0) {
        expect(data1.data.data.items.length).toBeLessThanOrEqual(4);
        expect(data1.data.data.pagination.page).toBe(1);
        expect(data1.data.data.pagination.limit).toBe(4);

        // If there's a next page, test it
        if (data1.data.data.pagination.hasNext) {
          const response2 = await request.get(`${API_BASE}/api/pets/read-model?page=2&limit=4`);
          const data2 = await response2.json();

          expect(data2.data.data.pagination.page).toBe(2);
          expect(data2.data.data.pagination.hasPrevious).toBe(true);
        }
      }
    });

    test('should navigate pagination in UI', async ({ page }) => {
      await loginUI(page);
      await page.goto(`${FRONTEND_BASE}/admin/pets`);

      // Wait for pets to load
      await page.waitForSelector('table tbody tr, text="No pets found"', { timeout: 10000 });

      // Check if there are pets
      const noPetsMessage = await page.locator('text="No pets found"').count();

      if (noPetsMessage === 0) {
        // Pets exist, check pagination
        const hasPaginationInfo = await page.locator('text=/Page \\d+/').count();

        if (hasPaginationInfo > 0) {
          const paginationInfo = await page.locator('text=/Page \\d+/').textContent();
          expect(paginationInfo).toContain('Page');

          // Try navigating if Next is enabled
          const nextButton = page.locator('button:has-text("Next")');
          const exists = await nextButton.count();

          if (exists > 0) {
            const isNextEnabled = await nextButton.isEnabled();

            if (isNextEnabled) {
              await nextButton.click();
              await page.waitForTimeout(500);

              const paginationInfo2 = await page.locator('text=/Page \\d+/').textContent();
              expect(paginationInfo2).toContain('Page 2');
            }
          }
        }
      }
    });
  });
});
