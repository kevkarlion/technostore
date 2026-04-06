import "dotenv/config";
import { getDb } from "@/config/db";

async function checkImages() {
  const db = await getDb();
  
  const products = await db.collection("products").find({ 
    supplier: "jotakp",
    externalId: { $in: ["19879", "20174", "21735", "21884", "21887"] }
  }).toArray();
  
  console.log("=== Product Images ===\n");
  products.forEach((p: any) => {
    console.log(`${p.externalId}: ${p.imageUrls?.[0] || 'NO IMAGE'}`);
  });
}

checkImages().catch(console.error);