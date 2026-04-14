import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Get first 30 active products
  const products = await db
    .collection("products")
    .find({ status: "active" })
    .limit(30)
    .toArray();

  console.log("=== Product Image Status ===\n");

  let withCloudinary = 0;
  let withImageUrls = 0;
  let withoutImages = 0;

  for (const p of products) {
    const name = (p.name || "").substring(0, 35);
    const hasCloudinary = !!(p.cloudinaryUrls && p.cloudinaryUrls.length > 0);
    const hasImageUrls = !!(p.imageUrls && p.imageUrls.length > 0);
    const imageCount = p.imageUrls?.length || 0;
    const cloudinaryCount = p.cloudinaryUrls?.length || 0;

    if (hasCloudinary) withCloudinary++;
    else if (hasImageUrls) withImageUrls++;
    else withoutImages++;

    const status = hasCloudinary ? "☁️ CLOUDINARY" : hasImageUrls ? "🌐 IMAGEURLS" : "❌ NONE";
    
    console.log(`${status} | ${name.padEnd(35)} | img: ${imageCount} | cloud: ${cloudinaryCount}`);

    if (hasImageUrls && !hasCloudinary) {
      const firstUrl = p.imageUrls[0] || "";
      console.log(`        ↳ ${firstUrl.substring(0, 50)}`);
    }
    if (hasCloudinary) {
      const firstUrl = p.cloudinaryUrls[0] || "";
      console.log(`        ↳ ${firstUrl.substring(0, 50)}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total checked: ${products.length}`);
  console.log(`With Cloudinary: ${withCloudinary}`);
  console.log(`With imageUrls only: ${withImageUrls}`);
  console.log(`No images: ${withoutImages}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });