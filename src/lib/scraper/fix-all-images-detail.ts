/**
 * Fix: Get ALL images from product detail pages (main + thumbnails)
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

function convertThumbnail(id: string): string {
  const actualId = parseInt(id, 10).toString().padStart(9, "0");
  return `${BASE_URL}/imagenes/${actualId}.JPG`;
}

async function fixAllImages() {
  const db = await getDb();
  
  // Get all jotakp products
  const products = await db.collection("products").find({
    supplier: "jotakp"
  }).toArray();

  console.log(`Processing ${products.length} products...\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    for (const product of products) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(800);

        const images: string[] = [];

        // 1. Get main image
        const mainImg = await page.locator("img.img-fluid").first();
        const mainSrc = await mainImg.getAttribute("src");
        
        if (mainSrc && mainSrc.includes("imagenes")) {
          // Main image might be PNG or JPG
          const pngUrl = `${BASE_URL}/${mainSrc.replace(/\.\w+$/i, ".PNG")}`;
          const jpgUrl = `${BASE_URL}/${mainSrc.replace(/\.\w+$/i, ".JPG")}`;
          
          try {
            let res = await fetch(pngUrl, { method: "HEAD" });
            if (res.ok) images.push(pngUrl);
            else {
              res = await fetch(jpgUrl, { method: "HEAD" });
              if (res.ok) images.push(jpgUrl);
            }
          } catch {}
        }

        // 2. Get thumbnails
        const thumbDivs = await page.locator("div[id^='imgArt']").all();
        for (const div of thumbDivs) {
          const style = await div.getAttribute("style") || "";
          const match = style.match(/url\(imagenes\/min\/imagen(\d+)\.jpg\)/i);
          if (match) {
            const thumbUrl = convertThumbnail(match[1]);
            // Try PNG first, then JPG
            const pngUrl = thumbUrl.replace(/\.\w+$/i, ".PNG");
            const jpgUrl = thumbUrl.replace(/\.\w+$/i, ".JPG");
            
            try {
              let res = await fetch(pngUrl, { method: "HEAD" });
              if (res.ok && !images.includes(pngUrl)) images.push(pngUrl);
              else if (!images.includes(jpgUrl)) {
                res = await fetch(jpgUrl, { method: "HEAD" });
                if (res.ok) images.push(jpgUrl);
              }
            } catch {}
          }
        }

        // Update if we have images
        if (images.length > 0) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: images } }
          );
          console.log(`✅ ${product.externalId}: ${images.length} images`);
        }

      } catch (e) {
        console.log(`❌ ${product.externalId}: ${e}`);
      }
    }

    console.log(`\n=== DONE ===`);

  } finally {
    await browser.close();
  }
}

fixAllImages();