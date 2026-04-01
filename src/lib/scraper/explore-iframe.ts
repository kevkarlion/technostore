/**
 * Exploración del iframe
 * Usage: npx tsx src/lib/scraper/explore-iframe.ts
 */

import { chromium } from "playwright";

async function exploreIframe() {
  console.log("🚀 Exploring iframe...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log("=== LOGIN ===");
    await page.goto("http://jotakp.dyndns.org/loginext.aspx", { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("Logged in!");

    // Navigate to products page
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get all frames
    console.log("\n=== FRAMES ===");
    const frames = page.frames();
    console.log(`Total frames: ${frames.length}`);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const url = frame.url();
      console.log(`\nFrame ${i}:`);
      console.log(`  URL: ${url}`);
      
      if (url && url !== "about:blank") {
        try {
          const title = await frame.title();
          console.log(`  Title: ${title}`);
          
          // Get frame content
          const body = await frame.locator("body").innerHTML();
          console.log(`  Body length: ${body.length}`);
          console.log(`  Body sample: ${body.substring(0, 500)}`);
        } catch (e) {
          console.log(`  Error getting content: ${e}`);
        }
      }
    }

    // Check for iframes specifically
    console.log("\n=== IFRAMES ===");
    const iframes = await page.locator("iframe").all();
    console.log(`Iframes in page: ${iframes.length}`);
    
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      const src = await iframe.getAttribute("src");
      const id = await iframe.getAttribute("id");
      const name = await iframe.getAttribute("name");
      console.log(`  Iframe ${i}: src="${src}" id="${id}" name="${name}"`);
    }

    // Save screenshot
    await page.screenshot({ path: "/tmp/jotakp-iframe.png", fullPage: true });
    console.log("\nScreenshot saved!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreIframe();
