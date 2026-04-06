import "dotenv/config";
import { getDb } from "@/config/db";

async function verifyAll() {
  const db = await getDb();
  
  const products = await db.collection("products").find({ 
    supplier: "jotakp",
    externalId: { $in: ["19879", "20174", "21735", "21884", "21887"] }
  }).toArray();
  
  console.log("=== Pendrive Products - Full Details ===\n");
  products.forEach((p: any) => {
    console.log(`ID: ${p.externalId}`);
    console.log(`  Name: ${p.name?.substring(0, 60)}...`);
    console.log(`  Price: ${p.price} ${p.currency}`);
    console.log(`  Image: ${p.imageUrls?.[0]}`);
    console.log(`  Description: ${p.description ? p.description.substring(0, 80) + "..." : "(empty)"}`);
    console.log("");
  });
}

verifyAll().catch(console.error);