import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { runScraper } from "./src/lib/scraper/scraper.service";
import { jotakpCategories } from "./src/lib/scraper/config";

// Obtener todas las subcategorías
const allCategories = jotakpCategories.filter(c => c.idsubrubro1 > 0);

async function main() {
  console.log(`=== Scraping de ${allCategories.length} categorías ===\n`);
  
  let totalCreated = 0;
  let totalUpdated = 0;
  let errores = 0;
  
  // Procesar todas las categorías
  for (let i = 0; i < allCategories.length; i++) {
    const cat = allCategories[i];
    console.log(`[${i+1}/${allCategories.length}] ${cat.name} (id=${cat.idsubrubro1})`);
    
    try {
      const result = await runScraper({ idsubrubro1: cat.idsubrubro1 });
      console.log(`  → ${result.created} created, ${result.updated} updated`);
      totalCreated += result.created;
      totalUpdated += result.updated;
    } catch (e) {
      console.error(`  ❌ Error: ${(e as Error).message}`);
      errores++;
    }
    
    // Delay pequeño entre categorías
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`=== RESUMEN FINAL ===`);
  console.log(`Total created: ${totalCreated}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Errores: ${errores}`);
  console.log('='.repeat(50));
}

main().catch(console.error);