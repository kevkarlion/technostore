/**
 * Test image URLs to find high-res version
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
      // Test different URL patterns
      const patterns = [
        `/imagenes/min/imagen${imageId}.jpg`,
        `/imagenes/chica/imagen${imageId}.jpg`,
        `/imagenes/mediana/imagen${imageId}.jpg`,
        `/imagenes/grande/imagen${imageId}.jpg`,
        `/imagenes/original/imagen${imageId}.jpg`,
        `/imagenes/imagen${imageId}.jpg`,
        `/imagenes/full/imagen${imageId}.jpg`,
        `/imagenes/large/imagen${imageId}.jpg`,
      ];

      console.log("\n=== Testing image URLs ===\n");
      
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
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

testImageUrls();