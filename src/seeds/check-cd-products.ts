import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Ver productos en cajas-cd-dvd-bluray
  const total = await db.collection("products").countDocuments({ categories: "cajas-cd-dvd-bluray" });
  const withCost = await db.collection("products").countDocuments({ 
    categories: "cajas-cd-dvd-bluray", 
    costPrice: { $exists: true, $ne: null } 
  });
  const withoutCost = await db.collection("products").countDocuments({ 
    categories: "cajas-cd-dvd-bluray", 
    $or: [{ costPrice: { $exists: false } }, { costPrice: null }] 
  });
  
  console.log(`📊 Cajas CD/DVD/Bluray:`);
  console.log(`  Total: ${total}`);
  console.log(`  Con costPrice: ${withCost}`);
  console.log(`  Sin costPrice: ${withoutCost}`);
  
  // Mostrar algunos ejemplos
  const samples = await db.collection("products")
    .find({ categories: "cajas-cd-dvd-bluray" })
    .project({ name: 1, costPrice: 1, price: 1 })
    .limit(5)
    .toArray();
  
  console.log("\n🔍 Ejemplos:");
  samples.forEach((p: any) => {
    console.log(`  - ${p.name}`);
    console.log(`    price: $${p.price}, costPrice: ${p.costPrice ?? 'N/A'}`);
  });
}

check().then(() => process.exit());
