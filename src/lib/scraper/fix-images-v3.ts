/**
 * Fix images - only get product-specific images (not related products)
 * Run: npx tsx src/lib/scraper/fix-images-v3.ts
 * 
 * Solution: Only extract images from the product main area (col-12 col-md-8),
 * not from related products area
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

/**
 * Extract ONLY the product's own images
 * Strategy:
 * 1. Get main image from img#artImg (the product image)
 * 2. Get thumbnails ONLY from the product area (col-12 col-md-8)
 * 3. Filter out related products thumbnails (they are in different containers)
 */
async function getProductImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // 1. Get main product image (img#artImg)
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        const fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src.replace(/^\/+/, "")}`;
        images.push(fullUrl);
      }
    }
    
    // 2. Get thumbnails ONLY from the product main area
    // The product area is in: col-12 col-md-8
    // Related products are in different containers (tg-hover-sha, etc.)
    
    // Find the product area container
    const productArea = page.locator("div.col-12.col-md-8").first();
    
    if (await productArea.count() > 0) {
      // Get all background-image divs inside the product area
      const thumbDivs = await productArea.locator("div[style*='background-image']").all();
      
      for (const div of thumbDivs) {
        const style = await div.getAttribute("style") || "";
        const imgMatch = style.match(/url\(([^)]+)\)/);
        const imgUrl = imgMatch?.[1] || "";
        
        // Only thumbnails (min/)
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
    }
    
    // 3. Edge case: if no thumbnails found in product area, try alternative selectors
    if (images.length <= 1) {
      console.log("  ⚠️ No thumbnails in product area, trying fallback...");
      
      // Try to find thumbnails in the main content area that aren't related products
      const mainContent = page.locator("div").filter({ has: page.locator("#artImg") }).first();
      
      if (await mainContent.count() > 0) {
        const allDivs = await mainContent.locator("div[style*='background-image']").all();
        
        for (const div of allDivs) {
          const style = await div.getAttribute("style") || "";
          const imgMatch = style.match(/url\(([^)]+)\)/);
          const imgUrl = imgMatch?.[1] || "";
          
          // Check parent class to filter out related products
          const parent = await div.locator("xpath=..").first();
          const parentClass = await parent.getAttribute("class") || "";
          
          // Skip if it's a related product (has tg-hover-sha)
          if (parentClass.includes("tg-hover")) continue;
          
          // Only thumbnails
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
      }
    }
    
  } catch (e) {
    console.log(`     ⚠️ Error: ${e}`);
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
    let alreadyCorrect = 0;
    let errors = 0;

    for (const product of products) {
      console.log(`\n=== ${product.externalId}: ${product.name?.substring(0, 35)}... ===`);
      console.log(`  Before: ${product.imageUrls.length} images`);
      
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(1000);

        const correctImages = await getProductImages(page);
        
        console.log(`  After: ${correctImages.length} images`);
        
        if (correctImages.length > 0 && JSON.stringify(correctImages) !== JSON.stringify(product.imageUrls)) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: correctImages, updatedAt: new Date() } }
          );
          console.log(`  ✅ Updated!`);
          fixed++;
        } else if (correctImages.length === product.imageUrls.length) {
          console.log(`  ✓ Already correct`);
          alreadyCorrect++;
        } else {
          console.log(`  ⚠️ Issue: ${correctImages.length} found`);
          errors++;
        }

      } catch (err) {
        console.log(`  ❌ Error: ${err}`);
        errors++;
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Issues: ${errors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

fixImages();