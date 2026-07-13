import type { Document } from "mongodb";
import type { TokenizedQuery, SearchOptions } from "./types";
import categoryTypeMap from "./config/category-type-map.json";

function buildTextSearchStages(normalizedQuery: string): Document[] {
  if (!normalizedQuery.trim()) return [];
  return [{ $match: { $text: { $search: normalizedQuery } } }];
}

export function buildCandidatePipeline(
  tokens: TokenizedQuery,
  options: SearchOptions,
  normalizedQuery: string
): Document[] {
  const stages: Document[] = [];

  // Stage 1: Text search (if query is non-empty)
  stages.push(...buildTextSearchStages(normalizedQuery));

  // Stage 2: Active products
  stages.push({ $match: { status: "active" } });

  // Stage 3: Category filter
  if (options.categoryHint) {
    stages.push({ $match: { categories: options.categoryHint } });

    const categoryKey = options.categoryHint.toLowerCase();
    const mappedTypes = categoryTypeMap[categoryKey as keyof typeof categoryTypeMap];
    if (mappedTypes && mappedTypes.length > 0) {
      stages.push({
        $match: { productType: { $in: mappedTypes } },
      });
    }
  }

  // Stage 4: Attach MongoDB text score
  stages.push({
    $addFields: {
      mongoTextScore: { $meta: "textScore" },
    },
  });

  // Stage 5: Sort by relevance before limiting
  stages.push({ $sort: { mongoTextScore: -1 } });

  // Stage 6: Project fields needed for scoring
  stages.push({
    $project: {
      name: 1,
      description: 1,
      price: 1,
      brand: 1,
      productType: 1,
      capacity: 1,
      formFactor: 1,
      categories: 1,
      inStock: 1,
      stock: 1,
      status: 1,
      imageUrls: 1,
      cloudinaryUrls: 1,
      slug: 1,
      createdAt: 1,
      updatedAt: 1,
      mongoTextScore: 1,
    },
  });

  // Stage 7: Limit candidates (app-layer scoring runs on these)
  stages.push({ $limit: 200 });

  return stages;
}
