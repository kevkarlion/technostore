import "dotenv/config";
import { getDb } from "@/config/db";

/**
 * Seed masivo de productos mock con márgenes.
 * Uso: DOTENV_CONFIG_PATH=.env.local npx tsx src/seeds/seed-mock-margins.ts
 */

interface SeedProductInput {
  name: string;
  description: string;
  costPrice: number;
  profitMargin: number;
  category: string;
}

const TIERS = {
  teclado: { names: ["HyperX Alloy Origins", "Redragon Kumara K552", "Logitech G Pro", "Razer BlackWidow V3", "Corsair K70 RGB", "Ducky One 3 Mini", "Keychron Q1", "SteelSeries Apex 7", "Cooler Master CK550", "Roccat Vulcan 121"], baseCost: 45, marginRange: [18, 35] },
  mouse: { names: ["Logitech G305", "Razer DeathAdder V2", "Redragon M711", "HyperX Pulsefire Haste", "SteelSeries Rival 3", "Corsair Harpoon", "Glorious Model O", "Cooler Master MM710", "Roccat Kone Pro", "Zowie EC2"], baseCost: 18, marginRange: [25, 45] },
  auriculares: { names: ["HyperX Cloud II", "Redragon H510", "Logitech G435", "Razer Kraken V3 Pro", "Corsair HS80", "SteelSeries Arctis 7", "JBL Quantum 400", "Sennheiser GSP 300", "Turtle Beach Recon 70", "EPOS H3"], baseCost: 35, marginRange: [15, 30] },
  monitor: { names: ["LG UltraGear 27GP850-B", "Samsung Odyssey G7", "AOC CQ27G2U", "ViewSonic XG2705-2K", "Asus ROG Swift PG279QM", "Dell S2722QC", "BenQ EX2780Q", "Gigabyte M27Q", "MSI Optix MAG274QRF", "HP X27i"], baseCost: 180, marginRange: [8, 28] },
  gpu: { names: ["NVIDIA RTX 4060", "AMD Radeon RX 7800 XT", "NVIDIA RTX 4070 Super", "AMD Radeon RX 7900 GRE", "NVIDIA RTX 4080 Super", "AMD Radeon RX 7700 XT", "Intel Arc A770", "NVIDIA RTX 4060 Ti", "AMD Radeon RX 7600", "NVIDIA RTX 4090"], baseCost: 280, marginRange: [3, 12] },
  cpu: { names: ["Intel Core i5-14600K", "AMD Ryzen 7 7800X3D", "Intel Core i7-14700K", "AMD Ryzen 9 7950X", "Intel Core i9-14900K", "AMD Ryzen 5 7600X", "Intel Core i3-14100F", "AMD Ryzen 9 7900X", "Intel Core i5-14400F", "AMD Ryzen 7 7700X"], baseCost: 150, marginRange: [4, 15] },
  gabinete: { names: ["Corsair 4000D Airflow", "NZXT H510 Flow", "Lian Li O11 Dynamic", "Cooler Master TD500", "Phanteks Eclipse G360A", "Fractal Design Meshify 2", "Thermaltake View 71", "be quiet! Silent Base 802", "MetallicGear Neo Qube", "SilverStone Fara R1"], baseCost: 65, marginRange: [8, 25] },
  fuente: { names: ["Corsair RM850x", "EVGA SuperNOVA 850 G7", "Seasonic Focus GX-750", "be quiet! Pure Power 12 M", "Thermaltake Toughpower GF3", "Cooler Master MWE Gold 850", "MSI MPG A850GF", "NZXT C850", "Asus ROG Thor 1000P", "SilverStone Strider 750"], baseCost: 85, marginRange: [10, 22] },
  silla: { names: ["Corsair T3 Rush", "Secretlab Titan Evo", "Razer Iskur V2", "Noblechairs Hero", "DXRacer Racing Series", "AKRacing Core Pro", "Cougar Armor S", "Vertagear SL5000", "Respawn 110 Racing", "Homall Executive Gaming"], baseCost: 160, marginRange: [20, 40] },
  joystick: { names: ["Xbox Series X Wireless", "DualSense PS5", "8BitDo Pro 2", "Razer Wolverine V2", "PowerA Fusion Pro", "GameSir T4 Kaleid", "Thrustmaster eSwap X", "Victrix Gambit", "Nacon Revolution X", "Scuf Reflex"], baseCost: 35, marginRange: [18, 35] },
  streaming: { names: ["Logitech C920 Pro HD", "Elgato Facecam", "Razer Kiyo Pro", "AverMedia PW315", "Microsoft LifeCam HD-3000", "Creative Live Cam Sync 4K", "Insta360 Link", "Logitech StreamCam", "Dell UltraSharp WB7022", "Anker PowerConf C200"], baseCost: 30, marginRange: [5, 20] },
  parlantes: { names: ["Logitech Z407", "Edifier R1280T", "JBL Flip 6", "Creative Pebble V3", "Bose Companion 2 Series III", "Razer Nommo V2", "SteelSeries Arena 3", "Harman Kardon SoundSticks 4", "Klipsch ProMedia 2.1", "Audioengine A2+"], baseCost: 40, marginRange: [15, 35] },
  almacenamiento: { names: ["Samsung 990 Pro 2TB", "WD Black SN850X", "Crucial T500 1TB", "Kingston Fury Renegade 2TB", "Seagate FireCuda 530", "Sabrent Rocket 4 Plus", "Corsair MP600 Pro", "TeamGroup T-Force Cardea", "ADATA XPG Gammix S70", "SK hynix Platinum P41"], baseCost: 75, marginRange: [5, 18] },
  mother: { names: ["Asus ROG Strix Z790-E", "MSI MAG Z790 Tomahawk", "Gigabyte Z790 Aorus Elite", "ASRock Phantom Gaming Z790", "Asus TUF Gaming B760", "MSI PRO B760-P", "Gigabyte B760M Aorus Elite", "ASRock B760M Pro RS", "Asus ROG Crosshair X670E", "MSI MEG X670E Ace"], baseCost: 140, marginRange: [6, 20] },
  monitorAcc: { names: ["Amazon Basics Monitor Stand", "Wali Single Monitor Mount", "ErGear Dual Monitor Arm", "Vivo Pneumatic Monitor Arm", "Wali Dual Monitor Stand", "Mounting Dream Single Arm", "HUANUO Gas Spring Arm", "BONTEC Triple Monitor Stand", "WALI Full Motion Wall Mount", "Ergotron LX Desk Mount"], baseCost: 15, marginRange: [30, 55] },
  cable: { names: ["Anker USB-C 100W 3m", "Belkin USB-C to HDMI", "Ugreen Cat6 Ethernet 5m", "CableMod Pro Braided", "Amazon Basics DisplayPort", "Insignia USB-A to USB-C", "Startech USB 3.0 Extension", "Cable Matters Thunderbolt 4", "Monoprice VGA to HDMI", "Anker Powerline+ Lightning"], baseCost: 8, marginRange: [40, 65] },
  webcam: { names: ["Logitech Brio 4K", "Elgato Facecam Pro", "Razer Kiyo Pro Ultra", "Dell Pro Webcam", "AverMedia PW313D", "Logitech C922 Pro", "Microsoft Modern Webcam", "Anker PowerConf 300", "Lenovo 300 FHD", "Jabra Panacast 20"], baseCost: 50, marginRange: [8, 22] },
  microfono: { names: ["Blue Yeti X", "Elgato Wave:3", "Razer Seiren V2 Pro", "HyperX QuadCast S", "Samson Q2U", "Audio-Technica AT2020", "Shure MV7", "Rode NT-USB Mini", "Fifine K669B", "Maono AU-A04"], baseCost: 40, marginRange: [15, 30] },
  mousepad: { names: ["SteelSeries QcK XXL", "Razer Goliathus Chroma", "Corsair MM350 Pro", "HyperX Fury S Pro", "Logitech G840", "Glorious 3XL Extended", "Cooler Master MP510", "X-raypad Aqua Control+", "Fnatic Focus 3", "Zowie G-SR-SE"], baseCost: 12, marginRange: [35, 55] },
  router: { names: ["TP-Link Archer AX73", "Asus RT-AX86U", "Netgear Nighthawk RAX50", "MikroTik hAP ax3", "Ubiquiti UniFi U6 Pro", "Linksys Atlas Pro 6", "D-Link DIR-X5460", "Eero Pro 6E", "Google Nest WiFi Pro", "TP-Link Deco XE75"], baseCost: 60, marginRange: [12, 30] },
};

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

