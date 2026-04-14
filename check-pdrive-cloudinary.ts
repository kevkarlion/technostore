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
  // Buscar imágenes en Cloudinary para externalIds de pendrive
  const externalIds = [19879, 21884, 21887];
  
  console.log('=== Imágenes en Cloudinary para pendrive ===\n');
  
  for (const extId of externalIds) {
    console.log(`Buscando externalId: ${extId}`);
    
    // Buscar por prefijo
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `technostore/jotakp/jotakp_${extId}_`,
      max_results: 10,
    });
    
    console.log(`  Encontradas: ${result.resources.length}`);
    for (const r of result.resources) {
      console.log(`    public_id: ${r.public_id}`);
      console.log(`    url: ${r.secure_url}`);
    }
    console.log('');
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });