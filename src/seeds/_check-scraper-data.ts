import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();

  const runs = await db.collection("scraper_runs").find().sort({ createdAt: -1 }).limit(1).toArray();
  console.log("Last scraper run:", JSON.stringify(runs[0]?.stats || "none", null, 2));

  const productsCount = await db.collection("products").countDocuments();
  console.log("Products count:", productsCount);

  // Check if there's any backup collection
  const collections = await db.listCollections().toArray();
  const collNames = collections.map(c => c.name);
  const backupColls = collNames.filter(n => n.includes("backup") || n.includes("dump") || n.includes("old"));
  console.log("Backup collections:", backupColls);

  process.exit();
}
check();
