import "dotenv/config";
import { getDb } from "@/config/db";

const products = [
  {
    name: "Teclado Mecánico RGB HyperStrike K70",
    description: "Teclado mecánico gamer con switches red, iluminación RGB personalizable y construcción en aluminio.",
    price: 129,
    currency: "USD",
    stock: 25,
    status: "active",
    categories: ["perifericos", "teclados"],
    imageUrls: ["https://picsum.photos/seed/keyboard1/600/600"],
  },
  {
    name: "Mouse Gamer Phantom X Pro",
    description: "Mouse ultraligero con sensor óptico de 26000 DPI, ideal para esports y juegos competitivos.",
    price: 89,
    currency: "USD",
    stock: 40,
    status: "active",
    categories: ["perifericos", "mouse"],
    imageUrls: ["https://picsum.photos/seed/mouse1/600/600"],
  },
  {
    name: "Auriculares Gamer TitanSound 7.1",
    description: "Auriculares con sonido envolvente 7.1, micrófono con cancelación de ruido y almohadillas memory foam.",
    price: 149,
    currency: "USD",
    stock: 18,
    status: "active",
    categories: ["audio", "auriculares"],
    imageUrls: ["https://picsum.photos/seed/headset1/600/600"],
  },
  {
    name: "Monitor Gamer UltraView 27'' 165Hz",
    description: "Monitor IPS de 27 pulgadas con resolución QHD, 165Hz y tiempo de respuesta de 1ms.",
    price: 399,
    currency: "USD",
    stock: 10,
    status: "active",
    categories: ["monitores"],
    imageUrls: ["https://picsum.photos/seed/monitor1/600/600"],
  },
  {
    name: "Silla Gamer DarkForce Elite",
    description: "Silla ergonómica gamer con soporte lumbar ajustable, reclinación 180° y estructura metálica.",
    price: 320,
    currency: "USD",
    stock: 12,
    status: "active",
    categories: ["gaming", "sillas"],
    imageUrls: ["https://picsum.photos/seed/chair1/600/600"],
  },
  {
    name: "Mousepad Gamer XXL SpeedControl",
    description: "Mousepad de gran tamaño con superficie optimizada para precisión y base antideslizante.",
    price: 35,
    currency: "USD",
    stock: 60,
    status: "active",
    categories: ["perifericos", "mousepads"],
    imageUrls: ["https://picsum.photos/seed/mousepad1/600/600"],
  },
  {
    name: "Gabinete Gamer Nova RGB",
    description: "Gabinete ATX con panel lateral de vidrio templado y ventiladores RGB incluidos.",
    price: 140,
    currency: "USD",
    stock: 14,
    status: "active",
    categories: ["hardware", "gabinetes"],
    imageUrls: ["https://picsum.photos/seed/case1/600/600"],
  },
  {
    name: "Placa de Video RTX 4070 Storm Edition",
    description: "GPU de alto rendimiento con arquitectura moderna, ideal para gaming en 1440p y ray tracing.",
    price: 799,
    currency: "USD",
    stock: 6,
    status: "active",
    categories: ["hardware", "gpu"],
    imageUrls: ["https://picsum.photos/seed/gpu1/600/600"],
  },
  {
    name: "Joystick Pro Controller X",
    description: "Control inalámbrico gamer compatible con PC y consolas, con vibración háptica avanzada.",
    price: 75,
    currency: "USD",
    stock: 30,
    status: "active",
    categories: ["gaming", "controles"],
    imageUrls: ["https://picsum.photos/seed/controller1/600/600"],
  },
  {
    name: "Microfono Streaming StudioCast",
    description: "Micrófono USB de condensador ideal para streaming, podcasting y gaming.",
    price: 110,
    currency: "USD",
    stock: 20,
    status: "active",
    categories: ["streaming", "audio"],
    imageUrls: ["https://picsum.photos/seed/mic1/600/600"],
  }
];
async function seed() {
  const db = await getDb();
  const collection = db.collection("products");

  const now = new Date();

  const docs = products.map((p) => ({
    ...p,
    createdAt: now,
    updatedAt: now,
  }));

  await collection.insertMany(docs);

  console.log("Seed completed");
}

seed().then(() => process.exit());