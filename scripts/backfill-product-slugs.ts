import "dotenv/config";
import { getDb } from "@/config/db";
import {
  generateProductSlug,
  cleanProductName,
} from "@/domain/mappers/product-to-presentation";

/**
 * Backfill slugs for all existing products.
 *
 * This migration:
 * 1. Finds all active products without a `slug` field
 * 2. Generates a slug from the product name for each one
 * 3. Handles name collisions by appending a counter suffix
 * 4. Creates a MongoDB index on `slug` for fast lookups
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-product-slugs.ts
 */

async function main() {
  console.log("[Migration] Starting product slug backfill...\n");

  const db = await getDb();
  const collection = db.collection("products");

  // 1. Create index on slug field (sparse so products without slug don't bloat it)
  console.log("[Migration] Ensuring index on slug field...");
  await collection.createIndex(
    { slug: 1 },
    {
      name: "idx_product_slug",
      sparse: true,
      background: true,
    }
  );
  console.log("[Migration] Index created.\n");

  // 2. Find products without slug
  const totalProducts = await collection.countDocuments({ status: "active" });
  const missingSlug = await collection
    .find({ slug: { $exists: false }, status: "active" })
    .project({ name: 1 })
    .toArray();

  console.log(`[Migration] Active products: ${totalProducts}`);
  console.log(
    `[Migration] Products without slug: ${missingSlug.length}\n`
  );

  if (missingSlug.length === 0) {
    console.log("[Migration] Nothing to do — all products already have a slug.");
    process.exit(0);
  }

  // 3. Collect all existing slugs to detect collisions upfront
  const allDocs = await collection
    .find({ slug: { $exists: true } })
    .project({ slug: 1 })
    .toArray();
  const existingSlugs = new Set(allDocs.map((d: any) => d.slug));

  // 4. Generate and backfill slugs
  let updated = 0;
  let skipped = 0;
  let collisions = 0;
  const batchSize = 100;
  const slugCounts = new Map<string, number>();

  for (let i = 0; i < missingSlug.length; i += batchSize) {
    const batch = missingSlug.slice(i, i + batchSize);

    const bulkOps = [];

    for (const doc of batch) {
      if (!doc.name) {
        skipped++;
        continue;
      }

      let slug = generateProductSlug(doc.name);

      // Handle name collisions: append counter suffix
      if (existingSlugs.has(slug)) {
        const counter = (slugCounts.get(slug) || 1) + 1;
        slugCounts.set(slug, counter);
        slug = `${slug}-${counter}`;
        collisions++;
      }

      // Handle collisions within the batch itself
      const tempSlug = slug;
      let finalSlug = tempSlug;
      let counter = 1;
      while (existingSlugs.has(finalSlug)) {
        counter++;
        finalSlug = `${tempSlug}-${counter}`;
      }
      slug = finalSlug;

      existingSlugs.add(slug);
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { slug } },
        },
      });
    }

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
      updated += bulkOps.length;
    }

    console.log(
      `[Migration] Progress: ${Math.min(i + batchSize, missingSlug.length)}/${missingSlug.length} products processed`
    );
  }

  // 5. Summary
  console.log("\n[Migration] Done!");
  console.log(`  Updated:     ${updated}`);
  console.log(`  Skipped:     ${skipped} (no name)`);
  console.log(`  Collisions:  ${collisions}`);
  console.log(`  Total:       ${missingSlug.length}`);

  const productsWithSlugs = await collection.countDocuments({
    slug: { $exists: true },
    status: "active",
  });
  console.log(
    `\n[Migration] Active products with slugs now: ${productsWithSlugs}/${totalProducts}`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
