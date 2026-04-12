/**
 * Exploración de la API del sitio
 * Usage: npx tsx src/lib/scraper/explore-api.ts
 */

import { chromium, type Browser, type Page } from "playwright";

async function exploreApi() {
  console.log("🚀 Exploring API patterns...\n");

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
    console.log("Logged in!");

    // Navigate to products page
    console.log("\n=== NAVIGATING TO PRODUCTS ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for any iframes
    const iframes = await page.frames();
    console.log(`Iframes: ${iframes.length}`);

    // Look for any JavaScript that might load products
    console.log("\n=== LOOKING FOR PRODUCT CONTAINERS ===");
    
    // Common product grid patterns
    const containerSelectors = [
      "#productos",
      "#articulos",
      "[class*='product']",
      "[class*='articulo']",
      "[id*='product']",
      "[id*='articulo']",
      ".grid",
      ".list",
      "#galeriaFiltroKey"
    ];

    for (const sel of containerSelectors) {
      const el = await page.locator(sel).first();
      if (await el.count() > 0) {
        const html = await el.innerHTML();
        const text = await el.textContent();
        console.log(`\n${sel}:`);
        console.log(`  HTML length: ${html.length}`);
        console.log(`  Text: ${text?.substring(0, 200)}`);
      }
    }

    // Try clicking on the filter dropdown
    console.log("\n=== TRYING FILTER DROPDOWN ===");
    const filterSelect = page.locator("#galeriaFiltroKey");
    if (await filterSelect.count() > 0) {
      // Click to open
      await filterSelect.click();
      await page.waitForTimeout(1000);
      
      // Get options
      const options = await filterSelect.locator("option").all();
      console.log(`Options after click: ${options.length}`);
      for (let i = 0; i < Math.min(10, options.length); i++) {
        const text = await options[i].textContent();
        const value = await options[i].getAttribute("value");
        console.log(`  [${value}]: ${text}`);
      }
    }

    // Wait more and check again
    await page.waitForTimeout(2000);
    
    // Look for any dynamically loaded content
    const body = await page.locator("body").textContent();
    console.log("\n=== BODY TEXT SAMPLE ===");
    console.log(body?.substring(0, 2000));

    // Check network requests more thoroughly
    console.log("\n=== NETWORK ANALYSIS ===");
    
    // Try different category IDs to see the pattern
    const categoryIds = [5, 12, 126, 100]; // Different categories
    
    for (const catId of categoryIds) {
      console.log(`\n--- Category ${catId} ---`);
      
      await page.goto(`http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=${catId}`, { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Count links that might be products
      const links = await page.locator("a").all();
      const productLinks = links.filter(async (link) => {
        const href = await link.getAttribute("href");
        const text = await link.textContent();
        return href && (href.includes("Articulo") || href.includes("articulo") || 
               text?.toLowerCase().includes("pendrive") ||
               text?.toLowerCase().includes("memoria"));
      });
      
      console.log(`  Total links: ${links.length}`);
      console.log(`  Potential product links: ${productLinks.length}`);
    }

    // Take final screenshot
    await page.screenshot({ path: "/tmp/jotakp-final.png", fullPage: true });
    console.log("\nScreenshot saved!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreApi();
