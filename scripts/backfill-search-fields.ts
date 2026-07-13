import "dotenv/config";
import { MongoClient } from "mongodb";
import { extractFields } from "@/lib/search/field-extractor";

/**
 * Backfill search fields (brand, productType, capacity, formFactor) for all active products.
 *
 * Idempotent — safe to run multiple times. Only processes products where brand is null/undefined.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-search-fields.ts
 */

async function main() {
  console.log("[Migration] Starting search fields backfill...\n");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error("[Migration] Error: MONGODB_URI and MONGODB_DB_NAME must be set in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("products");

  const totalActive = await collection.countDocuments({ status: "active" });
  const missing = await collection
    .find({
      status: "active",
      $or: [
        { brand: { $exists: false } },
        { brand: null },
      ],
    })
    .project({ name: 1 })
    .toArray();

  console.log(`[Migration] Active products: ${totalActive}`);
  console.log(`[Migration] Products without brand: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log("[Migration] Nothing to do — all products already have search fields.");
    await client.close();
    process.exit(0);
  }

  const batchSize = 500;
  let updated = 0;

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const bulkOps = batch
      .filter((doc: any) => doc.name)
      .map((doc: any) => {
        const fields = extractFields(doc.name);
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: fields },
          },
        };
      });

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
      updated += bulkOps.length;
    }

    console.log(
      `[Migration] Progress: ${Math.min(i + batchSize, missing.length)}/${missing.length}`
    );
  }

  console.log(`\n[Migration] Done! Updated ${updated} products with search fields.`);
  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
