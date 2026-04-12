/**
 * Explore product characteristics/attributes
 * Usage: npx tsx src/lib/scraper/explore-product-attributes.ts
 */

import { chromium } from "playwright";

async function exploreAttributes() {
  console.log("🚀 Exploring product attributes...\n");

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

    // Go to product 6377
    console.log("=== Product 6377 ===");
    await page.goto("http://jotakp.dyndns.org/articulo.aspx?id=6377", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for the specific container
    const container = await page.locator(".container-fluid.row.p-0.m-0.tg-border-top.pb-3").first();
    if (await container.count() > 0) {
      console.log("✅ Found container with class");
      const html = await container.innerHTML();
      console.log("\nContainer HTML:");
      console.log(html.substring(0, 3000));
    } else {
      console.log("❌ Container not found");
    }

    // Also try to find any table or attributes
    console.log("\n=== LOOKING FOR TABLES ===");
    const tables = await page.locator("table").all();
    console.log(`Found ${tables.length} tables`);
    
    for (const table of tables) {
      const html = await table.innerHTML();
      console.log(`\nTable HTML (first 500 chars):`);
      console.log(html.substring(0, 500));
    }

    // Look for divs with specific patterns
    console.log("\n=== LOOKING FOR SPECIFIC DIVS ===");
    const divsWithAttrs = await page.locator("[class*='tg-border']").all();
    console.log(`Found ${divsWithAttrs.length} divs with 'tg-border'`);
    
    for (const div of divsWithAttrs.slice(0, 3)) {
      const classAttr = await div.getAttribute("class");
      const html = await div.innerHTML();
      console.log(`\nDiv class: ${classAttr}`);
      console.log(`HTML: ${html.substring(0, 1000)}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreAttributes();