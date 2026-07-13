import type { Product } from "@/domain/models/product";
import type { TokenizedQuery, ScoringWeights, ScoredProduct, SearchOptions } from "./types";
import { DEFAULT_SCORING_WEIGHTS } from "./types";
import { normalizeText } from "./normalizer";

const GENERIC_WORDS = new Set([
  "para", "con", "sin", "de", "el", "la", "los", "las", "un", "una",
  "usb", "hdmi", "vga", "bluetooth", "wifi", "led", "rgb",
  "pro", "plus", "max", "mini", "nano",
]);

export function scoreProduct(
  product: Product,
  tokens: TokenizedQuery,
  originalQuery: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  let score = 0;

  const normalizedName = normalizeText(product.name);
  const normalizedQuery = normalizeText(originalQuery);

  // Exact name match
  if (normalizedName === normalizedQuery) {
    score += w.exactName;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += Math.round(w.exactName * 0.8);
  }

  // Type match
  if (tokens.productType && product.productType) {
    if (normalizeText(product.productType) === tokens.productType) {
      score += w.typeMatch;
    } else {
      score += w.typeMismatch;
    }
  }

  // Capacity match
  if (tokens.capacity) {
    const productCapacity = normalizeText(product.capacity || "");
    if (productCapacity === tokens.capacity) {
      score += w.capacityMatch;
    } else if (productCapacity && productCapacity !== tokens.capacity) {
      score += w.capacityMismatch;
    }
  }

  // Form factor match
  if (tokens.formFactor && product.formFactor) {
    if (normalizeText(product.formFactor) === tokens.formFactor) {
      score += w.formFactorMatch;
    }
  }

  // Brand match
  if (tokens.brand && product.brand) {
    const productBrand = normalizeText(product.brand);
    if (productBrand === tokens.brand) {
      score += w.brandMatch;
    } else if (productBrand.includes(tokens.brand)) {
      score += Math.round(w.brandMatch * 0.5);
    }
  }

  // Category match
  if (tokens.categoryHint && product.categories?.length) {
    if (product.categories.some((c) => normalizeText(c) === normalizeText(tokens.categoryHint!))) {
      score += w.categoryMatch;
    }
  }

  // Multi-word bonus
  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter((word) => word.length > 2 && !GENERIC_WORDS.has(word));
  const matchedWords = queryWords.filter((word) => normalizedName.includes(word));
  if (matchedWords.length >= 2) {
    score += w.multiWord;
  }

  // Partial word match (capped at +30)
  let partialBonus = 0;
  for (const word of queryWords) {
    if (normalizedName.includes(word)) {
      partialBonus += GENERIC_WORDS.has(word) ? w.generic : w.partial;
    }
  }
  if (partialBonus > 0) {
    score += Math.min(partialBonus, 30);
  }

  return score;
}

function tieBreaker(a: ScoredProduct, b: ScoredProduct): number {
  if (a.product.inStock !== b.product.inStock) {
    return a.product.inStock ? -1 : 1;
  }
  if (a.product.price !== b.product.price) {
    return a.product.price - b.product.price;
  }
  return b.product.createdAt.getTime() - a.product.createdAt.getTime();
}

export function scoreAndSort(
  products: Product[],
  tokens: TokenizedQuery,
  query: string,
  options: SearchOptions = {}
): ScoredProduct[] {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;

  let scored = products
    .map((product) => {
      const score = scoreProduct(product, tokens, query);
      const normalizedName = normalizeText(product.name);
      const normalizedQuery = normalizeText(query);
      const matchType: ScoredProduct["matchType"] =
        normalizedName === normalizedQuery
          ? "exact"
          : normalizedName.includes(normalizedQuery)
            ? "partial"
            : "partial";

      return { product, score, matchType };
    })
    .sort((a, b) => b.score - a.score || tieBreaker(a, b));

  if (options.inStockOnly) {
    scored = scored.filter((item) => item.product.inStock);
  }

  const start = (page - 1) * limit;
  return scored.slice(start, start + limit);
}
