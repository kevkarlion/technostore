import type { WithId } from "mongodb";
import { getDb } from "@/config/db";
import type { Product } from "@/domain/models/product";
import { productMapper } from "@/domain/mappers/product.mapper";
import { normalizeText } from "./normalizer";
import { extractTokens } from "./tokenizer";
import { enrichIfFew } from "./fuzzy-matcher";
import { buildCandidatePipeline } from "./pipeline-stages";
import type {
  SearchOptions,
  SearchResult,
  ScoredProduct,
  AutocompleteResult,
} from "./types";

import { scoreAndSort } from "./scorer";

const COLLECTION_NAME = "products";

async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));

  if (!query || !query.trim()) {
    return { items: [], total: 0, page, limit };
  }

  const normalizedQuery = normalizeText(query);
  const tokens = extractTokens(normalizedQuery);
  tokens.categoryHint = options.categoryHint || null;

  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);

  const pipeline = buildCandidatePipeline(tokens, options, normalizedQuery);
  const rawDocs = await collection.aggregate(pipeline).toArray();

  const candidates = rawDocs.map(
    (doc) =>
      productMapper.toDomain(doc as Parameters<typeof productMapper.toDomain>[0]) as Product
  );

  let scored: ScoredProduct[] = scoreAndSort(candidates, tokens, query, {
    page: 1,
    limit: candidates.length,
    inStockOnly: options.inStockOnly,
  });

  scored = enrichIfFew(scored, candidates, tokens);

  const total = scored.length;
  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  return {
    items: paginated,
    total,
    page,
    limit,
    searchMeta: {
      query,
      tokens,
      fuzzyUsed: scored.some((s) => s.matchType === "fuzzy"),
      synonymsUsed: tokens.raw.length !== tokens.expandedRaw.length,
    },
  };
}

async function autocomplete(
  query: string,
  limit = 8
): Promise<AutocompleteResult> {
  const normalizedQuery = normalizeText(query);
  console.log("[Autocomplete] normalizedQuery:", normalizedQuery);
  if (normalizedQuery.length < 2) {
    console.log("[Autocomplete] Normalized query too short");
    return { items: [] };
  }

  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);

  const prefixRegex = new RegExp(`^${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
  console.log("[Autocomplete] prefixRegex:", prefixRegex);

  const docs = await collection
    .find({
      status: "active",
      $or: [
        { searchName: prefixRegex },
        { name: prefixRegex },
      ],
    })
    .project({
      name: 1,
      brand: 1,
      capacity: 1,
      slug: 1,
      imageUrls: 1,
      cloudinaryUrls: 1,
      inStock: 1,
    })
    .limit(limit * 2)
    .toArray();

  console.log("[Autocomplete] DB docs found:", docs.length);
  if (docs.length > 0) {
    console.log("[Autocomplete] First doc name:", docs[0].name, "searchName:", (docs[0] as any).searchName);
  }

  // DEBUG: check if any product has "memoria" in searchName
  const debugDocs = await collection
    .find({ status: "active" })
    .project({ name: 1, searchName: 1 })
    .limit(5)
    .toArray();
  console.log("[Autocomplete] DEBUG sample products:");
  debugDocs.forEach((d: any) => {
    console.log(`  name: "${d.name}" | searchName: "${d.searchName}" | startsWithMemoria: ${d.searchName?.startsWith("memoria")}`);
  });

  // DEBUG: count products with/without searchName
  const withSearchName = await collection.countDocuments({ status: "active", searchName: { $exists: true, $ne: null } });
  const withoutSearchName = await collection.countDocuments({ status: "active", $or: [{ searchName: { $exists: false } }, { searchName: null }] });
  console.log(`[Autocomplete] Products WITH searchName: ${withSearchName}, WITHOUT: ${withoutSearchName}`);

  type AutocompleteDoc = WithId<{
    name: string;
    brand?: string;
    capacity?: string;
    slug?: string;
    imageUrls?: string[];
    cloudinaryUrls?: string[];
    inStock: boolean;
  }>;

  function resolveAutocompleteImageUrl(doc: AutocompleteDoc): string | undefined {
    const cloudinaryUrls = doc.cloudinaryUrls || [];
    const hasValidCloudinary = cloudinaryUrls.length > 0 &&
      cloudinaryUrls.some((url) => url.startsWith("http"));
    if (hasValidCloudinary) return cloudinaryUrls[0];
    const imageUrls = doc.imageUrls || [];
    if (imageUrls.length > 0) {
      const url = imageUrls[0];
      return url.startsWith("http") ? url : `https://jotakp.dyndns.org/${url.replace(/^\//, "")}`;
    }
    return undefined;
  }

  const scored = docs
    .map((doc: AutocompleteDoc) => {
      let score = 0;
      const name = doc.name || "";
      const brand = doc.brand || "";
      const normalizedName = normalizeText(name);

      if (normalizedName.startsWith(normalizedQuery)) score += 20;
      else if (normalizedName.includes(normalizedQuery)) score += 10;

      if (normalizeText(brand).startsWith(normalizedQuery)) score += 10;

      if (doc.inStock) score += 5;

      return {
        id: doc._id.toString(),
        name,
        brand: brand || undefined,
        capacity: doc.capacity || undefined,
        slug: doc.slug || "",
        imageUrl: resolveAutocompleteImageUrl(doc),
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { items: scored };
}

export const searchEngine = { search, autocomplete };
