/**
 * Complete scraper with CHECKPOINTS and RESUME capability
 * Saves progress after each category so it can resume from where it left off
 * 
 * Usage: npx tsx src/lib/scraper/scrape-with-checkpoints.ts
 */

import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import { productRepository } from "@/api/repository/product.repository";
import { jotakpCategories } from "./config";
import { getDb } from "@/config/db";

const DELAY_BETWEEN_PAGES_MS = 2000;
const DELAY_BETWEEN_PRODUCTS_MS = 1000;
const DELAY_BETWEEN_CATEGORIES_MS = 2000;

const BASE_URL = "https://jotakp.dyndns.org";

// Checkpoint collection
interface ScraperCheckpoint {
  _id?: any;
  runId: string;
  currentCategoryId: string;
  currentCategoryIndex: number;
  currentPage: number;
  currentProductIndex: number;
  totalProducts: number;
  totalPages: number;
  totalCategories: number;
  status: "running" | "completed" | "failed";
  startedAt: Date;
  updatedAt: Date;
  lastError?: string;
}

// Generate a unique run ID
function generateRunId(): string {
  return `scrape-${Date.now()}`;
}

async function saveCheckpoint(
  db: any,
  checkpoint: Partial<ScraperCheckpoint>
): Promise<void> {
  await db.collection("scraper_checkpoints").updateOne(
    { runId: checkpoint.runId },
    { $set: { ...checkpoint, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function getLatestCheckpoint(db: any): Promise<ScraperCheckpoint | null> {
  // Also check failed checkpoints for resume
  return await db.collection("scraper_checkpoints")
    .findOne({ status: { $in: ["running", "failed"] } }, { sort: { updatedAt: -1 } });
}

async function clearStaleCheckpoints(db: any): Promise<void> {
  // Clear checkpoints older than 24 hours (both running and failed)
  const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.collection("scraper_checkpoints")
    .deleteMany({ 
      status: { $in: ["running", "failed"] },
      updatedAt: { $lt: staleDate }
    });
}

async function scrapeAttributes(page: Page): Promise<Array<{ key: string; value: string }>> {
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
  page: Page,
  categoryId: number,
  pageNum: number
): Promise<{ products: Array<{ externalId: string; name: string; priceUSD: string }>; hasNext: boolean }> {
  const url = `${BASE_URL}/buscar.aspx?idsubrubro1=${categoryId}&pag=${pageNum}`;
  
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

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
      try {
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
      } catch (e) {
        // Skip this product
      }
    }

    return { products, hasNext };
  } catch (e) {
    console.log(`     ⚠️ Error loading page ${pageNum}: ${e}`);
    return { products: [], hasNext: false };
  }
}

async function scrapeProductDetails(page: Page, product: { externalId: string; name: string; priceUSD: string }) {
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
    
  } catch (e) {
    return { description: "", imageUrl: "", attributes: [] };
  }
}

async function scrapeSubcategory(
  page: Page, 
  subcategory: { id: string; name: string; idsubrubro1: number },
  db: any,
  runId: string
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
        try {
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
        } catch (e) {
          errors++;
        }
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

async function scrapeAllCategories(startFromIndex: number = 0) {
  console.log("🚀 Starting SCROPPER with CHECKPOINTS\n");
  
  const db = await getDb();
  
  // Clear stale checkpoints from previous runs
  await clearStaleCheckpoints(db);
  
  // Check for existing checkpoint to resume
  const existingCheckpoint = await getLatestCheckpoint(db);
  let startIndex = startFromIndex;
  let runId = generateRunId();
  
  if (existingCheckpoint && startFromIndex === 0) {
    console.log(`📍 Resuming from checkpoint: ${existingCheckpoint.currentCategoryId}`);
    console.log(`   Started at: ${existingCheckpoint.startedAt}`);
    startIndex = existingCheckpoint.currentCategoryIndex + 1;
    runId = existingCheckpoint.runId;
  }

  // Initialize checkpoint
  await saveCheckpoint(db, {
    runId,
    currentCategoryId: "",
    currentCategoryIndex: startIndex,
    currentPage: 1,
    currentProductIndex: 0,
    totalProducts: 0,
    totalPages: 0,
    totalCategories: 0,
    status: "running",
    startedAt: existingCheckpoint?.startedAt || new Date(),
  });

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
    const totalCategories = allSubcategories.length;
    
    console.log(`   Total subcategories to scrape: ${totalCategories}`);
    console.log(`   Starting from index: ${startIndex}\n`);

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
    let totalPagesScraped = 0;

    // Process each parent category
    const parentIds = Object.keys(categoriesByParent);
    
    for (const parentId of parentIds) {
      const subcategories = categoriesByParent[parentId];
      console.log(`\n=== ${parentId.toUpperCase()} ===`);
      
      for (let i = 0; i < subcategories.length; i++) {
        const subcat = subcategories[i];
        
        // Skip if we're resuming
        const globalIndex = allSubcategories.findIndex(s => s.id === subcat.id);
        if (globalIndex < startIndex) {
          continue;
        }
        
        console.log(`  📦 ${subcat.name} (id=${subcat.idsubrubro1})`);
        
        // Save checkpoint before scraping category
        await saveCheckpoint(db, {
          runId,
          currentCategoryId: subcat.id,
          currentCategoryIndex: globalIndex,
          currentPage: 1,
          currentProductIndex: 0,
          totalProducts,
          totalPages: totalPagesScraped,
          totalCategories: totalCategories,
        });

        const result = await scrapeSubcategory(page, subcat, db, runId);
        
        totalProducts += result.success;
        totalErrors += result.errors;
        totalPagesScraped += result.pages;
        
        console.log(`     ✅ ${result.success} products, ${result.pages} pages`);
        
        // Save checkpoint after completing category
        await saveCheckpoint(db, {
          runId,
          currentCategoryId: subcat.id,
          currentCategoryIndex: globalIndex,
          currentPage: 1,
          currentProductIndex: 0,
          totalProducts,
          totalPages: totalPagesScraped,
          totalCategories: totalCategories,
        });
        
        // Delay between subcategories
        await page.waitForTimeout(DELAY_BETWEEN_CATEGORIES_MS);
      }
    }

    // Mark as completed
    await saveCheckpoint(db, {
      runId,
      currentCategoryId: "DONE",
      currentCategoryIndex: totalCategories,
      status: "completed",
      totalProducts,
      totalPages: totalPagesScraped,
      totalCategories,
    });

    console.log(`\n\n=== 🎉 DONE ===`);
    console.log(`Categories processed: ${totalCategories}`);
    console.log(`Total products scraped: ${totalProducts}`);
    console.log(`Total pages: ${totalPagesScraped}`);
    console.log(`Total errors: ${totalErrors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
    
    // Save error to checkpoint
    await saveCheckpoint(db, {
      runId,
      status: "failed",
      lastError: String(error),
    });
  } finally {
    await browser.close();
  }
}

// Get start index from command line args
const args = process.argv.slice(2);
const startIndex = args[0] ? parseInt(args[0], 10) : 0;

scrapeAllCategories(startIndex);