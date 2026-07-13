# Tasks: Intelligent Search Engine

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 850–1100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + config + core modules (normalizer, synonyms, tokenizer, scorer) | PR 1 | Foundation; all pure functions, fully unit-testable |
| 2 | Search engine orchestrator + pipeline stages + fuzzy matcher | PR 2 | Builds on PR 1; integration layer, mock MongoDB tests |
| 3 | Data model + migration + API routes | PR 3 | Model changes, 2 new routes, migration script |
| 4 | Frontend + cleanup + tests | PR 4 | UI changes, dead code removal, spec-scenario tests |

---

## Phase 1: Foundation — Types & Config

- [x] **1.1** Create `src/lib/search/types.ts` — all interfaces: `SearchQuery`, `TokenizedQuery`, `ScoredProduct`, `SearchResult`, `AutocompleteResult`, `ScoringWeights`, `SearchOptions`, `CapacityToken`, `FormFactorToken`, `TypeToken`, `BrandToken`
- [x] **1.2** Create `src/lib/search/config/synonyms.json` — ~50 synonym groups (storage, components, peripherals, brand aliases)
- [x] **1.3** Create `src/lib/search/config/category-type-map.json` — category→type mapping populated from product data
- [x] **1.4** Install dependency: `npm install fastest-levenshtein` (~2KB, zero deps)

## Phase 2: Core Modules

- [x] **2.1** Create `src/lib/search/normalizer.ts` — `normalizeText()` (trim→lowercase→NFD strip→collapse whitespace→normalize hyphens→strip special chars) and `normalizeForSearch()` (adds synonym expansion). Extract accent logic from `src/api/repository/product.repository.ts:11-17`
- [x] **2.2** Create `src/lib/search/synonym-dictionary.ts` — `Map<string, string[]>` reverse index built at module init from `synonyms.json`. Export: `expand(tokens: string[]): string[]`, `getOriginals(): string[]`
- [x] **2.3** Create `src/lib/search/tokenizer.ts` — `extractTokens(normalized: string): TokenizedQuery`. Priority: capacity (regex `(\d+)\s*(gb|tb|mb)`) → formFactor → type (compound patterns first) → brand → model. Use `KNOWN_BRANDS` (~80 brands), `PRODUCT_TYPES` map
- [x] **2.4** Create `src/lib/search/scorer.ts` — `scoreProduct(product, tokens, query, weights?)` and `scoreAndSort(products, tokens, query, options?)`. Exact +100, type +50, capacity +60, brand +40, formFactor +50, category +50, multi-word +40, partial +10. Penalties: capacity mismatch -80, type mismatch -50

## Phase 3: Search Engine — Orchestrator & Pipeline

- [ ] **3.1** Create `src/lib/search/pipeline-stages.ts` — `buildCandidatePipeline(tokens, options): Document[]`. MongoDB aggregation: $text match on searchName+description, optional status/category filters, $addFields textScore, $project needed fields, $limit 200
- [x] **3.2** Create `src/lib/search/fuzzy-matcher.ts` — `enrichIfFew(results, query, options?)`. Levenshtein via `fastest-levenshtein`. Activate only when scored results < 5. Max distance 1 (3-4 char words), 2 (5+ char). Prefix matching at 0.8 weight
- [ ] **3.3** Create `src/lib/search/search-engine.ts` — orchestrator with `search(query, options?)` and `autocomplete(query, limit?)`. Pipeline: normalize → tokenize → expand synonyms → build pipeline → MongoDB exec → score → fuzzy enrich → paginate. Autocomplete: normalize → prefix match on name+brand → simplified scoring → limit 8
- [ ] **3.4** Create `src/lib/search/field-extractor.ts` — `extractFields(name): {brand, productType, capacity, formFactor}`. Reuses KNOWN_BRANDS/PRODUCT_TYPES/capacity regex from tokenizer. Used by migration and scraper

## Phase 4: Data Model & Migration

