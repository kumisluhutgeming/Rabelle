import { test, expect } from '@playwright/test';

test.describe('Full Admin Journey', () => {

  test('Admin logs in, explores all main features, and adds towers', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Enter Dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // 3. Go to Interactive Map
    await page.click('a[href="/dashboard/maps"]');
    await expect(page).toHaveURL(/.*\/dashboard\/maps/);
    await page.waitForTimeout(2000);

    // 4. Apply Filter in Map
    const filterBtn = page.locator('button[title="Buka Filter Peta"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }
    await page.selectOption('select[name="jenis"]', { label: 'Seluler' });
    await page.waitForTimeout(1000);

    // 5. Toggle Signal Strength & Visual Coverage
    const mapControls = page.locator('.absolute.bottom-6.right-16 button');
    await mapControls.nth(0).click(); // Check Signal
    await page.waitForTimeout(500);
    await mapControls.nth(1).click(); // Toggle Coverage
    await page.waitForTimeout(1000);

    // 6. Switch to Table Mode
    await page.mouse.move(0, 0);
    await page.mouse.move(200, 200);
    await page.waitForTimeout(500);
    await page.click('a[href="/dashboard/data-tabel"]', { force: true });
    await expect(page).toHaveURL(/.*\/dashboard\/data-tabel/);

    // 7. Apply Filter in Table
    await page.selectOption('select[name="jenis"]', { label: 'Seluler' });
    await page.waitForTimeout(1000);

    // 8. Download CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Unduh")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    // 9. Go to Tambah Data -> Impor CSV
    // Open Tambah Data Menu if closed
    const addDataBtn = page.locator('button:has-text("Tambah Data")');
    if (await addDataBtn.isVisible()) {
      const isExpanded = await addDataBtn.locator('.lucide-chevron-down.rotate-180').isVisible();
      if (!isExpanded) {
        await addDataBtn.click();
      }
    }
    
    await page.click('a[href="/dashboard/add-tower/csv"]');
    await expect(page).toHaveURL(/.*\/dashboard\/add-tower\/csv/);

    // 10. Import CSV
    const csvContent = 'Operator,Jenis Komunikasi,Kota,Provinsi,Latitude,Longitude,Tinggi Menara (m),Frekuensi,Azimuths\nAdmin Journey Op,Televisi,Admin City,Admin Prov,-6.2146,106.8451,50,2100,"0, 120, 240"\n';
    await page.setInputFiles('input[type="file"]', {
      name: 'admin-import.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    await page.click('button:has-text("Mulai Impor")');
    await expect(page.locator('text=Sukses')).toBeVisible({ timeout: 10000 });

    // 11. Go to Tambah Data -> Input Manual
    if (await addDataBtn.isVisible()) {
      const isExpanded = await addDataBtn.locator('.lucide-chevron-down.rotate-180').isVisible();
      if (!isExpanded) {
        await addDataBtn.click();
      }
    }
    await page.click('a[href="/dashboard/add-tower/manual"]');
    await expect(page).toHaveURL(/.*\/dashboard\/add-tower\/manual/);

    // 12. Submit Manual Input
    await page.fill('input[name="Latitude"]', '-6.1111');
    await page.fill('input[name="Longitude"]', '106.1111');
    await page.fill('input[name="Provinsi"]', 'Provinsi Admin Journey');
    await page.fill('input[name="Kota"]', 'Kota Admin Journey');
    await page.fill('input[name="Operator"]', 'Admin Manual Op');
    await page.selectOption('select[name="Jenis Komunikasi"]', 'Radio Siaran');
    await page.click('button:has-text("Simpan Data")');
    
    await expect(page.locator('text=Sukses')).toBeVisible({ timeout: 10000 });
  });

});
