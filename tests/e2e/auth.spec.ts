import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test.describe('Login Scenarios', () => {
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

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill wrong credentials
      await page.fill('input[name="login"]', 'wronguser');
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Should still be on login page
      await expect(page).toHaveURL(/.*\/login/);
      
      // Should see error message
      await expect(page.locator('text=Maaf, akun atau password yang Anda masukkan salah.')).toBeVisible();
    });
  });

  test.describe('Registration Scenarios', () => {
    test('should register a new user successfully', async ({ page }) => {
      await page.goto('/register');

      // Generate random string to avoid duplicate user errors on repeated test runs
      const randomId = Math.floor(Math.random() * 1000000);
      const testUsername = `testuser_${randomId}`;
      const testEmail = `testuser_${randomId}@example.com`;

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="username"]', testUsername);
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');

      // Submit
      await page.click('button[type="submit"]');

      // wait for redirect
      await page.waitForURL(/.*\/login/);

      // Should see success message banner on login page
      await expect(page.locator('text=Akun berhasil dibuat! Silakan masuk dengan email Anda.')).toBeVisible();
    });

    test('should show validation error when passwords do not match', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="username"]', 'testuser_mismatch');
      await page.fill('input[name="email"]', 'mismatch@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password321');

      // Submit
      await page.click('button[type="submit"]');

      // Error message should appear
      await expect(page.locator('text=Konfirmasi password tidak cocok')).toBeVisible();
      
      // Should still be on register page
      await expect(page).toHaveURL(/.*\/register/);
    });

    test('should show error when registering with existing username', async ({ page }) => {
      await page.goto('/register');

      // Use the admin username which we know exists
      await page.fill('input[name="name"]', 'Admin Copy');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="email"]', 'admin_copy@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');

      // Submit
      await page.click('button[type="submit"]');

      // App redirects to login with an error query param if user exists, which login page converts to this text
      await page.waitForURL(/.*\/login/);
      await expect(page.locator('text=Kredensial tidak valid. Silakan coba lagi.')).toBeVisible();
    });
  });
});
