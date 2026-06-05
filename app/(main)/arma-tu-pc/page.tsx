import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { getExchangeRateServer } from "@/lib/exchange-rate-server";
import { ArmaTuPcClient } from "./arma-tu-pc-client";
import type { Product } from "@/types/domain";

export const dynamic = "force-dynamic";

interface CategorySection {
  slug: string;
  name: string;
  products: Product[];
}

const CATEGORIES: { slug: string; name: string }[] = [
  { slug: "microprocesadores", name: "Procesadores (CPU)" },
  { slug: "coolers-disipadores", name: "Coolers y Disipadores" },
  { slug: "motherboard", name: "Motherboards" },
  { slug: "memorias", name: "Memorias RAM" },
  { slug: "memorias-notebooks", name: "Memorias RAM Notebook" },
  { slug: "discos-ssd", name: "Almacenamiento SSD" },
  { slug: "discos-m2", name: "Discos M.2 NVMe" },
  { slug: "discos-hdd", name: "Discos HDD" },
  { slug: "placas-de-video", name: "Placas de Video (GPU)" },
  { slug: "fuentes", name: "Fuentes de Poder" },
  { slug: "gabinetes", name: "Gabinetes" },
  { slug: "monitores-tv", name: "Monitores" },
  { slug: "teclado-gamer", name: "Teclados Gamer" },
  { slug: "teclados-perifericos", name: "Teclados Oficina" },
  { slug: "mouse-gamer", name: "Mouse Gamer" },
  { slug: "mouse-perifericos", name: "Mouse Oficina" },
];

// Alto límite para que el buscador encuentre todos los productos
// (~540 productos totales entre las 16 categorías)
const PRODUCTS_LIMIT = 200;

export default async function ArmaTuPcPage() {
  // Fetch exchange rate first, then categories in parallel
  const exchangeRateData = await getExchangeRateServer();
  const exchangeRate = exchangeRateData?.venta ?? undefined;

  const results = await Promise.all(
    CATEGORIES.map((cat) =>
      productRepository
        .findByCategorySlug(cat.slug, PRODUCTS_LIMIT)
        .then((products) => ({
          ...cat,
          products: products.map((p) =>
            toPresentationProduct(p, exchangeRate)
          ),
        }))
    )
  );

  const categories: CategorySection[] = results.filter(
    (c: CategorySection) => c.products.length > 0
  );

  return <ArmaTuPcClient categories={categories} />;
}
