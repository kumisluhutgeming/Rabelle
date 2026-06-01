import { test, expect } from '@playwright/test';

test.describe('Middleware and Security Controls', () => {
  
  test('Route Protection: Unauthenticated user should be redirected to login', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/dashboard/audit');
    
    // Check if the URL is redirected to login by NextAuth middleware
    await expect(page).toHaveURL(/.*\/login.*/);
  });

  test('Route Protection: Authenticated admin can access protected routes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should reach dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate to a protected page (Audit Log)
    await page.goto('/dashboard/audit');
    await expect(page.locator('text=Riwayat Audit Aktivitas')).toBeVisible();
  });

  test('Rate Limiting: Exceeding 50 requests per minute on /api/markers returns 429', async ({ request }) => {
    // Send 55 requests very quickly to hit the limit.
    // The middleware is set to 50 requests per minute.
    // We spoof the IP to avoid blocking other parallel tests running on 127.0.0.1.
    const requests = [];
    for (let i = 0; i < 55; i++) {
      requests.push(request.get('/api/markers?provinsi=TestLimit', {
        headers: { 'x-forwarded-for': '123.123.123.123' }
      }));
    }

    const responses = await Promise.all(requests);
    
    // Find if any response got a 429
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    // We expect at least some to be rate limited since we fired 55
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    const lastResponse = rateLimitedResponses[rateLimitedResponses.length - 1];
    const responseBody = await lastResponse.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Too many requests");
  });

});
