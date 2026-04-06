/**
 * Update product images to high-res URLs
 * Run: npx tsx src/lib/scraper/update-product-images.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";
const CATEGORY_ID = "149";

async function updateImages() {
  const db = await getDb();
  
  // Get products from category 149
  const products = await db.collection("products")
    .find({ 
      supplier: "jotakp",
      categories: CATEGORY_ID
    })
    .toArray();

  console.log(`Found ${products.length} products to update\n`);

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

    for (const product of products) {
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(1000);

        // Get high-res image from img#artImg
        const imgTag = await page.locator("img#artImg").first();
        let imageUrl = "";
        
        if (await imgTag.count() > 0) {
          const src = await imgTag.getAttribute("src") || "";
          imageUrl = src ? `https://jotakp.dyndns.org/${src}` : "";
        }

        if (imageUrl) {
          await db.collection("products").updateOne(
            { _id: product._id },
            { $set: { imageUrls: [imageUrl], updatedAt: new Date() } }
          );
          updated++;
          console.log(`✅ ${product.externalId}: ${imageUrl.substring(0, 60)}...`);
        } else {
          console.log(`⚠️ ${product.externalId}: No high-res image found`);
        }

      } catch (err) {
        console.log(`❌ ${product.externalId}: ${err}`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Updated ${updated} of ${products.length} products`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

updateImages();