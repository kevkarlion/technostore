import type { Category, Product } from "@/types/domain";

export const categories: Category[] = [
  {
    id: "cat-laptops",
    name: "Laptops",
    slug: "laptops",
    description: "Ultrabooks, gaming and creator laptops.",
    featured: true,
  },
  {
    id: "cat-components",
    name: "Components",
    slug: "components",
    description: "CPUs, GPUs, memory and storage.",
    featured: true,
  },
  {
    id: "cat-peripherals",
    name: "Peripherals",
    slug: "peripherals",
    description: "Keyboards, mice, audio and more.",
  },
  {
    id: "cat-monitors",
    name: "Monitors",
    slug: "monitors",
    description: "High refresh and color-accurate displays.",
  },
  {
    id: "cat-networking",
    name: "Networking",
    slug: "networking",
    description: "Routers, switches and Wi‑Fi gear.",
  },
];

export const products: Product[] = [
  {
    id: "prod-ultra-laptop-15",
    name: "UltraBook Pro 15”",
    slug: "ultrabook-pro-15",
    category: "laptops",
    brand: "TechNova",
    price: 2199,
    originalPrice: 2499,
    inStock: true,
    stockQuantity: 8,
    rating: 4.7,
    ratingCount: 132,
    badges: ["featured", "sale"],
    shortDescription:
      "15-inch creator laptop with OLED display, Intel Core Ultra and RTX graphics.",
    specs: {
      CPU: "Intel Core Ultra 7",
      GPU: "NVIDIA RTX 4070 8GB",
      RAM: "32GB DDR5",
      Storage: "1TB NVMe SSD",
      Display: '15.3" 3K OLED 120Hz',
      Weight: "1.6kg",
    },
    images: [
      {
        id: "hero",
        src: "/images/products/ultrabook-pro-15/hero.jpg",
        alt: "UltraBook Pro 15” front view",
      },
      {
        id: "side",
        src: "/images/products/ultrabook-pro-15/side.jpg",
        alt: "UltraBook Pro 15” side view",
      },
    ],
  },
  {
    id: "prod-mech-keyboard-65",
    name: "PulseKeys 65% Mechanical Keyboard",
    slug: "pulsekeys-65-mechanical-keyboard",
    category: "peripherals",
    brand: "PulseKeys",
    price: 159,
    inStock: true,
    stockQuantity: 24,
    rating: 4.8,
    ratingCount: 320,
    badges: ["new", "featured"],
    shortDescription:
      "Hot-swappable 65% mechanical keyboard with gasket mount and per-key RGB.",
    specs: {
      Layout: "65%",
      Switches: "Hot-swappable (MX compatible)",
      Connectivity: "USB‑C, Bluetooth 5.1",
      Plate: "Aluminum",
      Keycaps: "PBT dye-sub",
    },
    images: [
      {
        id: "hero",
        src: "/images/products/pulsekeys-65/hero.jpg",
        alt: "PulseKeys 65% keyboard top view",
      },
    ],
  },
  {
    id: "prod-gpu-rtx5090",
    name: "HyperForce RTX 5090",
    slug: "hyperforce-rtx-5090",
    category: "components",
    brand: "HyperForce",
    price: 1899,
    inStock: false,
    rating: 4.9,
    ratingCount: 58,
    badges: ["new"],
    shortDescription:
      "Next‑gen flagship GPU with advanced ray tracing and AI upscaling.",
    specs: {
      Memory: "24GB GDDR7",
      "Boost Clock": "2.9 GHz",
      Power: "450W",
      Outputs: "3x DisplayPort 2.1, 1x HDMI 2.1",
    },
    images: [
      {
        id: "hero",
        src: "/images/products/hyperforce-rtx-5090/hero.jpg",
        alt: "HyperForce RTX 5090 graphics card",
      },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategorySlug(slug: string): Product[] {
  return products.filter((product) => product.category === slug);
}

