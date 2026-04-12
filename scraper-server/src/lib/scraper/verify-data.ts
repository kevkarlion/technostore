import "dotenv/config";
import { getDb } from "@/config/db";

async function verify() {
  const db = await getDb();
  
  const products = await db.collection("products").find({ supplier: "jotakp" }).toArray();
  console.log("=== Products in DB ===\n");
  products.forEach((p: any) => {
    console.log("- " + p.name.substring(0, 60));
    console.log("  categories:", p.categories);
    console.log();
  });

  const categories = await db.collection("categories").find({ slug: "pendrive" }).toArray();
  console.log("=== Pendrive Category ===");
  console.log(JSON.stringify(categories, null, 2));
  
  const almacenamiento = await db.collection("categories").find({ slug: "almacenamiento" }).toArray();
  console.log("\n=== Almacenamiento Category ===");
  console.log(JSON.stringify(almacenamiento, null, 2));
}

verify().catch(console.error);