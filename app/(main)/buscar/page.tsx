import type { Metadata } from "next";
import { productRepository } from "@/api/repository/product.repository";
import { searchEngine } from "@/lib/search/search-engine";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Buscar productos",
  description: "Busca laptops, componentes y periféricos en todo el catálogo de TechnoStore.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query, page, category } = await searchParams;
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const limit = 20;

  let result;
  if (query && query.trim()) {
    const searchResult = await searchEngine.search(query, {
      page: pageNum,
      limit,
      categoryHint: category,
    });
    result = {
      items: searchResult.items.map((s) => toPresentationProduct(s.product)),
      total: searchResult.total,
      page: searchResult.page,
      limit: searchResult.limit,
      searchMeta: searchResult.searchMeta ?? null,
    };
  } else {
    const products = await productRepository.findFeatured(limit);
    result = {
      items: products.map(toPresentationProduct),
      total: products.length,
      page: 1,
      limit,
      searchMeta: null,
    };
  }

  return (
    <SearchClient
      key={`${query || ""}-${result.page}`}
      initialProducts={result.items}
      initialQuery={query || ""}
      initialTotal={result.total}
      initialPage={result.page}
      searchMeta={result.searchMeta}
    />
  );
}
