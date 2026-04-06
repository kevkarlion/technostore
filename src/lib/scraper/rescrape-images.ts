/**
 * Fixed: Handle 8-digit thumbnail IDs correctly
 * Thumbnails: imagen00015886 (8 digits) -> extract -> pad to 8 digits -> 000015886
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

function convertThumbnailId(rawId: string): string {
  // rawId = "00015886" (8 digits)
  // Just pad to 8 digits (no parsing needed)
  const padded = rawId.padStart(8, "0"); // "00015886" stays "00015886"
  return padded;
}

async function getCorrectImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // 1. Get main image
    const mainImg = await page.locator("img.img-fluid").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        // Main: imagenes/000015886.JPG (7 digits)
        const match = src.match(/imagenes\/(\d+)\.JPG/i);
        if (match) {
          const id = match[1].padStart(7, "0");
          const fullUrl = `${BASE_URL}/imagenes/${id}.JPG`;
          images.push(fullUrl);
        }
      }
    }
    
    // 2. Get thumbnails
    const thumbDivs = await page.locator("div[id^='imgArt']").all();
    
    for (const div of thumbDivs) {
      const style = await div.getAttribute("style") || "";
      const imgMatch = style.match(/url\(imagenes\/min\/imagen(\d+)\.jpg\)/i);
      
      if (imgMatch) {
        const rawId = imgMatch[1]; // "00015886" (8 digits)
        const realId = convertThumbnailId(rawId); // stays "00015886"
        const fullUrl = `${BASE_URL}/imagenes/${realId}.JPG`;
        
        if (!images.includes(fullUrl)) {
          images.push(fullUrl);
        }
      }
    }
    
  } catch (e) {
    console.log(`  ⚠️ Error: ${e}`);
  }
  
  return images;
}

async function rescrap() {
  const db = await getDb();
  
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
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    let fixed = 0;

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
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
      }
    }

    console.log(`\n=== DONE: Fixed ${fixed} products ===`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

rescrap();