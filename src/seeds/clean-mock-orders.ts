import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Borra todas las órdenes mock EXCEPTO las de Juan Pérez.
 * Limpia tanto la sección de pedidos como la de contabilidad.
 *
 * Uso: DOTENV_CONFIG_PATH=.env.local npx tsx src/seeds/clean-mock-orders.ts
 */

async function clean() {
  const db = await getDb();
  const collection = db.collection("orders");

  // Contar total antes
  const totalBefore = await collection.countDocuments();
  console.log(`📊 Total de órdenes antes: ${totalBefore}`);

  // Contar órdenes de Juan Pérez
  const juanOrders = await collection.countDocuments({
    "customer.name": "Juan",
    "customer.lastName": "Pérez",
  });
  console.log(`👤 Órdenes de Juan Pérez: ${juanOrders}`);

  // Borrar todo lo que NO sea Juan Pérez
  const result = await collection.deleteMany({
    $or: [
      { "customer.name": { $ne: "Juan" } },
      { "customer.lastName": { $ne: "Pérez" } },
    ],
  });

  const totalAfter = await collection.countDocuments();
  console.log(`🗑️ Órdenes borradas: ${result.deletedCount}`);
  console.log(`📊 Total de órdenes después: ${totalAfter}`);
}

clean().then(() => process.exit());
