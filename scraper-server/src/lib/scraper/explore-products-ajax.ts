/**
 * Obtener productos después de configurar el clasificador
 * Usage: npx tsx src/lib/scraper/explore-products-ajax.ts
 */

import { chromium } from "playwright";

async function getProducts() {
  console.log("🚀 Getting products via AJAX...\n");

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

    // Go directly to buscar page with subrubro
    console.log("\n=== NAVIGATING TO BUSCAR PAGE ===");
    await page.goto("http://jotakp.dyndns.org/buscar.aspx?idsubrubro1=5", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Now try to get the classifiers
    console.log("\n=== GETTING CLASSIFIERS ===");
    
    // First let's check what the page structure looks like
    const html = await page.content();
    
    // Look for the dropdown elements for classification
    const selects = await page.locator("select").all();
    console.log(`Selects found: ${selects.length}`);
    
    for (const select of selects) {
      const id = await select.getAttribute("id");
      const name = await select.getAttribute("name");
      console.log(`  Select: id="${id}", name="${name}"`);
      
      // Get all options
      const options = await select.locator("option").all();
      console.log(`    Options: ${options.length}`);
      
      for (let i = 0; i < Math.min(10, options.length); i++) {
        const text = await options[i].textContent();
        const value = await options[i].getAttribute("value");
        console.log(`      [${value}]: ${text}`);
      }
    }

    // Try calling PageMethods.CargarClasificadores after we're on the page
    console.log("\n=== CALLING WEBMETHODS ===");
    
    // First set the idsubrubro in a hidden field if needed
    const idsubrubroInput = await page.locator("input[name*='idsubrubro']").first();
    if (await idsubrubroInput.count() > 0) {
      const idValue = await idsubrubroInput.getAttribute("value");
      console.log(`idsubrubro value: ${idValue}`);
    }

    // Try to call the classifier loading
    const clasificadores = await page.evaluate(async () => {
      return new Promise((resolve) => {
        // @ts-ignore
        PageMethods.CargarClasificadores(
          (response: any) => resolve(response),
          (error: any) => resolve({ error: error.toString() })
        );
      });
    });
    
    console.log(`Clasificadores: ${JSON.stringify(clasificadores).substring(0, 2000)}`);

    // Now try to get articles directly using PageMethods
    // Looking at the JS, we need to use CargarArticulo with an article ID
    // Let's first get the list of article IDs from the dropdown
    
    // Wait a bit and reload page
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    
    // Try calling with timeout
    const clasificadores2 = await page.evaluate(async () => {
      return new Promise((resolve) => {
        // @ts-ignore
        setTimeout(() => {
          // @ts-ignore
          PageMethods.CargarClasificadores(
            (response: any) => resolve(response),
            (error: any) => resolve({ error: error.toString() })
          );
        }, 2000);
      });
    });
    
    console.log(`Clasificadores after wait: ${JSON.stringify(clasificadores2).substring(0, 2000)}`);

    // Take final screenshot
    await page.screenshot({ path: "/tmp/jotakp-products.png", fullPage: true });
    console.log("\nScreenshot saved!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

getProducts();
