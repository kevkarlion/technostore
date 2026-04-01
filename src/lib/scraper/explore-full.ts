/**
 * Exploración completa del HTML
 * Usage: npx tsx src/lib/scraper/explore-full.ts
 */

import { chromium } from "playwright";
import * as fs from "fs";

async function exploreFull() {
  console.log("🚀 Starting full HTML exploration...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    await page.goto("http://jotakp.dyndns.org/loginext.aspx", { waitUntil: "networkidle" });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle");

    // Go to products page
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=126", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Get full HTML
    const html = await page.content();
    
    // Save to file for analysis
    fs.writeFileSync("/tmp/jotakp-products.html", html);
    console.log("HTML saved to /tmp/jotakp-products.html");

    // Analyze with cheerier approach - look for product patterns
    console.log("\n=== ANALYZING HTML STRUCTURE ===");
    
    // Find all divs with product-related classes
    const allDivs = await page.locator("div").all();
    console.log(`Total divs: ${allDivs.length}`);
    
    // Look for unique class patterns
    const uniqueClasses = new Set<string>();
    for (const div of allDivs) {
      const classAttr = await div.getAttribute("class");
      if (classAttr) {
        uniqueClasses.add(classAttr);
      }
    }
    
    console.log("\n=== UNIQUE CLASSES (sample) ===");
    const classArray = Array.from(uniqueClasses).filter(c => c && c.length > 0);
    for (const cls of classArray.slice(0, 30)) {
      console.log(`  "${cls}"`);
    }

    // Look for product-related content
    console.log("\n=== LOOKING FOR PRODUCT CONTENT ===");
    
    // Try finding elements with specific text patterns
    const pricePattern = await page.locator("span:has-text('$'), div:has-text('$')").all();
    console.log(`Elements with $ sign: ${pricePattern.length}`);
    
    // Find table-based layout (common in ASP.NET)
    const tableRows = await page.locator("tr").all();
    console.log(`Table rows: ${tableRows.length}`);
    
    // Check for tbody
    const tbody = await page.locator("tbody").all();
    console.log(`Table bodies: ${tbody.length}`);

    // Look for grid/list views
    const gridViews = await page.locator("[class*='grid'], [class*='list'], [class*='table']").all();
    console.log(`Grid/list elements: ${gridViews.length}`);

    // Get the main content area
    console.log("\n=== MAIN CONTENT AREA ===");
    const mainContent = await page.evaluate(() => {
      // Try to find the main content
      const body = document.body;
      return body ? body.innerHTML.substring(0, 30000) : "";
    });
    console.log(mainContent);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreFull();
