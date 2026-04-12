import "dotenv/config";
import { getDb } from "@/config/db";

async function checkAttributes() {
  const db = await getDb();
  
  // Find products with attributes
  const products = await db.collection('products').find({ 
    "attributes.0": { $exists: true }
  }).limit(5).toArray();
  
  console.log("=== Products with attributes ===\n");
  for (const p of products) {
    console.log(`ID: ${p.externalId}`);
    console.log(`  Name: ${p.name?.substring(0, 50)}...`);
    console.log(`  Attributes:`);
    for (const attr of p.attributes || []) {
      console.log(`    - ${attr.key}: ${attr.value}`);
    }
    console.log("");
  }
}

checkAttributes().catch(console.error);