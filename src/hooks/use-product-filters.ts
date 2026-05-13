"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";

export interface FilterState {
  priceMin: number;
  priceMax: number;
  brands: string[];
}

export interface FilterStatePartial {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
}

const DEFAULT_PRICE_RANGE = { min: 0, max: 100000 };

export function useProductFilters(defaultPriceRange = DEFAULT_PRICE_RANGE) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial state from URL
  const [priceMin, setPriceMin] = useState(() => {
    const v = searchParams.get("priceMin");
    return v ? parseInt(v, 10) : defaultPriceRange.min;
  });

  const [priceMax, setPriceMax] = useState(() => {
    const v = searchParams.get("priceMax");
    return v ? parseInt(v, 10) : defaultPriceRange.max;
  });

  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const v = searchParams.get("brands");
    return v ? v.split(",").filter(Boolean) : [];
  });

  const hasFilters = priceMin > defaultPriceRange.min || 
                     priceMax < defaultPriceRange.max || 
                     selectedBrands.length > 0;

  const activeFiltersCount = 
    (priceMin > defaultPriceRange.min ? 1 : 0) +
    (priceMax < defaultPriceRange.max ? 1 : 0) +
    (selectedBrands.length > 0 ? 1 : 0);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    const params = new URLSearchParams(searchParams.toString());

    const newPriceMin = updates.priceMin ?? priceMin;
    const newPriceMax = updates.priceMax ?? priceMax;
    const newBrands = updates.brands ?? selectedBrands;

    // Update URL params
    if (newPriceMin > defaultPriceRange.min) {
      params.set("priceMin", newPriceMin.toString());
    } else {
      params.delete("priceMin");
    }

    if (newPriceMax < defaultPriceRange.max) {
      params.set("priceMax", newPriceMax.toString());
    } else {
      params.delete("priceMax");
    }

    if (newBrands.length > 0) {
      params.set("brands", newBrands.join(","));
    } else {
      params.delete("brands");
    }

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams, priceMin, priceMax, selectedBrands, defaultPriceRange]);

  const clearFilters = useCallback(() => {
    setPriceMin(defaultPriceRange.min);
    setPriceMax(defaultPriceRange.max);
    setSelectedBrands([]);
    router.push(pathname, { scroll: false });
  }, [router, pathname, defaultPriceRange]);

  const toggleBrand = useCallback((brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    updateFilters({ brands: newBrands });
  }, [selectedBrands, updateFilters]);

  return {
    priceMin,
    priceMax,
    selectedBrands,
    hasFilters,
    activeFiltersCount,
    setPriceMin: (v: number) => updateFilters({ priceMin: v }),
    setPriceMax: (v: number) => updateFilters({ priceMax: v }),
    toggleBrand,
    clearFilters,
  };
}