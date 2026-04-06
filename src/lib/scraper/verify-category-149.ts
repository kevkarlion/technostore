/**
 * Verify scraped products from category 149
 * Run: npx tsx src/lib/scraper/verify-category-149.ts
 */

import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Check products with category 149
  const count = await db.collection("products").countDocuments({
    supplier: "jotakp",
    categories: "149"
  });
  
  console.log(`📦 Productos con categoría '149': ${count}`);
  
  // Show some products
  const products = await db.collection("products")
    .find({ supplier: "jotakp", categories: "149" })
    .limit(10)
    .toArray();
  
  console.log("\nProductos encontrados:");
  products.forEach(p => {
    console.log(`- ${p.externalId}: ${p.name.substring(0, 45)}...`);
    console.log(`  💰 ${p.price} ${p.currency} | 📷 ${p.imageUrls?.[0]?.substring(0, 60) || 'SIN IMAGEN'}`);
    console.log(`  📝 Attrs: ${p.attributes?.length || 0}`);
  });
}

check().catch(console.error);