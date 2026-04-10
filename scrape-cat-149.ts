/**
 * Scrape category 149 - Audio Auricular Bluetooth
 * using the main ScraperService
 * 
 * Run: npx tsx scrape-cat-149.ts
 */

import "dotenv/config";
import { ScraperService } from "./src/lib/scraper/scraper.service";
import type { ScraperRunRequest } from "./src/lib/scraper/types";

async function main() {
  // Filter to only scrape category 149 (Auricular Bluetooth)
  const request: ScraperRunRequest = {
    source: "jotakp",
    idsubrubro1: 149,  // Audio Auricular Bluetooth
  };
  
  const scraper = new ScraperService(undefined, request);
  
  try {
    console.log("🚀 Starting scrape of category 149 - Audio Auricular Bluetooth\n");
    
    const result = await scraper.run();
    
    console.log("\n=== RESULT ===");
    console.log(`Success: ${result.success}`);
    console.log(`Created: ${result.created}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    
    if (result.errors.length > 0) {
      console.log("\nErrors:");
      result.errors.forEach(e => console.log(`  - ${e}`));
    }
    
  } catch (error) {
    console.error("❌ Fatal error:", error);
  }
  
  process.exit(0);
}

main();