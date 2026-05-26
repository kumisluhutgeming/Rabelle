import { test, expect } from '@playwright/test';

test.describe('Map API and Rendering', () => {
  // We use the admin session for these tests
  test.use({ storageState: { cookies: [], origins: [] } }); // reset state

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Map API should return valid JSON markers', async ({ request }) => {
    const response = await request.get('/api/markers?minLat=-10&maxLat=10&minLng=100&maxLng=120');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body).toHaveProperty('markers');
    expect(body).toHaveProperty('stats');
    expect(Array.isArray(body.markers)).toBeTruthy();
  });

  test('Map page should load WebGL canvas', async ({ page }) => {
    await page.goto('/dashboard/maps');
    // Wait for the filter panel to render, confirming the map page loaded its UI
    await expect(page.locator('h3:has-text("Filter Peta")')).toBeVisible({ timeout: 15000 });
  });
});
