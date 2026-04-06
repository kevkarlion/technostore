import "dotenv/config";
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  
  // Count products by category "auricular-bluetooth"
  const count = await db.collection("products").countDocuments({
    categories: "auricular-bluetooth"
  });
  
  console.log(`Productos en categoría 'auricular-bluetooth': ${count}`);
  
  // Show some products
  const products = await db.collection("products")
    .find({ categories: "auricular-bluetooth" })
    .limit(5)
    .toArray();
  
  console.log("\nProductos encontrados:");
  products.forEach(p => {
    console.log(`- ${p.name.substring(0, 50)}... | stock: ${p.stock} | price: ${p.price}`);
  });
}

main().catch(console.error);
