/**
 * Test high-res image URLs found in img tags
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

    // Get ALL images on the page to find the right one
    console.log("=== All images on page ===\n");
    const images = await page.locator("img").all();
    
    for (const img of images) {
      const src = await img.getAttribute("src");
      const id = await img.getAttribute("id");
      if (src && src.includes("imagenes") && !src.includes("logo")) {
        console.log(`id: ${id}`);
        console.log(`src: ${src}`);
        console.log("---");
      }
    }

    // The image ID from thumbnail is 00003951 - test with leading zeros in imagenes folder
    console.log("\n=== Testing high-res URLs ===\n");
    
    const testUrls = [
      `https://jotakp.dyndns.org/imagenes/000003951.JPG`,
      `https://jotakp.dyndns.org/imagenes/00003951.jpg`,
      `https://jotakp.dyndns.org/imagenes/3951.jpg`,
      `https://jotakp.dyndns.org/imagenes/000003951.jpg`,
    ];

    for (const url of testUrls) {
      try {
        const response = await page.request.head(url);
        console.log(`${response.status() === 200 ? '✅' : '❌'} ${url}`);
        console.log(`   Size: ${response.headers()["content-length"]} bytes`);
      } catch (e: any) {
        console.log(`❌ ${url} - Error: ${e.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

testImageUrls();