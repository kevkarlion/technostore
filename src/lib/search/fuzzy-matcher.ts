import { distance } from "fastest-levenshtein";
import type { Product } from "@/domain/models/product";
import type { TokenizedQuery } from "./types";
import { normalizeText } from "./normalizer";

export interface FuzzyConfig {
  minResultsForExact: number;
  prefixWeight: number;
}

const DEFAULT_FUZZY_CONFIG: FuzzyConfig = {
  minResultsForExact: 5,
  prefixWeight: 0.8,
};

function maxEditDistance(word: string): number {
  if (word.length <= 2) return 0;
  if (word.length <= 4) return 1;
  return 2;
}

export function fuzzyMatch(term: string, candidate: string): boolean {
  if (term === candidate) return true;
  if (term.length < 3) return false;

  const normalizedTerm = term.toLowerCase();
  const normalizedCandidate = candidate.toLowerCase();

  if (normalizedCandidate.startsWith(normalizedTerm)) return true;

  const maxDist = maxEditDistance(normalizedTerm);
  return distance(normalizedTerm, normalizedCandidate) <= maxDist;
}

export function fuzzyFilter(
  tokens: TokenizedQuery,
  candidates: Product[]
): Product[] {
  return candidates.filter((product) => {
    const nameWords = normalizeText(product.name).split(/\s+/);
    const brandWords = product.brand
      ? normalizeText(product.brand).split(/\s+/)
      : [];
    const allWords = [...nameWords, ...brandWords];

    return tokens.raw.some((token) =>
      allWords.some((word) => fuzzyMatch(token, word))
    );
  });
}

export function enrichIfFew(
  scoredResults: { product: Product; score: number }[],
  allCandidates: Product[],
  tokens: TokenizedQuery,
  config: FuzzyConfig = DEFAULT_FUZZY_CONFIG
): { product: Product; score: number; matchType: "exact" | "partial" | "fuzzy" }[] {
  if (scoredResults.length >= config.minResultsForExact) {
    return scoredResults.map((r) => ({
      ...r,
      matchType: "exact" as const,
    }));
  }

  const existingIds = new Set(scoredResults.map((r) => r.product.id));
  const fuzzyCandidates = allCandidates.filter(
    (p) => !existingIds.has(p.id)
  );

  const fuzzyMatches = fuzzyFilter(tokens, fuzzyCandidates).map((product) => ({
    product,
    score: 0,
    matchType: "fuzzy" as const,
  }));

  return [
    ...scoredResults.map((r) => ({
      ...r,
      matchType: "exact" as const,
    })),
    ...fuzzyMatches,
  ];
}
