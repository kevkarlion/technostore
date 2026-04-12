/**
 * Re-scrape all product images correctly
 * - Main image: img#artImg -> .JPG works
 * - Thumbnails: convert min/ URL to .JPG format
 * Run: npx tsx src/lib/scraper/rescrape-all-images.ts
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

async function getCorrectImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // 1. Get main image
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        // Convert to full URL and ensure .JPG extension
        // src: imagenes/000015886.JPG
        // We need to handle it correctly
        const match = src.match(/imagenes\/(\d+)\.(\w+)/i);
        if (match) {
          const id = match[1].padStart(7, "0");
          const fullUrl = `${BASE_URL}/imagenes/${id}.JPG`;
          images.push(fullUrl);
        }
      }
    }
    
    // 2. Get thumbnails from product area
    const productArea = page.locator("div.col-12.col-md-8").first();
    if (await productArea.count() > 0) {
      const thumbDivs = await productArea.locator("div[style*='background-image']").all();
      
      for (const div of thumbDivs) {
        const style = await div.getAttribute("style") || "";
        const imgMatch = style.match(/url\(([^)]+)\)/);
        const imgUrl = imgMatch?.[1] || "";
        
        if (imgUrl && imgUrl.includes("imagenes/min/")) {
          // thumbnail: imagenes/min/imagen00015886.jpg
          // Extract just the number (after 'imagen')
          const thumbMatch = imgUrl.match(/imagen(\d+)\.jpg/i);
          if (thumbMatch) {
            const id = thumbMatch[1].padStart(7, "0");
            const fullUrl = `${BASE_URL}/imagenes/${id}.JPG`;
            
            if (!images.includes(fullUrl)) {
              images.push(fullUrl);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Error: ${e}`);
  }
  
  return images;
}

async function rescrapeImages() {
  const db = await getDb();
  
  // Get all products
  const products = await db.collection("products").find({
    supplier: "jotakp"
  }).toArray();

  console.log(`Rescraping ${products.length} products...\n`);

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

        const images = await getCorrectImages(page);
        
        if (images.length > 0 && JSON.stringify(images) !== JSON.stringify(product.imageUrls)) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: images, updatedAt: new Date() } }
          );
          console.log(`✅ ${product.externalId}: ${images.length} images`);
          fixed++;
        } else if (images.length > 0) {
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

rescrapeImages();