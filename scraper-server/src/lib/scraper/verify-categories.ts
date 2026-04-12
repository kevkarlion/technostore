import "dotenv/config";
import { getDb } from "@/config/db";

async function verifyCategories() {
  const db = await getDb();
  
  const categories = ['carry-caddy-disk', 'cd-dvd-bluray', 'discos-externos', 'discos-hdd', 'discos-m2', 'discos-ssd', 'memorias-flash', 'pendrive'];
  
  console.log("=== Product Count by Category ===\n");
  for (const cat of categories) {
    const count = await db.collection('products').countDocuments({ categories: cat });
    console.log(`${cat}: ${count} products`);
  }
  
  const total = await db.collection('products').countDocuments({ supplier: 'jotakp' });
  console.log(`\nTotal jotakp products: ${total}`);
}

verifyCategories().catch(console.error);