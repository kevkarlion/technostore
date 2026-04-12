/**
 * Rescrape images from category pages - FIXED SELECTORS
 * Run: npx tsx src/lib/scraper/rescrape-from-category.ts
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

const CATEGORIES = [
  "100", "13", "14", "69", "157", "156", "12", "5"
];

function convertThumbnail(id: string): string {
  const actualId = parseInt(id, 10).toString().padStart(9, "0");
  return `${BASE_URL}/imagenes/${actualId}.JPG`;
}

async function getProductsFromCategory(page: any, categoryId: string): Promise<{id: string, imageUrl: string}[]> {
  const products: {id: string, imageUrl: string}[] = [];
  
  try {
    await page.goto(`${BASE_URL}/buscar.aspx?idsubrubro1=${categoryId}`, { 
      waitUntil: "networkidle",
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // Fixed selector: div.col-6.col-md-4.col-lg-3.col-xl-2.p-2
    const cards = await page.locator("div.col-6.col-md-4.col-lg-3.col-xl-2.p-2").all();
    
    for (const card of cards) {
      try {
        // Get product ID from link
        const link = card.locator("a").first();
        const href = await link.getAttribute("href");
        const idMatch = href?.match(/id=(\d+)/);
        if (!idMatch) continue;
        
        const productId = idMatch[1];
        
        // Get image from div.w-100.tg-article-img
        const imgDiv = card.locator("div.w-100.tg-article-img").first();
        const style = await imgDiv.getAttribute("style") || "";
        
        const bgMatch = style.match(/url\(imagenes\/min\/imagen(\d+)\.jpg\)/i);
        if (bgMatch) {
          const imageUrl = convertThumbnail(bgMatch[1]);
          products.push({ id: productId, imageUrl });
        }
      } catch {
        // Skip
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Error: ${e}`);
  }
  
  return products;
}

async function rescrap() {
  const db = await getDb();
  console.log("Starting category image scraping...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    let totalUpdated = 0;

    for (const catId of CATEGORIES) {
      console.log(`Scraping category ${catId}...`);
      const products = await getProductsFromCategory(page, catId);
      console.log(`  Found ${products.length} products`);
      
      for (const p of products) {
        // Update product - set image if not already set
        const existing = await db.collection("products").findOne({ 
          externalId: parseInt(p.id),
          supplier: "jotakp"
        });
        
        // Only add if no image or want to update
        if (!existing?.imageUrls?.length) {
          await db.collection("products").updateOne(
            { externalId: parseInt(p.id) },
            { $set: { imageUrls: [p.imageUrl] } }
          );
          console.log(`  ✅ ${p.id}: added image`);
          totalUpdated++;
        }
      }
    }

    console.log(`\n=== DONE: Updated ${totalUpdated} products ===`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

rescrap();