import "dotenv/config";
import { MongoClient } from "mongodb";

/**
 * Compare a new vs old product to find missing fields.
 * New = most recent by createdAt, Old = least recent by createdAt.
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error("MONGODB_URI and MONGODB_DB_NAME must be set");
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const col = client.db(dbName).collection("products");

  // Newest product (by createdAt desc)
  const newest = await col.findOne({}, { sort: { createdAt: -1 } });
  // Oldest product (by createdAt asc)
  const oldest = await col.findOne({}, { sort: { createdAt: 1 } });

  if (!newest || !oldest) {
    console.log("No products found");
    await client.close();
    process.exit(1);
  }

  const allKeys = new Set([...Object.keys(newest), ...Object.keys(oldest)]);

  console.log("=== FIELD COMPARISON ===\n");
  console.log(`New: ${newest.name} (${newest.createdAt})`);
  console.log(`Old: ${oldest.name} (${oldest.createdAt})\n`);

  const newMissing: string[] = [];
  const oldMissing: string[] = [];
  const different: string[] = [];

  for (const key of [...allKeys].sort()) {
    const nv = newest[key];
    const ov = oldest[key];
    const nExists = key in newest;
    const oExists = key in oldest;

    if (nExists && !oExists) {
      newMissing.push(key);
    } else if (!nExists && oExists) {
      oldMissing.push(key);
    } else if (JSON.stringify(nv) !== JSON.stringify(ov)) {
      different.push(key);
    }
  }

  console.log(`--- Keys ONLY in NEW product (${newMissing.length}) ---`);
  for (const k of newMissing) console.log(`  + ${k}: ${JSON.stringify(newest[k])?.substring(0, 100)}`);

  console.log(`\n--- Keys ONLY in OLD product (${oldMissing.length}) ---`);
  for (const k of oldMissing) console.log(`  - ${k}: ${JSON.stringify(oldest[k])?.substring(0, 100)}`);

  console.log(`\n--- Keys with DIFFERENT values (${different.length}) ---`);
  for (const k of different) {
    const nv = JSON.stringify(newest[k])?.substring(0, 80);
    const ov = JSON.stringify(oldest[k])?.substring(0, 80);
    console.log(`  ~ ${k}`);
    console.log(`      NEW: ${nv}`);
    console.log(`      OLD: ${ov}`);
  }

  // Also check: how many products have searchText vs don't
  const withSearchText = await col.countDocuments({ searchText: { $exists: true, $ne: null } });
  const withoutSearchText = await col.countDocuments({ $or: [{ searchText: { $exists: false } }, { searchText: null }] });
  const withSearchKeywords = await col.countDocuments({ searchKeywords: { $exists: true, $ne: null } });
  const withoutSearchKeywords = await col.countDocuments({ $or: [{ searchKeywords: { $exists: false } }, { searchKeywords: null }] });
  const withSlug = await col.countDocuments({ slug: { $exists: true, $ne: null } });
  const withoutSlug = await col.countDocuments({ $or: [{ slug: { $exists: false } }, { slug: null }] });

  console.log(`\n--- FIELD COVERAGE (all products) ---`);
  console.log(`  searchText:       ${withSearchText} have it, ${withoutSearchText} missing`);
  console.log(`  searchKeywords:   ${withSearchKeywords} have it, ${withoutSearchKeywords} missing`);
  console.log(`  slug:             ${withSlug} have it, ${withoutSlug} missing`);

  // Check text index
  const indexes = await col.indexes();
  console.log(`\n--- INDEXES ---`);
  for (const idx of indexes) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  }

  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
