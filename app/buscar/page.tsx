import type { Metadata } from "next";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Buscar productos",
  description: "Busca laptops, componentes y periféricos en todo el catálogo de TechnoStore.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const limit = 20;

  // Fetch initial products
  let result;
  if (query && query.trim()) {
    result = await productRepository.searchByName(query, { page: pageNum, limit });
  } else {
    const products = await productRepository.findFeatured(limit);
    result = { items: products, total: products.length, page: 1, limit };
  }

  const initialProducts = result.items.map(toPresentationProduct);

  return (
    <SearchClient
      initialProducts={initialProducts}
      initialQuery={query || ""}
      initialTotal={result.total}
      initialPage={result.page}
    />
  );
}
