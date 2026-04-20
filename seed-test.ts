import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { MongoClient, ObjectId } from "mongodb";

async function seedProducts() {
  const { MONGODB_URI, MONGODB_DB_NAME } = process.env;
  
  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  
  console.log(`[DB] Connected to ${MONGODB_DB_NAME}`);

  const collection = db.collection("products");

  // Delete existing products first
  await collection.deleteMany({});
  console.log("🗑️  Productos existentes eliminados");

  const products = [
    {
      _id: new ObjectId(),
      name: "SSD Samsung 1TB NVMe 980 Pro",
      slug: "ssd-samsung-1tb-980-pro",
      category: "almacenamiento",
      brand: "Samsung",
      price: 15999,
      originalPrice: 18999,
      inStock: true,
      stockQuantity: 25,
      rating: 4.8,
      ratingCount: 124,
      badges: ["sale", "featured"],
      shortDescription: "Disco SSD NVMe de 1TB con velocidades de lectura hasta 3500MB/s",
      specs: { capacidad: "1TB", interfaz: "PCIe 3.0 NVMe" },
      imageUrls: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500"],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Mouse Gamer Logitech G502",
      slug: "mouse-logitech-g502",
      category: "perifericos",
      brand: "Logitech",
      price: 8990,
      originalPrice: 10990,
      inStock: true,
      stockQuantity: 40,
      rating: 4.7,
      ratingCount: 89,
      badges: ["sale"],
      shortDescription: "Mouse gamer con sensor HERO 25K y 11 botones programables",
      specs: { tipo: "Inalámbrico", dpi: "25600" },
      imageUrls: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500"],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Teclado Mecánico Corsair K70",
      slug: "teclado-corsair-k70",
      category: "perifericos",
      brand: "Corsair",
      price: 24999,
      inStock: true,
      stockQuantity: 15,
      rating: 4.9,
      ratingCount: 56,
      badges: ["featured"],
      shortDescription: "Teclado mecánico con switches Cherry MX y retroiluminación RGB",
      specs: { switches: "Cherry MX Red", iluminacion: "RGB" },
      imageUrls: ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500"],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Monitor LG UltraGear 27\" 144Hz",
      slug: "monitor-lg-ultragear-27",
      category: "monitores",
      brand: "LG",
      price: 45999,
      originalPrice: 52999,
      inStock: true,
      stockQuantity: 8,
      rating: 4.6,
      ratingCount: 34,
      badges: ["sale"],
      shortDescription: "Monitor gamer 27\" IPS con 144Hz y FreeSync",
      specs: { pantalla: "27\" IPS", frecuencia: "144Hz" },
      imageUrls: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500"],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Notebook Lenovo ThinkPad X1 Carbon",
      slug: "notebook-lenovo-x1-carbon",
      category: "equipos",
      brand: "Lenovo",
      price: 189999,
      inStock: true,
      stockQuantity: 5,
      rating: 4.9,
      ratingCount: 28,
      badges: ["new", "featured"],
      shortDescription: "Ultrabook profesional con Intel Core i7 y pantalla 14\" OLED",
      specs: { procesador: "Intel Core i7", ram: "16GB", almacenamiento: "512GB SSD" },
      imageUrls: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const product of products) {
    await collection.insertOne(product);
    console.log(`✅ Insertado: ${product.name}`);
  }

  console.log(`\n🎉 ${products.length} productos insertados en la base de datos!`);
  
  await client.close();
}

seedProducts().catch(console.error);