import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getDb } from "./src/config/db";

async function main() {
  const db = await getDb();
  
  // Buscar categoría por supplierCategoryId 133
  const category = await db.collection("categories").findOne({ supplierCategoryId: 133 });
  console.log("Categoría:", category?.name, "| id:", category?.id);
  
  if (category) {
    // Contar productos activos de esa categoría
    const activeCount = await db.collection("products").countDocuments({ 
      categoryId: category.id,
      status: "active"
    });
    console.log("Activos en DB:", activeCount);
    
    const totalCount = await db.collection("products").countDocuments({ 
      categoryId: category.id
    });
    console.log("Total en DB:", totalCount);
    
    // Listar productos
    const products = await db.collection("products").find({ categoryId: category.id }).toArray();
    products.forEach(p => {
      console.log("-", p.name, "| status:", p.status);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });