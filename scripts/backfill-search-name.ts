import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Backfill searchName for all active products + create text index.
 *
 * 1. Creates a MongoDB text index on searchName + description with Spanish stemming
 * 2. Backfills searchName for all active products that don't have it
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-search-name.ts
 */

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function main() {
  console.log("[Migration] Starting searchName backfill...\n");

  const db = await getDb();
  const collection = db.collection("products");

  // 1. Create text index
  console.log("[Migration] Creating text index on searchName + description...");
  try {
    await collection.createIndex(
      { searchName: "text", description: "text" },
      {
        name: "idx_product_search_text",
        default_language: "spanish",
        weights: { searchName: 10, description: 5 },
      }
    );
    console.log("[Migration] Text index created.\n");
  } catch (err: any) {
    // If index already exists with different options, drop and recreate
    if (err.code === 85) {
      console.log("[Migration] Index exists with different options, dropping and recreating...");
      await collection.dropIndex("idx_product_search_text");
      await collection.createIndex(
        { searchName: "text", description: "text" },
        {
          name: "idx_product_search_text",
          default_language: "spanish",
          weights: { searchName: 10, description: 5 },
        }
      );
      console.log("[Migration] Text index recreated.\n");
    } else {
      throw err;
    }
  }

  // 2. Backfill searchName for products without it
  const totalActive = await collection.countDocuments({ status: "active" });
  const missing = await collection
    .find({ searchName: { $exists: false }, status: "active" })
    .project({ name: 1 })
    .toArray();

  console.log(`[Migration] Active products: ${totalActive}`);
  console.log(`[Migration] Products without searchName: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log("[Migration] Nothing to do — all products already have searchName.");
    process.exit(0);
  }

  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const bulkOps = batch
      .filter((doc: any) => doc.name)
      .map((doc: any) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { searchName: normalizeText(doc.name) } },
        },
      }));

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
      updated += bulkOps.length;
    }

    console.log(
      `[Migration] Progress: ${Math.min(i + batchSize, missing.length)}/${missing.length}`
    );
  }

  console.log(`\n[Migration] Done! Updated ${updated} products.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
