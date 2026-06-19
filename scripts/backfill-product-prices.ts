import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Backfill selling prices for all products that have costPrice + profitMargin
 * but price is 0/null.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-product-prices.ts
 */

async function main() {
  console.log("[Migration] Starting product price backfill...\n");

  const db = await getDb();
  const collection = db.collection("products");

  // Find products with costPrice + profitMargin but price is 0/null/0
  const badProducts = await collection
    .find({
      $or: [{ price: 0 }, { price: null }, { price: { $exists: false } }],
      costPrice: { $exists: true, $ne: null, $ne: 0 },
      profitMargin: { $exists: true, $ne: null },
      status: "active",
    })
    .project({ name: 1, costPrice: 1, profitMargin: 1, price: 1 })
    .toArray();

  console.log(
    `[Migration] Products with price=0/null but cost+margin set: ${badProducts.length}\n`
  );

  if (badProducts.length === 0) {
    console.log("[Migration] Nothing to do — all products already have a valid price.");
    process.exit(0);
  }

  // Also find ALL active products with price=0 (even without margin)
  // Only fix those WITH margin since we can calculate a valid price
  let updated = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < badProducts.length; i += batchSize) {
    const batch = badProducts.slice(i, i + batchSize);
    const bulkOps = [];

    for (const doc of batch) {
      if (
        doc.costPrice == null ||
        doc.costPrice <= 0 ||
        doc.profitMargin == null
      ) {
        skipped++;
        continue;
      }

      const price = Math.round(
        doc.costPrice * (1 + doc.profitMargin / 100) * 100
      ) / 100;

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { price } },
        },
      });
    }

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
      updated += bulkOps.length;
    }

    console.log(
      `[Migration] Progress: ${Math.min(i + batchSize, badProducts.length)}/${badProducts.length}`
    );
  }

  console.log(`\n[Migration] Done!`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Total:    ${badProducts.length}`);

  const remaining = await collection.countDocuments({
    $or: [{ price: 0 }, { price: null }],
    costPrice: { $exists: true, $ne: null, $ne: 0 },
    profitMargin: { $exists: true, $ne: null },
    status: "active",
  });
  console.log(`  Remaining with price=0: ${remaining}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
