import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { runIncrementalScraper } from "./src/lib/scraper/incremental-scraper.service";

// Parse command line: npm run scraper:incremental -- --force
const args = process.argv.slice(2);
const forceFullScrape = args.includes("--force");

console.log("[Incremental] Starting with force:", forceFullScrape);

runIncrementalScraper(forceFullScrape)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.error(e));