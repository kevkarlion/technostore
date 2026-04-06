import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { chromium } from "playwright";
import { getScraperConfig } from "./src/lib/scraper/config";

async function main() {
  const config = getScraperConfig();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Login
  console.log("Logging in...");
  await page.goto(config.loginUrl, { waitUntil: "networkidle" });
  await page.fill(config.selectors.login.emailInputSelector, config.email);
  await page.fill(config.selectors.login.passwordInputSelector, config.password);
  await page.click(config.selectors.login.submitButtonSelector);
  await page.waitForLoadState("networkidle");
  
  // Branch selection
  await page.waitForTimeout(3000);
  try {
    const branchLink = page.locator("a:has-text('Cipolletti')").first();
    if (await branchLink.count() > 0) {
      await branchLink.click();
      await page.waitForLoadState("networkidle");
    }
  } catch {}
  
  // Go to page 1
  console.log("Going to page 1...");
  await page.goto(`${config.baseUrl}/buscar.aspx?idsubrubro1=149&pag=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  // Check pagination on page 1
  console.log("\n=== PAGE 1 ===");
  const nextButton1 = page.locator("a:has-text('Siguiente')").first();
  console.log(`Siguiente button count: ${await nextButton1.count()}`);
  if (await nextButton1.count() > 0) {
    const href1 = await nextButton1.getAttribute("href");
    console.log(`href: ${href1}`);
  }
  
  // Go to page 2
  console.log("\n=== PAGE 2 ===");
  await page.goto(`${config.baseUrl}/buscar.aspx?idsubrubro1=149&pag=2`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  const nextButton2 = page.locator("a:has-text('Siguiente')").first();
  console.log(`Siguiente button count: ${await nextButton2.count()}`);
  if (await nextButton2.count() > 0) {
    const href2 = await nextButton2.getAttribute("href");
    console.log(`href: ${href2}`);
  }
  
  // Count products
  const items = await page.locator("a[href*='articulo.aspx?id=']").all();
  console.log(`Products on page 2: ${items.length}`);
  
  await browser.close();
}

main().catch(console.error);
