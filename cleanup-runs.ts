import "dotenv/config";
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  
  // Find all incomplete runs
  const runs = await db.collection("scraper_runs")
    .find({ status: "in_progress" })
    .toArray();
  
  console.log("Runs in_progress:");
  runs.forEach((r: any) => {
    console.log(`- ${r.runId}: ${r.source} | category: ${r.lastCategoryName} | page: ${r.lastPageNumber}`);
  });
  
  if (runs.length > 0) {
    console.log("\nLimpiando runs incompletos...");
    
    // Delete them
    const result = await db.collection("scraper_runs")
      .deleteMany({ status: "in_progress" });
    
    console.log(`Eliminados ${result.deletedCount} runs`);
  } else {
    console.log("\nNo hay runs incompletos");
  }
}

main().catch(console.error);
