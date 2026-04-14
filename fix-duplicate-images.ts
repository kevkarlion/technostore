import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getDb } from "@/config/db";
import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary
function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary not configured");
  }
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

function extractPublicIdFromUrl(url: string): string | null {
  // https://res.cloudinary.com/dfli0n64m/image/upload/v1775851900/technostore/jotakp/14438_0.jpg
  // -> technostore/jotakp/14438_0
  const match = url.match(/upload\/[^/]+\/([^.]+)/);
  return match ? match[1] : null;
}

async function getImagesByProductId(productId: string): Promise<string[]> {
  // Buscar imágenes en Cloudinary - el public_id tiene formato: technostore/jotakp/jotakp_{productId}_{index}
  const result = await cloudinary.api.resources({
    type: "upload",
    prefix: `technostore/jotakp/jotakp_${productId}_`,
    max_results: 10,
  });
  
  // Ordenar por índice (el que termina en _0 primero)
  const urls = result.resources
    .map((r: any) => r.secure_url)
    .sort((a: string, b: string) => {
      const idxA = parseInt(a.match(/_(\d+)\./)?.[1] || "0");
      const idxB = parseInt(b.match(/_(\d+)\./)?.[1] || "0");
      return idxA - idxB;
    });
  
  return urls;
}

async function main() {
  initCloudinary();
  const db = await getDb();
  
  console.log("🔍 Finding duplicate image URLs...\n");
  
  // 1. Find all products with cloudinaryUrls
  const products = await db.collection("products").find({
    status: "active",
    cloudinaryUrls: { $exists: true, $ne: [] }
  }).toArray();
  
  // 2. Group by cloudinaryUrl
  const urlProducts = new Map<string, any[]>();
  for (const p of products) {
    for (const url of p.cloudinaryUrls || []) {
      if (!urlProducts.has(url)) {
        urlProducts.set(url, []);
      }
      urlProducts.get(url).push(p);
    }
  }
  
  // 3. Find duplicates and fix
  let fixed = 0;
  let skipped = 0;
  
  for (const [url, prods] of urlProducts) {
    if (prods.length <= 1) continue; // No duplicate
    
    console.log(`\n📦 Duplicate: ${prods.length} products using same image`);
    console.log(`   URL: ${url.substring(0, 60)}...`);
    
    // Get the public_id from the current (wrong) URL
    const currentPublicId = extractPublicIdFromUrl(url);
    
    // For each product, try to find their correct images in Cloudinary
    for (const product of prods) {
      const externalId = product.externalId;
      console.log(`\n   🔧 Fixing: ${product.name?.substring(0, 35)} (externalId: ${externalId})`);
      
      // Search for correct images in Cloudinary
      const correctImages = await getImagesByProductId(externalId);
      
      if (correctImages.length > 0) {
        console.log(`   ✅ Found ${correctImages.length} correct images`);
        
        // Update the product with correct images
        await db.collection("products").updateOne(
          { _id: product._id },
          { $set: { cloudinaryUrls: correctImages, updatedAt: new Date() } }
        );
        
        fixed++;
      } else {
        console.log(`   ⚠️  No images found for externalId ${externalId}`);
        skipped++;
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });