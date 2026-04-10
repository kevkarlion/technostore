import "dotenv/config";
import { runIncrementalScraper } from "./src/lib/scraper/incremental-scraper.service";

async function runFullIncremental() {
  console.log("🚀 Starting FULL incremental scraper with resume...\n");
  console.log("💡 This will automatically resume from where it left off if interrupted\n");
  
  const result = await runIncrementalScraper(true);
  
  console.log("\n" + "=".repeat(50));
  console.log("=== FINAL RESULT ===");
  console.log("=".repeat(50));
  console.log(`Success: ${result.success}`);
  console.log(`Timestamp: ${result.timestamp}`);
  
  console.log("\n--- PRE-CHECK ---");
  console.log(`Total categories: ${result.preCheck.total}`);
  console.log(`Changed: ${result.preCheck.changed.length}`);
  console.log(`Unchanged: ${result.preCheck.unchanged.length}`);
  console.log(`Errors: ${result.preCheck.errors.length}`);
  
  if (result.scrapeResult) {
    console.log("\n--- SCRAPE RESULT ---");
    console.log(`Created (new products): ${result.scrapeResult.created}`);
    console.log(`Updated (price changes): ${result.scrapeResult.updated}`);
    console.log(`Errors: ${result.scrapeResult.errors.length}`);
    console.log(`Duration: ${result.scrapeResult.durationMs}ms (${Math.round(result.scrapeResult.durationMs / 60000)} min)`);
  }
}

runFullIncremental().catch(console.error);
