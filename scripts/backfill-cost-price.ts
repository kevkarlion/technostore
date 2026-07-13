/**
 * Backfill migration: products where costPrice is null
 *
 * For each product:
 * - If costPrice is null but price exists → set costPrice = price, profitMargin = 0
 * - If both costPrice and profitMargin are null → set costPrice = price, profitMargin = 0
 * - If costPrice exists but profitMargin is null → set profitMargin = 0
 *
 * Run: npx tsx scripts/backfill-cost-price.ts
 */

import { MongoClient } from "mongodb";

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://kriquelme10_db_user:tfLOGUjunNXYSRiX@cluster0.ypjetfs.mongodb.net/?appName=Cluster0";

const DB_NAME = process.env.MONGODB_DB_NAME || "ecommerce";

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection("products");

    // Find products where costPrice is missing/null
    const cursor = collection.find({
      $or: [
        { costPrice: { $exists: false } },
        { costPrice: null },
      ],
    });

    let fixed = 0;
    let skipped = 0;

    for await (const doc of cursor) {
      const price = doc.price as number | undefined;

      if (price == null || price <= 0) {
        console.log(`SKIP (no price): ${doc.name}`);
        skipped++;
        continue;
      }

      // Set costPrice = price, profitMargin = 0 (no margin by default)
      const result = await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            costPrice: price,
            profitMargin: doc.profitMargin ?? 0,
            updatedAt: new Date(),
          },
        }
      );

      console.log(`FIXED: ${doc.name} → costPrice=${price}, margin=${doc.profitMargin ?? 0}`);
      fixed++;
    }

    console.log(`\nDone: ${fixed} products fixed, ${skipped} skipped`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
