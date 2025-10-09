import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Look for test files in the "tests/functional" directory, relative to this configuration file.
  testDir: './tests/functional',

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: 'html',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
  },

  // We only need one project for API testing.
  projects: [
    {
      name: 'api',
    },
  ],
});
