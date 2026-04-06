/**
 * Fix: Use product detail pages to get correct images
 * Main image could be PNG or JPG
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

async function fixFromDetail() {
  const db = await getDb();
  
  // Get all products without valid images or with broken images
  const products = await db.collection("products").find({
    supplier: "jotakp",
    categories: "carry-caddy-disk"
  }).toArray();

  console.log(`Checking ${products.length} products in carry-caddy-disk...\n`);

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

        // Get main image
        const mainImg = await page.locator("img.img-fluid").first();
        const src = await mainImg.getAttribute("src");
        
        if (src && src.includes("imagenes")) {
          // src is like "imagenes/000025716.PNG" or "imagenes/000012509.JPG"
          const fullUrl = `${BASE_URL}/${src}`;
          
          // Test both PNG and JPG
          const pngUrl = fullUrl.replace(/\.\w+$/i, ".PNG");
          const jpgUrl = fullUrl.replace(/\.\w+$/i, ".JPG");
          
          let finalUrl = "";
          
          try {
            let res = await fetch(pngUrl, { method: "HEAD" });
            if (res.ok) {
              finalUrl = pngUrl;
            } else {
              res = await fetch(jpgUrl, { method: "HEAD" });
              if (res.ok) finalUrl = jpgUrl;
            }
          } catch {}
          
          if (finalUrl) {
            await db.collection("products").updateOne(
              { _id: product._id },
              { $set: { imageUrls: [finalUrl] } }
            );
            console.log(`✅ ${product.externalId}: ${finalUrl.split('/').pop()}`);
          } else {
            console.log(`❌ ${product.externalId}: No valid image found`);
          }
        }

      } catch (e) {
        console.log(`⚠️ ${product.externalId}: ${e}`);
      }
    }

    console.log(`\n=== DONE ===`);

  } finally {
    await browser.close();
  }
}

fixFromDetail();