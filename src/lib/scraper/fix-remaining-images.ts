/**
 * Fix remaining products with errors (re-run after browser crash)
 * Run: npx tsx src/lib/scraper/fix-remaining-images.ts
 */

import "dotenv/config";
import { chromium, Browser, Page } from "playwright";
import { getDb } from "@/config/db";

const BASE_URL = "https://jotakp.dyndns.org";

// Products that still have more than 2 images (need fixing)
const FAILED_PRODUCTS = [
  "21848", "940", "6227", "8334", "8335", "9309", "9313", "9927", "9936", "9937",
  "12133", "12944", "12945", "13419", "13420", "13571", "13686", "13687", "13688",
  "13925", "13931", "13932", "14864", "14865", "14940", "15218", "15219", "15762",
  "15851", "17733", "17948", "19004", "19007", "19008", "19010", "19168", "19268",
  "19975", "19984", "20178", "20211", "20273", "20274", "20276", "20460", "20482",
  "20483", "20499", "20501", "20502", "20503", "20757", "20764", "20765", "20766",
  "20767", "20768", "21111", "21112", "21298", "18962", "19051", "19102", "19264",
  "19265", "19276", "19811", "19923", "19924", "20079", "20091", "20098", "20263",
  "21064", "21150", "21266", "21703", "21719", "21759", "21778", "21854", "21862",
  "21863", "21864", "21865", "21883", "18898", "21866", "21867", "17852", "17873",
  "18825", "19279", "19302", "21713", "2376", "2944", "4982", "5860", "6040",
  "8119", "8679", "9129", "13027", "13621", "13850", "14131", "14132", "14426",
  "14427", "14460", "14840", "15376", "16434", "16681", "16682", "17003", "17084",
  "17112", "17113", "17273", "17606", "17834", "17835", "17999", "18631", "18874",
  "18916", "19182", "19185", "19226", "19673", "19674", "19962", "20159", "21094",
  "21126", "21127", "21128", "21129", "21147", "21560", "21815", "21816", "21875",
  "114", "322", "327", "329", "332", "333", "334", "1926", "2411", "2414", "2415",
  "2504", "2632", "2633", "4697", "5883", "5884", "5885", "7582", "7662", "8474",
  "9397", "10479", "10494", "10572", "10593", "10595", "11368", "11369", "11403",
  "11404", "11805", "12023", "13625", "13626", "13627", "14830", "14832", "14833",
  "14835", "14836", "15390", "15795", "15840", "15843", "16396", "16792", "16793",
  "16802", "17764", "17770", "17847", "17940", "17941", "17942", "17943", "17945",
  "17946", "89", "3016", "6752", "9107", "10777", "11255", "14401", "14820", "14862",
  "15372", "15399", "15400", "15401", "15793", "16349", "16399", "16505", "16937",
  "17771", "18118", "18157", "18174", "18221", "18232", "18298", "18301", "18302",
  "18303", "18345", "18516", "18777", "19040", "19156", "19214", "19217", "19218",
  "19219", "19401", "19635", "19650", "20029", "20032", "20044", "20045", "20046",
  "20668", "20669", "20842", "20932", "20933", "20934", "20935", "20936", "20938",
  "21205", "21337", "21417", "21428", "21429", "21630", "9734", "11354", "13729",
  "13738", "16797", "21355", "21599", "9919", "10486", "11400", "11401", "11402",
  "13615", "14398", "14400", "14960", "16391", "16394", "17710", "18770", "18771",
  "19413", "19414", "19664", "19667", "19668", "19816", "20212", "21302", "21396",
  "21629", "5366", "8464", "10462", "12159"
];

