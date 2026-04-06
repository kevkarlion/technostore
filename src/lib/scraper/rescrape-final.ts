/**
 * Final fix: pad thumbnails to 9 digits (not 7!)
 * 00015886 -> parse to 15886 -> pad to 000015886 (9 digits)
 */

import "dotenv/config";
import { getDb } from "@/config/db";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

function convertThumbnail(id: string): string {
  // "00015886" -> parse to int -> pad to 9 digits
  const actualId = parseInt(id, 10).toString(); // "15886"
  return actualId.padStart(9, "0"); // "000015886"
}

async function getImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  // 1. Main image
  const mainImg = await page.locator("img.img-fluid").first();
  if (await mainImg.count() > 0) {
    const src = await mainImg.getAttribute("src") || "";
    if (src && src.includes("imagenes")) {
      const match = src.match(/imagenes\/(\d+)\.JPG/i);
      if (match) {
        const id = match[1].padStart(9, "0");
        images.push(`${BASE_URL}/imagenes/${id}.JPG`);
      }
    }
  }
  
  // 2. Thumbnails
  const thumbDivs = await page.locator("div[id^='imgArt']").all();
  for (const div of thumbDivs) {
    const style = await div.getAttribute("style") || "";
    const match = style.match(/url\(imagenes\/min\/imagen(\d+)\.jpg\)/i);
    if (match) {
      const id = convertThumbnail(match[1]);
      const url = `${BASE_URL}/imagenes/${id}.JPG`;
      if (!images.includes(url)) images.push(url);
    }
  }
  
  return images;
}

async function rescrap() {
  const db = await getDb();
  const products = await db.collection("products").find({ supplier: "jotakp" }).toArray();
  console.log(`Rescraping ${products.length} products...\n`);

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
        await page.goto(`${BASE_URL}/articulo.aspx?id=${product.externalId}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(800);
        const images = await getImages(page);
        
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
    console.log("\n=== DONE ===");
  } finally {
    await browser.close();
  }
}

rescrap();