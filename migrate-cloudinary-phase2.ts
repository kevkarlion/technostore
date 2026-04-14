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
    
  } while (nextCursor);
  
  console.log(`✅ Total Cloudinary images: ${allImages.length}`);
  return allImages;
}

function extractNumbersFromFilename(filename: string): string[] {
  // Extract all numbers from filename like "jotakp_14438_21001" -> ["14438", "21001"]
  const matches = filename.match(/\d+/g);
  return matches || [];
}

async function main() {
  initCloudinary();
  const db = await getDb();
  
  // 1. Get products without cloudinaryUrls
  console.log("\n🔍 Finding products without cloudinaryUrls...");
  
  const productsWithoutCloudinary = await db.collection("products").find({
    status: "active",
    $or: [
      { cloudinaryUrls: { $exists: false } },
      { cloudinaryUrls: { $size: 0 } }
    ]
  }).toArray();
  
  console.log(`   Found ${productsWithoutCloudinary.length} products without cloudinaryUrls`);
  
  // 2. Get all Cloudinary images
  const cloudinaryImages = await getAllCloudinaryImages();
  
  // 3. Try to match products to images
  let matched = 0;
  let batchSize = 50;
  let processed = 0;
  
  console.log("\n🔄 Matching products to Cloudinary images...");
  
  for (const product of productsWithoutCloudinary) {
    const productName = product.name?.toLowerCase() || "";
    const externalId = product.externalId || "";
    const categories = product.categories || [];
    
    // Try to find matching Cloudinary image
    let bestMatch: CloudinaryImage | null = null;
    
    for (const img of cloudinaryImages) {
      const filename = img.public_id.split("/").pop() || "";
      const numbers = extractNumbersFromFilename(filename);
      
      // Match 1: by externalId
      if (externalId && numbers.includes(externalId)) {
        bestMatch = img;
        break;
      }
      
      // Match 2: by first number in filename (product ID from jotakp)
      if (numbers.length > 0) {
        const firstNum = numbers[0];
        // Check if this number appears in product name or externalId
        if (productName.includes(firstNum) || externalId.includes(firstNum)) {
          bestMatch = img;
          break;
        }
      }
    }
    
    if (bestMatch) {
      await db.collection("products").updateOne(
        { _id: product._id },
        { 
          $set: { 
            cloudinaryUrls: [bestMatch.secure_url],
            updatedAt: new Date()
          }
        }
      );
      matched++;
      
      if (matched % 50 === 0) {
        console.log(`   ✅ Matched ${matched} products...`);
      }
    }
    
    processed++;
    if (processed % 100 === 0) {
      console.log(`   Processed ${processed}/${productsWithoutCloudinary.length}...`);
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Products checked: ${processed}`);
  console.log(`   Matched: ${matched}`);
  console.log(`   Not found: ${processed - matched}`);
  
  // 4. Final status
  const withRealCloudinary = await db.collection("products").countDocuments({
    status: "active",
    cloudinaryUrls: { $elemMatch: { $regex: "^https://res.cloudinary.com" } }
  });
  
  console.log(`\n🎉 Now have ${withRealCloudinary} products with real Cloudinary URLs!`);
  
  // Show breakdown by category
  console.log("\n📊 Cloudinary coverage by category:");
  const categories = ["memorias", "discos-ssd", "discos-m2", "perifericos", "impresoras", "gabinetes"];
  for (const cat of categories) {
    const withImg = await db.collection("products").countDocuments({
      status: "active",
      categories: cat,
      cloudinaryUrls: { $elemMatch: { $regex: "^https://res.cloudinary.com" } }
    });
    const total = await db.collection("products").countDocuments({
      status: "active",
      categories: cat
    });
    console.log(`   ${cat}: ${withImg}/${total} (${Math.round(withImg/total*100)}%)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });