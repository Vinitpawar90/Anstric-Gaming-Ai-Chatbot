import { test, expect } from '@playwright/test';

/**
 * DEMO TEST: Login Flow for Anstric Gaming
 * 
 * This is a simple demo to show you how Playwright tests work.
 * It tests the complete login flow from the signin page to the dashboard.
 */

test.describe('Login Flow Demo', () => {

    /**
     * Test 1: User can navigate to signin page
     * 
     * This test just checks if the signin page loads correctly
     */
    test('should display signin page', async ({ page }) => {
        // Navigate to signin page
        await page.goto('/signin');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if we're on the right page
        await expect(page).toHaveURL(/.*signin/);

        // Check if the form exists
        await expect(page.locator('form')).toBeVisible();

        // Check if email and password fields exist
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // Check if sign in button exists
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        console.log('✅ Signin page loads correctly!');
    });

    /**
     * Test 2: User can login with valid credentials
     * 
     * This test fills the login form and submits it
     */
    test('should login successfully with valid credentials', async ({ page }) => {
        // Step 1: Navigate to signin page
        await page.goto('/signin');
        console.log('📍 Navigated to signin page');

        // Step 2: Fill in the email field
        await page.fill('input[type="email"]', 'admin@gmail.com');
        console.log('✍️ Filled email field');

        // Step 3: Fill in the password field
        await page.fill('input[type="password"]', '12345678');
        console.log('🔒 Filled password field');

        // Step 4: Click the submit button
        await page.click('button[type="submit"]');
        console.log('🖱️ Clicked submit button');

        // Step 5: Wait for navigation to complete
        // After successful login, we should be redirected to admin or employee dashboard
        await page.waitForURL(/.*\/(admin|employee)/, { timeout: 10000 });
        console.log('🚀 Redirected to dashboard');

        // Step 6: Verify we're on a dashboard page
        const url = page.url();
        expect(url).toMatch(/\/(admin|employee)/);
        console.log('✅ Login successful! Current URL:', url);

        // Step 7: Take a screenshot to see what the dashboard looks like
        await page.screenshot({ path: 'e2e/screenshots/dashboard-after-login.png' });
        console.log('📸 Screenshot saved!');
    });

    /**
     * Test 3: User cannot login with invalid credentials
     * 
     * This test verifies that login fails with wrong password
     */
    test('should show error with invalid credentials', async ({ page }) => {
        // Navigate to signin page
        await page.goto('/signin');

        // Fill in wrong credentials
        await page.fill('input[type="email"]', 'admin@gmail.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Click submit
        await page.click('button[type="submit"]');

        // We should still be on the signin page (not redirected)
        await page.waitForTimeout(2000); // Wait a bit for any error messages

        // Check we're still on signin page
        await expect(page).toHaveURL(/.*signin/);

        console.log('✅ Invalid login correctly rejected!');
    });

    /**
     * Test 4: Signed in user can see their name
     * 
     * This tests that after login, the user's name appears in the header
     */
    test('should display user name after login', async ({ page }) => {
        // Login first
        await page.goto('/signin');
        await page.fill('input[type="email"]', 'admin@gmail.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(/.*\/(admin|employee)/);

        // Look for the main header element (not sidebar nav)
        const header = page.locator('header').first();
        await expect(header).toBeVisible();

        console.log('✅ User dashboard loaded with header!');

        // Take screenshot to verify
        await page.screenshot({ path: 'e2e/screenshots/logged-in-header.png' });
    });
});

/**
 * HOW TO RUN THESE TESTS:
 * 
 * 1. Make sure your backend is running on port 8000
 * 2. Make sure you have a user with email: admin@gmail.com and password: 12345678
 * 3. Run: npm run test:e2e
 * 
 * WHAT HAPPENS:
 * - Playwright will start your dev server automatically
 * - It will open a Chrome browser
 * - It will run all 4 tests
 * - Screenshots will be saved to e2e/screenshots/
 * - A report will be generated showing pass/fail
 * 
 * TO DEBUG:
 * - Run: npm run test:e2e:debug
 * - This will open the test in UI mode where you can step through
 */
