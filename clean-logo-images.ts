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
  
  console.log("🔍 Buscando imágenes del logo (agenes0000) en Cloudinary...\n");
  
  // Buscar todas las imágenes con "agenes0000"
  const result = await cloudinary.api.resources({
    type: "upload",
    prefix: "technostore/jotakp",
    max_results: 500,
  });
  
  const logoImages = result.resources.filter((r: any) => 
    r.public_id.includes("agenes0000") || r.public_id.includes("agenes")
  );
  
  console.log(`Encontradas ${logoImages.length} imágenes del logo\n`);
  
  // Mostrar ejemplo
  for (const img of logoImages.slice(0, 5)) {
    console.log(`  - ${img.public_id}`);
  }
  if (logoImages.length > 5) {
    console.log(`  ... y ${logoImages.length - 5} más`);
  }
  
  // Eliminar cada una
  console.log("\n🗑️  Eliminando imágenes del logo...\n");
  
  let deleted = 0;
  for (const img of logoImages) {
    try {
      await cloudinary.uploader.destroy(img.public_id);
      deleted++;
      if (deleted <= 10) {
        console.log(`  ✅ Eliminado: ${img.public_id}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${img.public_id}`);
    }
  }
  console.log(`\nTotal eliminadas: ${deleted}`);
  
  // Ahora limpiar los cloudinaryUrls en la DB que apuntan a esas imágenes
  console.log("\n🧹 Limpiando cloudinaryUrls en la DB...\n");
  
  const logoPatterns = ["agenes0000", "agenes"];
  let productsUpdated = 0;
  
  // Buscar productos que tienen esas URLs
  const allProducts = await db.collection("products").find({
    status: "active",
    cloudinaryUrls: { $exists: true, $ne: [] }
  }).toArray();
  
  for (const product of allProducts) {
    const cloudUrls = product.cloudinaryUrls || [];
    const hasLogoUrl = cloudUrls.some(url => 
      url.includes("agenes0000") || url.includes("agenes")
    );
    
    if (hasLogoUrl) {
      // Limpiar las URLs del logo y dejar solo las válidas
      const validUrls = cloudUrls.filter(url => 
        !url.includes("agenes0000") && !url.includes("agenes")
      );
      
      // Actualizar - si no hay URLs válidas, dejar vacío (usará imageUrls como fallback)
      await db.collection("products").updateOne(
        { _id: product._id },
        { $set: { cloudinaryUrls: validUrls } }
      );
      
      productsUpdated++;
      console.log(`  🔧 Actualizado: ${product.name?.substring(0, 35)} (${validUrls.length} URLs válidas)`);
    }
  }
  
  console.log(`\n✅ Productos actualizados: ${productsUpdated}`);
  
  // Resumen final
  console.log("\n📊 Resumen:");
  console.log(`   Imágenes del logo eliminadas de Cloudinary: ${deleted}`);
  console.log(`   Productos limpiados en DB: ${productsUpdated}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });