/**
 * Scrape FULL product details for pendrives
 * Usage: npx tsx src/lib/scraper/scrape-pendrive-full.ts
 */

import { chromium } from "playwright";

const productIds = ["19879", "20174", "21735", "21884", "21887"];

async function scrapeFullDetails() {
  console.log("🚀 Scraping FULL pendrive details...\n");

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

    // Scrape each product
    for (const productId of productIds) {
      console.log(`\n=== Product ${productId} ===`);
      
      const productUrl = `http://jotakp.dyndns.org/articulo.aspx?id=${productId}`;
      await page.goto(productUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      // Get the full page HTML for analysis
      const html = await page.content();
      
      // Look for any text containing price patterns
      const bodyText = await page.locator("body").textContent();
      
      // Find price patterns - look for $ or ARS followed by numbers
      const priceMatches = bodyText?.match(/\$[\d,.]+|ARS\s*[\d,.]+/g);
      console.log(`Prices found: ${priceMatches?.join(", ") || "none"}`);
      
      // Look for stock patterns
      const stockMatch = bodyText?.match(/stock[:\s]*(\d+)|(\d+)\s*disponible|disponible[:\s]*(\d+)/i);
      console.log(`Stock match: ${stockMatch?.[0] || "none"}`);
      
      // Look for SKU/code patterns
      const skuMatches = bodyText?.match(/cod\.?\s*:?\s*([A-Z0-9-]+)|sku[:\s]*([A-Z0-9-]+)|codigo[:\s]*([A-Z0-9-]+)/i);
      console.log(`SKU match: ${skuMatches?.[0] || "none"}`);
      
      // Look for "artículo" or "id" related text
      const idMatch = bodyText?.match(/articulo[:\s]*(\d+)|id[:\s]*(\d+)/i);
      console.log(`ID match: ${idMatch?.[0] || "none"}`);
      
      // Get any visible table data
      const tableRows = await page.locator("table tr").all();
      console.log(`Table rows: ${tableRows.length}`);
      
      // Look for specific divs/ids that might contain product info
      const importantIds = ["divArticuloDescripcion", "divArticulo", "divArticuloInformacion", "divPrecio", "divStock", "lblCodigo", "lblDescripcion"];
      
      for (const id of importantIds) {
        const el = await page.locator(`#${id}`).first();
        if (await el.count() > 0) {
          const text = (await el.textContent() || "").trim();
          if (text && text.length > 5 && text.length < 500) {
            console.log(`  #${id}: ${text.substring(0, 100)}`);
          }
        }
      }
      
      // Get first 2000 chars of page for manual inspection
      console.log(`\n  Page preview (first 500 chars of text):`);
      console.log(`  ${bodyText?.substring(0, 500)}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

scrapeFullDetails();