import "dotenv/config";
import { productRepository } from "@/api/repository/product.repository";

const pendriveProducts = [
  {
    externalId: "19879",
    supplier: "jotakp",
    name: "Pendrive Hikvision 128GB M200 Classic USB 3.0 (HS-USB-M200 128GB U3)",
    description: "Sin descripción",
    price: 0, // No price in the scraped data - need to check
    currency: "ARS",
    stock: 0,
    sku: "0019879",
    imageUrls: [],
    categories: ["pendrive"],
  },
  {
    externalId: "20174",
    supplier: "jotakp",
    name: "Pendrive 128 Gb HikSemi 3.0 Usb y Usb-C E307C Dual Slim (HS-USB-E307C 128G U3)",
    description: "Sin descripción",
    price: 0,
    currency: "ARS",
    stock: 0,
    sku: "0020174",
    imageUrls: [],
    categories: ["pendrive"],
  },
  {
    externalId: "21735",
    supplier: "jotakp",
    name: "Pendrive Usb-C 64GB Hiksemi Metalico HS-USB-E327C-64GB-U3-SILVER",
    description: "HS-USB-E327C de 64 GB es un dispositivo que almacena y transfiere archivos de forma rápida y sencilla. Admite 64 GB de almacenamiento en diversos sistemas operativos y dispositivos. Con conectores USB tipo A y tipo C, la memoria Hiksemi permite transferencias fluidas entre portátiles, ordenadores de sobremesa y smartphones. Como solución de alto rendimiento, la memoria ofrece velocidades de lectura de hasta 150 MB/s y de escritura de 45 MB/s para acceder rápidamente a archivos importantes.",
    price: 0,
    currency: "ARS",
    stock: 0,
    sku: "0021735",
    imageUrls: [],
    categories: ["pendrive"],
  },
  {
    externalId: "21884",
    supplier: "jotakp",
    name: "Pendrive Dual 128GB Hiksemi Metalico HS-USB-E327C-128GB-U3-SILVER",
    description: "Sin descripción",
    price: 0,
    currency: "ARS",
    stock: 0,
    sku: "0021884",
    imageUrls: [],
    categories: ["pendrive"],
  },
  {
    externalId: "21887",
    supplier: "jotakp",
    name: "Pendrive 256 Gb HikSemi 3.0 Usb y Usb-C E307C Dual Slim (HS-USB-E307C 256G U3)",
    description: "Sin descripción",
    price: 0,
    currency: "ARS",
    stock: 0,
    sku: "0021887",
    imageUrls: [],
    categories: ["pendrive"],
  },
];

async function insertProducts() {
  console.log("=== Inserting 5 Pendrive Products ===\n");

  for (const product of pendriveProducts) {
    try {
      const result = await productRepository.upsertByExternalId(product);
      console.log(`✅ Inserted: ${result.name.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Error inserting ${product.name}:`, error);
    }
  }

  console.log("\n✅ Done!");
}

insertProducts().catch(console.error);