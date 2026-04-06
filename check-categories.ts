import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  const count = await db.collection("products").countDocuments({ supplier: "jotakp" });
  console.log("Total products:", count);

  // Show categories with their product counts
  const cats = await db.collection("products").aggregate([
    { $match: { supplier: "jotakp" } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 }
  ]).toArray();

  console.log("\nTop 30 categories:");
  cats.forEach(c => console.log(c._id + ": " + c.count));
  
  // Check which have exactly 60 products (probably paginated)
  const paginated = cats.filter(c => c.count === 60);
  console.log("\nCategories with 60 products (probably need pagination):");
  paginated.forEach(c => console.log("  " + c._id));
}

check();