/**
 * Scrape product attributes from detail page
 */

import { chromium } from "playwright";

async function scrapeAttributes() {
  console.log("🚀 Scraping product attributes...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log("=== LOGIN ===");
    await page.goto("http://jotakp.dyndns.org/loginext.aspx", { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("Logged in!\n");

    // Test with product 6377
    const productId = "6377";
    console.log(`=== Product ${productId} ===`);
    
    await page.goto(`http://jotakp.dyndns.org/articulo.aspx?id=${productId}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find the attributes container
    const container = await page.locator(".container-fluid.row.p-0.m-0.tg-border-top.pb-3").first();
    
    const attributes: Array<{ key: string; value: string }> = [];
    
    if (await container.count() > 0) {
      // Get all rows inside the container
      const rows = await container.locator(".row").all();
      
      for (const row of rows) {
        const cols = await row.locator(".col-6").all();
        if (cols.length === 2) {
          const key = (await cols[0].textContent() || "").trim();
          const value = (await cols[1].textContent() || "").trim();
          if (key && value) {
            attributes.push({ key, value });
          }
        }
      }
    }
    
    console.log("Attributes found:");
    console.log(JSON.stringify(attributes, null, 2));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

scrapeAttributes();