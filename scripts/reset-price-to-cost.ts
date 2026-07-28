import "dotenv/config";
import { MongoClient } from "mongodb";

/**
 * Reset price = costPrice and profitMargin = 0 for ALL products.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/reset-price-to-cost.ts
 *
 * Optional --dry-run flag to preview without writing:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/reset-price-to-cost.ts --dry-run
 *
 * NOTE: Bypasses getEnv() intentionally — this script only needs MongoDB,
 * and the full env schema requires MercadoPago credentials we don't use here.
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(
    `[Reset] Starting — mode: ${dryRun ? "DRY RUN (no writes)" : "LIVE"}\n`
  );

  // Connect directly — skip getEnv() validation (MercadoPago etc. not needed)
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error("[Reset] MONGODB_URI and MONGODB_DB_NAME must be set in .env");
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("products");

  const total = await collection.countDocuments({});
  console.log(`[Reset] Total products in collection: ${total}`);

  // Count how many actually need changes (price != costPrice OR profitMargin != 0)
  const sample = await collection
    .aggregate([
      {
        $match: {
          $expr: {
            $or: [
              { $ne: ["$price", "$costPrice"] },
              { $ne: ["$profitMargin", 0] },
            ],
          },
        },
      },
      { $count: "count" },
    ])
    .toArray();

  const affected = sample[0]?.count ?? 0;
  console.log(
    `[Reset] Products where price ≠ costPrice or profitMargin ≠ 0: ${affected}\n`
  );

  if (affected === 0) {
    console.log("[Reset] Nothing to do — all products already match.");
    await client.close();
    process.exit(0);
  }

  if (dryRun) {
    // Show a few examples
    const examples = await collection
      .aggregate([
        {
          $match: {
            $expr: {
              $or: [
                { $ne: ["$price", "$costPrice"] },
                { $ne: ["$profitMargin", 0] },
              ],
            },
          },
        },
        { $project: { name: 1, price: 1, costPrice: 1, profitMargin: 1 } },
        { $limit: 5 },
      ])
      .toArray();

    console.log("[Reset] Sample products that would be updated:");
    for (const p of examples) {
      console.log(
        `  ${p.name}: price=$${p.price} → $${p.costPrice}, margin=${p.profitMargin}% → 0%`
      );
    }

    console.log(`\n[Reset] DRY RUN complete. No changes made.`);
    await client.close();
    process.exit(0);
  }

  // LIVE: set price = costPrice, profitMargin = 0 for ALL products
  const result = await collection.updateMany(
    {}, // all products
    [
      {
        $set: {
          price: "$costPrice",
          profitMargin: 0,
          updatedAt: new Date(),
        },
      },
    ]
  );

  console.log(`[Reset] Done!`);
  console.log(`  Matched:    ${result.matchedCount}`);
  console.log(`  Modified:   ${result.modifiedCount}`);
  console.log(`  Unmodified: ${result.matchedCount - result.modifiedCount} (already matching)`);

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Reset] Failed:", err);
  process.exit(1);
});
