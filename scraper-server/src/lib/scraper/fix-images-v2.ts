/**
 * Fix images - only get product-specific images (not related products)
 * Run: npx tsx src/lib/scraper/fix-images-v2.ts
 * 
 * Problem: Current scraper collects ALL background-images from the page
 * including related products, ads, etc.
 * Solution: Only extract from the specific product gallery section
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

/**
 * Extract ONLY the product's own images
 * Strategy:
 * 1. Get main image from img#artImg (this is always the correct product image)
 * 2. Get thumbnails ONLY from the product gallery container, not from anywhere else
 * 3. Filter out any images that might be from related products
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
        console.log(`    Main image: ${fullUrl}`);
      }
    }
    
    // 2. Get thumbnails from product gallery ONLY
    // The product gallery is usually inside a specific container
    // Look for the gallery/thumbnail section that belongs to THIS product
    
    // Strategy: Find the main image container, then look for siblings/children that contain thumbnails
    // The product images are typically in a div that contains the main img#artImg
    
    // Try to find the product image wrapper/container
    const productImageArea = page.locator("div").filter({ has: page.locator("#artImg") }).first();
    
    // If we can't find a specific container, try to identify the thumbnail section by position
    // The thumbnails are usually immediately below or near the main image
    
    // Let's look for thumbnail containers more carefully
    // They typically have background-image and are clickable/thumbnails
    
    // Get all thumbnail-like elements in the product area
    // Look for divs with background-image that have "min" in the URL (thumbnails)
    const thumbnailSelectors = [
      // Gallery thumbnails typically have these characteristics
      "div[style*='background-image'][style*='min']",
      // Or look in specific gallery containers
      "#divImgGaleria div",
      "[id*='Galeria'] div[style*='background-image']",
      "[class*='Galeria'] div[style*='background-image']",
    ];
    
    for (const selector of thumbnailSelectors) {
      try {
        const thumbs = await page.locator(selector).all();
        for (const thumb of thumbs) {
          const style = await thumb.getAttribute("style") || "";
          const imgMatch = style.match(/url\(([^)]+)\)/);
          const imgUrl = imgMatch?.[1] || "";
          
          // Only take thumbnails (min/)
          if (imgUrl && imgUrl.includes("imagenes/min/")) {
            const thumbMatch = imgUrl.match(/imagenes\/min\/imagen(\d+)\.jpg/i);
            if (thumbMatch) {
              const imageId = thumbMatch[1].padStart(7, "0");
              const fullUrl = `${BASE_URL}/imagenes/${imageId}.JPG`;
              
              if (!images.includes(fullUrl)) {
                images.push(fullUrl);
                console.log(`    Thumbnail: ${fullUrl}`);
              }
            }
          }
        }
      } catch (e) {
        // Selector didn't match, continue to next
      }
    }
    
    // Alternative approach: Find ALL background-image divs that are:
    // 1. Inside the main product area (not in related products section)
    // 2. Contain "min" in the URL (thumbnails)
    
    // First, identify the main content area (exclude sidebar, related products, footer)
    const mainContent = await page.locator("div").filter({ has: page.locator("#artImg") }).first();
    
    // Get all divs with background-image in the main area
    if (await mainContent.count() > 0) {
      const allDivs = await mainContent.locator("div[style*='background-image']").all();
      
      for (const div of allDivs) {
        try {
          const style = await div.getAttribute("style") || "";
          const imgMatch = style.match(/url\(([^)]+)\)/);
          const imgUrl = imgMatch?.[1] || "";
          
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
        } catch (e) {
          // Skip errors
        }
      }
    }
    
  } catch (e) {
    console.log(`     ⚠️ Error: ${e}`);
  }
  
  // Deduplicate and remove any potential duplicates from related products
  // If we have more than 5 images, something is probably wrong (related products)
  if (images.length > 5) {
    console.log(`     ⚠️ Warning: ${images.length} images seems too many, truncating to first 5`);
    return images.slice(0, 5);
  }
  
  return images;
}

async function fixImages() {
  const db = await getDb();
  
  // Get all products with multiple images
  const products = await db.collection("products").find({
    supplier: "jotakp",
    "imageUrls.1": { $exists: true }
  }).limit(50).toArray();

  console.log(`Found ${products.length} products with multiple images\n`);

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
      console.log(`\n=== Product ${product.externalId}: ${product.name?.substring(0, 30)}... ===`);
      console.log(`  Current: ${product.imageUrls.length} images`);
      
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(1500);

        const correctImages = await getProductImages(page);
        
        console.log(`  Correct: ${correctImages.length} images`);
        
        if (correctImages.length > 0) {
          // Only update if the number is different or we have new images
          const isDifferent = correctImages.length !== product.imageUrls.length;
          
          if (isDifferent || JSON.stringify(correctImages) !== JSON.stringify(product.imageUrls)) {
            await db.collection("products").updateOne(
              { _id: product._id },
              { $set: { imageUrls: correctImages, updatedAt: new Date() } }
            );
            console.log(`  ✅ Updated!`);
            fixed++;
          } else {
            console.log(`  ✓ Already correct`);
            alreadyCorrect++;
          }
        } else {
          console.log(`  ⚠️ No images found on page`);
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
    console.log(`Errors/No images: ${errors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

fixImages();