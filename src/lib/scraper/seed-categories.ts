import "dotenv/config";
import { jotakpCategories } from "@/lib/scraper/config";
import { categoryRepository } from "@/api/repository/category.repository";

/**
 * Script to seed categories from Jotakp
 * Usage: npx tsx src/lib/scraper/seed-categories.ts
 */
async function seedCategories() {
  console.log("=== Seeding Categories from Jotakp ===\n");

  // Clear existing categories
  console.log("Clearing existing categories...");
  await categoryRepository.deleteAll();

  // Prepare categories for seeding
  const categoriesToSeed = jotakpCategories
    .filter((cat) => cat.idsubrubro1 > 0) // Skip parent categories
    .map((cat) => ({
      name: cat.name,
      slug: cat.id,
      description: `Categoría de ${cat.name} - Productos de tecnología e informática`,
      supplierId: "jotakp",
      supplierCategoryId: cat.idsubrubro1,
    }));

  console.log(`Seeding ${categoriesToSeed.length} categories...`);

  const result = await categoryRepository.upsertMany(categoriesToSeed);

  console.log(`\n✅ Categories seeded successfully!`);
  console.log(`   Inserted: ${result.inserted}`);
  console.log(`   Updated: ${result.updated}`);

  // Verify
  const allCategories = await categoryRepository.findAll();
  console.log(`\nTotal categories in DB: ${allCategories.length}`);
  console.log("\nCategories:");
  allCategories.forEach((cat) => {
    console.log(`  - ${cat.name} (/category/${cat.slug})`);
  });
}

seedCategories().catch(console.error);
