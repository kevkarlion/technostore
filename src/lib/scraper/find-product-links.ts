/**
 * Encontrar los enlaces de productos reales
 * Usage: npx tsx src/lib/scraper/find-product-links.ts
 */

import { chromium } from "playwright";

async function findProductLinks() {
  console.log("🚀 Finding product links...\n");

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

    // Go to a category page
    console.log("\n=== GOING TO CATEGORY 1 (Memorias) ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=1", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);

    // Get all links and analyze them
    console.log("\n=== ANALYZING ALL LINKS ===");
    const links = await page.locator("a").all();
    
    // Categorize links
    const categories: { [key: string]: { text: string; href: string }[] } = {
      articulo: [],
      producto: [],
      buscar: [],
      carrito: [],
      other: []
    };

    for (const link of links) {
      const href = await link.getAttribute("href");
      const text = (await link.textContent() || "").trim();
      
      if (!href || href === "#" || href === "javascript:void(0)") continue;
      
      const entry = { text: text.substring(0, 80), href };
      
      if (href.includes("Articulo") || href.includes("articulo")) {
        categories.articulo.push(entry);
      } else if (href.includes("producto") || href.includes("Producto")) {
        categories.producto.push(entry);
      } else if (href.includes("buscar")) {
        categories.buscar.push(entry);
      } else if (href.includes("carrito") || href.includes("Carrito")) {
        categories.carrito.push(entry);
      } else {
        categories.other.push(entry);
      }
    }

    console.log(`\nArticulo links: ${categories.articulo.length}`);
    console.log(`Producto links: ${categories.producto.length}`);
    console.log(`Buscar links: ${categories.buscar.length}`);
    console.log(`Carrito links: ${categories.carrito.length}`);
    console.log(`Other links: ${categories.other.length}`);

    // Show articulo links
    console.log("\n=== ARTICULO LINKS ===");
    for (const link of categories.articulo.slice(0, 20)) {
      console.log(`  "${link.text}" -> ${link.href}`);
    }

    // Check for any links that might have product codes
    console.log("\n=== POTENTIAL PRODUCT LINKS (with codes) ===");
    const codePattern = /\d{4,}/; // Product codes are usually 4+ digits
    for (const link of links) {
      const href = await link.getAttribute("href");
      const text = (await link.textContent() || "").trim();
      
      if (href && codePattern.test(href)) {
        console.log(`  "${text}" -> ${href}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: "/tmp/jotakp-product-links.png", fullPage: true });
    console.log("\nScreenshot saved!");

    // Now let's try clicking on one of the category links to see if it shows products
    console.log("\n=== TRYING TO FIND PRODUCT DISPLAY ===");
    
    // Look for any element that might contain product info
    const priceElements = await page.locator("span:has-text('$')").all();
    console.log(`Price elements found: ${priceElements.length}`);
    
    for (const el of priceElements.slice(0, 5)) {
      const text = await el.textContent();
      console.log(`  Price: ${text}`);
    }

    // Look for images
    const images = await page.locator("img").all();
    console.log(`Images found: ${images.length}`);
    
    for (const img of images.slice(0, 10)) {
      const src = await img.getAttribute("src");
      const alt = await img.getAttribute("alt");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        console.log(`  Image: src="${src}" alt="${alt}"`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

findProductLinks();
