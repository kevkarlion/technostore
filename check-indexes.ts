import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  const collection = db.collection("products");

  // Verificar índices
  console.log("=== ÍNDICES ===");
  const indexes = await collection.indexes();
  indexes.forEach(idx => {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  console.log("\n=== CONTEO DE CAMPOS ===");
  
  // Productos con slug
  const withSlug = await collection.countDocuments({ slug: { $exists: true, $ne: null } });
  console.log(`Con slug: ${withSlug}`);
  
  // Productos sin slug
  const withoutSlug = await collection.countDocuments({ 
    $or: [{ slug: { $exists: false } }, { slug: null }] 
  });
  console.log(`Sin slug: ${withoutSlug}`);
  
  // Productos con searchName
  const withSearchName = await collection.countDocuments({ searchName: { $exists: true, $ne: null } });
  console.log(`Con searchName: ${withSearchName}`);
  
  // Productos sin searchName
  const withoutSearchName = await collection.countDocuments({ 
    $or: [{ searchName: { $exists: false } }, { searchName: null }] 
  });
  console.log(`Sin searchName: ${withoutSearchName}`);
  
  // Total de productos activos
  const totalActive = await collection.countDocuments({ status: "active" });
  console.log(`Total activos: ${totalActive}`);

  // Productos recientes sin slug (creados en los últimos 2 días)
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const recentWithoutSlug = await collection.countDocuments({
    createdAt: { $gte: twoDaysAgo },
    $or: [{ slug: { $exists: false } }, { slug: null }]
  });
  console.log(`\nProductos recientes (2 días) sin slug: ${recentWithoutSlug}`);

  // Muestra algunos productos recientes sin slug
  if (recentWithoutSlug > 0) {
    console.log("\n=== PRODUCTOS RECIENTES SIN SLUG ===");
    const recent = await collection
      .find({ createdAt: { $gte: twoDaysAgo }, $or: [{ slug: { $exists: false } }, { slug: null }] })
      .limit(5)
      .toArray();
    recent.forEach(p => {
      console.log(`- ${p.name?.substring(0, 60)}...`);
      console.log(`  _id: ${p._id}`);
      console.log(`  createdAt: ${p.createdAt}`);
      console.log(`  slug: ${p.slug}`);
    });
  }
}

main().catch(console.error);