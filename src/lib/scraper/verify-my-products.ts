import "dotenv/config";
import { getDb } from "@/config/db";

async function verifyMyProducts() {
  const db = await getDb();
  
  // Search for my specific products by externalId
  const products = await db.collection("products").find({ 
    supplier: "jotakp",
    externalId: { $in: ["19879", "20174", "21735", "21884", "21887"] }
  }).toArray();
  
  console.log("=== My 5 Pendrive Products ===\n");
  products.forEach((p: any) => {
    console.log(`- ${p.name.substring(0, 70)}`);
    console.log(`  externalId: ${p.externalId}`);
    console.log(`  categories: ${p.categories}`);
    console.log();
  });

  // Get the "pendrive" category
  const pendriveCat = await db.collection("categories").findOne({ slug: "pendrive" });
  console.log("=== Pendrive Category ===");
  console.log(pendriveCat);
  
  // Get the "almacenamiento" parent category
  const almacenamientoCat = await db.collection("categories").findOne({ slug: "almacenamiento" });
  console.log("\n=== Almacenamiento Parent Category ===");
  console.log(almacenamientoCat);
}

verifyMyProducts().catch(console.error);