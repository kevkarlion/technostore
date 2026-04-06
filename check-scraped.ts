import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  const count = await db.collection("products").countDocuments({ supplier: "jotakp" });
  console.log(`Total products in DB: ${count}`);
  
  // Products per category
  const byCategory = await db.collection("products").aggregate([
    { $match: { supplier: "jotakp" } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]).toArray();
  
  console.log("\nTop categories:");
  byCategory.forEach(c => console.log(`  ${c._id}: ${c.count}`));
}

check();