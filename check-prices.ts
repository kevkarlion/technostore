import "dotenv/config";
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  const collection = db.collection("products");

  // Ver productos de carry-caddy-disk
  const products = await collection
    .find({ categories: "carry-caddy-disk" })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  console.log(`\n=== Productos en carry-caddy-disk (últimos 10) ===\n`);
  products.forEach((p: any) => {
    console.log(`Nombre: ${p.name?.substring(0, 50)}...`);
    console.log(`  price: ${p.price}`);
    console.log(`  priceRaw: ${p.priceRaw}`);
    console.log(`  currency: ${p.currency}`);
    console.log(`  createdAt: ${p.createdAt}`);
    console.log("");
  });

  console.log(`\nTotal en categoría: ${await collection.countDocuments({ categories: "carry-caddy-disk" })}`);
}

main().catch(console.error);