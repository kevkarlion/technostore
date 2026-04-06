/**
 * Scrape descriptions for specific pendrive products
 * Usage: npx tsx src/lib/scraper/scrape-pendrive-descriptions.ts
 */

import { chromium } from "playwright";

const productIds = ["19879", "20174", "21735", "21884", "21887"];

async function scrapeDescriptions() {
  console.log("🚀 Scraping pendrive descriptions...\n");

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
      console.log(`=== Product ${productId} ===`);
      
      const productUrl = `http://jotakp.dyndns.org/articulo.aspx?id=${productId}`;
      await page.goto(productUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      // Get page title/name
      const titleElement = await page.locator("h1, .titulo-producto, [class*='titulo'], [class*='title']").first();
      const name = await titleElement.textContent().catch(() => "NOT FOUND");
      console.log(`Name: ${name?.trim()}`);

      // Get description from divArticuloDescripcion
      const descElement = await page.locator("#divArticuloDescripcion").first();
      let description = "";
      
      if (await descElement.count() > 0) {
        description = (await descElement.textContent() || "").trim();
      }
      
      if (description) {
        console.log(`Description (first 300 chars): ${description.substring(0, 300)}`);
        console.log(`Description length: ${description.length} chars`);
      } else {
        console.log("❌ No description found in divArticuloDescripcion");
      }

      // Also check for other description elements
      const altDescSelectors = [
        "#divArticuloDescripcion",
        "[class*='descripcion']",
        "[id*='descripcion']",
        ".product-description",
        "#product-description",
        "div[itemprop='description']"
      ];

      for (const sel of altDescSelectors) {
        const el = await page.locator(sel).first();
        if (await el.count() > 0) {
          const text = (await el.textContent() || "").trim();
          if (text && text.length > 20 && text !== description) {
            console.log(`  Alt selector "${sel}" found: ${text.substring(0, 100)}...`);
          }
        }
      }

      // Get image info
      const imgDiv = await page.locator("[id^='imgArt']").first();
      if (await imgDiv.count() > 0) {
        const imgId = await imgDiv.getAttribute("id");
        const style = await imgDiv.getAttribute("style");
        console.log(`  Image div: id="${imgId}", style="${style?.substring(0, 100)}"`);
      }

      console.log("");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

scrapeDescriptions();