async function seed() {
  const db = await getDb();
  const collection = db.collection("products");

  const rng = seededRandom(42);
  const now = new Date();

  const categoryEntries = Object.entries(TIERS);
  const products: any[] = [];
  const indexOffset = 0;

  for (let ci = 0; ci < categoryEntries.length; ci++) {
    const [catKey, tier] = categoryEntries[ci];
    const baseCost = tier.baseCost;
    const [minMargin, maxMargin] = tier.marginRange;
    // 50 items per category = 1000 products total
    for (let pi = 0; pi < 50; pi++) {
      const nameIdx = (ci * 50 + pi) % tier.names.length;
      const name = tier.names[nameIdx];
      const variant = pi < 10 ? ` Gen ${pi + 1}` : pi < 20 ? ` (2025)` :
                      pi < 30 ? ` V${pi - 19}` : ` Ed. ${String.fromCharCode(65 + pi % 26)}`;
      const margin = round(minMargin + rng() * (maxMargin - minMargin));
      const costVariation = 0.75 + rng() * 0.5; // 0.75x - 1.25x
      const costPrice = round(baseCost * costVariation);
      const price = round(costPrice * (1 + margin / 100));

      products.push({
        name: `${name}${variant}`,
        description: `${name} — calidad garantizada, ideal para gaming y trabajo profesional.`,
        price,
        costPrice,
        profitMargin: margin,
        currency: "USD",
        stock: Math.floor(rng() * 80) + 1,
        inStock: true,
        status: "active",
        categories: [catKey],
        imageUrls: [`https://picsum.photos/seed/${catKey}${ci * 100 + pi}/600/600`],
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Insert in batches of 100
  let inserted = 0;
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    await collection.insertMany(batch, { ordered: false });
    inserted += batch.length;
  }

  console.log(`✅ Insertados ${inserted} productos con márgenes`);

  // Summary stats
  const docCount = await collection.countDocuments();
  const withMargins = await collection.countDocuments({ profitMargin: { $gt: 0 } });
  const highMargin = await collection.countDocuments({ profitMargin: { $gt: 30 } });
  const lowMargin = await collection.countDocuments({ profitMargin: { $lt: 15, $gt: 0 } });

  console.log(`📊 Total en DB: ${docCount}`);
  console.log(`   Con margen > 0: ${withMargins}`);
  console.log(`   Alto (>30%): ${highMargin}`);
  console.log(`   Bajo (<15%): ${lowMargin}`);
  console.log("");
  console.log("🚀 Listo! Revisá /admin/margins para ver el flujo.");
}

seed().then(() => process.exit());
