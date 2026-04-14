import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function check() {
  // Buscar imágenes que terminan en 24294
  const result = await cloudinary.api.resources({
    type: "upload",
    prefix: "technostore/jotakp/jotakp_89_",
    max_results: 10,
  });

  console.log('=== Imágenes con _89_ ===');
  for (const r of result.resources) {
    console.log(`  - ${r.public_id}`);
    console.log(`    URL: ${r.secure_url}`);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });