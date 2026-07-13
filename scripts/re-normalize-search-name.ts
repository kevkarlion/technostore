import "dotenv/config";
import { MongoClient } from "mongodb";
import { normalizeText } from "../src/lib/search/normalizer";

/**
 * Re-apply normalizeText() to ALL active products' searchName.
 *
 * The original backfill used a local normalizeText that was missing
 * .replace(/[^\w\s\-\.]/g, ""), so parentheses, quotes, and special
 * chars leaked into searchName. This fixes every active product.
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/re-normalize-search-name.ts
 */

async function main() {
  console.log("[Migration] Starting searchName re-normalization...\n");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error(
      "[Migration] Error: MONGODB_URI and MONGODB_DB_NAME must be set in .env.local"
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("products");

  const totalActive = await collection.countDocuments({ status: "active" });
  const cursor = collection
    .find({ status: "active" })
    .project({ name: 1, searchName: 1 });

  const batchSize = 500;
  let processed = 0;
  let updated = 0;

  console.log(`[Migration] Active products: ${totalActive}\n`);

  let batch: any[] = [];

  for await (const doc of cursor) {
    batch.push(doc);

    if (batch.length === batchSize) {
      await processBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
  }

  console.log(`\n[Migration] Done! Processed ${processed}, updated ${updated}.`);
  await client.close();
  process.exit(0);

  async function processBatch(docs: any[]) {
    const bulkOps = docs
      .filter((doc: any) => doc.name)
      .map((doc: any) => {
        const normalized = normalizeText(doc.name);
        return {
          updateOne: {
            filter: { _id: doc._id, searchName: { $ne: normalized } },
            update: { $set: { searchName: normalized } },
          },
        };
      })
      .filter((op) => op.updateOne.filter.searchName.$ne !== undefined);

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
      updated += bulkOps.length;
    }

    processed += docs.length;
    console.log(
      `[Migration] Progress: ${processed}/${totalActive} (updated: ${updated})`
    );
  }
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
