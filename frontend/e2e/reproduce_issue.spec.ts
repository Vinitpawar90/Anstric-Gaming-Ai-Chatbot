import { test, expect } from '@playwright/test';

test.describe('Chatbot Issue Reproduction', () => {

    test.beforeEach(async ({ page }) => {
        // Debug requests
        page.on('request', request => console.log('>>', request.method(), request.url()));
        page.on('response', response => console.log('<<', response.status(), response.url()));
        page.on('console', msg => console.log('CONSOLE:', msg.text()));

        // Mock Authentication
        await page.addInitScript(() => {
            localStorage.setItem('token', 'fake-token');
            localStorage.setItem('user', JSON.stringify({
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'admin'
            }));
        });

        // Mock Profile API
        await page.route('**/api/v1/users/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: {
                        id: 1,
                        name: 'Test User',
                        email: 'test@example.com',
                        role: 'admin'
                    }
                })
            });
        });

        // Mock Chat Sessions API (GET)
        await page.route('**/api/v1/chat/sessions?*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'success',
                        data: []
                    })
                });
            } else {
                await route.fallback();
            }
        });

        // Mock Create Session API (POST)
        await page.route('**/api/v1/chat/sessions', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'success',
                        data: {
                            id: 123,
                            agent_id: 1,
                            user_id: 1,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            title: 'New Chat'
                        }
                    })
                });
            } else {
                await route.fallback();
            }
        });
    });

    test('reproduce bug: backend returns "message" instead of "response"', async ({ page }) => {
        // Mock Chat Message API with BUGGY response (returning 'message' property)
        await page.route('**/api/v1/chat/agents/1', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: {
                        sessionId: 123,
                        message: "This is the buggy response", // Bug: 'message' instead of 'response'
                        // response: "This is the buggy response", // Missing 'response' property
                        metadata: {}
                    }
                })
            });
        });

        await page.goto('http://localhost:8080/admin/ask');

        // Wait for page to load
        await expect(page.getByText('How can I help you today?')).toBeVisible();

        // Type a question
        const questionInput = page.getByPlaceholder('Type your question here...');
        await questionInput.fill('Hello AI');
        await page.getByRole('button').filter({ has: page.locator('svg') }).click(); // Send button

        // Expectation: The user question should appear optimistically.
        // But if the response comes back invalid (undefined content), it might cause issues.
        // Use 'Thinking...' check to ensure request is in flight
        // await expect(page.getByText('Thinking...')).toBeVisible(); 

        // After response, we expect "This is the buggy response" to be visible IF it was working.
        // Since it's buggy, it probably won't be found.
        await expect(page.getByText('This is the buggy response')).not.toBeVisible({ timeout: 5000 });

        // Also check if the user message is still visible (it should be, unless error handling removed it)
        // If response is 200 OK but structure is wrong, AskBrain might process it as success with undefined content.
        // If undefined content renders as empty string, we might see a bubble with no text?
        // Let's verify failure.
    });

    test('verify fix: backend returns "response" property', async ({ page }) => {
        // Mock Chat Message API with FIXED response (returning 'response' property)
        await page.route('**/api/v1/chat/agents/1', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: {
                        sessionId: 123,
                        response: "This is the fixed response", // Fix: 'response' property
                        metadata: {}
                    }
                })
            });
        });

        await page.goto('http://localhost:8080/admin/ask');

        // Wait for page to load
        await expect(page.getByText('How can I help you today?')).toBeVisible();

        // Type a question
        const questionInput = page.getByPlaceholder('Type your question here...');
        await questionInput.fill('Hello AI');
        await page.getByRole('button').filter({ has: page.locator('svg') }).click();

        // Expectation: The AI response should be visible
        await expect(page.getByText('This is the fixed response')).toBeVisible();
    });
});
