/**
 * Llamar WebMethod directamente
 * Usage: npx tsx src/lib/scraper/explore-pagemethod.ts
 */

import { chromium } from "playwright";

async function callWebMethod() {
  console.log("🚀 Calling WebMethod directly...\n");

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

    // Get session cookies
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // Get page elements for the POST request
    const viewState = await page.locator("#__VIEWSTATE").inputValue();
    const viewStateGenerator = await page.locator("#__VIEWSTATEGENERATOR").inputValue();
    const eventValidation = await page.locator("#__EVENTVALIDATION").inputValue();

    console.log(`\nViewState: ${viewState.substring(0, 50)}...`);
    console.log(`EventValidation: ${eventValidation.substring(0, 50)}...`);

    // Try calling the WebMethod using page.evaluate
    console.log("\n=== CALLING WEBMETHOD VIA JAVASCRIPT ===");

    // First let's see what PageMethods are available
    const pageMethodsAvailable = await page.evaluate(() => {
      // @ts-ignore
      return typeof PageMethods !== 'undefined';
    });
    console.log(`PageMethods available: ${pageMethodsAvailable}`);

    // Try to call the CargarClasificadores method
    const result = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        if (typeof PageMethods !== 'undefined') {
          // @ts-ignore
          PageMethods.CargarClasificadores(
            (response: any) => resolve({ success: true, data: response }),
            (error: any) => resolve({ success: false, error: error })
          );
        } else {
          resolve({ success: false, error: 'PageMethods not found' });
        }
      });
    });

    console.log(`Result:`, JSON.stringify(result, null, 2).substring(0, 2000));

    // Take screenshot after the call
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/jotakp-pagemethod.png", fullPage: true });
    console.log("\nScreenshot saved!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await browser.close();
  }
}

callWebMethod();
