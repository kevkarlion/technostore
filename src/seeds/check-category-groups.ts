import "dotenv/config";
import { getDb } from "@/config/db";
import { CATEGORY_GROUPS } from "@/components/admin/sections/category-groups";

async function check() {
  const db = await getDb();
  
  // Obtener todas las categorías reales que existen en productos
  const realCategories = new Set(await db.collection("products").distinct("categories"));
  
  console.log("🔍 Slugs en category-groups.ts que NO existen en productos:\n");
  
  for (const group of CATEGORY_GROUPS) {
    for (const slug of group.children) {
      if (!realCategories.has(slug)) {
        console.log(`  ❌ ${slug} (grupo: ${group.name})`);
      }
    }
  }
  
  console.log("\n✅ Slugs que SÍ existen en productos:");
  let count = 0;
  for (const group of CATEGORY_GROUPS) {
    for (const slug of group.children) {
      if (realCategories.has(slug)) {
        count++;
      }
    }
  }
  console.log(`  ${count} slugs válidos`);
}

check().then(() => process.exit());
