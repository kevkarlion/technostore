/**
 * Test more image URL patterns - find the high-res version
 */

import "dotenv/config";
import { chromium } from "playwright";

const BASE_URL = "https://jotakp.dyndns.org";

async function testImageUrls() {
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

    // Go to a product page
    const productId = "5505";
    await page.goto(`${BASE_URL}/articulo.aspx?id=${productId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Get the image info from the page
    const imgDiv = await page.locator("[id^='imgArt']").first();
    const style = await imgDiv.getAttribute("style") || "";
    console.log("Original style:", style);

    // Extract image ID
    const imgMatch = style.match(/imagen(\d+)\.jpg/);
    const imageId = imgMatch?.[1];
    console.log("Image ID:", imageId);

    if (imageId) {
      // Test different variations
      const patterns = [
        `/imagenes/min/imagen${imageId}.jpg`,
        `/imagenes/mini/imagen${imageId}.jpg`,
        `/imagenes/thumb/imagen${imageId}.jpg`,
        `/imagenes/thumbnail/imagen${imageId}.jpg`,
        `/imagenes/small/imagen${imageId}.jpg`,
        // Try with different padding
        `imagenes/min/imagen${parseInt(imageId).toString().padStart(6, '0')}.jpg`,
        `imagenes/min/imagen${parseInt(imageId)}.jpg`,
      ];

      console.log("\n=== Testing more patterns ===\n");
      
      for (const pattern of patterns) {
        const url = `https://jotakp.dyndns.org${pattern}`;
        
        try {
          const response = await page.request.head(url);
          const status = response.status();
          const contentLength = response.headers()["content-length"];
          
          console.log(`${status === 200 ? '✅' : '❌'} ${pattern}`);
          console.log(`   Status: ${status}, Size: ${contentLength || 'unknown'}`);
        } catch (e: any) {
          console.log(`❌ ${pattern} - Error: ${e.message}`);
        }
      }

      // Also check if there's an <img> tag with different src
      console.log("\n=== Checking img tags on page ===\n");
      const images = await page.locator("img").all();
      
      for (const img of images.slice(0, 10)) {
        const src = await img.getAttribute("src");
        const alt = await img.getAttribute("alt");
        if (src) {
          console.log(`src: ${src}`);
          if (alt) console.log(`alt: ${alt}`);
          console.log("---");
        }
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

testImageUrls();