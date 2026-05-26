import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {


  test('should allow test admin to login', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Should see dashboard header
    await expect(page.locator('text=Ringkasan Dashboard')).toBeVisible();
  });
});
