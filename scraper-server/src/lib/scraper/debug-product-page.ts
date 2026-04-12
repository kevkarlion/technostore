/**
 * Debug: Understand the product page structure for images
 * Run: npx tsx src/lib/scraper/debug-product-page.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

async function debugProductPage(externalId: string) {
  const browser = await chromium.launch({
    headless: false,  // Watch what's happening
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log("=== LOGIN ===");
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    // Go to product page
    console.log(`=== Loading product ${externalId} ===`);
    await page.goto(`${BASE_URL}/articulo.aspx?id=${externalId}`, { 
      waitUntil: "networkidle" 
    });
    await page.waitForTimeout(2000);

    // Get main image
    const mainImg = await page.locator("img#artImg").first();
    const mainSrc = await mainImg.getAttribute("src");
    console.log(`Main image src: ${mainSrc}`);
    
    // Extract image ID from main image
    const mainMatch = mainSrc?.match(/imagen(\d+)\.(\w+)/i);
    if (mainMatch) {
      console.log(`Main image ID: ${mainMatch[1]}, extension: ${mainMatch[2]}`);
    }

    // Get all background-image divs
    console.log("\n=== All background-image divs ===");
    const allDivs = await page.locator("div[style*='background-image']").all();
    console.log(`Found ${allDivs.length} divs with background-image\n`);
    
    for (let i = 0; i < Math.min(allDivs.length, 20); i++) {
      const style = await allDivs[i].getAttribute("style") || "";
      const imgMatch = style.match(/url\(([^)]+)\)/);
      const imgUrl = imgMatch?.[1] || "";
      
      if (imgUrl.includes("imagenes")) {
        // Get some context - parent elements
        const parent = await allDivs[i].locator("xpath=..").first();
        const grandparent = await parent.locator("xpath=..").first();
        const grandparentClass = await grandparent.getAttribute("class");
        const parentClass = await parent.getAttribute("class");
        
        console.log(`  ${i + 1}. ${imgUrl}`);
        console.log(`     Parent class: ${parentClass}`);
        console.log(`     Grandparent class: ${grandparentClass}`);
      }
    }

    // Check if there's a thumbnail gallery section
    console.log("\n=== Looking for specific gallery/thumbnail container ===");
    
    // Check for common gallery selectors
    const gallerySelectors = [
      "#divImgGaleria",
      "[id*='Galeria']",
      "[class*='Galeria']",
      "[class*='Thumb']",
      "#thumbs",
      ".thumbs",
    ];
    
    for (const selector of gallerySelectors) {
      const el = await page.locator(selector).first();
      if (await el.count() > 0) {
        console.log(`Found: ${selector}`);
        const divs = await el.locator("div[style*='background-image']").all();
        console.log(`  Contains ${divs.length} image divs`);
      }
    }

    // Take a screenshot for reference
    await page.screenshot({ path: `/tmp/product-${externalId}.png` });
    console.log(`\n📸 Screenshot saved to /tmp/product-${externalId}.png`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Keep browser open for inspection
    console.log("\nBrowser will close in 10 seconds...");
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Get product ID from command line or use default
const productId = process.argv[2] || "9277";
debugProductPage(productId);