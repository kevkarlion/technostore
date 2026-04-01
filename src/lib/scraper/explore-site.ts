/**
 * Script de exploración del sitio del proveedor
 * Este script se usa para identificar los selectores CSS reales del sitio
 * 
 * Usage: npx tsx src/lib/scraper/explore-site.ts
 */

import { chromium } from "playwright";

async function exploreSite() {
  console.log("🚀 Starting site exploration...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ===== EXPLORAR LOGIN =====
    console.log("=== EXPLORING LOGIN PAGE ===");
    const loginUrl = "http://jotakp.dyndns.org/loginext.aspx";
    await page.goto(loginUrl, { waitUntil: "networkidle" });
    
    // Get login form info
    const loginHtml = await page.content();
    
    // Find form elements
    const inputs = await page.locator("input").all();
    console.log(`Found ${inputs.length} input elements on login page`);
    
    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const name = await input.getAttribute("name");
      const type = await input.getAttribute("type");
      const placeholder = await input.getAttribute("placeholder");
      const classAttr = await input.getAttribute("class");
      console.log(`  Input: id="${id}" name="${name}" type="${type}" placeholder="${placeholder}" class="${classAttr}"`);
    }

    // Find buttons
    const buttons = await page.locator("button, input[type='submit']").all();
    console.log(`Found ${buttons.length} button/submit elements`);
    for (const btn of buttons) {
      const id = await btn.getAttribute("id");
      const name = await btn.getAttribute("name");
      const type = await btn.getAttribute("type");
      const value = await btn.getAttribute("value");
      const classAttr = await btn.getAttribute("class");
      console.log(`  Button: id="${id}" name="${name}" type="${type}" value="${value}" class="${classAttr}"`);
    }

    // Try login
    console.log("\n🔐 Attempting login...");
    // Fill username (usually first input after type text)
    const usernameInput = page.locator("input[type='text']").first();
    const passwordInput = page.locator("input[type='password']").first();
    const submitBtn = page.locator("button[type='submit'], input[type='submit']").first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill("20418216795");
      console.log("  Filled username");
    }
    if (await passwordInput.isVisible()) {
      await passwordInput.fill("123456");
      console.log("  Filled password");
    }
    
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      console.log("  Clicked submit");
    }

    // Wait for navigation
    await page.waitForLoadState("networkidle");
    console.log(`  Redirected to: ${page.url()}`);

    // ===== EXPLORAR PÁGINA PRINCIPAL/PRODUCTOS =====
    console.log("\n=== EXPLORING MAIN PAGE ===");
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    console.log(`Current URL: ${page.url()}`);

    // Find all links
    const links = await page.locator("a").all();
    console.log(`Found ${links.length} links on page`);
    
    // Look for product-related links
    console.log("\nProduct-related links:");
    for (const link of links) {
      const href = await link.getAttribute("href");
      const text = await link.textContent();
      if (href && (href.toLowerCase().includes("product") || href.toLowerCase().includes("item") || 
          text?.toLowerCase().includes("product") || text?.toLowerCase().includes("catalog"))) {
        console.log(`  Link: "${text?.trim()}" -> ${href}`);
      }
    }

    // Look for tables (common in business apps)
    const tables = await page.locator("table").all();
    console.log(`\nFound ${tables.length} tables on page`);

    // Look for common product container patterns
    const productContainers = await page.locator(".product, #product, [class*='product'], [id*='product']").all();
    console.log(`Found ${productContainers.length} elements with 'product' in class/id`);

    // Get body content sample
    const bodyHtml = await page.locator("body").innerHTML();
    console.log("\n=== BODY HTML SAMPLE (first 2000 chars) ===");
    console.log(bodyHtml.substring(0, 2000));

    // ===== GUARDAR SELECTORES ENCONTRADOS =====
    console.log("\n=== SELECTOR SUMMARY ===");
    
    // Try to find login form selector
    const forms = await page.locator("form").all();
    if (forms.length > 0) {
      console.log(`Form found: ${forms.length} form(s)`);
      for (const form of forms) {
        const action = await form.getAttribute("action");
        const id = await form.getAttribute("id");
        console.log(`  Form: action="${action}" id="${id}"`);
      }
    }

    console.log("\n✅ Exploration complete!");
    console.log("Use this information to update src/lib/scraper/config.ts");

  } catch (error) {
    console.error("❌ Exploration failed:", error);
  } finally {
    await browser.close();
  }
}

exploreSite();
