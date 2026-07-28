import "dotenv/config";
import { MongoClient } from "mongodb";

/**
 * Backfill missing slug + searchName for products created without them.
 * Safe to re-run — only touches products where slug or searchName is missing/null.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-slug-searchname.ts
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/backfill-slug-searchname.ts --dry-run
 */

function generateProductSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error("MONGODB_URI and MONGODB_DB_NAME must be set");
    process.exit(1);
  }

  console.log(`[Backfill] Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const col = client.db(dbName).collection("products");

  // Find products missing slug or searchName
  const missing = await col.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { searchName: { $exists: false } },
      { searchName: null },
    ],
  }).toArray();

  console.log(`[Backfill] Products missing slug/searchName: ${missing.length}`);

  if (missing.length === 0) {
    console.log("[Backfill] Nothing to do.");
    await client.close();
    process.exit(0);
  }

  if (dryRun) {
    for (const p of missing) {
      console.log(`  ${p.name} | slug=${generateProductSlug(p.name)} | searchName=${normalizeText(p.name)}`);
    }
    console.log(`\n[Backfill] DRY RUN complete.`);
    await client.close();
    process.exit(0);
  }

  // Bulk update
  const ops = missing.map((p: any) => ({
    updateOne: {
      filter: { _id: p._id },
      update: {
        $set: {
          slug: generateProductSlug(p.name),
          searchName: normalizeText(p.name),
          updatedAt: new Date(),
        },
      },
    },
  }));

  const result = await col.bulkWrite(ops);
  console.log(`[Backfill] Done! Updated: ${result.modifiedCount} products`);

  await client.close();
  process.exit(0);
}

main().catch((err) => { console.error("[Backfill] Failed:", err); process.exit(1); });
