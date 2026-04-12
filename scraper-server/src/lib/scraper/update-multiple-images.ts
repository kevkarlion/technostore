/**
 * Update products with multiple images - FIXED URLs
 * Run: npx tsx src/lib/scraper/update-multiple-images.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

async function getAllImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Get main image from img#artImg (high-res)
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        // Fix: ensure proper URL format
        const fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src.replace(/^\/+/, "")}`;
        images.push(fullUrl);
      }
    }
    
    // Get additional images from divs with background-image
    const bgDivs = await page.locator("div[style*='background-image']").all();
    
    for (const div of bgDivs) {
      const style = await div.getAttribute("style") || "";
      const imgMatch = style.match(/url\(([^)]+)\)/);
      const imgUrl = imgMatch?.[1] || "";
      
      if (imgUrl && imgUrl.includes("imagenes")) {
        // Convert thumbnail to high-res
        // From: imagenes/min/imagen00012509.jpg
        // To: imagenes/000012509.JPG
        const thumbMatch = imgUrl.match(/imagenes\/min\/imagen(\d+)\.jpg/i);
        if (thumbMatch) {
          const imageId = thumbMatch[1].padStart(7, "0");
          const fullUrl = `${BASE_URL}/imagenes/${imageId}.JPG`;
          
          // Avoid duplicates
          if (!images.includes(fullUrl)) {
            images.push(fullUrl);
          }
        } else {
          // If not thumbnail format, use as-is
          const fullUrl = imgUrl.startsWith("http") ? imgUrl : `${BASE_URL}/${imgUrl.replace(/^\/+/, "")}`;
          if (!images.includes(fullUrl)) {
            images.push(fullUrl);
          }
        }
      }
    }
  } catch (e) {
    console.log(`     ⚠️ Error getting images: ${e}`);
  }
  
  return images;
}

async function updateProducts() {
  const db = await getDb();
  
  // Get ALL products to check for multiple images
  const allProducts = await db.collection("products").find({
    supplier: "jotakp",
    $expr: { $lte: [{ $size: "$imageUrls" }, 1] }  // Products with 0 or 1 image
  }).limit(50).toArray();

  console.log(`Found ${allProducts.length} products with 0 or 1 image\n`);

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

    let updated = 0;
    let skipped = 0;

    // Process products
    for (const product of allProducts) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(1000);

        const allImages = await getAllImages(page);
        
        if (allImages.length > 1) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: allImages, updatedAt: new Date() } }
          );
          updated++;
          console.log(`✅ ${product.externalId}: ${allImages.length} images`);
        } else if (allImages.length === 1) {
          // Keep the single image, just fix URL if needed
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: allImages, updatedAt: new Date() } }
          );
          skipped++;
        } else {
          skipped++;
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Updated ${updated} products with multiple images`);
    console.log(`Kept ${skipped} products with single/no image`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

updateProducts();