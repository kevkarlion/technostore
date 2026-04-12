/**
 * Exploración con waitForSelector más específico
 * Usage: npx tsx src/lib/scraper/explore-aspnet.ts
 */

import { chromium } from "playwright";

async function exploreAspNet() {
  console.log("🚀 Starting ASP.NET exploration...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for network requests
  const requests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("buscar") || req.url().includes("producto") || req.url().includes("articulo")) {
      requests.push(req.url());
    }
  });

  try {
    // Login
    await page.goto("http://jotakp.dyndns.org/loginext.aspx", { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("Logged in!");

    // Wait for any redirects
    await page.waitForTimeout(2000);

    // Go to products page
    console.log("\n=== GOING TO PRODUCTS ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { timeout: 30000 });
    
    // Wait for the page to stabilize
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    // Try waiting for specific elements
    console.log("\n=== WAITING FOR ELEMENTS ===");
    
    // Try common ASP.NET content placeholders
    const placeholders = [
      "#ContentPlaceHolder1",
      "#ContentPlaceHolder1_UpdatePanel1",
      "[id*='ContentPlaceHolder']",
      ".row",
      ".col"
    ];

    for (const ph of placeholders) {
      try {
        const el = await page.waitForSelector(ph, { timeout: 3000 });
        if (el) {
          const html = await el.innerHTML();
          console.log(`  ${ph}: found, length=${html.length}`);
        }
      } catch {
        console.log(`  ${ph}: not found`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: "/tmp/jotakp-aspnet.png", fullPage: true });
    console.log("\nScreenshot saved!");

    // Print network requests
    console.log("\n=== NETWORK REQUESTS ===");
    console.log(requests);

    // Try to find any div that looks like it has products
    console.log("\n=== DIV STRUCTURE ===");
    const divs = await page.locator("div").all();
    console.log(`Total divs: ${divs.length}`);

    // Get the full URL we're on
    console.log(`\nFinal URL: ${page.url()}`);

    // Try getting the raw HTML from specific sections
    const body = await page.locator("body").innerHTML();
    console.log(`\nBody HTML length: ${body.length}`);

    // Save full HTML
    const fs = require("fs");
    fs.writeFileSync("/tmp/jotakp-full.html", await page.content());
    console.log("Full HTML saved to /tmp/jotakp-full.html");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreAspNet();
