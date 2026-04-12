import "dotenv/config";
import { jotakpCategories } from "@/lib/scraper/config";
import { categoryRepository } from "@/api/repository/category.repository";

/**
 * Script to seed categories from Jotakp with parent-child hierarchy
 * Usage: npx tsx src/lib/scraper/seed-categories.ts
 */
async function seedCategories() {
  console.log("=== Seeding Categories from Jotakp ===\n");

  // Clear existing categories FIRST
  console.log("Clearing existing categories...");
  await categoryRepository.deleteAll();

  // Prepare all categories for upsert (both parent and subcategories)
  const categoriesToSeed = jotakpCategories.map((cat) => ({
    name: cat.name,
    slug: cat.id, // Use the ID as slug
    description: cat.parentId 
      ? `Productos de ${cat.name}` 
      : `Categoría de ${cat.name} - Productos de tecnología e informática`,
    parentId: cat.parentId || undefined, // undefined for parent categories
    supplierId: "jotakp",
    supplierCategoryId: cat.idsubrubro1,
  }));

  console.log(`Seeding ${categoriesToSeed.length} categories...`);

  // Use upsertMany to handle duplicates properly
  const result = await categoryRepository.upsertMany(categoriesToSeed);

  console.log(`\n✅ Categories seeded successfully!`);
  console.log(`   Inserted: ${result.inserted}`);
  console.log(`   Updated: ${result.updated}`);

  // Verify
  const allCategories = await categoryRepository.findAll();
  console.log(`\nTotal categories in DB: ${allCategories.length}`);

  // Group by parent for display
  const parents = allCategories.filter((c) => !c.parentId);
  console.log(`\nParent categories (${parents.length}):`);
  parents.forEach((p) => {
    const subs = allCategories.filter((c) => c.parentId === p.slug);
    console.log(`  ${p.name} → ${subs.length} subcategories`);
  });
}

seedCategories().catch(console.error);
