import "dotenv/config";
import { getDb } from "@/config/db";
import { jotakpCategories } from "./src/lib/scraper/config";

async function check() {
  const db = await getDb();
  
  // Get all unique categories that have products
  const categoriesWithProducts = await db.collection("products").aggregate([
    { $match: { supplier: "jotakp" } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log("=== Categories with products in DB ===\n");
  
  // Get all subcategories
  const allSubcategories = jotakpCategories.filter(c => c.idsubrubro1 !== 0 && c.parentId !== null);
  
  // Find the index of the last category with products
  let lastIndex = -1;
  
  for (let i = allSubcategories.length - 1; i >= 0; i--) {
    const cat = allSubcategories[i];
    const found = categoriesWithProducts.find(c => c._id === cat.id);
    if (found && found.count > 0) {
      lastIndex = i;
      console.log(`Found products for: ${cat.id} (index ${i}) - ${found.count} products`);
      break;
    }
  }
  
  console.log(`\nLast category with products: index ${lastIndex}`);
  console.log(`Next category to scrape: index ${lastIndex + 1}`);
  
  if (lastIndex >= 0 && lastIndex < allSubcategories.length - 1) {
    const nextCat = allSubcategories[lastIndex + 1];
    console.log(`\nTo resume, run: npx tsx src/lib/scraper/scrape-with-checkpoints.ts ${lastIndex + 1}`);
  }
}

check();