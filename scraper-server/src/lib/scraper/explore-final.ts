/**
 * Exploración FINAL - encuentra estructura de productos
 * Usage: npx tsx src/lib/scraper/explore-final.ts
 */

import { chromium } from "playwright";

async function exploreFinal() {
  console.log("🚀 Starting final exploration...\n");

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

    // Go to a simpler category first - Pendrive (id=5)
    console.log("\n=== GOING TO PENDRIBE CATEGORY ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000); // Wait for any dynamic content
    
    console.log(`Page title: ${await page.title()}`);
    console.log(`URL: ${page.url()}`);

    // Get the page content
    const content = await page.content();
    console.log(`Page length: ${content.length}`);

    // Find all links on the page
    const links = await page.locator("a").all();
    console.log(`Total links: ${links.length}`);

    // Look for product links - typically these go to product detail pages
    console.log("\n=== ALL LINKS (sample) ===");
    for (let i = 0; i < Math.min(50, links.length); i++) {
      const href = await links[i].getAttribute("href");
      const text = (await links[i].textContent() || "").trim();
      if (href && href.length > 0 && text.length > 0 && text.length < 100) {
        console.log(`  [${i}] "${text}" -> ${href}`);
      }
    }

    // Look for any element containing price or product info
    console.log("\n=== SEARCHING FOR PRODUCT ELEMENTS ===");
    
    // Try to find any element with specific patterns
    const patterns = [
      "$", "ARS", "precio", "Precio",
      "stock", "Stock", "disponible", "Disponibilidad",
      "codigo", "Código", "sku", "SKU"
    ];

    for (const pattern of patterns) {
      const elements = await page.locator(`text=${pattern}`).all();
      if (elements.length > 0) {
        console.log(`  Pattern "${pattern}": ${elements.length} elements`);
        // Get first few
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const text = (await elements[i].textContent() || "").trim();
          const tag = await elements[i].evaluate(el => el.tagName);
          console.log(`    [${tag}]: "${text.substring(0, 100)}"`);
        }
      }
    }

    // Try to find the main product container
    console.log("\n=== MAIN CONTAINER SEARCH ===");
    
    // Get the main content div
    const mainSelectors = ["#ContentPlaceHolder1", ".container", "main", ".content"];
    for (const sel of mainSelectors) {
      const el = await page.locator(sel).first();
      if (await el.count() > 0) {
        const html = await el.innerHTML();
        console.log(`  Found ${sel}, length: ${html.length}`);
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: "/tmp/jotakp-products.png", fullPage: true });
    console.log("\nScreenshot saved to /tmp/jotakp-products.png");

    // Get all text content
    console.log("\n=== ALL TEXT CONTENT ===");
    const bodyText = await page.locator("body").textContent();
    console.log(bodyText?.substring(0, 3000));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreFinal();
