/**
 * Scrape ALL categories from jotakp.dyndns.org
 * Usage: npx tsx src/lib/scraper/scrape-all-categories.ts
 * 
 * Processes one category at a time with delays between to avoid saturation.
 */

import "dotenv/config";
import { chromium } from "playwright";
import { productRepository } from "@/api/repository/product.repository";
import { jotakpCategories } from "./config";

const DELAY_BETWEEN_CATEGORIES_MS = 5000; // 5 seconds
const DELAY_BETWEEN_PRODUCTS_MS = 1500; // 1.5 seconds per product

// Base URL
const BASE_URL = "https://jotakp.dyndns.org";

/**
 * Scrape attributes from a product detail page
 */
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
    // No attributes found
  }
  
  return attributes;
}

/**
 * Scrape a single subcategory
 */
async function scrapeSubcategory(
  page: any, 
  subcategory: { id: string; name: string; idsubrubro1: number }
): Promise<{ success: number; errors: number; withAttributes: number }> {
  console.log(`\n  📦 ${subcategory.name} (id=${subcategory.idsubrubro1})`);
  
  let success = 0;
  let errors = 0;
  let withAttributes = 0;
  
  try {
    // Go to subcategory page
    const url = `${BASE_URL}/buscar.aspx?idsubrubro1=${subcategory.idsubrubro1}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get all product links
    const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
    
    if (productLinks.length === 0) {
      console.log(`     ⚠️ No products found`);
      return { success: 0, errors: 0, withAttributes: 0 };
    }

    console.log(`     Found ${productLinks.length} products`);

    // Parse products from list
    const products: Array<{
      externalId: string;
      name: string;
      priceUSD: string;
    }> = [];

    for (const link of productLinks) {
      const href = await link.getAttribute("href");
      const fullText = (await link.textContent() || "").trim();
      
      const idMatch = href?.match(/id=(\d+)/);
      const productId = idMatch?.[1] || "";
      
      // Parse: "NameU$D price+ IVA 21%"
      const nameMatch = fullText.match(/^(.*?)U\$D/);
      const name = nameMatch?.[1]?.trim() || "";
      
      const pricePart = fullText.replace(/^.*?U\$D/, "").trim();
      const usdMatch = pricePart.match(/^([\d.,]+)\+/);
      const usdPrice = usdMatch?.[1] || "0";
      
      if (productId && name) {
        products.push({ externalId: productId, name, priceUSD: usdPrice });
      }
    }

    // Visit each detail page to get full data
    for (const product of products) {
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
        
        // Get image URL
        const imgDiv = await page.locator("[id^='imgArt']").first();
        let imageUrl = "";
        if (await imgDiv.count() > 0) {
          try {
            const style = await imgDiv.getAttribute("style") || "";
            const imgMatch = style.match(/url\(([^)]+)\)/);
            imageUrl = imgMatch?.[1] || "";
          } catch (e) {
            // No image
          }
        }
        
        const fullImageUrl = imageUrl ? `https://jotakp.dyndns.org/${imageUrl}` : "";
        
        // Get attributes
        const attributes = await scrapeAttributes(page);
        if (attributes.length > 0) withAttributes++;
        
        // Save to DB
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

/**
 * Main scraping function
 */
async function scrapeAllCategories() {
  console.log("🚀 Starting FULL scrape of ALL categories...\n");
  console.log(`   Categories: ${jotakpCategories.filter(c => c.parentId !== null).length} subcategories`);
  console.log(`   Delay between products: ${DELAY_BETWEEN_PRODUCTS_MS}ms`);
  console.log(`   Delay between categories: ${DELAY_BETWEEN_CATEGORIES_MS}ms`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log("\n=== LOGIN ===");
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    // Group categories by parent
    const categoriesByParent: Record<string, typeof jotakpCategories> = {};
    
    for (const cat of jotakpCategories) {
      if (cat.parentId === null) {
        // This is a parent category
        categoriesByParent[cat.id] = [];
      } else {
        // Add to parent
        const parentId = cat.parentId;
        if (!categoriesByParent[parentId]) {
          categoriesByParent[parentId] = [];
        }
        categoriesByParent[parentId].push(cat);
      }
    }

    let totalProducts = 0;
    let totalErrors = 0;
    let totalWithAttributes = 0;

    // Process each parent category
    const parentCategories = jotakpCategories.filter(c => c.parentId === null);
    
    for (const parent of parentCategories) {
      console.log(`\n=== ${parent.name.toUpperCase()} ===`);
      
      const subcategories = categoriesByParent[parent.id] || [];
      
      for (const subcat of subcategories) {
        const result = await scrapeSubcategory(page, subcat);
        totalProducts += result.success;
        totalErrors += result.errors;
        totalWithAttributes += result.withAttributes;
        
        console.log(`     ✅ ${result.success} products, ${result.withAttributes} with attributes`);
        
        // Delay between subcategories
        await page.waitForTimeout(2000);
      }
      
      // Delay between parent categories
      console.log(`\n   💤 Waiting ${DELAY_BETWEEN_CATEGORIES_MS}ms before next category...`);
      await page.waitForTimeout(DELAY_BETWEEN_CATEGORIES_MS);
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

// Run if called directly
scrapeAllCategories();