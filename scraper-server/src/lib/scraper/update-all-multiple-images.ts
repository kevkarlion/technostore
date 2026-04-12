/**
 * Update ALL products with multiple images
 * Run: npx tsx src/lib/scraper/update-all-multiple-images.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";
const BATCH_SIZE = 50;

async function getAllImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Get main image from img#artImg (high-res)
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
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
        const thumbMatch = imgUrl.match(/imagenes\/min\/imagen(\d+)\.jpg/i);
        if (thumbMatch) {
          const imageId = thumbMatch[1].padStart(7, "0");
          const fullUrl = `${BASE_URL}/imagenes/${imageId}.JPG`;
          
          if (!images.includes(fullUrl)) {
            images.push(fullUrl);
          }
        } else {
          const fullUrl = imgUrl.startsWith("http") ? imgUrl : `${BASE_URL}/${imgUrl.replace(/^\/+/, "")}`;
          if (!images.includes(fullUrl)) {
            images.push(fullUrl);
          }
        }
      }
    }
  } catch (e) {
    // Silently fail
  }
  
  return images;
}

async function updateProducts() {
  const db = await getDb();
  
  // Get all products with 0 or 1 image
  const productsToProcess = await db.collection("products").find({
    supplier: "jotakp",
    $or: [
      { $expr: { $lte: [{ $size: "$imageUrls" }, 1] } },
      { imageUrls: { $exists: false } },
      { imageUrls: null }
    ]
  }).toArray();

  console.log(`Found ${productsToProcess.length} products to process\n`);

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
    let noImages = 0;
    let errors = 0;

    for (let i = 0; i < productsToProcess.length; i++) {
      const product = productsToProcess[i];
      
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(500);

        const allImages = await getAllImages(page);
        
        if (allImages.length > 0) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: allImages, updatedAt: new Date() } }
          );
          updated++;
          if (allImages.length > 1) {
            console.log(`✅ ${i + 1}/${productsToProcess.length}: ${product.externalId} - ${allImages.length} images`);
          }
        } else {
          noImages++;
        }

      } catch (err) {
        errors++;
      }

      // Progress every 50 products
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${productsToProcess.length} processed`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Updated: ${updated}`);
    console.log(`No images found: ${noImages}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

updateProducts();