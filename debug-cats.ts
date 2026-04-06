import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Check categories in DB
  const categories = await db.collection("categories").find({}).toArray();
  console.log("Categories in DB:", categories.length);
  console.log(categories.map(c => c.slug));
  
  // Check if auricular-bluetooth exists
  const auricular = await db.collection("categories").findOne({ slug: "auricular-bluetooth" });
  console.log("\nauricular-bluetooth:", auricular);
  
  // Check products with category "149" (the numeric one we used)
  const products = await db.collection("products").find({ 
    supplier: "jotakp", 
    categories: "149" 
  }).limit(3).toArray();
  console.log("\nProducts with category 149:", products.map(p => ({ id: p.externalId, name: p.name.substring(0, 30) })));
}

check();