import { test, expect } from '@playwright/test';

test.describe('Breed Filtering and Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost/login');
    await page.fill('input[type="email"]', 'admin@hauspet.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to home page
    await page.waitForURL('http://localhost/', { timeout: 10000 });

    // Navigate to breeds admin page
    await page.goto('http://localhost/admin/breeds');
    await page.waitForLoadState('networkidle');
  });

  test('should display all breed types as filter buttons', async ({ page }) => {
    // Wait for breed types to load
    await page.waitForSelector('text=All', { timeout: 5000 });

    // Verify common breed type buttons exist
    const allButton = page.locator('button:has-text("All")');
    await expect(allButton).toBeVisible();

    const dogButton = page.locator('button:has-text("Dog")');
    await expect(dogButton).toBeVisible();

    const catButton = page.locator('button:has-text("Cat")');
    await expect(catButton).toBeVisible();

    const birdButton = page.locator('button:has-text("Bird")');
    await expect(birdButton).toBeVisible();

    // Check for additional types that were seeded
    const fishButton = page.locator('button:has-text("Fish")');
    await expect(fishButton).toBeVisible();

    const rabbitButton = page.locator('button:has-text("Rabbit")');
    await expect(rabbitButton).toBeVisible();
  });

  test('should filter breeds by dog type', async ({ page }) => {
    // Click on Dog filter
    await page.click('button:has-text("Dog")');

    // Wait for URL to update
    await page.waitForURL(/petType=dog/, { timeout: 5000 });

    // Verify URL contains filter parameter
    expect(page.url()).toContain('petType=dog');
    expect(page.url()).toContain('page=1');

    // Wait for breeds to load
    await page.waitForLoadState('networkidle');

    // Check that only dog breeds are displayed
    const breedRows = page.locator('tbody tr');
    const count = await breedRows.count();

    // Should have at least 1 breed
    expect(count).toBeGreaterThan(0);

    // Verify all visible breeds are dogs
    for (let i = 0; i < count; i++) {
      const typeCell = breedRows.nth(i).locator('td').nth(1);
      const typeText = await typeCell.textContent();
      expect(typeText?.toLowerCase()).toBe('dog');
    }
  });

  test('should filter breeds by cat type', async ({ page }) => {
    // Click on Cat filter
    await page.click('button:has-text("Cat")');

    // Wait for URL to update
    await page.waitForURL(/petType=cat/, { timeout: 5000 });

    // Verify URL contains filter parameter
    expect(page.url()).toContain('petType=cat');

    // Wait for breeds to load
    await page.waitForLoadState('networkidle');

    // Check that only cat breeds are displayed
    const breedRows = page.locator('tbody tr');
    const count = await breedRows.count();

    expect(count).toBeGreaterThan(0);

    // Verify all visible breeds are cats
    for (let i = 0; i < count; i++) {
      const typeCell = breedRows.nth(i).locator('td').nth(1);
      const typeText = await typeCell.textContent();
      expect(typeText?.toLowerCase()).toBe('cat');
    }
  });

  test('should maintain filter when paginating', async ({ page }) => {
    // Filter by dog
    await page.click('button:has-text("Dog")');
    await page.waitForURL(/petType=dog/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Check if Next button exists and is enabled
    const nextButton = page.locator('button:has-text("Next")');
    const isNextDisabled = await nextButton.isDisabled();

    if (!isNextDisabled) {
      // Click Next page
      await nextButton.click();

      // Wait for URL to update
      await page.waitForURL(/page=2/, { timeout: 5000 });

      // Verify URL still contains filter AND page
      expect(page.url()).toContain('petType=dog');
      expect(page.url()).toContain('page=2');

      // Wait for breeds to load
      await page.waitForLoadState('networkidle');

      // Verify all breeds on page 2 are still dogs
      const breedRows = page.locator('tbody tr');
      const count = await breedRows.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const typeCell = breedRows.nth(i).locator('td').nth(1);
          const typeText = await typeCell.textContent();
          expect(typeText?.toLowerCase()).toBe('dog');
        }
      }
    }
  });

  test('should reset to page 1 when changing filter', async ({ page }) => {
    // Filter by dog
    await page.click('button:has-text("Dog")');
    await page.waitForURL(/petType=dog/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Check if Next button exists and is enabled
    const nextButton = page.locator('button:has-text("Next")');
    const isNextDisabled = await nextButton.isDisabled();

    if (!isNextDisabled) {
      // Go to page 2
      await nextButton.click();
      await page.waitForURL(/page=2/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');

      // Now change filter to cat
      await page.click('button:has-text("Cat")');
      await page.waitForURL(/petType=cat/, { timeout: 5000 });

      // Should be back on page 1
      expect(page.url()).toContain('page=1');
      expect(page.url()).toContain('petType=cat');
      expect(page.url()).not.toContain('page=2');
    }
  });

  test('should search breeds by name', async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search breeds"]');
    await searchInput.fill('beagle');

    // Click search button
    await page.click('button:has-text("Search")');

    // Wait for URL to update
    await page.waitForURL(/search=beagle/, { timeout: 5000 });

    // Verify URL contains search parameter
    expect(page.url()).toContain('search=beagle');
    expect(page.url()).toContain('page=1');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Should have at least one result
    const breedRows = page.locator('tbody tr');
    const count = await breedRows.count();
    expect(count).toBeGreaterThan(0);

    // First result should contain "beagle" (case insensitive)
    const firstBreedName = await breedRows.first().locator('td').first().textContent();
    expect(firstBreedName?.toLowerCase()).toContain('beagle');
  });

  test('should combine search and type filter', async ({ page }) => {
    // Filter by dog
    await page.click('button:has-text("Dog")');
    await page.waitForURL(/petType=dog/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Search for beagle
    const searchInput = page.locator('input[placeholder*="Search breeds"]');
    await searchInput.fill('beagle');
    await page.click('button:has-text("Search")');

    // Wait for URL to update with both filters
    await page.waitForURL(/petType=dog.*search=beagle|search=beagle.*petType=dog/, { timeout: 5000 });

    // Verify URL contains both parameters
    expect(page.url()).toContain('petType=dog');
    expect(page.url()).toContain('search=beagle');
    expect(page.url()).toContain('page=1');

    // Wait for results
    await page.waitForLoadState('networkidle');
  });

  test('should maintain filters when using browser back button', async ({ page }) => {
    // Filter by dog
    await page.click('button:has-text("Dog")');
    await page.waitForURL(/petType=dog/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Verify we're on page 1 with dog filter
    expect(page.url()).toContain('petType=dog');
    expect(page.url()).toContain('page=1');

    // Check if Next button exists and is enabled
    const nextButton = page.locator('button:has-text("Next")');
    const isNextDisabled = await nextButton.isDisabled();

    if (!isNextDisabled) {
      // Go to page 2
      await nextButton.click();
      await page.waitForURL(/page=2/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should be back on page 1 with dog filter
      expect(page.url()).toContain('petType=dog');
      expect(page.url()).toContain('page=1');

      // Verify dog filter button is still active
      const dogButton = page.locator('button:has-text("Dog")');
      // Check if button has active styling (you may need to adjust this based on your CSS classes)
      await expect(dogButton).toBeVisible();
    }
  });

  test('should clear search when clicking clear button', async ({ page }) => {
    // Search for something
    const searchInput = page.locator('input[placeholder*="Search breeds"]');
    await searchInput.fill('beagle');
    await page.click('button:has-text("Search")');

    // Wait for URL to update
    await page.waitForURL(/search=beagle/, { timeout: 5000 });

    // Click clear button
    await page.click('button:has-text("Clear")');

    // Wait for URL to update (search param should be removed)
    await page.waitForTimeout(500);

    // Verify search is cleared
    expect(page.url()).not.toContain('search=');

    // Verify input is empty
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('');
  });

  test('should show correct pagination info', async ({ page }) => {
    // Check pagination info is displayed
    const paginationInfo = page.locator('text=/Page \\d+/');
    await expect(paginationInfo).toBeVisible();

    // Should show "Page 1"
    const infoText = await paginationInfo.textContent();
    expect(infoText).toContain('Page 1');
  });

  test('should disable Previous button on first page', async ({ page }) => {
    // Previous button should be disabled on page 1
    const previousButton = page.locator('button:has-text("Previous")');
    await expect(previousButton).toBeDisabled();
  });

  test('should show all breeds when clicking All filter after applying a filter', async ({ page }) => {
    // Filter by dog
    await page.click('button:has-text("Dog")');
    await page.waitForURL(/petType=dog/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Get count of dog breeds
    const dogBreedRows = page.locator('tbody tr');
    const dogCount = await dogBreedRows.count();

    // Click All filter
    await page.click('button:has-text("All")');
    await page.waitForLoadState('networkidle');

    // URL should not have petType parameter
    expect(page.url()).not.toContain('petType=');

    // Should show more breeds than just dogs
    const allBreedRows = page.locator('tbody tr');
    const allCount = await allBreedRows.count();

    // All breeds count should be >= dog breeds count
    expect(allCount).toBeGreaterThanOrEqual(dogCount);
  });
});
