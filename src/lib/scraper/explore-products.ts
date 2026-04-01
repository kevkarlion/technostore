/**
 * Script de exploración del sitio del proveedor - Productos
 * Este script navega a la página de productos después del login
 * 
 * Usage: npx tsx src/lib/scraper/explore-products.ts
 */

import { chromium } from "playwright";

async function exploreProducts() {
  console.log("🚀 Starting product exploration...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ===== LOGIN =====
    console.log("=== LOGIN ===");
    const loginUrl = "http://jotakp.dyndns.org/loginext.aspx";
    await page.goto(loginUrl, { waitUntil: "networkidle" });

    // Fill login form with the selectors we found
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    
    await page.waitForLoadState("networkidle");
    console.log(`Logged in! Current URL: ${page.url()}`);

    // ===== EXPLORAR PÁGINA PRINCIPAL =====
    console.log("\n=== MAIN PAGE STRUCTURE ===");
    
    // Get main content areas
    const mainContent = await page.locator("main, #main, .main, .content, .container").first();
    console.log(`Main content element found: ${await mainContent.count() > 0}`);
    
    // Look for navigation menus
    const navElements = await page.locator("nav, .nav, #nav, .menu, .navbar").all();
    console.log(`Found ${navElements.length} navigation elements`);

    // Find all links and categorize them
    const allLinks = await page.locator("a").all();
    console.log(`Total links: ${allLinks.length}`);

    // Categorize links
    console.log("\n=== LINK CATEGORIES ===");
    const categories: { [key: string]: string[] } = {
      productos: [],
      buscar: [],
      catalogo: [],
      categoria: [],
      otro: []
    };

    for (const link of allLinks) {
      const href = await link.getAttribute("href");
      const text = (await link.textContent() || "").trim().toLowerCase();
      
      if (!href || href === "#") continue;
      
      const linkInfo = `${text} -> ${href}`;
      
      if (href.includes("product") || text.includes("product")) {
        categories.productos.push(linkInfo);
      } else if (href.includes("buscar") || text.includes("buscar")) {
        categories.buscar.push(linkInfo);
      } else if (href.includes("catalogo") || text.includes("catalogo")) {
        categories.catalogo.push(linkInfo);
      } else if (href.includes("categoria") || href.includes("idsubrubro")) {
        categories.categoria.push(linkInfo);
      }
    }

    // Print interesting links
    console.log("\n--- Buscar/Catalogo links (first 20) ---");
    for (const link of [...categories.buscar, ...categories.catalogo, ...categories.categoria].slice(0, 20)) {
      console.log(`  ${link}`);
    }

    // ===== EXPLORAR PÁGINA DE PRODUCTOS =====
    console.log("\n=== EXPLORING PRODUCTS PAGE ===");
    
    // Try to find a products link - look for specific patterns
    // From the first exploration, we saw: buscar.aspx?idsubrubro1=126
    const productsUrl = "http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=126";
    await page.goto(productsUrl, { waitUntil: "networkidle" });
    console.log(`Products page URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    // ===== BUSCAR ELEMENTOS DE PRODUCTOS =====
    console.log("\n=== PRODUCT ELEMENTS ===");

    // Look for common product container patterns
    const productSelectors = [
      ".product",
      ".producto",
      ".item",
      ".articulo",
      ".card",
      "[class*='product']",
      "[class*='item']",
      "[class*='card']",
      "table",
      ".grid",
      ".list"
    ];

    for (const selector of productSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`  Selector "${selector}": ${elements.length} elements`);
      }
    }

    // Look for tables (common in ASP.NET)
    const tables = await page.locator("table").all();
    console.log(`\nFound ${tables.length} tables`);
    
    for (let i = 0; i < Math.min(tables.length, 5); i++) {
      const table = tables[i];
      const rows = await table.locator("tr").all();
      const cells = await table.locator("td").all();
      console.log(`  Table ${i + 1}: ${rows.length} rows, ${cells.length} cells`);
      
      // Get first row as sample
      if (rows.length > 0) {
        const firstRowCells = await rows[0].locator("td, th").all();
        console.log(`    First row cells:`);
        for (const cell of firstRowCells.slice(0, 5)) {
          const text = (await cell.textContent() || "").trim().substring(0, 50);
          const classAttr = await cell.getAttribute("class");
          console.log(`      [${classAttr}]: "${text}"`);
        }
      }
    }

    // Look for links that might be products
    console.log("\n=== PRODUCT-RELATED LINKS ===");
    const productLinks = await page.locator("a").all();
    for (const link of productLinks.slice(0, 30)) {
      const href = await link.getAttribute("href");
      const text = (await link.textContent() || "").trim();
      if (href && (href.includes("Producto") || href.includes("articulo") || 
          text.toLowerCase().includes("producto") || text.toLowerCase().includes("articulo"))) {
        console.log(`  "${text}" -> ${href}`);
      }
    }

    // Get full HTML for analysis
    console.log("\n=== PAGE HTML SAMPLE (products section) ===");
    const bodyHtml = await page.locator("body").innerHTML();
    console.log(bodyHtml.substring(0, 5000));

    console.log("\n✅ Product exploration complete!");

  } catch (error) {
    console.error("❌ Exploration failed:", error);
  } finally {
    await browser.close();
  }
}

exploreProducts();
