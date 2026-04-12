/**
 * Fix specific products from category 100
 * Run: npx tsx src/lib/scraper/fix-category-100.ts
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";
const CATEGORY_ID = "100";

function convertThumbnail(id: string): string {
  const actualId = parseInt(id, 10).toString().padStart(9, "0");
  return `${BASE_URL}/imagenes/${actualId}.JPG`;
}

async function fixCategory() {
  const db = await getDb();
  console.log("Scraping category 100 (Carry-Caddy Disk)...\n");

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

    await page.goto(`${BASE_URL}/buscar.aspx?idsubrubro1=${CATEGORY_ID}`, { 
      waitUntil: "networkidle" 
    });
    await page.waitForTimeout(2000);

    const cards = await page.locator("div.col-6.col-md-4.col-lg-3.col-xl-2.p-2").all();
    console.log(`Found ${cards.length} products\n`);

    let updated = 0;

    for (const card of cards) {
      try {
        const link = card.locator("a").first();
        const href = await link.getAttribute("href");
        const idMatch = href?.match(/id=(\d+)/);
        if (!idMatch) continue;
        
        const productId = parseInt(idMatch[1]);
        
        const imgDiv = card.locator("div.w-100.tg-article-img").first();
        const style = await imgDiv.getAttribute("style") || "";
        
        const bgMatch = style.match(/url\(imagenes\/min\/imagen(\d+)\.jpg\)/i);
        if (bgMatch) {
          const imageUrl = convertThumbnail(bgMatch[1]);
          
          // Check if URL actually exists
          try {
            const res = await fetch(imageUrl, { method: "HEAD" });
            if (res.ok) {
              await db.collection("products").updateOne(
                { externalId: productId },
                { $set: { imageUrls: [imageUrl] } }
              );
              console.log(`✅ ${productId}: ${imageUrl.split('/').pop()}`);
              updated++;
            } else {
              console.log(`❌ ${productId}: ${imageUrl.split('/').pop()} - 404`);
            }
          } catch {
            console.log(`❌ ${productId}: Error checking URL`);
          }
        }
      } catch (e) {
        console.log(`⚠️ Error: ${e}`);
      }
    }

    console.log(`\n=== DONE: Updated ${updated} products ===`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await browser.close();
  }
}

fixCategory();