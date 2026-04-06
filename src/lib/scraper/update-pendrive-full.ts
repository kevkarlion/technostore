/**
 * Update pendrive products with scraped data (prices, descriptions, images)
 * Usage: npx tsx src/lib/scraper/update-pendrive-full.ts
 */

import "dotenv/config";
import { productRepository } from "@/api/repository/product.repository";

const pendriveProducts = [
  {
    externalId: "19879",
    supplier: "jotakp",
    name: "Pendrive Hikvision 128GB M200 Classic USB 3.0 (HS-USB-M200 128GB U3)",
    description: "",
    price: 14.20,
    currency: "USD",
    stock: 0,
    sku: "0019879",
    imageUrls: ["https://jotakp.dyndns.org/imagenes/min/imagen00026379.jpg"],
    categories: ["pendrive"],
  },
  {
    externalId: "20174",
    supplier: "jotakp",
    name: "Pendrive 128 Gb HikSemi 3.0 Usb y Usb-C E307C Dual Slim (HS-USB-E307C 128G U3)",
    description: "",
    price: 14.27,
    currency: "USD",
    stock: 0,
    sku: "0020174",
    imageUrls: ["https://jotakp.dyndns.org/imagenes/min/imagen00026713.jpg"],
    categories: ["pendrive"],
  },
  {
    externalId: "21735",
    supplier: "jotakp",
    name: "Pendrive Usb-C 64GB Hiksemi Metalico HS-USB-E327C-64GB-U3-SILVER",
    description: "HS-USB-E327C de 64 GB es un dispositivo que almacena y transfiere archivos de forma rápida y sencilla. Admite 64 GB de almacenamiento en diversos sistemas operativos y dispositivos. Con conectores USB tipo A y tipo C, la memoria Hiksemi permite transferencias fluidas entre portátiles, ordenadores de sobremesa y smartphones. Como solución de alto rendimiento, la memoria ofrece velocidades de lectura de hasta 150 MB/s y de escritura de 45 MB/s para acceder rápidamente a archivos importantes.",
    price: 7.92,
    currency: "USD",
    stock: 0,
    sku: "0021735",
    imageUrls: ["https://jotakp.dyndns.org/imagenes/min/imagen00028750.jpg"],
    categories: ["pendrive"],
  },
  {
    externalId: "21884",
    supplier: "jotakp",
    name: "Pendrive Dual 128GB Hiksemi Metalico HS-USB-E327C-128GB-U3-SILVER",
    description: "",
    price: 15.26,
    currency: "USD",
    stock: 0,
    sku: "0021884",
    imageUrls: ["https://jotakp.dyndns.org/imagenes/min/imagen00028904.jpg"],
    categories: ["pendrive"],
  },
  {
    externalId: "21887",
    supplier: "jotakp",
    name: "Pendrive 256 Gb HikSemi 3.0 Usb y Usb-C E307C Dual Slim (HS-USB-E307C 256G U3)",
    description: "",
    price: 34.83,
    currency: "USD",
    stock: 0,
    sku: "0021887",
    imageUrls: ["https://jotakp.dyndns.org/img/sinfoto.png"],
    categories: ["pendrive"],
  },
];

async function updateProducts() {
  console.log("=== Updating Pendrive Products with Full Data ===\n");

  for (const product of pendriveProducts) {
    try {
      const result = await productRepository.upsertByExternalId(product);
      console.log(`✅ ${product.externalId}: $${product.price} ${product.currency}`);
      console.log(`   Image: ${product.imageUrls[0]}`);
      console.log(`   Description: ${product.description ? product.description.substring(0, 50) + "..." : "(empty)"}`);
      console.log("");
    } catch (error) {
      console.error(`❌ Error updating ${product.externalId}:`, error);
    }
  }

  console.log("✅ Done!");
}

updateProducts().catch(console.error);