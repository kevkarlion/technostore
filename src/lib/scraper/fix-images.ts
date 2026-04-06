/**
 * Fix images - clean up incorrect and duplicate images
 * Run: npx tsx src/lib/scraper/fix-images.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

async function getCorrectImages(page: any, externalId: string): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Get main image from img#artImg (this is the REAL product image)
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        const fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src.replace(/^\/+/, "")}`;
        images.push(fullUrl);
      }
    }
    
    // Get thumbnails from the carousel/galería del producto
    // These are typically in a container specific to the product images
    // Look for the thumbnails section - usually has class or specific structure
    const thumbContainer = page.locator("div[id*='Thumbs'], div[class*='Thumb'], div[id*='Galeria'], div[class*='Galeria']");
    
    // Alternative: get all thumbnail divs that are children of the product image container
    // The product images are usually in a specific section, not mixed with related products
    const allBgDivs = await page.locator("div[style*='background-image']").all();
    
    for (const div of allBgDivs) {
      const style = await div.getAttribute("style") || "";
      const imgUrlMatch = style.match(/url\(([^)]+)\)/);
      const imgUrl = imgUrlMatch?.[1] || "";
      
      // Only include if it's a thumbnail (min/) format
      if (imgUrl && imgUrl.includes("imagenes/min/")) {
        const thumbMatch = imgUrl.match(/imagenes\/min\/imagen(\d+)\.jpg/i);
        if (thumbMatch) {
          const imageId = thumbMatch[1].padStart(7, "0");
          const fullUrl = `${BASE_URL}/imagenes/${imageId}.JPG`;
          
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

async function fixImages() {
  const db = await getDb();
  
  // Get all products with multiple images
  const products = await db.collection("products").find({
    supplier: "jotakp",
    "imageUrls.1": { $exists: true }
  }).limit(100).toArray();

  console.log(`Found ${products.length} products with multiple images to check\n`);

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

    let fixed = 0;
    let skipped = 0;

    for (const product of products) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(1000);

        const correctImages = await getCorrectImages(page, product.externalId);
        
        console.log(`Product ${product.externalId}:`);
        console.log(`  Current: ${product.imageUrls.length} images`);
        console.log(`  Correct: ${correctImages.length} images`);
        
        if (correctImages.length > 0 && correctImages.length !== product.imageUrls.length) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: correctImages, updatedAt: new Date() } }
          );
          console.log(`  ✅ Fixed!`);
          fixed++;
        } else if (correctImages.length === product.imageUrls.length) {
          console.log(`  ✓ Already correct`);
          skipped++;
        } else {
          console.log(`  ⚠️ No images found`);
          skipped++;
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Skipped/Already correct: ${skipped}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

fixImages();