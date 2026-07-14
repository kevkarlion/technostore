import "dotenv/config";
import { MongoClient } from "mongodb";

/**
 * Remove priceRaw field from all products.
 * priceRaw was the original price string from the supplier (e.g. "2,27").
 * It's no longer used by the domain model — only the scraper referenced it.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/remove-priceRaw.ts
 */

async function main() {
  console.log("[Migration] Removing priceRaw from products...\n");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    console.error("[Migration] Missing MONGODB_URI or MONGODB_DB_NAME in env");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("products");

  // Count how many documents have priceRaw
  const withPriceRaw = await collection.countDocuments({
    priceRaw: { $exists: true },
  });
  console.log(`[Migration] Documents with priceRaw: ${withPriceRaw}`);

  if (withPriceRaw === 0) {
    console.log("[Migration] Nothing to do — priceRaw already removed.");
    await client.close();
    process.exit(0);
  }

  // Remove priceRaw from all documents that have it
  const result = await collection.updateMany(
    { priceRaw: { $exists: true } },
    { $unset: { priceRaw: "" } }
  );

  console.log(`[Migration] Done! Removed priceRaw from ${result.modifiedCount} documents.`);

  // Verify
  const remaining = await collection.countDocuments({
    priceRaw: { $exists: true },
  });
  console.log(`[Migration] Remaining with priceRaw: ${remaining}`);

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Migration] Failed:", err);
  process.exit(1);
});
