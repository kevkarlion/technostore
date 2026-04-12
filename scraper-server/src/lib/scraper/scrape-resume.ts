/**
 * Resume scraping from where it stopped
 * Continue from Conectividad (Routers) -> остальные категории
 * Usage: npx tsx src/lib/scraper/scrape-all-categories.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { productRepository } from "@/api/repository/product.repository";
import { jotakpCategories } from "./config";

const DELAY_BETWEEN_CATEGORIES_MS = 5000;
const DELAY_BETWEEN_PRODUCTS_MS = 2000; // Mayor delay para evitar saturación
const START_FROM_CATEGORY = "varios"; // Cambiar para continuar desde otra categoría

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

async function scrapeSubcategory(
  page: any, 
  subcategory: { id: string; name: string; idsubrubro1: number }
): Promise<{ success: number; errors: number; withAttributes: number }> {
  console.log(`\n  📦 ${subcategory.name} (id=${subcategory.idsubrubro1})`);
  
  let success = 0;
  let errors = 0;
  let withAttributes = 0;
  
  try {
    const url = `${BASE_URL}/buscar.aspx?idsubrubro1=${subcategory.idsubrubro1}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
    
    if (productLinks.length === 0) {
      console.log(`     ⚠️ No products found`);
      return { success: 0, errors: 0, withAttributes: 0 };
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

    for (const product of products) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(DELAY_BETWEEN_PRODUCTS_MS);
        
        const descElement = await page.locator("#divArticuloDescripcion").first();
        let description = "";
        if (await descElement.count() > 0) {
          description = (await descElement.textContent() || "").trim();
          if (description === "Sin descripción") description = "";
        }
        
        const imgDiv = await page.locator("[id^='imgArt']").first();
        let imageUrl = "";
        if (await imgDiv.count() > 0) {
          try {
            const style = await imgDiv.getAttribute("style") || "";
            const imgMatch = style.match(/url\(([^)]+)\)/);
            imageUrl = imgMatch?.[1] || "";
          } catch (e) {}
        }
        
        const fullImageUrl = imageUrl ? `https://jotakp.dyndns.org/${imageUrl}` : "";
        const attributes = await scrapeAttributes(page);
        if (attributes.length > 0) withAttributes++;
        
        await productRepository.upsertByExternalId({
          externalId: product.externalId,
          supplier: "jotakp",
          name: product.name,
          description: description,
          price: parseFloat(product.priceUSD.replace(",", ".")),
          currency: "USD",
          stock: 0,
          sku: product.externalId.padStart(7, "0"),
          imageUrls: [fullImageUrl],
          categories: [subcategory.id],
          attributes: attributes,
        });
        
        success++;
        
      } catch (err) {
        console.log(`     ❌ Error ${product.externalId}: ${err}`);
        errors++;
      }
    }

  } catch (err) {
    console.log(`     ❌ Category error: ${err}`);
    errors++;
  }

  return { success, errors, withAttributes };
}

async function scrapeAllCategories() {
  console.log("🚀 RESUMING from Conectividad...\n");
  console.log(`   Start from: ${START_FROM_CATEGORY}`);
  console.log(`   Delay between products: ${DELAY_BETWEEN_PRODUCTS_MS}ms`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("\n=== LOGIN ===");
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

  // Get all subcategories (skip parents with idsubrubro1=0)
  const allSubcategories = jotakpCategories.filter(c => c.idsubrubro1 !== 0 && c.parentId !== null);
  
  // Find the starting index
  const startIndex = allSubcategories.findIndex(c => c.parentId === START_FROM_CATEGORY);
  const subcategoriesToScrape = startIndex >= 0 ? allSubcategories.slice(startIndex) : allSubcategories;
  
  console.log(`   Subcategories to scrape: ${subcategoriesToScrape.length}`);
  
  let totalProducts = 0;
  let totalErrors = 0;
  let totalWithAttributes = 0;

  // Group by parent for progress reporting
  let currentParent = "";
  
  for (const subcat of subcategoriesToScrape) {
    if (subcat.parentId && subcat.parentId !== currentParent) {
      currentParent = subcat.parentId;
      console.log(`\n=== ${currentParent.toUpperCase()} ===`);
    }
    
    const result = await scrapeSubcategory(page, subcat);
    totalProducts += result.success;
    totalErrors += result.errors;
    totalWithAttributes += result.withAttributes;
    
    console.log(`     ✅ ${result.success} products, ${result.withAttributes} with attrs`);
    
    // Delay between subcategories
    await page.waitForTimeout(2000);
  }

  console.log(`\n\n=== 🎉 DONE ===`);
  console.log(`Total products scraped: ${totalProducts}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Products with attributes: ${totalWithAttributes}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

scrapeAllCategories();