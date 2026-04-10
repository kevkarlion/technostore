import "dotenv/config";
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  
  // Get total products
  const total = await db.collection('products').countDocuments();
  console.log('Total products:', total);
  
  // Get unique categories
  const categories = await db.collection('products').distinct('category_id');
  console.log('\nUnique categories:', categories.length);
  console.log(categories.slice(0, 20));
  
  // Check if category 149 might be stored differently
  const products149 = await db.collection('products').find({ categories: "149" }).toArray();
  console.log('\nProducts with categories containing "149":', products149.length);
  
  process.exit(0);
}

main();