/**
 * Scrape ALL subcategories from Almacenamiento WITH ATTRIBUTES
 * Usage: npx tsx src/lib/scraper/scrape-almacenamiento-all.ts
 */

import "dotenv/config";
import { chromium } from "playwright";
import { productRepository } from "@/api/repository/product.repository";

// All Almacenamiento subcategories with their idsubrubro1
const ALMACENAMIENTO_SUBCATEGORIES = [
  { id: "carry-caddy-disk", name: "Carry-Caddy Disk", idsubrubro1: 100 },
  { id: "cd-dvd-bluray", name: "CD-DVD-BluRay-Dual Layer", idsubrubro1: 13 },
  { id: "discos-externos", name: "Discos Externos", idsubrubro1: 14 },
  { id: "discos-hdd", name: "Discos HDD", idsubrubro1: 69 },
  { id: "discos-m2", name: "Discos M.2", idsubrubro1: 157 },
  { id: "discos-ssd", name: "Discos SSD", idsubrubro1: 156 },
  { id: "memorias-flash", name: "Memorias Flash", idsubrubro1: 12 },
];

/**
 * Scrape attributes from a product detail page
 */
async function scrapeAttributes(page: any): Promise<Array<{ key: string; value: string }>> {
  const attributes: Array<{ key: string; value: string }> = [];
  
  try {
    const container = await page.locator(".container-fluid.row.p-0.m-0.tg-border-top.pb-3").first();
    
    if (await container.count() > 0) {
      const rows = await container.locator(".row").all();
      
      for (const row of rows) {
        const cols = await row.locator(".col-6").all();
        if (cols.length === 2) {
          const key = (await cols[0].textContent() || "").trim();
          const value = (await cols[1].textContent() || "").trim();
          if (key && value) {
            attributes.push({ key, value });
          }
        }
      }
    }
  } catch (e) {
    // No attributes found
  }
  
  return attributes;
}

async function scrapeAllAlmacenamiento() {
  console.log("🚀 Scraping ALL Almacenamiento subcategories (with attributes)...\n");

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

    let totalProducts = 0;
    let totalWithAttributes = 0;
    let totalErrors = 0;

    // Process each subcategory
    for (const subcat of ALMACENAMIENTO_SUBCATEGORIES) {
      console.log(`\n=== ${subcat.name} (id=${subcat.idsubrubro1}) ===`);
      
      // Go to subcategory page
      const url = `http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=${subcat.idsubrubro1}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(3000);

      // Get all product links
      const productLinks = await page.locator("a[href*='articulo.aspx?id=']").all();
      console.log(`  Found ${productLinks.length} products`);
      
      if (productLinks.length === 0) {
        console.log("  ⚠️ No products found");
        continue;
      }

      // Parse products from list
      const products: Array<{
        externalId: string;
        name: string;
        priceUSD: string;
        href: string;
      }> = [];

      for (const link of productLinks) {
        const href = await link.getAttribute("href");
        const fullText = (await link.textContent() || "").trim();
        
        const idMatch = href?.match(/id=(\d+)/);
        const productId = idMatch?.[1] || "";
        
        // Parse: "NameU$D price+ IVA 21%"
        const nameMatch = fullText.match(/^(.*?)U\$D/);
        const name = nameMatch?.[1]?.trim() || "";
        
        const pricePart = fullText.replace(/^.*?U\$D/, "").trim();
        const usdMatch = pricePart.match(/^([\d.,]+)\+/);
        const usdPrice = usdMatch?.[1] || "0";
        
        if (productId && name) {
          products.push({
            externalId: productId,
            name,
            priceUSD: usdPrice,
            href: href || ""
          });
        }
      }

      console.log(`  Parsed ${products.length} products from list`);

      // Now visit each detail page to get description, image and attributes
      for (const product of products) {
        try {
          await page.goto(`http://jotakp.dyndns.org/articulo.aspx?id=${product.externalId}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(1000);
          
          // Get description
          const descElement = await page.locator("#divArticuloDescripcion").first();
          let description = "";
          if (await descElement.count() > 0) {
            description = (await descElement.textContent() || "").trim();
            if (description === "Sin descripción") description = "";
          }
          
          // Get image URL
          const imgDiv = await page.locator("[id^='imgArt']").first();
          let imageUrl = "";
          if (await imgDiv.count() > 0) {
            try {
              const style = await imgDiv.getAttribute("style") || "";
              const imgMatch = style.match(/url\(([^)]+)\)/);
              imageUrl = imgMatch?.[1] || "";
            } catch (e) {
              // No image
            }
          }
          
          const fullImageUrl = imageUrl ? `https://jotakp.dyndns.org/${imageUrl}` : "";
          
          // Get attributes
          const attributes = await scrapeAttributes(page);
          
          if (attributes.length > 0) {
            totalWithAttributes++;
            console.log(`  ✅ ${product.externalId}: ${attributes.length} attributes`);
          }
          
          // Save to DB
          await productRepository.upsertByExternalId({
            externalId: product.externalId,
            supplier: "jotakp",
            name: product.name,
            description: description,
            price: parseFloat(product.priceUSD.replace(",", ".")),
            currency: "USD",
            stock: 0,
            sku: product.externalId.padStart(7, "0"),
            imageUrls: [fullImageUrl],
            categories: [subcat.id],
            attributes: attributes,
          });
          
          console.log(`  ✅ ${product.externalId}: ${product.name.substring(0, 40)}... - $${product.priceUSD}`);
          
        } catch (err) {
          console.log(`  ❌ Error processing ${product.externalId}: ${err}`);
          totalErrors++;
        }
      }

      totalProducts += products.length;
    }

    console.log(`\n=== DONE ===`);
    console.log(`Total products scraped: ${totalProducts}`);
    console.log(`Products with attributes: ${totalWithAttributes}`);
    console.log(`Total errors: ${totalErrors}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

scrapeAllAlmacenamiento();