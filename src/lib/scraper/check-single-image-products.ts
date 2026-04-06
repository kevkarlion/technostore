/**
 * Check products that might have more images than currently stored
 * Run: npx tsx src/lib/scraper/check-single-image-products.ts
 * 
 * Products with only 1 image might actually have more on the source site
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

async function getProductImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Get main product image
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        let fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src.replace(/^\/+/, "")}`;
        const match = fullUrl.match(/imagenes\/(\d+)\.(\w+)/i);
        if (match) {
          const id = match[1].padStart(7, "0");
          const ext = match[2];
          fullUrl = `${BASE_URL}/imagenes/${id}.${ext}`;
        }
        images.push(fullUrl);
      }
    }
    
    // Get thumbnails from product area
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
    // ignore
  }
  
  return images;
}

async function checkSingleImageProducts() {
  const db = await getDb();
  
  // Get products with only 1 image (might have more on source site)
  const products = await db.collection("products").find({
    supplier: "jotakp",
    $expr: { $eq: [{ $size: "$imageUrls" }, 1] }
  }).limit(50).toArray();

  console.log(`Checking ${products.length} products with 1 image...\n`);

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

    let needsUpdate = 0;
    let alreadyCorrect = 0;

    for (const product of products) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(800);

        const actualImages = await getProductImages(page);
        
        if (actualImages.length > 1) {
          console.log(`🔄 ${product.externalId}: ${product.imageUrls.length} → ${actualImages.length} images`);
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: actualImages, updatedAt: new Date() } }
          );
          needsUpdate++;
        } else {
          alreadyCorrect++;
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Needs update: ${needsUpdate}`);
    console.log(`Already correct: ${alreadyCorrect}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

checkSingleImageProducts();