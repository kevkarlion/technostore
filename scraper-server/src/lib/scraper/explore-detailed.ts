/**
 * Script de exploración detallada de productos
 * Usage: npx tsx src/lib/scraper/explore-detailed.ts
 */

import { chromium } from "playwright";

async function exploreDetailed() {
  console.log("🚀 Starting detailed product exploration...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log("=== LOGIN ===");
    await page.goto("http://jotakp.dyndns.org/loginext.aspx", { waitUntil: "networkidle" });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle");
    console.log(`Logged in!`);

    // Go to products page
    console.log("\n=== PRODUCTS PAGE ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=126", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Find all elements with 'item' in class
    console.log("\n=== ITEM ELEMENTS (detailed) ===");
    const itemElements = await page.locator("[class*='item']").all();
    console.log(`Found ${itemElements.length} elements with 'item' in class`);

    // Get first few items and analyze their structure
    for (let i = 0; i < Math.min(5, itemElements.length); i++) {
      const item = itemElements[i];
      const classAttr = await item.getAttribute("class");
      const id = await item.getAttribute("id");
      
      console.log(`\n--- Item ${i + 1} ---`);
      console.log(`  class: ${classAttr}`);
      console.log(`  id: ${id}`);
      
      // Find all child elements
      const children = await item.locator("*").all();
      console.log(`  Children: ${children.length}`);
      
      // Look for text content
      const text = (await item.textContent() || "").trim().substring(0, 200);
      console.log(`  Text preview: "${text}"`);
      
      // Look for links
      const links = await item.locator("a").all();
      console.log(`  Links in item: ${links.length}`);
      for (const link of links) {
        const href = await link.getAttribute("href");
        const linkText = (await link.textContent() || "").trim();
        if (href || linkText) {
          console.log(`    Link: "${linkText}" -> ${href}`);
        }
      }
      
      // Look for images
      const images = await item.locator("img").all();
      console.log(`  Images in item: ${images.length}`);
      for (const img of images) {
        const src = await img.getAttribute("src");
        const alt = await img.getAttribute("alt");
        console.log(`    Image: src="${src}" alt="${alt}"`);
      }
      
      // Look for price-like elements
      const priceElements = await item.locator("[class*='price'], [class*='precio'], span").all();
      for (const span of priceElements.slice(0, 3)) {
        const spanText = (await span.textContent() || "").trim();
        const spanClass = await span.getAttribute("class");
        if (spanText && spanText.length < 50) {
          console.log(`    Span [${spanClass}]: "${spanText}"`);
        }
      }
    }

    // Look for more specific selectors
    console.log("\n=== LOOKING FOR SPECIFIC SELECTORS ===");
    
    // Common product card patterns
    const patterns = [
      ".product-item",
      ".producto-item", 
      ".item-producto",
      ".tg-shop-box",
      ".tg-feature-box",
      ".box-product",
      "[class*='producto']",
      "[class*='articulo']"
    ];

    for (const pattern of patterns) {
      const elements = await page.locator(pattern).all();
      if (elements.length > 0) {
        console.log(`  "${pattern}": ${elements.length} elements`);
        
        // Get inner HTML of first element
        const firstEl = elements[0];
        const html = await firstEl.innerHTML();
        console.log(`    First element HTML (first 500 chars):`);
        console.log(`    ${html.substring(0, 500)}`);
      }
    }

    // Get entire body for manual inspection
    console.log("\n=== FULL BODY HTML ===");
    const bodyHtml = await page.content();
    // Save to file for inspection
    console.log("Body length:", bodyHtml.length);

    console.log("\n✅ Exploration complete!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreDetailed();
