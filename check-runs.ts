import "dotenv/config";
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  const runs = await db.collection('scraperRuns').find({ status: 'incomplete' }).toArray();
  console.log('Incomplete runs:', runs.length);
  runs.forEach(r => console.log(' -', r.runId, 'at index', r.currentCategoryIndex));
  process.exit(0);
}

main();