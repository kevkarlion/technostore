import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { runScraper } from "./src/lib/scraper/scraper.service";
import { jotakpCategories } from "./src/lib/scraper/config";
import { MongoClient } from "mongodb";

// Filtrar solo subcategorías (con idsubrubro1 > 0)
const subcategories = jotakpCategories.filter(c => c.idsubrubro1 > 0);

// Tiempo mínimo entre scrapeos de una categoría (en ms)
// Por defecto 1 hora - solo re-escrapea si pasó este tiempo
const MIN_INTERVAL_MS = parseInt(process.env.SCRAPER_MIN_INTERVAL_MS || "3600000");

async function getLastScrapeTime(categorySlug: string): Promise<Date | null> {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://ecommerce_admin:27dLQan4VUKsda@cluster0.twowu9r.mongodb.net/?appName=Cluster0';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('ecommerce');
    
    // Buscar el último run completado para esta categoría
    const run = await db.collection('scraper_runs').findOne(
      { lastCategoryName: categorySlug, status: 'completed' },
      { sort: { createdAt: -1 } }
    );
    
    return run?.createdAt || null;
  } finally {
    await client.close();
  }
}

async function shouldScrapeCategory(categorySlug: string): Promise<boolean> {
  const lastScrape = await getLastScrapeTime(categorySlug);
  
  if (!lastScrape) {
    // Nunca se scrapeó, hacerlo
    console.log(`  [NUEVO] Nunca scrapeado`);
    return true;
  }
  
  const now = new Date();
  const elapsed = now.getTime() - lastScrape.getTime();
  
  if (elapsed < MIN_INTERVAL_MS) {
    const minutes = Math.round(elapsed / 60000);
    console.log(`  [SKIP] scrapeado hace ${minutes} min (esperar ${Math.round(MIN_INTERVAL_MS/60000)} min)`);
    return false;
  }
  
  console.log(`  [ACTUALIZAR] scrapeado hace ${Math.round(elapsed/60000)} min`);
  return true;
}

async function scrapeAll(force = false) {
  console.log(`=== Scraping inteligente: ${subcategories.length} subcategorías ===`);
  console.log(`Intervalo mínimo: ${Math.round(MIN_INTERVAL_MS/60000)} minutos\n`);
  
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let categoriasProcesadas = 0;
  
  for (let i = 0; i < subcategories.length; i++) {
    const subcat = subcategories[i];
    console.log(`\n[${i + 1}/${subcategories.length}] ${subcat.name} (idsubrubro1=${subcat.idsubrubro1})`);
    
    // Verificar si necesita scrapeo
    const shouldScrape = force || await shouldScrapeCategory(subcat.id);
    
    if (!shouldScrape) {
      totalSkipped++;
      continue;
    }
    
    try {
      const result = await runScraper({ idsubrubro1: subcat.idsubrubro1 });
      
      console.log(`    Result: ${result.created} created, ${result.updated} updated`);
      
      totalCreated += result.created;
      totalUpdated += result.updated;
      categoriasProcesadas++;
      
    } catch (e) {
      console.error(`    ❌ ERROR: ${(e as Error).message}`);
      totalErrors++;
    }
    
    // Pequeño delay entre categorías
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('=== RESUMEN ===');
  console.log(`Categorías procesadas: ${categoriasProcesadas}`);
  console.log(`Categorías omitidas (recientes): ${totalSkipped}`);
  console.log(`Total created: ${totalCreated}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Errores: ${totalErrors}`);
  console.log('='.repeat(50));
  
  return { created: totalCreated, updated: totalUpdated, skipped: totalSkipped, errors: totalErrors };
}

// Parsear argumentos CLI
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

if (force) {
  console.log('⚡ Modo FORCE: se scrapearán TODAS las categorías\n');
}

scrapeAll(force)
  .then(() => {
    console.log('\n✅ Scrapeo completado');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  });