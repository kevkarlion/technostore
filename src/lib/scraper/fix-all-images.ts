/**
 * Fix ALL products with incorrect images
 * Run: npx tsx src/lib/scraper/fix-all-images.ts
 * 
 * Process ALL jotakp products with more than 1 image
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

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
    
    // 2. Get thumbnails ONLY from the product main area (col-12 col-md-8)
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

async function fixAllImages() {
  const db = await getDb();
  
  // Get ALL products with more than 1 image
  const products = await db.collection("products").find({
    supplier: "jotakp",
    $expr: { $gt: [{ $size: "$imageUrls" }, 1] }  // More than 1 image
  }).toArray();

  console.log(`Found ${products.length} products with more than 1 image to fix\n`);

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
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(1000);

        const correctImages = await getProductImages(page);
        
        // Check if images are different
        const isDifferent = JSON.stringify(correctImages) !== JSON.stringify(product.imageUrls);
        
        if (correctImages.length > 0 && isDifferent) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: correctImages, updatedAt: new Date() } }
          );
          console.log(`✅ ${product.externalId}: ${product.imageUrls.length} → ${correctImages.length} images`);
          fixed++;
        } else if (correctImages.length > 0 && !isDifferent) {
          alreadyCorrect++;
        } else {
          console.log(`❌ ${product.externalId}: No images found`);
          errors++;
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
        errors++;
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

fixAllImages();