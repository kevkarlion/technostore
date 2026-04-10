import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  await client.connect();
  const db = client.db('ecommerce');

  const productsCount = await db.collection('products').countDocuments({ status: 'active' });
  console.log('Productos activos:', productsCount);

  const runsCount = await db.collection('scraper_runs').countDocuments({ status: 'completed' });
  console.log('Runs completados:', runsCount);

  const lastRuns = await db.collection('scraper_runs').find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10).toArray();
  console.log('\nÚltimos 10 runs completados:');
  lastRuns.forEach(r => console.log('  -', r.lastCategoryName, new Date(r.createdAt).toLocaleString()));

  await client.close();
}

main().catch(console.error);