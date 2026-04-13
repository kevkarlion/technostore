/**
 * Re-subir todas las imágenes faltantes a Cloudinary
 * Usage: npx tsx src/lib/scraper/rescrape-images-cloudinary.ts
 */
import { getDb } from "@/config/db";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { getProxyAgent, shouldUseProxy } from "./proxy-agent";

const BATCH_SIZE = 10;
const DELAY_MS = 2000;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processImage(
  imageUrl: string,
  supplier: string,
  productId: string,
  index: number,
  retryCount = 0
): Promise<string | null> {
  const MAX_RETRIES = 2;

  try {
    // Skip if already cloudinary
    if (imageUrl.includes("cloudinary.com")) {
      return imageUrl;
    }

    // Convert relative paths to full URLs
    let fullUrl = imageUrl;
    if (imageUrl.startsWith("/images/")) {
      // Local path - need the public URL
      // In production, these don't exist, so we'll skip
      console.log(`  ⚠️  Local image skipped: ${imageUrl}`);
      return null;
    } else if (imageUrl.startsWith("imagenes/")) {
      fullUrl = `https://jotakp.dyndns.org/${imageUrl}`;
    } else if (!imageUrl.startsWith("http")) {
      fullUrl = `https://jotakp.dyndns.org/${imageUrl}`;
    }

    // Upload to Cloudinary
    console.log(`  Uploading: ${fullUrl.substring(0, 60)}...`);
    const cloudUrl = await uploadImageToCloudinary(fullUrl, supplier, productId, index);
    return cloudUrl;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`  🔄 Retry ${retryCount + 1}...`);
      await delay(1000);
      return processImage(imageUrl, supplier, productId, index, retryCount + 1);
    }
    console.log(`  ❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

async function main() {
  const db = await getDb();
  const collection = db.collection("products");

  console.log("🔍 Buscando productos sin imágenes de Cloudinary...\n");

  // Find products that don't have cloudinary images
  const products = await collection
    .find({
      $and: [
        { imageUrls: { $exists: true, $ne: [] } },
        { imageUrls: { $not: { $regex: "cloudinary" } } },
      ],
    })
    .project({ name: 1, imageUrls: 1, externalId: 1, supplier: 1 })
    .limit(100)
    .toArray();

  console.log(`Encontrados: ${products.length} productos sin Cloudinary\n`);

  let processed = 0;
  let success = 0;
  let failed = 0;

  for (const product of products) {
    const supplier = product.supplier || "jotakp";
    const productId = product.externalId?.toString() || product._id.toString();

    console.log(`📦 [${processed + 1}/${products.length}] ${product.name?.substring(0, 40)}...`);
    console.log(`   ID: ${productId}, Supplier: ${supplier}`);
    console.log(`   Original images: ${product.imageUrls?.length || 0}`);

    const newImages: string[] = [];

    for (let i = 0; i < (product.imageUrls || []).length; i++) {
      const url = product.imageUrls[i];
      const cloudUrl = await processImage(url, supplier, productId, i);

      if (cloudUrl) {
        newImages.push(cloudUrl);
        success++;
      } else {
        failed++;
      }

      await delay(DELAY_MS);
    }

    // Update DB if we got new images
    if (newImages.length > 0) {
      await collection.updateOne(
        { _id: product._id },
        { $set: { imageUrls: newImages, updatedAt: new Date() } }
      );
      console.log(`   ✅ Updated: ${newImages.length} images`);
    }

    processed++;
    console.log("");

    // Limit to avoid long runs
    if (processed >= BATCH_SIZE) {
      console.log(`\n✅ Processed ${BATCH_SIZE} products. Stopping.`);
      break;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Successful uploads: ${success}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);