/**
 * Scrape pendrive products from LIST page with FULL details
 * Usage: npx tsx src/lib/scraper/scrape-pendrive-list-full.ts
 */

import { chromium } from "playwright";

async function scrapePendriveList() {
  console.log("🚀 Scraping pendrive LIST with full details...\n");

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

    // Go to pendrive category
    console.log("=== PENDRIVE CATEGORY ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get all product links
    const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
    console.log(`Found ${productLinks.length} products\n`);

    // Parse each product - FIRST collect all data from list page
    const products: Array<{
      externalId: string;
      name: string;
      priceUSD: string;
      priceARS: string;
      href: string;
    }> = [];

    for (const link of productLinks) {
      const href = await link.getAttribute("href");
      const fullText = (await link.textContent() || "").trim();
      
      // Extract product ID from URL
      const idMatch = href?.match(/id=(\d+)/);
      const productId = idMatch?.[1] || "";
      
      // Parse the text: "NameU$D price+ IVA 21%$ priceWithIva+ IVA 21%"
      const nameMatch = fullText.match(/^(.*?)U\$D/);
      const name = nameMatch?.[1]?.trim() || "";
      
      // Get the price part after U$D
      const pricePart = fullText.replace(/^.*?U\$D/, "").trim();
      
      // Parse USD price (before "+ IVA")
      const usdMatch = pricePart.match(/^([\d.,]+)\+/);
      const usdPrice = usdMatch?.[1] || "0";
      
      // Parse ARS price (after first $, before "+ IVA")
      const arsMatch = pricePart.match(/\$([\d.,]+)\+/);
      const arsPrice = arsMatch?.[1] || "0";
      
      console.log(`  ${productId}: ${name.substring(0, 50)}... USD ${usdPrice}`);
      
      products.push({
        externalId: productId,
        name,
        priceUSD: usdPrice,
        priceARS: arsPrice,
        href: href || ""
      });
    }

    console.log("\n=== SCRAPING DETAIL PAGES ===\n");

    // Now visit each detail page to get description and image
    for (const product of products) {
      console.log(`=== Product ${product.externalId} ===`);
      
      await page.goto(`http://jotakp.dyndns.org/articulo.aspx?id=${product.externalId}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      
      // Get description
      const descElement = await page.locator("#divArticuloDescripcion").first();
      let description = "";
      if (await descElement.count() > 0) {
        description = (await descElement.textContent() || "").trim();
      }
      
      // Get image URL from the div
      const imgDiv = await page.locator("[id^='imgArt']").first();
      let imageUrl = "";
      if (await imgDiv.count() > 0) {
        try {
          const style = await imgDiv.getAttribute("style") || "";
          const imgMatch = style.match(/url\(([^)]+)\)/);
          imageUrl = imgMatch?.[1] || "";
        } catch (e) {
          console.log("  No image found (error getting style)");
        }
      }
      
      console.log(`  Name: ${product.name}`);
      console.log(`  Price USD: ${product.priceUSD}`);
      console.log(`  Description: ${description ? description.substring(0, 80) + "..." : "(empty)"}`);
      console.log(`  Image: ${imageUrl}`);
      console.log("");
    }

    // Print final results
    console.log("=== FINAL PRODUCTS ===\n");
    console.log(JSON.stringify(products, null, 2));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

scrapePendriveList();