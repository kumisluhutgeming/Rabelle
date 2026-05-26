import { test, expect } from '@playwright/test';

test.describe('Admin Add Tower Features', () => {

  test.beforeEach(async ({ page }) => {
    // Log in as Admin first
    await page.goto('/login');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should parse and import CSV data correctly', async ({ page }) => {
    // Go to CSV import page
    await page.goto('/dashboard/add-tower/csv');
    
    // Check if page loaded correctly
    await expect(page.locator('text=Impor Data CSV')).toBeVisible();

    // Create a mock CSV file content
    const csvContent = 'Operator,Jenis Komunikasi,Kota,Provinsi,Latitude,Longitude,Tinggi Menara (m),Frekuensi,Azimuths\nTest Playwright Op,Seluler,Kota Test Playwright,Provinsi Test,-6.2146,106.8451,50,2100,"0, 120, 240"\n';
    
    // Upload the file
    await page.setInputFiles('input[type="file"]', {
      name: 'test-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Check if preview table appears indicating successful client-side parsing
    await expect(page.locator('text=Test Playwright Op')).toBeVisible();
    await expect(page.locator('text=Kota Test Playwright')).toBeVisible();

    // Click Import
    await page.click('button:has-text("Mulai Impor")');

    // Wait for success message
    await expect(page.locator('text=Sukses')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Berhasil mengimpor 1 data menara!')).toBeVisible();
  });

  test('should allow manual input of tower data', async ({ page, context }) => {
    // Go to Manual input page
    await page.goto('/dashboard/add-tower/manual');
    
    // Check if page loaded correctly
    await expect(page.locator('text=Input Data Manual')).toBeVisible();

    // Fill the form
    await page.fill('input[name="Latitude"]', '-6.1234');
    await page.fill('input[name="Longitude"]', '106.5678');
    await page.fill('input[name="Provinsi"]', 'Provinsi Manual Test');
    await page.fill('input[name="Kota"]', 'Kota Manual Test');
    
    await page.fill('input[name="Operator"]', 'Manual Operator Test');
    await page.selectOption('select[name="Jenis Komunikasi"]', 'Televisi');
    
    await page.fill('input[name="Tinggi Menara (m)"]', '45');
    await page.fill('input[name="Frekuensi"]', '800');
    await page.fill('input[name="Azimuths"]', '0, 180');

    // Submit form
    await page.click('button:has-text("Simpan Data")');

    // Wait for success message
    await expect(page.locator('text=Sukses')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Berhasil menambahkan data menara baru!')).toBeVisible();
  });

});
