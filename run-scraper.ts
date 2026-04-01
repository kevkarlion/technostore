import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { runScraper } from "./src/lib/scraper/scraper.service";

runScraper()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.error(e));