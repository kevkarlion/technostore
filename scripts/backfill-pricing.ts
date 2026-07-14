import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Backfill pricing: ensure costPrice and profitMargin exist on all products,
 * then recompute price = costPrice * (1 + profitMargin / 100).
 *
 * Rules:
 * - If costPrice is null/missing: use existing price as costPrice, set profitMargin = profitMargin ?? 0
 * - If costPrice exists but profitMargin is null/missing: set profitMargin = 0
 * - Always recompute price = costPrice * (1 + profitMargin / 100), rounded to 2 decimals
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-pricing.ts
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log("[Migration] Starting pricing backfill...\n");

  const db = await getDb();
  const collection = db.collection("products");

  const totalProducts = await collection.countDocuments({ status: "active" });
  console.log(`[Migration] Active products: ${totalProducts}\n`);

  let fixed = 0;
  let skipped = 0;
  const batchSize = 100;

  // Process all active products
  const cursor = collection.find({ status: "active" }).batchSize(batchSize);
  const bulkOps: any[] = [];

  for await (const doc of cursor) {
    const updates: Record<string, any> = {};
    let needsUpdate = false;

    const existingCostPrice = (doc as any).costPrice;
    const existingProfitMargin = (doc as any).profitMargin;
    const existingPrice = (doc as any).price;

    // Rule 1: If costPrice is null/missing, use existing price as costPrice
    if (existingCostPrice == null || existingCostPrice === 0) {
      if (existingPrice != null && existingPrice > 0) {
        updates.costPrice = existingPrice;
        needsUpdate = true;
      } else {
        // Neither costPrice nor price exist — skip
        skipped++;
        continue;
      }
    }

    // Rule 2: If profitMargin is null/missing, set to 0
    if (existingProfitMargin == null) {
      updates.profitMargin = 0;
      needsUpdate = true;
    }

    // Rule 3: Recompute price from costPrice * (1 + profitMargin / 100)
    const finalCostPrice = updates.costPrice ?? existingCostPrice;
    const finalMargin = updates.profitMargin ?? existingProfitMargin ?? 0;
    const newPrice = round2(finalCostPrice * (1 + finalMargin / 100));

    if (newPrice !== existingPrice) {
      updates.price = newPrice;
      needsUpdate = true;
    }

    if (needsUpdate) {
      updates.updatedAt = new Date();
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: updates },
        },
      });
    }

    // Flush batch
    if (bulkOps.length >= batchSize) {
      await collection.bulkWrite(bulkOps);
      fixed += bulkOps.length;
      bulkOps.length = 0;
    }
  }

  // Flush remaining
  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps);
    fixed += bulkOps.length;
  }

  console.log("\n[Migration] Done!");
  console.log(`  Updated:  ${fixed}`);
  console.log(`  Skipped:  ${skipped} (no costPrice or price available)`);
  console.log(`  Total:    ${totalProducts}`);

  // Verify: check for products still missing costPrice
  const remaining = await collection.countDocuments({
    status: "active",
    $or: [
      { costPrice: { $exists: false } },
      { costPrice: null },
      { costPrice: 0 },
    ],
  });
  console.log(`  Remaining without costPrice: ${remaining}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
