import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Borra productos mockeados del seed-mock-margins.ts.
 * Los productos mock tienen categorías como: teclado, mouse, auriculares, monitor, gpu, cpu,
 * gabinete, fuente, silla, joystick, streaming, parlantes, almacenamiento, mother,
 * monitorAcc, cable, webcam, microfono, mousepad, router
 *
 * Los productos reales del scraper tienen supplier: "jotakp".
 *
 * Uso: DOTENV_CONFIG_PATH=.env.local npx tsx src/seeds/clean-mock-products.ts
 */

const MOCK_CATEGORIES = [
  "teclado", "mouse", "auriculares", "monitor", "gpu", "cpu",
  "gabinete", "fuente", "silla", "joystick", "streaming", "parlantes",
  "almacenamiento", "mother", "monitorAcc", "cable", "webcam", "microfono",
  "mousepad", "router",
];

async function clean() {
  const db = await getDb();
  const collection = db.collection("products");

  // Contar total antes
  const totalBefore = await collection.countDocuments();
  console.log(`📊 Total de productos antes: ${totalBefore}`);

  // Contar productos reales del scraper
  const realProducts = await collection.countDocuments({ supplier: "jotakp" });
  console.log(`🏪 Productos reales (jotakp): ${realProducts}`);

  // Contar productos mock
  const mockProducts = await collection.countDocuments({
    categories: { $in: MOCK_CATEGORIES },
    supplier: { $ne: "jotakp" },
  });
  console.log(`🎭 Productos mock a borrar: ${mockProducts}`);

  // Borrar productos mock (sin supplier=jotakp y con categorías mock)
  const result = await collection.deleteMany({
    categories: { $in: MOCK_CATEGORIES },
    supplier: { $ne: "jotakp" },
  });

  const totalAfter = await collection.countDocuments();
  console.log(`🗑️ Productos borrados: ${result.deletedCount}`);
  console.log(`📊 Total de productos después: ${totalAfter}`);
}

clean().then(() => process.exit());
