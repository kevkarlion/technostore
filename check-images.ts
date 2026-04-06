import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();
  
  // Check a product with multiple images
  const product = await db.collection("products").findOne({
    supplier: "jotakp",
    "imageUrls.1": { $exists: true }  // Products with 2+ images
  });
  
  if (product) {
    console.log("Product with multiple images:");
    console.log(`External ID: ${product.externalId}`);
    console.log(`Name: ${product.name}`);
    console.log(`Images: ${product.imageUrls.length}`);
    product.imageUrls.forEach((img: string, i: number) => {
      console.log(`  ${i + 1}. ${img}`);
    });
  } else {
    console.log("No product with multiple images found");
    
    // Check how many have array of images
    const multiImageCount = await db.collection("products").countDocuments({
      supplier: "jotakp",
      "imageUrls.1": { $exists: true }
    });
    console.log(`Products with 2+ images: ${multiImageCount}`);
    
    const singleImageCount = await db.collection("products").countDocuments({
      supplier: "jotakp",
      $expr: { $eq: [{ $size: "$imageUrls" }, 1] }
    });
    console.log(`Products with exactly 1 image: ${singleImageCount}`);
  }
}

check();