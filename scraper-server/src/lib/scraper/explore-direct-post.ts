/**
 * Intentar cargar productos con postback
 * Usage: npx tsx src/lib/scraper/explore-direct-post.ts
 */

import { chromium } from "playwright";

async function exploreDirectPost() {
  console.log("🚀 Exploring with direct POST...\n");

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

    // Try going to different categories to find one with products
    const categories = [1, 5, 12, 126, 100, 60, 56]; // Various category IDs
    
    for (const catId of categories) {
      console.log(`\n=== TRYING CATEGORY ${catId} ===`);
      
      await page.goto(`http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=${catId}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Get page text to see if there's any product info
      const text = await page.locator("body").textContent();
      const hasProducts = text?.toLowerCase().includes("pendrive") || 
                         text?.toLowerCase().includes("memoria") ||
                         text?.toLowerCase().includes("articulo") ||
                         text?.toLowerCase().includes("$");
      
      console.log(`  Has product indicators: ${hasProducts}`);
      
      // Get links that look like products
      const links = await page.locator("a").all();
      const productLinks = links.filter(async (link) => {
        const href = await link.getAttribute("href");
        const text = await link.textContent();
        return href && href.length > 20 && !href.includes("aspx?");
      });
      
      console.log(`  Potential product links: ${productLinks.length}`);
      
      // Get the URL we're on
      console.log(`  URL: ${page.url()}`);
    }

    // Let's try the main page and look for any product listings
    console.log("\n=== CHECKING MAIN PAGE ===");
    await page.goto("http://jotakp.dyndns.org/index.aspx", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const mainText = await page.locator("body").textContent();
    console.log(`Main page text sample: ${mainText?.substring(0, 1000)}`);

    // Try to find any links with specific patterns
    const allLinks = await page.locator("a").all();
    console.log(`\nTotal links on main page: ${allLinks.length}`);
    
    // Look for special links
    for (const link of allLinks.slice(0, 30)) {
      const href = await link.getAttribute("href");
      const text = await link.textContent();
      if (href && (href.includes("Articulo") || href.includes("articulo") || 
          href.includes("producto") || href.includes("Producto"))) {
        console.log(`  Product link: "${text}" -> ${href}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: "/tmp/jotakp-direct-post.png", fullPage: true });
    console.log("\nScreenshot saved!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreDirectPost();
