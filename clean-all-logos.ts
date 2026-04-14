import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { v2 as cloudinary } from "cloudinary";
import { getDb } from "@/config/db";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function main() {
  const db = await getDb();
  
  console.log("🔍 Buscando TODAS las imágenes del logo en Cloudinary...\n");
  
  // Obtener TODOS los recursos de technostore/jotakp
  let allImages: any[] = [];
  let nextCursor: string | undefined;
  
  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "technostore/jotakp",
      max_results: 500,
      next_cursor: nextCursor,
    });
    
    allImages.push(...result.resources);
    nextCursor = result.next_cursor;
    console.log(`   Obtenidas: ${allImages.length}...`);
  } while (nextCursor);
  
  console.log(`\nTotal imágenes en Cloudinary: ${allImages.length}`);
  
  // Filtrar las del logo (cualquiera que tenga "agenes" o termine en "0000" o "0001" sin imagen real)
  const logoImages = allImages.filter((r: any) => {
    const publicId = r.public_id.toLowerCase();
    // Buscar patrones del logo
    return publicId.includes("agenes") || 
           publicId.endsWith("0000") || 
           publicId.endsWith("0001");
  });
  
  console.log(`Imágenes del logo encontradas: ${logoImages.length}\n`);
  
  // Mostrar las primeras 20
  logoImages.slice(0, 20).forEach((img: any) => {
    console.log(`  - ${img.public_id}`);
  });
  if (logoImages.length > 20) {
    console.log(`  ... y ${logoImages.length - 20} más`);
  }
  
  // Eliminar todas las imágenes del logo
  console.log("\n🗑️  Eliminando...\n");
  
  let deleted = 0;
  for (const img of logoImages) {
    try {
      await cloudinary.uploader.destroy(img.public_id);
      deleted++;
    } catch (e) {
      console.log(`  ❌ Error: ${img.public_id}`);
    }
  }
  
  console.log(`\nTotal eliminadas: ${deleted}`);
  
  // Limpiar la DB - buscar productos con URLs que terminan en patrones del logo
  console.log("\n🧹 Limpiando cloudinaryUrls en DB...\n");
  
  const productsToClean = await db.collection("products").find({
    status: "active",
    cloudinaryUrls: { $exists: true, $ne: [] }
  }).toArray();
  
  let updatedProducts = 0;
  for (const product of productsToClean) {
    const cloudUrls = product.cloudinaryUrls || [];
    const hasLogoUrl = cloudUrls.some(url => {
      const urlLower = url.toLowerCase();
      return urlLower.includes("agenes") || urlLower.endsWith("0000") || urlLower.endsWith("0001");
    });
    
    if (hasLogoUrl) {
      const validUrls = cloudUrls.filter(url => {
        const urlLower = url.toLowerCase();
        return !urlLower.includes("agenes") && !urlLower.endsWith("0000") && !urlLower.endsWith("0001");
      });
      
      await db.collection("products").updateOne(
        { _id: product._id },
        { $set: { cloudinaryUrls: validUrls } }
      );
      
      updatedProducts++;
      console.log(`  🔧 ${product.name?.substring(0, 35)}... -> ${validUrls.length} URLs`);
    }
  }
  
  console.log(`\n✅ Productos actualizados: ${updatedProducts}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });