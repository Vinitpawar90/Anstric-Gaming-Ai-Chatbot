import { test, expect } from '@playwright/test';

test.describe('Authentication Refresh Flow', () => {

    const API_URL = 'http://localhost:8000/api/v1';

    test('should refresh token automatically on 401 response', async ({ page }) => {
        // 1. Mock Login
        await page.route(`${API_URL}/users/login`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    message: 'Login successful',
                    data: {
                        user: {
                            id: 1,
                            email: 'test@example.com',
                            name: 'Test User',
                            role: 'admin'
                        },
                        accessToken: 'initial-access-token',
                        refreshToken: 'valid-refresh-token'
                    }
                })
            });
        });

        // 2. Mock Initial Profile Get (Success)
        await page.route(`${API_URL}/users/me`, async (route) => {
            // Allow initial check to pass if it happens
            if (route.request().headers()['authorization'] === 'Bearer initial-access-token') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'success',
                        data: {
                            id: 1,
                            email: 'test@example.com',
                            name: 'Test User',
                            role: 'admin'
                        }
                    })
                });
                return;
            }
            // If no token or wrong token, let it fail or handle in next steps
            await route.continue();
        });

        // Go to login page
        await page.goto('/signin');

        // Fill login form
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password');
        await page.click('button[type="submit"]');

        // Wait for navigation
        await expect(page).toHaveURL('/admin/overview');

        // 3. Setup Mock for Token Expiry Scenario

        // Clear previous routes for specific endpoints if needed, or just override

        // Mock /users/me to fail with 401 FIRST, then succeed with NEW token

        await page.unroute(`${API_URL}/users/me`);
        await page.route(`${API_URL}/users/me`, async (route) => {
            const headers = route.request().headers();
            const authHeader = headers['authorization'];

            console.log('Mock /users/me called with header:', authHeader);

            if (authHeader === 'Bearer initial-access-token') {
                // Expired token
                console.log('Returning 401 for expired token');
                await route.fulfill({
                    status: 401,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'error',
                        message: 'Token expired'
                    })
                });
            } else if (authHeader === 'Bearer new-access-token') {
                // Refreshed token
                console.log('Returning 200 for new token');
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'success',
                        data: {
                            id: 1,
                            email: 'test@example.com',
                            name: 'Test User',
                            role: 'admin'
                        }
                    })
                });
            } else {
                console.log('Returning 401 for unknown token');
                await route.fulfill({ status: 401 });
            }
        });

        // Mock Refresh Token Endpoint
        await page.route(`${API_URL}/users/refresh`, async (route) => {
            const postData = route.request().postDataJSON();
            console.log('Mock /users/refresh called with:', postData);

            if (postData.refreshToken === 'valid-refresh-token') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Token refreshed successfully',
                        data: {
                            accessToken: 'new-access-token'
                        }
                    })
                });
            } else {
                await route.fulfill({ status: 403 });
            }
        });

        // 4. Trigger the API call
        console.log('Triggering API call via page reload');
        await page.reload();

        // 5. Assertions
        // Verify we are still logged in (URL is /admin/overview)
        await expect(page).toHaveURL('/admin/overview');

        // Verify we eventually get the profile successfully
        const profileResponse = await page.waitForResponse(resp => resp.url().includes('/users/me') && resp.status() === 200);
        expect(profileResponse.ok()).toBeTruthy();

        // Check local storage
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBe('new-access-token');
    });
});
