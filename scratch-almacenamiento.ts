import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { runScraper } from "./src/lib/scraper/scraper.service";

// Subcategorías de Almacenamiento
const almacenamientoSubcats = [
  { id: 'carry-caddy-disk', idsubrubro1: 100 },
  { id: 'cd-dvd-bluray', idsubrubro1: 13 },
  { id: 'discos-externos', idsubrubro1: 14 },
  { id: 'discos-hdd', idsubrubro1: 69 },
  { id: 'discos-m2', idsubrubro1: 157 },
  { id: 'discos-ssd', idsubrubro1: 156 },
  { id: 'memorias-flash', idsubrubro1: 12 },
  { id: 'pendrive', idsubrubro1: 5 },
];

async function scrapeAll() {
  console.log('=== Scraping Almacenamiento (8 subcategorías) ===\n');
  
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (const subcat of almacenamientoSubcats) {
    console.log(`\n>>> Scraping: ${subcat.id} (idsubrubro1=${subcat.idsubrubro1})`);
    
    try {
      const result = await runScraper({ idsubrubro1: subcat.idsubrubro1 });
      console.log(`    Result: ${result.created} created, ${result.updated} updated`);
      totalCreated += result.created;
      totalUpdated += result.updated;
      totalErrors += result.errors.length;
    } catch (e) {
      console.error(`    ERROR: ${e}`);
      totalErrors++;
    }
  }
  
  console.log('\n=== RESUMEN ===');
  console.log(`Total created: ${totalCreated}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
}

scrapeAll();