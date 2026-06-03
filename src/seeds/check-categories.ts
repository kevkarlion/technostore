import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Ver todas las categorías únicas en productos
  const categories = await db.collection("products").distinct("categories");
  console.log(`📊 Categorías únicas en productos (${categories.length}):`);
  categories.sort().forEach((c: string) => console.log(`  - ${c}`));
  
  // Ver productos con "almacenamiento" o similar
  console.log("\n🔍 Productos en categoría 'almacenamiento':");
  const storageProducts = await db.collection("products")
    .find({ categories: "almacenamiento" })
    .project({ name: 1, categories: 1 })
    .limit(10)
    .toArray();
  console.log(`  Total: ${await db.collection("products").countDocuments({ categories: "almacenamiento" })}`);
  storageProducts.forEach((p: any) => console.log(`  - ${p.name}`));
  
  // Buscar productos que contengan "caja", "cd", "dvd", "bluray" en el nombre
  console.log("\n🔍 Productos con 'caja', 'cd', 'dvd', 'bluray' en el nombre:");
  const cdProducts = await db.collection("products")
    .find({ name: { $regex: /caja|cd|dvd|bluray/i } })
    .project({ name: 1, categories: 1 })
    .limit(20)
    .toArray();
  console.log(`  Total: ${await db.collection("products").countDocuments({ name: { $regex: /caja|cd|dvd|bluray/i } })}`);
  cdProducts.forEach((p: any) => console.log(`  - ${p.name} [${p.categories?.join(", ")}]`));
}

check().then(() => process.exit());
