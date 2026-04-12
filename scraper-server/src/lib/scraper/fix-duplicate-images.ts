/**
 * Fix: Only get unique images (no duplicates)
 * The main image is just a view of one of the thumbnails, not a separate image
 * Run: npx tsx src/lib/scraper/fix-duplicate-images.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

async function getUniqueImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Only get thumbnails from product area
    const productArea = page.locator("div.col-12.col-md-8").first();
    
    if (await productArea.count() > 0) {
      const thumbDivs = await productArea.locator("div[style*='background-image']").all();
      
      for (const div of thumbDivs) {
        const style = await div.getAttribute("style") || "";
        const imgMatch = style.match(/url\(([^)]+)\)/);
        const imgUrl = imgMatch?.[1] || "";
        
        if (imgUrl && imgUrl.includes("imagenes/min/")) {
          const thumbMatch = imgUrl.match(/imagenes\/min\/imagen(\d+)\.jpg/i);
          if (thumbMatch) {
            // Normalize to 7-digit format
            const imageId = thumbMatch[1].padStart(7, "0");
            const fullUrl = `${BASE_URL}/imagenes/${imageId}.JPG`;
            
            if (!images.includes(fullUrl)) {
              images.push(fullUrl);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(`     ⚠️ Error: ${e}`);
  }
  
  return images;
}

async function fixDuplicates() {
  const db = await getDb();
  
  // Get all jotakp products
  const products = await db.collection("products").find({
    supplier: "jotakp"
  }).toArray();

  console.log(`Checking ${products.length} products for duplicate images...\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const product of products) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(800);

        const uniqueImages = await getUniqueImages(page);
        
        // Check if we have duplicates (main image = first thumbnail)
        const currentImages = product.imageUrls || [];
        const uniqueCount = new Set(uniqueImages).size;
        
        // If current has more images than actual unique images, fix it
        if (uniqueImages.length > 0 && uniqueImages.length !== currentImages.length) {
          console.log(`🔄 ${product.externalId}: ${currentImages.length} → ${uniqueImages.length} images`);
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: uniqueImages, updatedAt: new Date() } }
          );
          fixed++;
        } else {
          alreadyCorrect++;
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Already correct: ${alreadyCorrect}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

fixDuplicates();