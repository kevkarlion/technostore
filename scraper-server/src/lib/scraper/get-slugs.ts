import "dotenv/config";
import { getDb } from "@/config/db";

async function getSlugs() {
  const db = await getDb();
  
  // Find products with attributes and get their slugs
  const products = await db.collection('products').find({ 
    "attributes.0": { $exists: true }
  }).limit(5).toArray();
  
  const generateSlug = (name: string) => {
    const cleaned = name
      .replace(/U\$D\s*[\d,]+\+?\s*IVA.*$/i, "")
      .replace(/\$[\d,]+\.?\d*/g, "")
      .replace(/\+?\s*IVA.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };
  
  console.log("=== Product URLs with attributes ===\n");
  for (const p of products) {
    const slug = generateSlug(p.name);
    console.log(`http://localhost:3000/products/${slug}`);
    console.log(`  Name: ${p.name.substring(0, 50)}...`);
    console.log("");
  }
}

getSlugs().catch(console.error);