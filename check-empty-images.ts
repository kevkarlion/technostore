import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();

  // Find products with empty or null imageUrls
  const noImages = await db.collection("products").find({
    supplier: "jotakp",
    $or: [
      { imageUrls: { $size: 0 } },
      { imageUrls: null },
      { imageUrls: "" }
    ]
  }).limit(10).toArray();

  console.log("Products without images:", noImages.length);

  // Also check for products where imageUrls is array with empty string
  const emptyImages = await db.collection("products").find({
    supplier: "jotakp",
    "imageUrls.0": { $in: ["", null] }
  }).limit(10).toArray();

  console.log("Products with empty string in imageUrls:", emptyImages.length);

  // Show first few
  if (emptyImages.length > 0) {
    console.log("\nFirst products with issues:");
    emptyImages.slice(0, 5).forEach(p => console.log(p.externalId, " | ", JSON.stringify(p.imageUrls)));
  }
}

check();