- [ ] **4.1** Modify `src/domain/models/product.ts` — add optional fields: `brand?: string`, `productType?: string`, `capacity?: string`, `formFactor?: string`, `searchKeywords?: string`, `searchText?: string`, `searchTokens?: string[]`
- [ ] **4.2** Create `scripts/backfill-search-fields.ts` — idempotent batch migration (500/batch), uses `field-extractor.ts`, bulkWrite upserts. Pattern from existing `scripts/backfill-search-name.ts`
- [ ] **4.3** Create MongoDB indexes: `{brand:1, status:1}`, `{productType:1, status:1}`, `{capacity:1, status:1}` — add to migration script
- [ ] **4.4** Modify `src/api/repository/product.repository.ts` — import `searchEngine`, replace `searchByName` internals with `searchEngine.search()`. Add brand/productType/capacity to `$set` in create/update/upsert. Remove old `normalizeText()` function (lines 11-17)
- [ ] **4.5** Modify `src/domain/mappers/product-to-presentation.ts` — replace hardcoded `brand: "General"` with `dbProduct.brand ?? "General"`

## Phase 5: API Routes

- [ ] **5.1** Create `app/api/search/route.ts` — `GET /api/search?q=...&category=...&page=...&limit=...`. Delegates to `searchEngine.search()`. Returns `{ products, total, page, limit, searchMeta }`
- [ ] **5.2** Create `app/api/search/autocomplete/route.ts` — `GET /api/search/autocomplete?q=...&limit=8`. Min 2 chars. Delegates to `searchEngine.autocomplete()`
- [ ] **5.3** Modify `app/api/products/route.ts` — no signature change needed (existing `searchByName` call transparently upgraded via repo change in 4.4)

## Phase 6: Frontend Changes

- [ ] **6.1** Modify `app/(main)/buscar/page.tsx` — use new search engine (signature unchanged, transparent via repo)
- [ ] **6.2** Modify `app/(main)/buscar/search-client.tsx` — add autocomplete dropdown: debounced fetch (250ms) to `/api/search/autocomplete`, render suggestions, click navigates
- [ ] **6.3** Modify `src/components/ui/search-bar.tsx` — add autocomplete dropdown with same debounce pattern, overlay positioning, keyboard navigation

## Phase 7: Cleanup

- [ ] **7.1** Remove dead code in `product.repository.ts` — old `normalizeText()` function, any `getBrandsByCategory()` O(n) name-parsing logic (replace with brand field query after migration)
- [ ] **7.2** Scraper integration — modify `atomicUpsertByExternalId` in product repository to call `extractFields()` and populate brand/productType/capacity on new products

## Phase 8: Tests

- [ ] **8.1** Unit tests for `normalizer.ts` — accent stripping, whitespace collapse, hyphen normalization, special char removal. File: `src/lib/search/__tests__/normalizer.test.ts`
- [ ] **8.2** Unit tests for `tokenizer.ts` — "memoria microsd 64gb kingston" extraction, compound patterns, brand lookup, capacity regex. File: `src/lib/search/__tests__/tokenizer.test.ts`
- [ ] **8.3** Unit tests for `scorer.ts` — exact match +100, type match +50, capacity mismatch -80, multi-word bonus, tie-breakers. File: `src/lib/search/__tests__/scorer.test.ts`
- [ ] **8.4** Unit tests for `synonym-dictionary.ts` — "pendrive" expands to include "usb flash", "flash drive"; "kingstom" alias → "kingston". File: `src/lib/search/__tests__/synonym-dictionary.test.ts`
- [ ] **8.5** Unit tests for `fuzzy-matcher.ts` — "kingstom" → Kingston (distance 1), prefix match, activation threshold (<5 results). File: `src/lib/search/__tests__/fuzzy-matcher.test.ts`
- [ ] **8.6** Unit tests for `field-extractor.ts` — brand/type/capacity extraction from product names. File: `src/lib/search/__tests__/field-extractor.test.ts`
- [ ] **8.7** Integration tests for `search-engine.ts` — end-to-end with mock MongoDB: "memoria microsd 64gb" → correct 64GB products ranked above 32GB. File: `src/lib/search/__tests__/search-engine.test.ts`
