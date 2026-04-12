/**
 * Fix products with empty image URLs
 * Run: npx tsx src/lib/scraper/fix-empty-images.ts
 */

import "dotenv/config";
import { getDb } from "@/config/db";

async function fix() {
  const db = await getDb();

  // Find ALL products with empty string in imageUrls
  const emptyImages = await db.collection("products").find({
    supplier: "jotakp",
    "imageUrls.0": { $in: ["", null] }
  }).toArray();

  console.log(`Found ${emptyImages.length} products with empty images`);

  // Delete these products (they have no useful data)
  if (emptyImages.length > 0) {
    const result = await db.collection("products").deleteMany({
      supplier: "jotakp",
      "imageUrls.0": { $in: ["", null] }
    });

    console.log(`Deleted ${result.deletedCount} products with no images`);
  }

  // Also remove products that have no imageUrls at all
  const noImages = await db.collection("products").countDocuments({
    supplier: "jotakp",
    $or: [
      { imageUrls: { $exists: false } },
      { imageUrls: null },
      { imageUrls: { $size: 0 } }
    ]
  });

  if (noImages > 0) {
    const result = await db.collection("products").deleteMany({
      supplier: "jotakp",
      $or: [
        { imageUrls: { $exists: false } },
        { imageUrls: null },
        { imageUrls: { $size: 0 } }
      ]
    });
    console.log(`Deleted ${result.deletedCount} products with no imageUrls field`);
  }

  // Verify count
  const total = await db.collection("products").countDocuments({ supplier: "jotakp" });
  console.log(`\nTotal products now: ${total}`);
}

fix();