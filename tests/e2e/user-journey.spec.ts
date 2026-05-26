import { test, expect } from '@playwright/test';

test.describe('Full User Journey', () => {

  test('User registers, logs in, and explores all main features', async ({ page, context }) => {
    // 1. Landing Page to Registration
    await page.goto('/');
    
    // Attempt to go to Register
    await page.goto('/register');
    
    // 2. Create New Account
    const randomId = Math.floor(Math.random() * 100000);
    const testUsername = `journey_user_${randomId}`;
    const testEmail = `journey_${randomId}@example.com`;

    await page.fill('input[name="name"]', 'Journey Test User');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await page.waitForURL(/.*\/login/);
    
    // 3. Login with newly created account
    await page.fill('input[name="login"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 4. Enter Dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // 5. Go to Interactive Map
    await page.click('a[href="/dashboard/maps"]');
    await expect(page).toHaveURL(/.*\/dashboard\/maps/);

    // Give map time to load
    await page.waitForTimeout(2000);

    // 6. Apply Filter in Map
    // Click "Buka Filter Peta" if filter is collapsed
    const filterBtn = page.locator('button[title="Buka Filter Peta"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }
    await page.selectOption('select[name="jenis"]', { label: 'Seluler' });
    await page.waitForTimeout(1000);

    // 7. Toggle Signal Strength & Visual Coverage
    // Assuming MapControls are at bottom right
    const mapControls = page.locator('.absolute.bottom-6.right-16 button');
    await mapControls.nth(0).click(); // Check Signal
    await page.waitForTimeout(500);
    await mapControls.nth(1).click(); // Toggle Coverage
    await page.waitForTimeout(1000);

    // 8. Switch to Table Mode
    // Wake up UI if it went idle
    await page.mouse.move(0, 0);
    await page.mouse.move(200, 200);
    await page.waitForTimeout(500);
    await page.click('a[href="/dashboard/data-tabel"]', { force: true });
    await expect(page).toHaveURL(/.*\/dashboard\/data-tabel/);

    // 9. Apply Filter in Table
    await page.selectOption('select[name="jenis"]', { label: 'Seluler' });
    await page.waitForTimeout(1000); // Wait for data to fetch

    // 10. Download CSV
    // Expect a download to start
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Unduh")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

});
