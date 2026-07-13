import type { Product } from "@/domain/models/product";

export interface SearchQuery {
  raw: string;
  normalized: string;
  categoryHint?: string;
}

export interface TokenizedQuery {
  capacity: string | null;
  formFactor: string | null;
  productType: string | null;
  brand: string | null;
  model: string | null;
  raw: string[];
  expandedRaw: string[];
  categoryHint: string | null;
}

export interface ScoredProduct {
  product: Product;
  score: number;
  matchType: "exact" | "partial" | "fuzzy";
}

export interface SearchResult {
  items: ScoredProduct[];
  total: number;
  page: number;
  limit: number;
  searchMeta?: {
    query: string;
    tokens: TokenizedQuery;
    fuzzyUsed: boolean;
    synonymsUsed: boolean;
  };
}

export interface AutocompleteResult {
  items: {
    id: string;
    name: string;
    brand?: string;
    capacity?: string;
    slug: string;
    imageUrl?: string;
    score: number;
  }[];
}

export interface ScoringWeights {
  exactName: number;
  typeMatch: number;
  capacityMatch: number;
  brandMatch: number;
  formFactorMatch: number;
  categoryMatch: number;
  multiWord: number;
  partial: number;
  generic: number;
  capacityMismatch: number;
  typeMismatch: number;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  categoryHint?: string;
  inStockOnly?: boolean;
}

export interface CapacityToken {
  value: string;
  numeric: number;
  unit: string;
}

export interface FormFactorToken {
  value: string;
}

export interface TypeToken {
  value: string;
}

export interface BrandToken {
  value: string;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  exactName: 100,
  typeMatch: 50,
  capacityMatch: 60,
  brandMatch: 40,
  formFactorMatch: 50,
  categoryMatch: 50,
  multiWord: 40,
  partial: 10,
  generic: 2,
  capacityMismatch: -80,
  typeMismatch: -50,
};
