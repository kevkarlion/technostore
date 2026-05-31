import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Crea una orden mock con items que tienen costPrice para probar el detalle
 * con márgenes de ganancia.
 *
 * Uso: DOTENV_CONFIG_PATH=.env.local npx tsx src/seeds/seed-mock-order.ts
 */

const ORDER_ID = `MOCK-${Date.now()}`;

async function seed() {
  const db = await getDb();

  // Tomar productos con costPrice del seed
  const products = await db
    .collection("products")
    .find({ costPrice: { $exists: true, $ne: null } })
    .limit(5)
    .toArray();

  if (products.length === 0) {
    console.error("⚠️ No hay productos con costPrice. Corré el seed primero.");
    process.exit(1);
  }

  const items = products.map((p) => ({
    productId: p._id.toString(),
    productName: p.name,
    quantity: Math.floor(Math.random() * 2) + 1,
    unitPrice: p.price,
    costPrice: p.costPrice,
    imageUrl: p.images?.[0] || "",
  }));

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shipping = Math.round(Math.random() * 1500 + 500) / 100;
  const taxes = Math.round(subtotal * 0.21 * 100) / 100;
  const total = Math.round((subtotal + shipping + taxes) * 100) / 100;

  const now = new Date();

  const order = {
    orderId: ORDER_ID,
    externalReference: ORDER_ID,
    status: "captured",
    statusDetail: "Mock order for testing margins in order detail",
    items,
    totals: { subtotal, shipping, taxes, total },
    customer: {
      name: "Juan",
      lastName: "Pérez",
      email: "juan.perez@example.com",
      phone: "+54 11 5555-1234",
      address: "Av. Corrientes 1234",
      street: "Av. Corrientes",
      number: "1234",
      floor: "3",
      apartment: "B",
      province: "CABA",
      city: "Capital Federal",
      postalCode: "C1043AAN",
      additionalInstructions: "Dejar en el portero eléctrico",
      saveAddress: true,
      sameForBilling: true,
    },
    payment: {
      paymentId: `mp-mock-${Date.now()}`,
      mpPaymentId: `mp-mock-${Date.now()}`,
      paymentMethodId: "visa",
      paymentMethodType: "credit_card",
      installments: 3,
    },
    timeline: [
      {
        status: "reserved",
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        detail: "Pago reservado por Mercado Pago",
      },
      {
        status: "captured",
        timestamp: now.toISOString(),
        detail: "Capturado por el comercio",
      },
    ],
    createdAt: new Date(now.getTime() - 60000),
    updatedAt: now,
  };

  await db.collection("orders").insertOne(order);
  console.log(`✅ Orden mock creada: ${ORDER_ID}`);
  console.log(`   Productos: ${items.length}`);
  console.log(`   Total: $${total}`);
  console.log("");
  console.log("   Items:");
  for (const item of items) {
    const margin = ((item.unitPrice - item.costPrice) / item.costPrice * 100).toFixed(1);
    console.log(`   - ${item.productName}: $${item.costPrice} → $${item.unitPrice} (${margin}%)`);
  }
}

seed().then(() => process.exit());
