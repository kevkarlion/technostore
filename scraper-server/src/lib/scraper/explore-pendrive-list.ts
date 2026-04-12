/**
 * Explore product LIST page to find where product details come from
 * Usage: npx tsx src/lib/scraper/explore-pendrive-list.ts
 */

import { chromium } from "playwright";

async function explorePendriveList() {
  console.log("🚀 Exploring pendrive product LIST page...\n");

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
    console.log("Logged in!\n");

    // Go to pendrive category
    console.log("=== PENDRIVE CATEGORY ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);

    // Get all links that look like product links
    const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
    console.log(`Found ${productLinks.length} product links`);

    // Get first 10 links with their text
    for (let i = 0; i < Math.min(10, productLinks.length); i++) {
      const href = await productLinks[i].getAttribute("href");
      const text = (await productLinks[i].textContent() || "").trim();
      console.log(`  ${i+1}. "${text}" -> ${href}`);
    }

    // Look for any JSON data or script tags with product info
    console.log("\n=== LOOKING FOR SCRIPT DATA ===");
    const scripts = await page.locator("script").all();
    for (const script of scripts) {
      const src = await script.getAttribute("src");
      if (src) {
        console.log(`  Script src: ${src}`);
      } else {
        const text = (await script.textContent() || "").substring(0, 500);
        if (text.includes("producto") || text.includes("articulo") || text.includes("precio")) {
          console.log(`  Inline script (first 300 chars): ${text.substring(0, 300)}`);
        }
      }
    }

    // Look for any hidden inputs that might contain product data
    console.log("\n=== HIDDEN INPUTS ===");
    const hiddenInputs = await page.locator("input[type='hidden']").all();
    for (const input of hiddenInputs) {
      const name = await input.getAttribute("name");
      const value = await input.getAttribute("value");
      if (name && value && value.length > 0 && value.length < 200) {
        console.log(`  ${name}: ${value}`);
      }
    }

    // Look for any data-* attributes
    console.log("\n=== DATA ATTRIBUTES ===");
    const dataElements = await page.locator("[data-id], [data-product], [data-articulo]").all();
    for (const el of dataElements.slice(0, 5)) {
      const tag = await el.evaluate(e => e.tagName);
      const attrs = await el.evaluate(e => {
        const dataAttrs: Record<string, string> = {};
        for (const attr of e.attributes) {
          if (attr.name.startsWith("data-")) dataAttrs[attr.name] = attr.value;
        }
        return dataAttrs;
      });
      console.log(`  ${tag}: ${JSON.stringify(attrs)}`);
    }

    // Get the HTML of the page body to see what's there
    console.log("\n=== BODY HTML SNIPPET (first 3000 chars) ===");
    const bodyHtml = await page.locator("body").innerHTML();
    console.log(bodyHtml.substring(0, 3000));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

explorePendriveList();