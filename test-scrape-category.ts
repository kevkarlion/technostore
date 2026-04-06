/**
 * Quick test: scrape one category and save to DB
 * Usage: npx tsx test-scrape-category.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { chromium } from "playwright";
import { getScraperConfig } from "./src/lib/scraper/config";
import { transformProducts } from "./src/lib/scraper/data-transformer";
import { downloadProductImages } from "./src/lib/scraper/image-downloader";
import { productRepository } from "./src/api/repository/product.repository";

const CATEGORY_ID = 100; // Carry-Caddy Disk
const DELAY = 2000;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = getScraperConfig();
  console.log("[Test] Starting scrape for category", CATEGORY_ID);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // Login
    console.log("[Test] Logging in...");
    await page.goto(config.loginUrl, { waitUntil: "networkidle" });
    await page.fill("#TxtEmail", config.email);
    await page.fill("#TxtPass1", config.password);
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle");
    await delay(DELAY);

    // Try branch selection
    try {
      const branch = page.locator("#ContentPlaceHolder1_ddlSucursal, #ddlSucursal").first();
      if (await branch.count() > 0) {
        await branch.selectOption({ index: 1 });
        await page.waitForLoadState("networkidle");
      }
    } catch {}

    // Navigate to category
    console.log("[Test] Navigating to category...");
    await page.goto(`${config.baseUrl}/buscar.aspx?idsubrubro1=${CATEGORY_ID}`, {
      waitUntil: "networkidle",
    });
    await delay(DELAY);

    // Get products
    const items = await page.locator("a[href*='articulo.aspx?id=']").all();
    console.log(`[Test] Found ${items.length} product links`);

    const products: any[] = [];

    for (const item of items) {
      try {
        const fullText = await item.textContent();
        const href = await item.getAttribute("href");
        if (!fullText || !href) continue;

        const idMatch = href.match(/id=(\d+)/);
        const externalId = idMatch ? idMatch[1] : href;
        const priceMatch = fullText.match(/U\$D\s+([\d.,]+)/);
        const name = fullText.replace(/U\$D[\s\d.,+IVA%]+$/, "").trim();

        if (!name || name.length < 3) continue;

        products.push({
          externalId,
          name,
          priceRaw: priceMatch ? priceMatch[1] : "0",
          productUrl: href,
          categories: ["Carry-Caddy Disk"],
        });
      } catch {}
    }

    console.log(`[Test] Parsed ${products.length} products`);

    if (products.length === 0) {
      console.log("[Test] No products found");
      return;
    }

    // Get details for each product (images + stock)
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        await page.goto(`${config.baseUrl}/${product.productUrl}`, {
          waitUntil: "networkidle",
          timeout: 10000,
        });
        await delay(1500);

        // Extract images
        const content = await page.content();
        const imageMatches = content.match(/imagenes\/[min\/]*(imagen\d+|0+\d+)\.[a-zA-Z]{3,4}/gi);
        if (imageMatches) {
          const unique = [...new Set(imageMatches)];
          product.imageUrls = unique.map((img: string) => img.replace("min/", ""));
        }

        // Extract stock
        const stockText = await page
          .locator("#ContentPlaceHolder1_lblStock, #lblStock")
          .first()
          .textContent()
          .catch(() => null);
        if (stockText) {
          if (stockText.toLowerCase().includes("sin stock") || stockText.toLowerCase().includes("consultar")) {
            product.stockRaw = "0";
          } else {
            const match = stockText.match(/(\d+)/);
            if (match) product.stockRaw = match[1];
          }
        }

        console.log(`[${i + 1}/${products.length}] ${product.name.substring(0, 30)}...`);
      } catch (e) {
        console.error(`Error getting detail for ${product.externalId}:`, e);
      }
      await delay(1500);
    }

    // Transform
    console.log("[Test] Transforming...");
    const { products: transformed, errors } = transformProducts(products, config.supplier);
    console.log(`[Test] Transformed: ${transformed.length} products, ${errors.length} errors`);

    // Download images
    console.log("[Test] Downloading images...");
    for (const product of transformed) {
      if (product.imageUrls && product.imageUrls.length > 0) {
        const localUrls = await downloadProductImages(product.imageUrls, product.supplier, product.externalId);
        if (localUrls.length > 0) {
          product.imageUrls = localUrls;
        }
        await delay(500);
      }
    }

    // Save to DB
    console.log("[Test] Saving to DB...");
    let saved = 0;
    for (const product of transformed) {
      try {
        await productRepository.upsertByExternalId(product);
        saved++;
      } catch (e) {
        console.error(`Error saving ${product.externalId}:`, e);
      }
    }

    console.log(`[Test] DONE! ${saved} products saved`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);