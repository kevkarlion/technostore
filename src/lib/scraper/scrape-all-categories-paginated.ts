/**
 * Complete scraper for all categories with pagination
 * Scrapes all products from all categories, handling pagination
 * 
 * Usage: npx tsx src/lib/scraper/scrape-all-categories-paginated.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { productRepository } from "@/api/repository/product.repository";
import { jotakpCategories } from "./config";

const DELAY_BETWEEN_PAGES_MS = 3000;
const DELAY_BETWEEN_PRODUCTS_MS = 1500;
const DELAY_BETWEEN_CATEGORIES_MS = 4000;

const BASE_URL = "https://jotakp.dyndns.org";

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
  categoryId: number,
  pageNum: number
): Promise<{ products: Array<{ externalId: string; name: string; priceUSD: string }>; hasNext: boolean }> {
  const url = `${BASE_URL}/buscar.aspx?idsubrubro1=${categoryId}&pag=${pageNum}`;
  
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check if there's a next page button
  const nextButton = page.locator(`a[href*="pag=${pageNum + 1}"]`);
  const hasNext = await nextButton.count() > 0;
  
  // Get all product links
  const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
  
  if (productLinks.length === 0) {
    return { products: [], hasNext: false };
  }

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
    
    // Get HIGH-RESOLUTION image from img#artImg
    const imgTag = await page.locator("img#artImg").first();
    let imageUrl = "";
    
    if (await imgTag.count() > 0) {
      const src = await imgTag.getAttribute("src") || "";
      imageUrl = src ? `https://jotakp.dyndns.org/${src}` : "";
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
    // console.log(`     ❌ Error getting details for ${product.externalId}: ${err}`);
    return { description: "", imageUrl: "", attributes: [] };
  }
}

async function scrapeSubcategory(
  page: any, 
  subcategory: { id: string; name: string; idsubrubro1: number }
): Promise<{ success: number; errors: number; pages: number }> {
  let success = 0;
  let errors = 0;
  let pages = 0;
  
  try {
    let pageNum = 1;

    while (true) {
      const { products, hasNext } = await scrapePage(page, subcategory.idsubrubro1, pageNum);
      
      if (products.length === 0) {
        break;
      }

      pages++;

      // Process each product
      for (const product of products) {
        const details = await scrapeProductDetails(page, product);
        
        await productRepository.upsertByExternalId({
          externalId: product.externalId,
          supplier: "jotakp",
          name: product.name,
          description: details.description,
          price: parseFloat(product.priceUSD.replace(",", ".")),
          currency: "USD",
          stock: 0,
          sku: product.externalId.padStart(7, "0"),
          imageUrls: [details.imageUrl],
          categories: [subcategory.id],
          attributes: details.attributes,
        });
        
        success++;
      }

      if (!hasNext) {
        break;
      }

      pageNum++;
      await page.waitForTimeout(DELAY_BETWEEN_PAGES_MS);
    }

  } catch (err) {
    errors++;
  }

  return { success, errors, pages };
}

async function scrapeAllCategories() {
  console.log("🚀 Starting COMPLETE scraper with pagination\n");

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

    // Get all subcategories (skip parents with idsubrubro1=0)
    const allSubcategories = jotakpCategories.filter(c => c.idsubrubro1 !== 0 && c.parentId !== null);
    
    console.log(`   Total subcategories to scrape: ${allSubcategories.length}\n`);

    // Group by parent for progress reporting
    const categoriesByParent: Record<string, typeof allSubcategories> = {};
    
    for (const subcat of allSubcategories) {
      const parentId = subcat.parentId!;
      if (!categoriesByParent[parentId]) {
        categoriesByParent[parentId] = [];
      }
      categoriesByParent[parentId].push(subcat);
    }

    let totalProducts = 0;
    let totalErrors = 0;
    let totalPages = 0;
    let categoriesProcessed = 0;

    // Process each parent category
    const parentIds = Object.keys(categoriesByParent);
    
    for (const parentId of parentIds) {
      const subcategories = categoriesByParent[parentId];
      console.log(`\n=== ${parentId.toUpperCase()} (${subcategories.length} subcategories) ===`);
      
      for (const subcat of subcategories) {
        console.log(`  📦 ${subcat.name} (id=${subcat.idsubrubro1})`);
        
        const result = await scrapeSubcategory(page, subcat);
        
        totalProducts += result.success;
        totalErrors += result.errors;
        totalPages += result.pages;
        categoriesProcessed++;
        
        console.log(`     ✅ ${result.success} products, ${result.pages} pages`);
        
        // Delay between subcategories
        await page.waitForTimeout(DELAY_BETWEEN_CATEGORIES_MS);
      }
    }

    console.log(`\n\n=== 🎉 DONE ===`);
    console.log(`Categories processed: ${categoriesProcessed}`);
    console.log(`Total products scraped: ${totalProducts}`);
    console.log(`Total pages: ${totalPages}`);
    console.log(`Total errors: ${totalErrors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

scrapeAllCategories();