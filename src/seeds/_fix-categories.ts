import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Mapea categorías del seed a slugs reales de la DB.
 * Usa bulkWrite para eficiencia.
 *
 * Uso: DOTENV_CONFIG_PATH=.env.local npx tsx src/seeds/_fix-categories.ts
 */

interface CatMap {
  mockSlug: string;
  realSlugs: string[];
}

const categoryMappings: CatMap[] = [
  { mockSlug: "teclado", realSlugs: ["teclado-gamer", "teclados-perifericos"] },
  { mockSlug: "mouse", realSlugs: ["mouse-gamer", "mouse-perifericos"] },
  { mockSlug: "mousepads", realSlugs: ["pad"] },
  { mockSlug: "auriculares", realSlugs: ["auricular-bluetooth", "auricular-cableado", "auricular-gamer"] },
  { mockSlug: "gpu", realSlugs: ["placas-de-video"] },
  { mockSlug: "cpu", realSlugs: ["microprocesadores"] },
  { mockSlug: "mother", realSlugs: ["motherboard"] },
  { mockSlug: "gabinetes", realSlugs: ["gabinetes"] },
  { mockSlug: "fuente", realSlugs: ["fuentes"] },
  { mockSlug: "almacenamiento", realSlugs: ["discos-ssd", "discos-hdd", "discos-m2"] },
  { mockSlug: "monitorAcc", realSlugs: ["soportes-computadoras"] },
  { mockSlug: "cable", realSlugs: ["cable-audio", "cable-hardware", "cable-video", "cable-energia"] },
  { mockSlug: "router", realSlugs: ["routers"] },
  { mockSlug: "sillas", realSlugs: ["silla-gamer"] },
  { mockSlug: "controles", realSlugs: ["joysticks"] },
  { mockSlug: "parlantes", realSlugs: ["parlantes"] },
  { mockSlug: "microfono", realSlugs: ["microfonos"] },
  { mockSlug: "webcam", realSlugs: ["webcams"] },
  { mockSlug: "streaming", realSlugs: ["streaming"] },
  { mockSlug: "gabinete", realSlugs: ["gabinetes"] },
  { mockSlug: "silla", realSlugs: ["silla-gamer"] },
  { mockSlug: "joystick", realSlugs: ["joysticks"] },
  { mockSlug: "mousepad", realSlugs: ["pad"] },
  { mockSlug: "teclados", realSlugs: ["teclado-gamer"] },
  { mockSlug: "procesadores", realSlugs: ["microprocesadores"] },
  // secondary categories (original seed had two per product)
  { mockSlug: "perifericos", realSlugs: ["mouse-gamer"] },
  { mockSlug: "audio", realSlugs: ["auricular-bluetooth"] },
  { mockSlug: "hardware", realSlugs: ["gabinetes"] },
  { mockSlug: "gaming", realSlugs: ["silla-gamer"] },
  { mockSlug: "monitor", realSlugs: ["monitores"] },
];

async function fix() {
  const db = await getDb();
  const productsCollection = db.collection("products");
  const categoriesCollection = db.collection("categories");

  // Get real slugs set
  const realCats = await categoriesCollection.find({}).project({ slug: 1 }).toArray();
  const realSlugs = new Set(realCats.map((c: any) => c.slug));

  // Build bulk operations
  const operations: any[] = [];

  for (const mapping of categoryMappings) {
    // Replace first category with real slugs
    const filter = { categories: mapping.mockSlug };
    const update = {
      $set: {
        [`categories`]: mapping.realSlugs,
      },
    };
    operations.push({
      updateMany: {
        filter,
        update,
      },
    });
  }

  if (operations.length > 0) {
    const result = await productsCollection.bulkWrite(operations);
    console.log(`✅ Productos actualizados: ${result.modifiedCount}`);
  } else {
    console.log("⚠️ No operations to run");
  }

  // Count remaining mock slugs
  const allSlugs = new Set<string>();
  const products = await productsCollection.find({}, { projection: { categories: 1 } }).toArray();
  for (const p of products) {
    for (const c of p.categories) {
      allSlugs.add(c);
    }
  }

  const unknownSlugs = [...allSlugs].filter(s => !realSlugs.has(s));
  if (unknownSlugs.length > 0) {
    console.log(`⚠️ Slugs sin mapping en DB: ${unknownSlugs.join(", ")}`);
  } else {
    console.log("✅ Todas las categorías de productos existen en la DB");
  }

  // Show distribution
  const pipeline = [
    { $project: { firstCategory: { $arrayElemAt: ["$categories", 0] } } },
    { $group: { _id: "$firstCategory", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ];
  const stats = await productsCollection.aggregate(pipeline).toArray();
  console.log("\nTop categorías:");
  for (const s of stats) {
    const isReal = realSlugs.has(s._id);
    console.log(`  ${isReal ? "✅" : "⚠️"} ${s._id}: ${s.count} productos`);
  }
}

fix().then(() => process.exit());
