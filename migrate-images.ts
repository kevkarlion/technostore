import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "./src/config/env";
import { getDb } from "./src/config/db";

// Initialize Cloudinary
function initCloudinary() {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary not configured");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const SUPPLIER_IMAGES_DIR = path.join(process.cwd(), "public", "images", "suppliers");

interface ImageInfo {
  supplier: string;
  filename: string;
  localPath: string;
  fullPath: string;
}

async function getAllLocalImages(): Promise<ImageInfo[]> {
  const images: ImageInfo[] = [];
  
  if (!fs.existsSync(SUPPLIER_IMAGES_DIR)) {
    console.log("No images directory found");
    return images;
  }
  
  const suppliers = fs.readdirSync(SUPPLIER_IMAGES_DIR);
  
  for (const supplier of suppliers) {
    const supplierDir = path.join(SUPPLIER_IMAGES_DIR, supplier);
    
    if (!fs.statSync(supplierDir).isDirectory()) continue;
    
    const files = fs.readdirSync(supplierDir);
    
    for (const filename of files) {
      if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) continue;
      
      images.push({
        supplier,
        filename,
        localPath: `/images/suppliers/${supplier}/${filename}`,
        fullPath: path.join(supplierDir, filename),
      });
    }
  }
  
  return images;
}

async function uploadToCloudinary(fullPath: string, supplier: string, filename: string): Promise<string | null> {
  try {
    const folder = `technostore/${supplier}`;
    const publicId = filename.replace(/\.[^.]+$/, "");
    
    const result = await cloudinary.uploader.upload(fullPath, {
      public_id: publicId,
      folder,
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });
    
    return result.secure_url;
  } catch (error) {
    console.error(`  ❌ Error uploading ${filename}:`, error);
    return null;
  }
}

async function updateProductImageUrls(oldUrl: string, newCloudinaryUrl: string) {
  const db = await getDb();
  
  // Find product by image URL
  const product = await db.collection("products").findOne({
    "images.src": { $regex: oldUrl.replace(/\//g, "\\/").replace(/\?.*$/, "") }
  });
  
  if (product) {
    // Update the image URL
    await db.collection("products").updateOne(
      { _id: product._id },
      { $set: { "images.$.src": newCloudinaryUrl } }
    );
    console.log(`  ✅ Updated product: ${product.name}`);
  }
}

async function main() {
  console.log("=== Cloudinary Migration Script ===\n");
  
  initCloudinary();
  const env = getEnv();
  
  const images = await getAllLocalImages();
  console.log(`Found ${images.length} images to upload\n`);
  
  if (images.length === 0) {
    console.log("No images to upload");
    return;
  }
  
  // Ask for confirmation
  console.log(`This will upload ${images.length} images to Cloudinary and update the database.`);
  console.log("Type 'yes' to continue: ");
  
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const answer = await new Promise<string>((resolve) => rl.question("", resolve));
  rl.close();
  
  if (answer.toLowerCase() !== "yes") {
    console.log("Cancelled");
    return;
  }
  
  console.log("\n--- Uploading images ---\n");
  
  let uploaded = 0;
  let failed = 0;
  
  for (const img of images) {
    process.stdout.write(`[${uploaded + failed + 1}/${images.length}] ${img.supplier}/${img.filename}... `);
    
    const cloudinaryUrl = await uploadToCloudinary(img.fullPath, img.supplier, img.filename);
    
    if (cloudinaryUrl) {
      console.log("✅");
      uploaded++;
      
      // Delete local file
      fs.unlinkSync(img.fullPath);
      console.log(`  🗑️  Deleted local file`);
    } else {
      console.log("❌");
      failed++;
    }
  }
  
  console.log(`\n--- Summary ---`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  
  // Clean up empty directories
  console.log(`\n--- Cleaning empty directories ---\n`);
  
  const suppliers = fs.readdirSync(SUPPLIER_IMAGES_DIR);
  for (const supplier of suppliers) {
    const supplierDir = path.join(SUPPLIER_IMAGES_DIR, supplier);
    if (fs.existsSync(supplierDir) && fs.statSync(supplierDir).isDirectory()) {
      const files = fs.readdirSync(supplierDir);
      if (files.length === 0) {
        fs.rmdirSync(supplierDir);
        console.log(`Deleted empty directory: ${supplier}`);
      }
    }
  }
  
  if (fs.existsSync(SUPPLIER_IMAGES_DIR)) {
    const remaining = fs.readdirSync(SUPPLIER_IMAGES_DIR);
    if (remaining.length === 0) {
      fs.rmdirSync(SUPPLIER_IMAGES_DIR);
      console.log("Deleted suppliers directory");
    }
  }
  
  console.log("\n✅ Migration complete!");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });