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
    throw new Error("Cloudinary not configured in .env.local");
  }
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  created_at: string;
}

async function getAllCloudinaryImages(): Promise<CloudinaryImage[]> {
  console.log("📡 Fetching all images from Cloudinary...");
  
  const allImages: CloudinaryImage[] = [];
  let nextCursor: string | undefined;
  
  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "technostore",
      max_results: 500,
      next_cursor: nextCursor,
    });
    
    allImages.push(...result.resources);
    nextCursor = result.next_cursor;
    console.log(`   Fetched ${allImages.length} images...`);
    
  } while (nextCursor);
  
  console.log(`✅ Total Cloudinary images: ${allImages.length}`);
  return allImages;
}

function extractFilenameFromPath(path: string): string | null {
  // /images/suppliers/jotakp/jotakp_14438_21001.JPG -> jotakp_14438_21001
  const match = path.match(/jotakp[_-](\d+)[_-](\d+)/);
  if (match) {
    return `jotakp_${match[1]}_${match[2]}`;
  }
  return null;
}

function extractProductIdFromPath(path: string): string | null {
  // /images/suppliers/jotakp/jotakp_14438_21001.JPG -> 14438
  const match = path.match(/jotakp[_-](\d+)/);
  return match ? match[1] : null;
}

async function main() {
  initCloudinary();
  const db = await getDb();
  
  // 1. Get all products with local cloudinaryUrls
  console.log("\n🔍 Finding products with local cloudinaryUrls...");
  
  const productsWithLocal = await db.collection("products").find({
    status: "active",
    cloudinaryUrls: { $exists: true, $ne: [], $elemMatch: { $regex: "^/images/" } }
  }).toArray();
  
  console.log(`   Found ${productsWithLocal.length} products with local paths`);
  
  if (productsWithLocal.length === 0) {
    console.log("✅ No products to migrate!");
    return;
  }
  
  // 2. Get all Cloudinary images
  const cloudinaryImages = await getAllCloudinaryImages();
  
  // 3. Create a map for faster lookup
  const imageMap = new Map<string, CloudinaryImage>();
  for (const img of cloudinaryImages) {
    // Store by public_id (last part of path)
    const filename = img.public_id.split("/").pop();
    if (filename) {
      imageMap.set(filename, img);
      // Also store by partial match
      const match = filename.match(/jotakp[_-](\d+)[_-](\d+)/);
      if (match) {
        imageMap.set(`jotakp_${match[1]}_${match[2]}`, img);
      }
    }
  }
  
  console.log(`\n📊 Created image map with ${imageMap.size} entries`);
  
  // 4. Match and update
  let updated = 0;
  let notFound = 0;
  
  for (const product of productsWithLocal) {
    const cloudinaryUrls = product.cloudinaryUrls || [];
    const newUrls: string[] = [];
    
    for (const localPath of cloudinaryUrls) {
      if (localPath.startsWith("/images/")) {
        // Try to find matching Cloudinary image
        const filename = extractFilenameFromPath(localPath);
        
        if (filename && imageMap.has(filename)) {
          const cloudImg = imageMap.get(filename)!;
          newUrls.push(cloudImg.secure_url);
          console.log(`   ✅ Matched: ${product.name?.substring(0, 30)}... -> ${filename}`);
        } else {
          // Try by product ID
          const productId = extractProductIdFromPath(localPath);
          // Search in all images for this product ID
          let found = false;
          for (const [key, img] of imageMap) {
            if (key.includes(productId || "")) {
              newUrls.push(img.secure_url);
              found = true;
              break;
            }
          }
          if (!found) {
            newUrls.push(localPath); // Keep original
            notFound++;
          }
        }
      } else {
        newUrls.push(localPath);
      }
    }
    
    // Update if we found new URLs
    if (newUrls.some(url => url.startsWith("https://res.cloudinary.com"))) {
      await db.collection("products").updateOne(
        { _id: product._id },
        { $set: { cloudinaryUrls: newUrls, updatedAt: new Date() } }
      );
      updated++;
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Products checked: ${productsWithLocal.length}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Not found in Cloudinary: ${notFound}`);
  
  // 5. Check again
  const withRealCloudinary = await db.collection("products").countDocuments({
    status: "active",
    cloudinaryUrls: { $elemMatch: { $regex: "^https://res.cloudinary.com" } }
  });
  
  console.log(`\n🎉 Now have ${withRealCloudinary} products with real Cloudinary URLs!`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });