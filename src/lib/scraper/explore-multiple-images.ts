/**
 * Explore multiple images on product page
 */

import "dotenv/config";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

async function exploreImages() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login first
    console.log("=== LOGIN ===");
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    // Go to product page
    const productId = "9277";
    await page.goto(`${BASE_URL}/articulo.aspx?id=${productId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    console.log("=== ALL IMG TAGS ===\n");
    const images = await page.locator("img").all();
    
    for (const img of images) {
      const src = await img.getAttribute("src");
      const id = await img.getAttribute("id");
      const alt = await img.getAttribute("alt");
      const style = await img.getAttribute("style");
      
      if (src && src.includes("imagenes") && !src.includes("logo")) {
        console.log(`id: ${id}`);
        console.log(`src: ${src}`);
        console.log(`alt: ${alt}`);
        console.log(`style: ${style}`);
        console.log("---");
      }
    }

    // Check for carousel/gallery elements
    console.log("\n=== CAROUSEL/GALLERY ===\n");
    const carousel = await page.locator("[class*='carousel'],[class*='gallery'],[class*='slider'],[class*='thumb']").all();
    console.log(`Found ${carousel.length} carousel/gallery elements`);

    // Check for any div with background image (besides main)
    console.log("\n=== DIVS WITH BACKGROUND IMAGE ===\n");
    const bgDivs = await page.locator("div[style*='background-image']").all();
    for (const div of bgDivs) {
      const style = await div.getAttribute("style");
      const id = await div.getAttribute("id");
      if (style && style.includes("imagenes")) {
        console.log(`id: ${id}`);
        console.log(`style: ${style}`);
        console.log("---");
      }
    }

    // Check for thumbnail images (smaller versions)
    console.log("\n=== THUMBNAIL CONTAINER ===\n");
    const thumbContainer = await page.locator("[id*='thumbs'],[id*='carousel'],[class*='thumb']").all();
    console.log(`Found ${thumbContainer.length} thumbnail containers`);
    
    for (const tc of thumbContainer) {
      const html = await tc.innerHTML();
      console.log(`Container HTML (first 500 chars):`);
      console.log(html.substring(0, 500));
      console.log("---");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreImages();