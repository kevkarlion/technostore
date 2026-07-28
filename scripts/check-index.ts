import "dotenv/config";
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) { console.error("Missing env vars"); process.exit(1); }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const col = client.db(dbName).collection("products");

  // 1. Get text index definition
  const indexes = await col.indexes();
  const textIndex = indexes.find(i => i.name === "idx_product_search_text");
  console.log("=== TEXT INDEX DEFINITION ===");
  console.log(JSON.stringify(textIndex, null, 2));

  // 2. Check newest product fields
  const newest = await col.findOne({}, { sort: { createdAt: -1 } });
  console.log("\n=== NEWEST PRODUCT FULL DUMP ===");
  if (newest) {
    const { _id, ...rest } = newest;
    for (const [k, v] of Object.entries(rest)) {
      const val = typeof v === "string" ? `"${v}"` : JSON.stringify(v);
      console.log(`  ${k}: ${val?.substring(0, 120)}`);
    }
  }

  // 3. Check if there are other creation paths - look at products WITHOUT slug but WITH externalId
  const newWithoutSlug = await col.countDocuments({
    slug: { $exists: false },
    externalId: { $exists: true }
  });
  const newWithSlug = await col.countDocuments({
    slug: { $exists: true, $ne: null },
    externalId: { $exists: true }
  });
  console.log(`\n=== SLUG COVERAGE (products with externalId) ===`);
  console.log(`  With slug:    ${newWithSlug}`);
  console.log(`  Without slug: ${newWithoutSlug}`);

  // 4. Check products without searchName
  const withoutSearchName = await col.countDocuments({
    $or: [{ searchName: { $exists: false } }, { searchName: null }]
  });
  console.log(`\n  Without searchName: ${withoutSearchName}`);

  // 5. Show a few products WITHOUT slug to see if they're all recent
  const noSlug = await col.find({ $or: [{ slug: { $exists: false } }, { slug: null }] })
    .project({ name: 1, slug: 1, searchName: 1, createdAt: 1, externalId: 1 })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  console.log(`\n=== SAMPLE PRODUCTS WITHOUT SLUG (newest 5) ===`);
  for (const p of noSlug) {
    console.log(`  "${p.name}" | created: ${p.createdAt} | externalId: ${p.externalId}`);
  }

  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
