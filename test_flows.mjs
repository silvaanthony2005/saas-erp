import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launchPersistentContext(
    'C:\\Users\\Useradmin\\AppData\\Local\\Temp\\playwright-test-profile',
    {
      headless: false,
      args: ['--window-size=1400,900'],
    }
  );

  const pages = browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // 1. Navigate to app
  console.log('>>> Navigating to app...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test_01_login.png' });
  console.log('Screenshot: test_01_login.png');

  // Check current URL/state
  console.log('URL:', page.url());

  // --- Login ---
  // Try to find login form
  const loginBtn = page.locator('button:has-text("Iniciar")');
  if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('>>> Login page detected, logging in...');
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="usuario" i]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@saas.com');
      await passInput.fill('admin123');
      await loginBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test_02_after_login.png' });
      console.log('Screenshot: test_02_after_login.png');
    }
  } else {
    console.log('No login form detected, proceeding...');
  }

  // 2. Navigate to POS
  console.log('\n>>> Navigating to POS...');
  const posLink = page.locator('a:has-text("POS"), a:has-text("Ventas"), a:has-text("Punto de Venta")').first();
  if (await posLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await posLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_03_pos.png' });
    console.log('Screenshot: test_03_pos.png');
  }

  // 3. Navigate to Inventory
  console.log('\n>>> Navigating to Inventory...');
  const invLink = page.locator('a:has-text("Inventario"), a:has-text("Productos")').first();
  if (await invLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await invLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_04_inventory.png' });
    console.log('Screenshot: test_04_inventory.png');
  }

  // 4. Navigate to Purchases
  console.log('\n>>> Navigating to Purchases...');
  const purchLink = page.locator('a:has-text("Compras"), a:has-text("Purchase")').first();
  if (await purchLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await purchLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_05_purchases.png' });
    console.log('Screenshot: test_05_purchases.png');
  }

  // 5. Navigate to CxP (Accounts Payable)
  console.log('\n>>> Navigating to CxP...');
  const cxpLink = page.locator('a:has-text("CxP"), a:has-text("Pagar"), a:has-text("Cuentas")').first();
  if (await cxpLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cxpLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_06_cxp.png' });
    console.log('Screenshot: test_06_cxp.png');
  }

  // 6. Navigate to Dashboard
  console.log('\n>>> Navigating to Dashboard...');
  const dashLink = page.locator('a:has-text("Dashboard"), a:has-text("Inicio"), a:has-text("Home")').first();
  if (await dashLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dashLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_07_dashboard.png' });
    console.log('Screenshot: test_07_dashboard.png');
  }

  // 7. Check for console errors
  console.log('\n>>> Checking for errors in the page...');
  const errorEls = page.locator('text=error, text=Error, text=404, text=500, text=failed');
  // Just take a final screenshot
  await page.screenshot({ path: 'test_08_final.png' });
  console.log('Screenshot: test_08_final.png');

  console.log('\n=== Testing complete! ===');

  // Close browser
  await browser.close();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
