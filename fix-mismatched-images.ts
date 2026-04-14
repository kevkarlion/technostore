import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getDb } from "@/config/db";

async function main() {
  const db = await getDb();
  
  console.log("🔍 Buscando productos con cloudinaryUrls incorrectos...\n");
  
  // Buscar todos los productos con cloudinaryUrls
  const products = await db.collection("products").find({
    status: "active",
    cloudinaryUrls: { $exists: true, $ne: [] }
  }).toArray();

  let fixed = 0;
  let skipped = 0;
  
  for (const p of products) {
    const cloudUrls = p.cloudinaryUrls || [];
    const extId = p.externalId;
    let isWrong = false;
    
    for (const url of cloudUrls) {
      if (url.includes('/jotakp_')) {
        const match = url.match(/jotakp_(\d+)_/);
        if (match) {
          const productIdInUrl = match[1];
          if (productIdInUrl !== extId) {
            isWrong = true;
            break;
          }
        }
      }
    }
    
    if (isWrong) {
      console.log(`🧹 Limpiando: ${p.name?.substring(0, 35)}...`);
      console.log(`   externalId: ${extId}, en URL: wrong`);
      
      // Limpiar cloudinaryUrls - dejar solo los correctos o vacío
      const correctUrls = cloudUrls.filter(url => {
        const match = url.match(/jotakp_(\d+)_/);
        if (match) {
          return match[1] === extId;
        }
        return false;
      });
      
      await db.collection("products").updateOne(
        { _id: p._id },
        { $set: { cloudinaryUrls: correctUrls } }
      );
      
      fixed++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n📊 RESUMEN`);
  console.log(`   ✅ Productos correctos: ${skipped}`);
  console.log(`   🔧 Productos corregidos: ${fixed}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });