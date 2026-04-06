/**
 * Scraping category 149 - Audio Auricular Bluetooth
 * Pag=1: 60 products, Pag=2: 10 products
 * Total: ~70 products
 * 
 * Usage: npx tsx src/lib/scraper/scrape-category-149.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { productRepository } from "@/api/repository/product.repository";

const DELAY_BETWEEN_PAGES_MS = 3000;
const DELAY_BETWEEN_PRODUCTS_MS = 2000;

const BASE_URL = "https://jotakp.dyndns.org";
const CATEGORY_ID = 149;
const CATEGORY_NAME = "Audio Auricular Bluetooth";

async function scrapeAttributes(page: any): Promise<Array<{ key: string; value: string }>> {
  const attributes: Array<{ key: string; value: string }> = [];
  
  try {
    const container = await page.locator(".container-fluid.row.p-0.m-0.tg-border-top.pb-3").first();
    
    if (await container.count() > 0) {
      const rows = await container.locator(".row").all();
      
      for (const row of rows) {
        const cols = await row.locator(".col-6").all();
        if (cols.length === 2) {
          const key = (await cols[0].textContent() || "").trim();
          const value = (await cols[1].textContent() || "").trim();
          if (key && value) {
            attributes.push({ key, value });
          }
        }
      }
    }
  } catch (e) {
    // No attributes
  }
  
  return attributes;
}

async function scrapePage(
  page: any,
  pageNum: number
): Promise<{ products: Array<{ externalId: string; name: string; priceUSD: string }>; hasNext: boolean }> {
  const url = `${BASE_URL}/buscar.aspx?idsubrubro1=${CATEGORY_ID}&pag=${pageNum}`;
  console.log(`\n  📄 Page ${pageNum}: ${url}`);
  
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check if there's a next page button
  const nextButton = page.locator("a[href*='pag=" + (pageNum + 1) + "']");
  const hasNext = await nextButton.count() > 0;
  
  // Get all product links
  const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
  
  if (productLinks.length === 0) {
    console.log(`     ⚠️ No products found`);
    return { products: [], hasNext: false };
  }

  console.log(`     Found ${productLinks.length} products`);

  const products: Array<{ externalId: string; name: string; priceUSD: string }> = [];

  for (const link of productLinks) {
    const href = await link.getAttribute("href");
    const fullText = (await link.textContent() || "").trim();
    
    const idMatch = href?.match(/id=(\d+)/);
    const productId = idMatch?.[1] || "";
    
    const nameMatch = fullText.match(/^(.*?)U\$D/);
    const name = nameMatch?.[1]?.trim() || "";
    
    const pricePart = fullText.replace(/^.*?U\$D/, "").trim();
    const usdMatch = pricePart.match(/^([\d.,]+)\+/);
    const usdPrice = usdMatch?.[1] || "0";
    
    if (productId && name) {
      products.push({ externalId: productId, name, priceUSD: usdPrice });
    }
  }

  return { products, hasNext };
}

async function scrapeProductDetails(page: any, product: { externalId: string; name: string; priceUSD: string }) {
  try {
    await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
      waitUntil: "networkidle" 
    });
    await page.waitForTimeout(DELAY_BETWEEN_PRODUCTS_MS);
    
    // Get description
    const descElement = await page.locator("#divArticuloDescripcion").first();
    let description = "";
    if (await descElement.count() > 0) {
      description = (await descElement.textContent() || "").trim();
      if (description === "Sin descripción") description = "";
    }
    
    // Get HIGH-RESOLUTION image from img tag (not the thumbnail from div)
    // The thumbnail is in: div#imgArt{Id} -> url(imagenes/min/imagen000{id}.jpg)
    // The high-res is in: img#artImg -> src="imagenes/0000{id}.JPG"
    const imgTag = await page.locator("img#artImg").first();
    let imageUrl = "";
    if (await imgTag.count() > 0) {
      try {
        const src = await imgTag.getAttribute("src") || "";
        // Convert to full URL, keeping the path as-is
        imageUrl = src ? `https://jotakp.dyndns.org/${src}` : "";
      } catch (e: any) {}
    }
    
    // Fallback to thumbnail if no high-res found
    if (!imageUrl) {
      const imgDiv = await page.locator("[id^='imgArt']").first();
      if (await imgDiv.count() > 0) {
        try {
          const style = await imgDiv.getAttribute("style") || "";
          const imgMatch = style.match(/url\(([^)]+)\)/);
          const thumbUrl = imgMatch?.[1] || "";
          imageUrl = thumbUrl ? `https://jotakp.dyndns.org/${thumbUrl}` : "";
        } catch (e: any) {}
      }
    }
    
    // Get attributes
    const attributes = await scrapeAttributes(page);
    
    return { description, imageUrl, attributes };
    
  } catch (err) {
    console.log(`     ❌ Error getting details for ${product.externalId}: ${err}`);
    return { description: "", imageUrl: "", attributes: [] };
  }
}

async function scrapeCategory() {
  console.log(`🚀 Starting scrape of category ${CATEGORY_ID} - ${CATEGORY_NAME}\n`);

  const browser = await chromium.launch({
    headless: true,
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

    let pageNum = 1;
    let totalProducts = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    while (true) {
      const { products, hasNext } = await scrapePage(page, pageNum);
      
      if (products.length === 0) {
        console.log(`     📭 No more products on page ${pageNum}`);
        break;
      }

      console.log(`     📦 Processing ${products.length} products...`);
      
      for (const product of products) {
        const details = await scrapeProductDetails(page, product);
        
        const result = await productRepository.upsertByExternalId({
          externalId: product.externalId,
          supplier: "jotakp",
          name: product.name,
          description: details.description,
          price: parseFloat(product.priceUSD.replace(",", ".")),
          currency: "USD",
          stock: 0,
          sku: product.externalId.padStart(7, "0"),
          imageUrls: [details.imageUrl],
          categories: [String(CATEGORY_ID)],
          attributes: details.attributes,
        });
        
        if (result) {
          totalSaved++;
          console.log(`     ✅ ${product.externalId} - ${product.name.substring(0, 40)}...`);
        } else {
          totalErrors++;
          console.log(`     ❌ Failed to save ${product.externalId}`);
        }
        
        totalProducts++;
      }

      if (!hasNext) {
        console.log(`     🚫 No next page button - stopping at page ${pageNum}`);
        break;
      }

      pageNum++;
      await page.waitForTimeout(DELAY_BETWEEN_PAGES_MS);
    }

    console.log(`\n\n=== 🎉 DONE ===`);
    console.log(`Total products found: ${totalProducts}`);
    console.log(`Total saved to DB: ${totalSaved}`);
    console.log(`Total errors: ${totalErrors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

scrapeCategory();