/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Anstric Gaming E2E Tests
 */
export default defineConfig({
    testDir: './e2e',

    // Maximum time one test can run
    timeout: 30 * 1000,

    // Run tests in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Reporter to use
    reporter: 'html',

    // Shared settings for all tests
    use: {
        // Base URL for navigation
        baseURL: 'http://localhost:8080',

        // Take screenshot on failure
        screenshot: 'only-on-failure',

        // Record video on failure
        video: 'retain-on-failure',

        // Record trace on failure
        trace: 'on-first-retry',
    },

    // Configure projects for different browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Run your dev server before starting the tests
    // Disabled - servers already running manually
    // webServer: {
    //     command: 'npm run dev',
    //     url: 'http://localhost:5173',
    //     reuseExistingServer: !process.env.CI,
    // },
});
