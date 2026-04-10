import { chromium } from 'playwright';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugScraper() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('[Debug] Navigating to Jotakp...');
  
  await page.goto('https://jotakp.dyndns.org/loginext.aspx');
  
  const email = process.env.SUPPLIER_EMAIL;
  const password = process.env.SUPPLIER_PASSWORD;
  
  console.log('[Debug] Logging in...');
  await page.fill('#TxtEmail', email || '');
  await page.fill('#TxtPass1', password || '');
  await page.click('#BtnIngresar');
  await page.waitForTimeout(3000);

  console.log('[Debug] Navigating to subcategory 100...');
  await page.goto('https://jotakp.dyndns.org/buscar.aspx?idsubrubro1=100', { timeout: 60000 });
  await page.waitForTimeout(3000);

  // Find FIRST articulo link and get its structure
  const link = page.locator('a[href*="articulo.aspx?id="]').first();
  const exists = await link.count();
  console.log('[Debug] First articulo link exists:', exists > 0);
  
  if (exists > 0) {
    const href = await link.getAttribute('href');
    const innerHTML = await link.evaluate(el => el.innerHTML);
    const textContent = await link.textContent();
    
    console.log('\n=== LINK STRUCTURE ===');
    console.log('href:', href);
    console.log('textContent:', textContent);
    console.log('innerHTML:', innerHTML);
  }

  await browser.close();
  console.log('\n[Done]');
}

debugScraper().catch(e => { console.error(e); process.exit(1); });