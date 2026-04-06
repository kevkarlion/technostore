import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { runScraper } from "./src/lib/scraper/scraper.service";
import type { ScraperRunRequest } from "./src/lib/scraper/types";

// Parse command line arguments: npm run scraper -- --idsubrubro1 149
const args = process.argv.slice(2);
console.log("[Scraper] Args:", args);

const request: ScraperRunRequest = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--idsubrubro1") {
    request.idsubrubro1 = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === "--categoryId") {
    request.categoryId = args[i + 1];
    i++;
  } else if (args[i] === "--source") {
    request.source = args[i + 1];
    i++;
  }
}

console.log("[Scraper] Starting with request:", request);

runScraper(request)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.error(e));