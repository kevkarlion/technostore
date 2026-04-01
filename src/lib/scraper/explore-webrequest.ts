/**
 * Exploración usando WebMethods de ASP.NET directamente
 * Usage: npx tsx src/lib/scraper/explore-webrequest.ts
 */

import { chromium } from "playwright";

async function exploreWebMethods() {
  console.log("🚀 Exploring via WebMethods...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login first
    console.log("=== LOGIN ===");
    await page.goto("http://jotakp.dyndns.org/loginext.aspx", { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    
    // Get the form fields needed for POST requests
    const viewState = await page.locator("#__VIEWSTATE").getAttribute("value");
    const viewStateGenerator = await page.locator("#__VIEWSTATEGENERATOR").getAttribute("value");
    const eventValidation = await page.locator("#__EVENTVALIDATION").getAttribute("value");
    
    console.log(`ViewState length: ${viewState?.length}`);
    console.log(`EventValidation length: ${eventValidation?.length}`);

    // Now try calling the WebMethod directly using fetch
    // First, we need to be on the buscar page to get proper cookies
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Get cookies
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    console.log(`\nCookies: ${cookieHeader.substring(0, 100)}...`);

    // Try calling the WebMethod
    console.log("\n=== CALLING WEBMETHOD ===");
    
    // Let's check if there's a simpler URL pattern for products
    // First, let's look at the page for any API endpoints
    const pageContent = await page.content();
    
    // Find any hidden fields or URLs
    const hiddenFields = await page.locator("input[type='hidden']").all();
    console.log(`\nHidden fields: ${hiddenFields.length}`);
    
    for (const field of hiddenFields) {
      const name = await field.getAttribute("name");
      const value = await field.getAttribute("value");
      if (name && name.startsWith("__")) {
        console.log(`  ${name}: ${value?.substring(0, 50)}...`);
      }
    }

    // Try clicking on category dropdowns to see what happens
    console.log("\n=== INTERACTING WITH PAGE ===");
    
    // Look for select/dropdown elements
    const selects = await page.locator("select").all();
    console.log(`Select elements: ${selects.length}`);
    
    for (const select of selects) {
      const id = await select.getAttribute("id");
      const name = await select.getAttribute("name");
      const classAttr = await select.getAttribute("class");
      console.log(`  Select: id="${id}" name="${name}" class="${classAttr}"`);
      
      // Get options
      const options = await select.locator("option").all();
      console.log(`    Options: ${options.length}`);
      for (let i = 0; i < Math.min(5, options.length); i++) {
        const text = await options[i].textContent();
        const value = await options[i].getAttribute("value");
        console.log(`      [${value}]: ${text}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: "/tmp/jotakp-selects.png", fullPage: true });
    console.log("\nScreenshot saved!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

exploreWebMethods();