async function getProductImages(page: any): Promise<string[]> {
  const images: string[] = [];
  
  try {
    // Get main product image
    const mainImg = await page.locator("img#artImg").first();
    if (await mainImg.count() > 0) {
      const src = await mainImg.getAttribute("src") || "";
      if (src && src.includes("imagenes")) {
        // Fix the URL - ensure proper format
        let fullUrl = src.startsWith("http") ? src : `${BASE_URL}/${src.replace(/^\/+/, "")}`;
        
        // Fix: ensure 7-digit format for image ID
        const match = fullUrl.match(/imagenes\/(\d+)\.(\w+)/i);
        if (match) {
          const id = match[1].padStart(7, "0");
          const ext = match[2];
          fullUrl = `${BASE_URL}/imagenes/${id}.${ext}`;
        }
        
        images.push(fullUrl);
      }
    }
    
    // Get thumbnails from product area
    const productArea = page.locator("div.col-12.col-md-8").first();
    
    if (await productArea.count() > 0) {
      const thumbDivs = await productArea.locator("div[style*='background-image']").all();
      
      for (const div of thumbDivs) {
        const style = await div.getAttribute("style") || "";
        const imgMatch = style.match(/url\(([^)]+)\)/);
        const imgUrl = imgMatch?.[1] || "";
        
        if (imgUrl && imgUrl.includes("imagenes/min/")) {
          const thumbMatch = imgUrl.match(/imagenes\/min\/imagen(\d+)\.jpg/i);
          if (thumbMatch) {
            // Ensure 7-digit padding
            const imageId = thumbMatch[1].padStart(7, "0");
            const fullUrl = `${BASE_URL}/imagenes/${imageId}.JPG`;
            
            if (!images.includes(fullUrl)) {
              images.push(fullUrl);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(`     ⚠️ Error: ${e}`);
  }
  
  return images;
}

async function fixRemaining() {
  const db = await getDb();
  
  console.log(`Processing ${FAILED_PRODUCTS.length} products\n`);

  let browser: Browser | null = null;
  let context: any = null;
  let page: any = null;

  try {
    // Initialize browser
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    context = await browser.newContext();
    page = await context.newPage();

    // Login
    console.log("=== LOGIN ===");
    await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#TxtEmail", "20418216795");
    await page.fill("#TxtPass1", "123456");
    await page.click("#BtnIngresar");
    await page.waitForLoadState("networkidle", { timeout: 30000 });
    console.log("✅ Logged in!\n");

    let fixed = 0;
    let errors = 0;

    for (let i = 0; i < FAILED_PRODUCTS.length; i++) {
      const externalId = FAILED_PRODUCTS[i];
      
      try {
        await page.goto(`${BASE_URL}/articulo.aspx?id=${externalId}`, { 
          waitUntil: "networkidle" 
        });
        await page.waitForTimeout(800);

        const correctImages = await getProductImages(page);
        
        if (correctImages.length > 0) {
          await db.collection("products").updateOne(
            { externalId: parseInt(externalId) },
            { $set: { imageUrls: correctImages, updatedAt: new Date() } }
          );
          console.log(`✅ ${externalId}: fixed`);
          fixed++;
        } else {
          console.log(`⚠️ ${externalId}: no images found`);
          errors++;
        }

      } catch (err) {
        console.log(`❌ ${externalId}: ${err}`);
        errors++;
        
        // Restart browser if crashed
        if (browser.isConnected() === false) {
          console.log("🔄 Restarting browser...");
          browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
          context = await browser.newContext();
          page = await context.newPage();
          
          // Re-login
          await page.goto(`${BASE_URL}/loginext.aspx`, { waitUntil: "networkidle", timeout: 30000 });
          await page.fill("#TxtEmail", "20418216795");
          await page.fill("#TxtPass1", "123456");
          await page.click("#BtnIngresar");
          await page.waitForLoadState("networkidle", { timeout: 30000 });
        }
      }
      
      // Progress every 50
      if ((i + 1) % 50 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${FAILED_PRODUCTS.length}\n`);
      }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    if (browser) await browser.close();
  }
}

fixRemaining();