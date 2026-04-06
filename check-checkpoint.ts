import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Check all checkpoints
  const checkpoints = await db.collection("scraper_checkpoints")
    .find({})
    .sort({ updatedAt: -1 })
    .limit(10)
    .toArray();
  
  console.log("=== Recent Checkpoints ===\n");
  checkpoints.forEach(cp => {
    console.log(`Run: ${cp.runId}`);
    console.log(`Status: ${cp.status}`);
    console.log(`Category: ${cp.currentCategoryId} (index ${cp.currentCategoryIndex})`);
    console.log(`Products: ${cp.totalProducts}, Pages: ${cp.totalPages}`);
    console.log(`Updated: ${cp.updatedAt}`);
    if (cp.lastError) console.log(`Error: ${cp.lastError.substring(0, 100)}`);
    console.log("---");
  });
}

check();