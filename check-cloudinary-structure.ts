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

async function main() {
  // Get some images to see their structure
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'technostore/jotakp',
    max_results: 10,
  });

  console.log('Sample Cloudinary images:');
  for (const r of result.resources) {
    console.log(`\npublic_id: ${r.public_id}`);
    console.log(`  url: ${r.secure_url.substring(0, 70)}...`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });