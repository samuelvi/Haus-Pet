import { defineConfig } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Look for test files in the "tests/functional" directory, relative to this configuration file.
  testDir: './tests/functional',

  // Maximum time one test can run for (30 seconds)
  timeout: 30 * 1000,

  // Expect timeout for assertions (5 seconds)
  expect: {
    timeout: 5 * 1000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Opt out of parallel tests on CI to avoid flakiness
  workers: process.env.CI ? 2 : undefined,

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI ? [['list'], ['html']] : 'html',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:3000',

    // Maximum time for each action (10 seconds)
    actionTimeout: 10 * 1000,

    // Maximum time for navigation (15 seconds)
    navigationTimeout: 15 * 1000,

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
