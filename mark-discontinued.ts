import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  
  // Obtener los 7 productos de la web de jotakp
  const webResponse = await fetch("https://jotakp.dyndns.org/buscar.aspx?idsubrubro1=133");
  const html = await webResponse.text();
  
  // Extraer IDs de productos de la web
  const webIds: string[] = [];
  const regex = /articulo\.aspx\?id=(\d+)/g;
  let match;
  const seen = new Set<string>();
  while ((match = regex.exec(html)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      webIds.push(match[1]);
    }
  }
  
  console.log("Productos en web jotakp:", webIds.length);
  console.log("IDs:", webIds);
  
  // Buscar categoría con supplierCategoryId 133
  const category = await db.collection("categories").findOne({ supplierCategoryId: 133 });
  console.log("\nCategoría en DB:", category?.name, "| slug:", category?.slug);
  
  if (!category) {
    console.log("Categoría no encontrada");
    return;
  }
  
  // Obtener productos de esa categoría usando el slug en el array categories
  const dbProducts = await db.collection("products").find({ 
    categories: category.slug,
    status: "active"
  }).toArray();
  
  console.log("\nProductos activos en DB:", dbProducts.length);
  
  // Encontrar los que ya no están en la web
  const discontinued: string[] = [];
  const stillActive: string[] = [];
  
  for (const product of dbProducts) {
    if (webIds.includes(product.externalId)) {
      stillActive.push(`${product.name} (${product.externalId})`);
    } else {
      discontinued.push(`${product.name} (${product.externalId})`);
    }
  }
  
  console.log("\n=== Productos que YA NO están en la web (deberían marcarse discontinued) ===");
  console.log("Total:", discontinued.length);
  discontinued.forEach(name => console.log("-", name));
  
  console.log("\n=== Productos que SÍ están en la web (correctos) ===");
  console.log("Total:", stillActive.length);
  stillActive.forEach(name => console.log("-", name));
  
  if (discontinued.length > 0) {
    console.log("\n--- Marcando como discontinued ---");
    const result = await db.collection("products").updateMany(
      {
        categories: category.slug,
        status: "active",
        externalId: { $nin: webIds }
      },
      {
        $set: {
          status: "discontinued",
          discontinuedAt: new Date()
        }
      }
    );
    console.log("Marcados:", result.modifiedCount);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });