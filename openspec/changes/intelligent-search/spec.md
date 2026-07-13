# SDD Spec: Intelligent Search Engine — Full Specification

**Change**: intelligent-search  
**Status**: Spec  
**Date**: 2026-07-13  
**Based on**: proposal.md (2026-07-13)

---

## Table of Contents

1. [Text Normalization](#1-text-normalization)
2. [Synonym Dictionary](#2-synonym-dictionary)
3. [Smart Tokenization](#3-smart-tokenization)
4. [Product Data Model Enhancement](#4-product-data-model-enhancement)
5. [Scoring Algorithm](#5-scoring-algorithm)
6. [Fuzzy Search](#6-fuzzy-search)
7. [Autocomplete / Typeahead](#7-autocomplete--typeahead)
8. [API Design](#8-api-design)
9. [Category Awareness](#9-category-awareness)
10. [Related Products](#10-related-products)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Text Normalization

### 1.1 Purpose

Transform raw user input into a canonical token form that maximizes match probability against product data.

### 1.2 Input/Output

- **Input**: Raw string from user (e.g., `"Memoria microSD 64GB  "`)
- **Output**: Normalized string (e.g., `"memoria microsd 64gb"`)

### 1.3 Normalization Rules (ordered, sequential)

| Step | Rule | Example |
|------|------|---------|
| 1 | Trim leading/trailing whitespace | `" memória "` → `"memória"` |
| 2 | Lowercase entire string | `"Memoria"` → `"memoria"` |
| 3 | Remove diacritics/accents (NFD decomposition + strip) | `"memória"` → `"memoria"` |
| 4 | Collapse multiple whitespace into single space | `"memoria  microsd"` → `"memoria microsd"` |
| 5 | Normalize hyphens: collapse ` - `, `–`, `—` into single hyphen no-padding | `"micro - sd"` → `"micro-sd"` |
| 6 | Normalize common invisible characters (zero-width spaces, non-breaking spaces) | `"micro\u00A0sd"` → `"microsd"` |
| 7 | Strip special characters that are not alphanumeric, spaces, hyphens, or dots | `"memoria@#$ microsd"` → `"memoria microsd"` |
| 8 | Apply synonym expansion (see §2) | `"memoria ram"` → tokens include synonyms |

### 1.4 Implementation

```typescript
// src/lib/search/normalizer.ts

export function normalizeText(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .toLowerCase()
    // NFD decomposition + strip combining marks (accents)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    // Normalize hyphens: em-dash, en-dash → hyphen
    .replace(/[–—]/g, "-")
    // Remove zero-width and non-breaking spaces
    .replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, "")
    // Strip special chars (keep alphanumeric, spaces, hyphens, dots)
    .replace(/[^\w\s\-\.]/g, "")
    .trim();
}
```

### 1.5 Edge Cases

| Input | Expected Output | Reasoning |
|-------|----------------|-----------|
| `""` (empty) | `""` | Empty query → no results |
| `"   "` (whitespace only) | `""` | Treated as empty |
| `"123"` (numbers only) | `"123"` | Valid — could match model numbers |
| `"áéíóú"` | `"aeiou"` | Accent removal |
| `"DDR5-6400"` | `"ddr5-6400"` | Hyphen preserved, dots preserved |
| `"USB 3.0"` | `"usb 3.0"` | Dot preserved for version numbers |
| `"GPU!!! $$"` | `"gpu"` | Special chars stripped |
| `"micro   sd"` | `"micro sd"` | Whitespace collapsed |
| `null` / `undefined` | `""` | Defensive — never crash |

### 1.6 Relationship to Existing Code

The existing `normalizeText()` in `product.repository.ts:11` already implements steps 1-3. The new implementation is a superset. The existing function will be replaced by importing from `src/lib/search/normalizer.ts`.

---

## 2. Synonym Dictionary

### 2.1 Purpose

Map user-typed terms to all valid product terminology so that `"pendrive"` also matches products labeled `"memoria usb"` and vice versa.

### 2.2 Data Structure

```typescript
// src/lib/search/synonym-dictionary.ts

export interface SynonymGroup {
  /** The canonical/normalized form — used as the group key */
  canonical: string;
  /** All aliases that map to this canonical form */
  aliases: string[];
}

export type SynonymMap = Record<string, string[]>;
```

### 2.3 Full Synonym List

#### Storage & Memory

| Canonical | Aliases |
|-----------|---------|
| `microsd` | `micro sd`, `tarjeta sd`, `sd card`, `sdhc`, `sdxc`, `micro sdhc`, `micro sdxc` |
| `pendrive` | `memoria usb`, `usb`, `flash drive`, `memory stick`, `thumb drive` |
| `ssd` | `disco solido`, `solid state`, `disco estado solido`, `disco ssd` |
| `hdd` | `disco mecanico`, `disco duro`, `hard drive`, `disco magnetico` |
| `nvme` | `m.2`, `m2`, `pcie`, `pcie nvme` |
| `ram` | `memoria`, `memory`, `memoria ram`, `dimm` |

#### Components

| Canonical | Aliases |
|-----------|---------|
| `gpu` | `placa de video`, `tarjeta de video`, `video card`, `graphics card`, `grafica` |
| `cpu` | `procesador`, `processor`, `chip` |
| `motherboard` | `placa madre`, `mainboard`, `mobo` |

#### Formats

| Canonical | Aliases |
|-----------|---------|
| `sata3` | `sata`, `sata iii`, `sata 3`, `serial ata` |
| `ddr4` | `ddr 4` |
| `ddr5` | `ddr 5` |
| `2.5` | `2.5 inch`, `2.5 pulgada`, `2.5"` |
| `3.5` | `3.5 inch`, `3.5 pulgada`, `3.5"` |

#### Peripherals

| Canonical | Aliases |
|-----------|---------|
| `auricular` | `headset`, `headphone`, `audifonos`, `cascos` |
| `teclado` | `keyboard`, `clado` |
| `mouse` | `raton`, `mousepad` (note: mousepad is separate but related) |
| `monitor` | `pantalla`, `display` |
| `webcam` | `camara web`, `cam` |

#### Brand Aliases (for search expansion only — brand field uses canonical)

| Canonical | Aliases |
|-----------|---------|
| `kingston` | `kingston technology` |
| `sandisk` | `san disk`, `western digital` (partial) |
| `western digital` | `wd`, `sandisk` (partial — disambiguate by context) |
| `crucial` | `crucial technology`, `micron` |
| `seagate` | `seagate technology` |
| `hyperx` | `kingston hyperx` (legacy brand) |

### 2.4 How Synonyms Are Applied

1. **At normalization time**: After `normalizeText()`, each token is looked up in the REVERSE_SYNONYM_INDEX.
2. **Reverse index**: Pre-computed at module load. Maps every alias → canonical + all siblings.
3. **Expansion**: A query token `"pendrive"` expands to `["pendrive", "memoria usb", "usb", "flash drive", "memory stick"]`.
4. **Storage**: Expanded terms are used for MongoDB `$or` queries and scoring, NOT stored back in the query.

```typescript
// Reverse index: alias → Set of all group members
const REVERSE_INDEX: Map<string, Set<string>> = buildReverseIndex(SYNONYMS);

function expandSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms);
  for (const term of terms) {
    const normalized = normalizeText(term);
    const synonyms = REVERSE_INDEX.get(normalized);
    if (synonyms) {
      for (const syn of synonyms) {
        expanded.add(syn);
      }
    }
  }
  return [...expanded];
}
```

### 2.5 Adding New Synonyms

Synonyms are defined in a **JSON config file** (NOT in code):

```
src/lib/search/config/synonyms.json
```

Format:
```json
{
  "microsd": ["micro sd", "tarjeta sd", "sd card"],
  "pendrive": ["memoria usb", "usb", "flash drive"]
}
```

**To add a new synonym**: Edit `synonyms.json`, no code change required. The reverse index rebuilds on server restart.

**To add a new synonym group at runtime** (v2): Admin UI writes to a `synonyms` collection in MongoDB. The search engine checks DB overrides on each request.

---

## 3. Smart Tokenization

### 3.1 Purpose

Parse a normalized query string into structured tokens with semantic meaning (brand, type, capacity, formFactor, model).

### 3.2 Output Shape

```typescript
// src/lib/search/types.ts

export interface SearchTokens {
  /** Detected brand (e.g., "kingston") */
  brand: string | null;
  /** Detected product type (e.g., "ram", "ssd", "gpu") */
  type: string | null;
  /** Detected capacity (e.g., "64gb", "1tb") */
  capacity: string | null;
  /** Detected form factor (e.g., "m.2", "ddr4", "2.5") */
  formFactor: string | null;
  /** Detected model number (e.g., "ns-cn93r") */
  model: string | null;
  /** Original normalized words */
  raw: string[];
  /** Expanded words (with synonyms) */
  expandedRaw: string[];
  /** Category hint (from URL param, not query parsing) */
  categoryHint: string | null;
}
```

### 3.3 Token Extraction Rules & Priority

Extraction runs in priority order. Once a token is matched, its word index is marked as "consumed" to prevent double-assignment.

| Priority | Token Type | Detection Method | Example |
|----------|-----------|-----------------|---------|
| 1 | **Capacity** | Regex: `^(\d+(?:\.\d+)?)\s*(gb|tb|mb|pb)$` | `"64gb"` → `{ value: "64", unit: "gb" }` |
| 2 | **Form Factor** | Regex patterns (see §3.4) | `"ddr4"` → `"ddr4"`, `"m.2"` → `"m.2"` |
| 3 | **Type** | Dictionary lookup + regex | `"memoria"` → `"ram"`, `"ssd"` → `"ssd"` |
| 4 | **Brand** | KNOWN_BRANDS Set lookup | `"kingston"` → `"kingston"` |
| 5 | **Model** | Remaining alphanumeric tokens starting with digit or known model prefix | `"ns-cn93r"` → `"ns-cn93r"` |

### 3.4 Form Factor Patterns

```typescript
const FORM_FACTOR_PATTERNS: [RegExp, string | ((match: RegExpMatchArray) => string)][] = [
  [/^m\.?2$/i, "m.2"],
  [/^(?:2\.5|3\.5)(?:\s*(?:inch|pulgada|"))?$/i, (m) => m[0].replace(/\./g, "").replace(/".*/, "").trim()],
  [/^ddr[345]?$/i, (m) => m[0].toLowerCase()],
  [/^sata\s*(?:iii|3)?$/i, "sata3"],
  [/^nvme$/i, "nvme"],
  [/^pcie$/i, "pcie"],
];
```

### 3.5 Type Patterns

```typescript
const TYPE_PATTERNS: [RegExp, string | ((match: RegExpMatchArray) => string)][] = [
  [/(?:memoria|memory|ram)/i, "ram"],
  [/(?:micro\s*sd|microsd|tarjeta\s*sd|sd\s*card)/i, "microsd"],
  [/(?:pendrive|memoria\s*usb|usb|flash)/i, "pendrive"],
  [/(?:ssd|disco\s*solido|solid\s*state)/i, "ssd"],
  [/(?:hdd|disco\s*mecanico|disco\s*duro)/i, "hdd"],
  [/(?:gpu|placa\s*de\s*video|tarjeta\s*de\s*video)/i, "gpu"],
  [/(?:procesador|cpu|processor)/i, "cpu"],
  [/(?:monitor|pantalla|display)/i, "monitor"],
  [/(?:teclado|keyboard)/i, "teclado"],
  [/(?:mouse|raton)/i, "mouse"],
  [/(?:auricular|headset|headphone)/i, "auricular"],
  [/(?:webcam|camara\s*web)/i, "webcam"],
  [/(?:base|gabinete|case)/i, "gabinete"],
  [/(?:fuente|power\s*supply|psu)/i, "fuente"],
];
```

### 3.6 Known Brands Set

Loaded from `src/lib/search/config/brands.json` (same pattern as synonyms — config file, not hardcoded):

```json
[
  "kingston", "sandisk", "crucial", "samsung", "wd", "western digital",
  "seagate", "toshiba", "lexar", "pny", "adata", "teamgroup", "silicon power",
  "logitech", "redragon", "hyperx", "razer", "corsair", "steelseries",
  "jbl", "sony", "xiaomi", "philips", "lg", "asus", "msi", "gigabyte",
  "kolke", "ugreen", "netmak", "nisuta", "fantech", "trust", "genius",
  "nvidia", "amd", "intel", "apple", "lenovo", "hp", "dell", "acer",
  "cooler master", "thermaltake", "evga", "be quiet", "nzxt",
  "tp-link", "netgear", "ubiquiti", "mikrotik",
  "hyperx", "turtle beach", "plantronics",
  "edifier", "soundcore", "anker", "bose", "sennheiser", "shure"
]
```

### 3.7 Ambiguity Resolution

| Ambiguity | Resolution |
|-----------|-----------|
| `"usb"` could be type (pendrive) or form factor | → Type wins (priority 3 > form factor priority 2 check happens first, but "usb" isn't a form factor) |
| `"kingston fury"` — brand or model? | → First word is brand if in KNOWN_BRANDS, remaining is model candidate |
| `"1tb"` could be capacity or model | → Always capacity (regex priority 1) |
| `"ssd"` alone — is it type or form factor? | → Type (it appears in TYPE_PATTERNS) |
| `"m.2"` alone — form factor or model? | → Form factor (regex priority 2) |
| Multiple capacity tokens: `"16gb 64gb"` | → First capacity wins (break after first match) |

### 3.8 Tokenization Example

```
Query: "memoria microSD 64GB kingston"

Step 1 - Normalize: "memoria microsd 64gb kingston"
Step 2 - Split: ["memoria", "microsd", "64gb", "kingston"]
Step 3 - Extract capacity: "64gb" → consumed (index 2)
Step 4 - Extract form factor: none matched
Step 5 - Extract type: "memoria" → "ram" (consumed index 0)
Step 6 - Extract brand: "kingston" → "kingston" (consumed index 3)
Step 7 - Extract model: "microsd" not alphanumeric-only starting with digit → skip
Step 8 - Remaining: ["microsd"] → added to raw but not classified

Result:
{
  brand: "kingston",
  type: "ram",       // "memoria" maps to "ram"
  capacity: "64gb",
  formFactor: null,
  model: null,
  raw: ["memoria", "microsd", "64gb", "kingston"],
  expandedRaw: ["memoria", "memoria ram", "ram", "microsd", "micro sd", "tarjeta sd", "sd card", "64gb", "kingston", "kingston technology"],
  categoryHint: null
}
```

**WAIT — IMPORTANT CORRECTION**: The query `"memoria microSD 64GB"` should tokenize `"microsd"` as the type (not "memoria"). The word "memoria" is ambiguous — it could mean RAM or SD card. The tokenizer should detect "microsd" first (priority: type detection at step 5 scans all words), and once "microsd" is matched as type, "memoria" becomes a generic descriptor.

**Revised resolution**: Type detection should check multi-word patterns first (`micro sd`, `tarjeta sd`) before single-word patterns (`memoria`). This way, `"memoria microsd"` → type is `"microsd"` (from the compound match), and `"memoria ram"` → type is `"ram"`.

---

## 4. Product Data Model Enhancement

### 4.1 New Fields on Product Schema

```typescript
// src/domain/models/product.ts

export interface Product {
  // === EXISTING FIELDS (unchanged) ===
  id: string;
  name: string;
  description?: string;
  price: number;
  // ... all existing fields ...

  // === NEW SEARCH FIELDS ===

  /** Normalized brand name (e.g., "kingston", "crucial") */
  brand?: string;

  /** Normalized product type (e.g., "ram", "ssd", "gpu", "microsd") */
  productType?: string;

  /** Normalized capacity (e.g., "64gb", "1tb", "16gb") */
  capacity?: string;

  /** Physical form factor (e.g., "m.2", "2.5", "ddr4", "ddr5") */
  formFactor?: string;

  /** Additional search keywords beyond the product name */
  searchKeywords?: string[];

  /** Pre-computed normalized text for full-text search */
  searchText?: string;

  /** Pre-computed search tokens for structured queries */
  searchTokens?: string[];
}
```

### 4.2 Field Constraints

| Field | Type | Default | Indexed | Notes |
|-------|------|---------|---------|-------|
| `brand` | `string` | `undefined` | Yes (compound) | Normalized lowercase, no accents |
| `productType` | `string` | `undefined` | Yes (compound) | One of: `ram`, `ssd`, `hdd`, `microsd`, `pendrive`, `gpu`, `cpu`, `monitor`, `teclado`, `mouse`, `auricular`, `webcam`, `gabinete`, `fuente` |
| `capacity` | `string` | `undefined` | Yes | Normalized: `"64gb"`, `"1tb"` |
| `formFactor` | `string` | `undefined` | No (queried via type) | `"m.2"`, `"2.5"`, `"3.5"`, `"ddr4"`, `"ddr5"` |
| `searchKeywords` | `string[]` | `[]` | No (used in $or) | Synonyms, alternate names |
| `searchText` | `string` | `""` | Yes (text index) | `name + description + searchKeywords` normalized |
| `searchTokens` | `string[]` | `[]` | No | Pre-tokenized brand/type/capacity for aggregation |

### 4.3 MongoDB Indexes

```javascript
// Compound index for structured filtering
db.products.createIndex(
  { brand: 1, productType: 1, capacity: 1 },
  { name: "idx_search_structured" }
);

// Text index for full-text search (already exists as searchName, extend)
db.products.createIndex(
  { searchText: "text" },
  { weights: { searchText: 10 }, name: "idx_search_text" }
);

// Single-field indexes for autocomplete prefix matching
db.products.createIndex({ searchText: 1 }, { name: "idx_search_prefix" });
db.products.createIndex({ brand: 1 }, { name: "idx_brand" });
```

### 4.4 Migration Strategy for Existing ~2967 Products

#### Migration Script: `scripts/backfill-search-fields.ts`

```typescript
// Idempotent — safe to re-run
// Processes in batches of 500

async function backfillSearchFields() {
  const db = await getDb();
  const collection = db.collection("products");

  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await collection
      .find({ searchText: { $exists: false } })
      .limit(500)
      .toArray();

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    const operations = batch.map(doc => {
      const name = doc.name || "";
      const brand = extractBrand(name);           // From KNOWN_BRANDS
      const productType = extractType(name);      // From TYPE_PATTERNS
      const capacity = extractCapacity(name);     // From CAPACITY_PATTERN
      const formFactor = extractFormFactor(name); // From FORM_FACTOR_PATTERNS
      const keywords = generateSearchKeywords(name, brand, productType);
      const searchText = buildSearchText(name, doc.description, keywords);
      const searchTokens = [brand, productType, capacity, formFactor].filter(Boolean);

      return {
        updateOne: {
          filter: { _id: doc._id },
          $set: {
            brand,
            productType,
            capacity,
            formFactor,
            searchKeywords: keywords,
            searchText,
            searchTokens,
          },
        },
      };
    });

    await collection.bulkWrite(operations, { ordered: false });
    processed += batch.length;
    console.log(`Backfilled ${processed} products...`);
  }

  console.log(`Migration complete. ${processed} products updated.`);
}
```

#### Extraction Logic (shared with scraper)

```typescript
// src/lib/search/field-extractor.ts

import { normalizeText } from "./normalizer";

const KNOWN_BRANDS: Set<string>;  // loaded from config/brands.json
const TYPE_PATTERNS: [RegExp, string][];
const CAPACITY_PATTERN = /^(\d+(?:\.\d+)?)\s*(gb|tb|mb|pb)$/i;
const FORM_FACTOR_PATTERNS: [RegExp, string | ((m: RegExpMatchArray) => string)][];

export function extractBrand(name: string): string | undefined {
  const normalized = normalizeText(name);
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (KNOWN_BRANDS.has(word)) return word;
  }
  return undefined;
}

export function extractType(name: string): string | undefined {
  const normalized = normalizeText(name);
  for (const [pattern, typeValue] of TYPE_PATTERNS) {
    if (pattern.test(normalized)) return typeValue;
  }
  return undefined;
}

export function extractCapacity(name: string): string | undefined {
  const normalized = normalizeText(name);
  const match = normalized.match(CAPACITY_PATTERN);
  if (match) return `${match[1]}${match[2].toLowerCase()}`;
  // Also check for capacity embedded in words: "64GB" in "Memoria 64GB"
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const m = word.match(CAPACITY_PATTERN);
    if (m) return `${m[1]}${m[2].toLowerCase()}`;
  }
  return undefined;
}

export function extractFormFactor(name: string): string | undefined {
  const normalized = normalizeText(name);
  const words = normalized.split(/\s+/);
  for (const word of words) {
    for (const [pattern, ffValue] of FORM_FACTOR_PATTERNS) {
      const match = word.match(pattern);
      if (match) return typeof ffValue === "function" ? ffValue(match) : ffValue;
    }
  }
  return undefined;
}
```

### 4.5 Scraper Integration

The scraper (`scraper.service.ts`) already processes product names. Add field extraction in the `transformProducts()` pipeline:

```typescript
// In scraper/data-transformer.ts or similar

import { extractBrand, extractType, extractCapacity, extractFormFactor } from "@/lib/search/field-extractor";

function enrichProductWithSearchFields(product: ScrapedProductDTO): ScrapedProductDTO {
  const name = product.name || "";
  return {
    ...product,
    brand: extractBrand(name),
    productType: extractType(name),
    capacity: extractCapacity(name),
    formFactor: extractFormFactor(name),
    searchText: buildSearchText(name, product.description, product.searchKeywords),
  };
}
```

### 4.6 Mapper Update

```typescript
// src/domain/mappers/product.mapper.ts — toDomain()

toDomain(doc: ProductDocument): Product {
  return {
    // ... existing fields ...
    brand: doc.brand || extractBrandFromName(doc.name),  // Fallback extraction
    productType: doc.productType,
    capacity: doc.capacity,
    formFactor: doc.formFactor,
    searchKeywords: doc.searchKeywords,
    searchTokens: doc.searchTokens,
    searchText: doc.searchText,
  };
}
```

### 4.7 Eliminate Hardcodes

| Location | Current | After |
|----------|---------|-------|
| `product-to-presentation.ts:123` | `brand: "General"` | `brand: dbProduct.brand \|\| extractBrandFromName(dbProduct.name)` |
| `product-to-presentation.ts:131` | `rating: 4.5` (hardcoded) | `rating: dbProduct.rating \|\| 0` (use DB value) |
| `product-to-presentation.ts:131` | `ratingCount: Math.floor(Math.random() * 50) + 10` | `ratingCount: dbProduct.ratingCount \|\| 0` |

---

## 5. Scoring Algorithm

### 5.1 Purpose

Rank candidate products by relevance to the user's structured query tokens.

### 5.2 Score Components

| Component | Points | Condition |
|-----------|--------|-----------|
| **Exact name match** | +100 | `normalizeText(product.name) === normalizeText(query)` |
| **Name contains query** | +80 | `normalizeText(product.name).includes(normalizeText(query))` |
| **Category match** | +50 | `normalizeText(product.categories[0]) === tokens.type` OR query category hint matches |
| **Type match** | +50 | `normalizeText(product.productType) === tokens.type` |
| **Capacity match** | +60 | `normalizeText(product.capacity) === tokens.capacity` |
| **Form factor match** | +50 | `normalizeText(product.formFactor) === tokens.formFactor` |
| **Brand match** | +40 | `normalizeText(product.brand) === tokens.brand` |
| **Brand partial match** | +20 | `normalizeText(product.brand).includes(tokens.brand)` |
| **Multi-word bonus** | +40 | ≥2 query words found in product name |
| **Partial word match** | +10 | Any individual query word found in product name (per word, max +30) |
| **Generic word match** | +2 | Matched word is a common/generic term (e.g., "para", "con", "usb") |
| **Capacity mismatch** | -80 | `tokens.capacity` present AND `product.capacity` present AND they differ |
| **Type mismatch** | -50 | `tokens.type` present AND `product.productType` present AND they differ |

### 5.3 Score Calculation

```typescript
// src/lib/search/scorer.ts

export interface ScoredProduct {
  product: Product;
  score: number;
  breakdown: Record<string, number>;
}

const GENERIC_WORDS = new Set([
  "para", "con", "sin", "de", "el", "la", "los", "las", "un", "una",
  "usb", "hdmi", "vga", "bluetooth", "wifi", "led", "rgb",
  "pro", "plus", "max", "mini", "nano",
]);

export function scoreProduct(
  product: Product,
  tokens: SearchTokens,
  query: string
): ScoredProduct {
  let score = 0;
  const breakdown: Record<string, number> = {};

  const normalizedName = normalizeText(product.name);
  const normalizedQuery = normalizeText(query);

  // === POSITIVE MATCHES ===

  // Exact name match
  if (normalizedName === normalizedQuery) {
    score += 100;
    breakdown.exactName = 100;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 80;
    breakdown.nameContains = 80;
  }

  // Type match (productType vs tokens.type)
  if (tokens.type && product.productType) {
    if (normalizeText(product.productType) === tokens.type) {
      score += 50;
      breakdown.type = 50;
    } else {
      score -= 50;
      breakdown.typePenalty = -50;
    }
  }

  // Capacity match (CRITICAL for "64GB" vs "32GB")
  if (tokens.capacity) {
    const productCapacity = normalizeText(product.capacity || "");
    if (productCapacity === tokens.capacity) {
      score += 60;
      breakdown.capacity = 60;
    } else if (productCapacity && productCapacity !== tokens.capacity) {
      score -= 80;
      breakdown.capacityPenalty = -80;
    }
  }

  // Form factor match
  if (tokens.formFactor && product.formFactor) {
    if (normalizeText(product.formFactor) === tokens.formFactor) {
      score += 50;
      breakdown.formFactor = 50;
    }
  }

  // Brand match
  if (tokens.brand && product.brand) {
    const productBrand = normalizeText(product.brand);
    if (productBrand === tokens.brand) {
      score += 40;
      breakdown.brand = 40;
    } else if (productBrand.includes(tokens.brand)) {
      score += 20;
      breakdown.brandPartial = 20;
    }
  }

  // Category match (from category hint, not query tokens)
  if (tokens.categoryHint && product.categories?.length) {
    if (product.categories.some(c => normalizeText(c) === normalizeText(tokens.categoryHint))) {
      score += 50;
      breakdown.category = 50;
    }
  }

  // Multi-word bonus
  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter(w => w.length > 2 && !GENERIC_WORDS.has(w));
  const matchedWords = queryWords.filter(w => normalizedName.includes(w));
  if (matchedWords.length >= 2) {
    score += 40;
    breakdown.multiWord = 40;
  }

  // Partial word match (per word, capped at +30 total)
  let partialBonus = 0;
  for (const word of queryWords) {
    if (normalizedName.includes(word)) {
      if (GENERIC_WORDS.has(word)) {
        partialBonus += 2;
      } else {
        partialBonus += 10;
      }
    }
  }
  if (partialBonus > 0) {
    const capped = Math.min(partialBonus, 30);
    score += capped;
    breakdown.partialWords = capped;
  }

  return { product, score, breakdown };
}
```

### 5.4 Tie-Breaking Rules

When two products have the same score:

1. **In-stock first**: `product.inStock === true` beats `false`
2. **Price ascending**: Lower price wins (user likely wants cheapest match)
3. **Newest first**: `product.createdAt` descending
4. **Alphabetical**: `product.name` ascending (deterministic)

```typescript
function tieBreaker(a: ScoredProduct, b: ScoredProduct): number {
  // In-stock first
  if (a.product.inStock !== b.product.inStock) {
    return a.product.inStock ? -1 : 1;
  }
  // Lower price first
  if (a.product.price !== b.product.price) {
    return a.product.price - b.product.price;
  }
  // Newest first
  return b.product.createdAt.getTime() - a.product.createdAt.getTime();
}
```

### 5.5 Score Normalization

Scores are NOT normalized to 0-1 range. They are used as-is for sorting. The raw score provides debugging visibility via `searchMeta.breakdown`.

**Score ranges** (theoretical):
- Perfect match: ~300 (exact +100, type +50, capacity +60, brand +40, category +50)
- Good match: 100-200
- Partial match: 30-100
- Weak match: 0-30
- Penalty-heavy: negative

---

## 6. Fuzzy Search

### 6.1 Purpose

Handle typos, misspellings, and partial queries that don't produce exact matches.

### 6.2 Strategy: Two-Tier Approach

**Tier 1 — Exact/Partial (always runs first)**:
- MongoDB `$text` search + application scoring (§5)
- Returns products that match well

**Tier 2 — Fuzzy (only if Tier 1 results < 5)**:
- Application-layer Levenshtein distance
- Only applied to individual tokens, not the full query

### 6.3 Levenshtein Implementation

```typescript
// src/lib/search/fuzzy-matcher.ts

import { distance } from "fastest-levenshtein";

/**
 * Maximum edit distance based on word length:
 * - 1-2 chars: no fuzzy (too ambiguous)
 * - 3-4 chars: max distance 1
 * - 5+ chars: max distance 2
 */
function maxEditDistance(word: string): number {
  if (word.length <= 2) return 0;
  if (word.length <= 4) return 1;
  return 2;
}

/**
 * Check if candidate word is a fuzzy match for the query term.
 */
export function fuzzyMatch(term: string, candidate: string): boolean {
  if (term === candidate) return true;
  if (term.length < 3) return false;

  const normalizedTerm = term.toLowerCase();
  const normalizedCandidate = candidate.toLowerCase();

  // Prefix match (handles "king" → "kingston")
  if (normalizedCandidate.startsWith(normalizedTerm)) return true;

  // Levenshtein distance
  const maxDist = maxEditDistance(normalizedTerm);
  return distance(normalizedTerm, normalizedCandidate) <= maxDist;
}

/**
 * Filter products that fuzzy-match at least one query token.
 */
export function fuzzyFilter(
  tokens: SearchTokens,
  candidates: Product[]
): Product[] {
  return candidates.filter(product => {
    const nameWords = normalizeText(product.name).split(/\s+/);
    const brandWord = product.brand ? normalizeText(product.brand).split(/\s+/) : [];
    const allWords = [...nameWords, ...brandWord];

    // At least ONE raw token must fuzzy-match at least ONE product word
    return tokens.raw.some(token =>
      allWords.some(word => fuzzyMatch(token, word))
    );
  });
}
```

### 6.4 When Fuzzy Kicks In

```
Tier 1 (exact/partial) results >= 5? → Return Tier 1 results
Tier 1 results < 5? → Run Tier 2 (fuzzy) on remaining candidates
Tier 2 results < 3? → Return "related products" (§10)
```

### 6.5 Performance Implications

| Metric | Target | Notes |
|--------|--------|-------|
| Tier 1 latency | <100ms | MongoDB pipeline + scoring |
| Tier 2 latency | <50ms | Levenshtein on ~200 candidates max |
| Total latency | <200ms (p95) | Combined |
| Candidate limit | 200 | MongoDB pipeline `$limit: 200` before scoring |

**Optimization**: `fastest-levenshtein` is a WASM-optimized library (~2KB). For 200 candidates × ~4 tokens × ~5 name words = 4000 distance calculations, well within budget.

### 6.6 Dependencies

```bash
npm install fastest-levenshtein
```

This is the ONLY new dependency for the entire feature.

---

## 7. Autocomplete / Typeahead

### 7.1 Endpoint Design

```
GET /api/search/autocomplete?q={query}&limit={limit}&category={category}
```

### 7.2 Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Partial query (min 2 chars) |
| `limit` | number | 8 | Max suggestions (1-15) |
| `category` | string | optional | Filter by category slug |

### 7.3 Response Shape

```typescript
// GET /api/search/autocomplete?q=king&limit=8

{
  suggestions: [
    {
      text: "Kingston Fury 16GB DDR4",
      brand: "Kingston",
      type: "ram",
      category: "memorias",
      score: 95
    },
    {
      text: "Kingston NV2 1TB NVMe M.2",
      brand: "Kingston",
      type: "ssd",
      category: "almacenamiento",
      score: 90
    }
  ],
  processingTimeMs: 32
}
```

### 7.4 Prefix Matching Rules

1. **Prefix match on name**: `product.name.toLowerCase().startsWith(query)`
2. **Prefix match on brand**: `product.brand.toLowerCase().startsWith(query)`
3. **Prefix match on searchText**: MongoDB text search with short query
4. **Sort by score**: Simple scoring — brand match +10, name prefix +20, in-stock +5

### 7.5 Autocomplete Scoring (simplified)

```typescript
function autocompleteScore(product: Product, query: string): number {
  let score = 0;
  const q = normalizeText(query);

  if (normalizeText(product.name).startsWith(q)) score += 20;
  if (normalizeText(product.brand || "").startsWith(q)) score += 10;
  if (product.inStock) score += 5;

  return score;
}
```

### 7.6 Debounce Strategy (Client-Side)

```typescript
// src/components/ui/search-bar.tsx (modified)

import { useState, useCallback, useRef, useEffect } from "react";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function SearchBar({ className, variant = "full" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSuggestions(data.suggestions);
      setShowSuggestions(true);
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setShowSuggestions(false);
      if (query.trim()) {
        router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      setShowSuggestions(false);
      setQuery(suggestion.text);
      router.push(`/buscar?q=${encodeURIComponent(suggestion.text)}`);
    },
    [router]
  );

  // ... render with suggestions dropdown ...
}
```

### 7.7 UI Behavior

| User Action | Response |
|-------------|----------|
| Types 2+ characters | After 250ms debounce, fetch suggestions |
| Types 1 character | No suggestions (below threshold) |
| Clears input | Suggestions disappear |
| Presses Enter | Navigate to /buscar with full query |
| Clicks suggestion | Navigate to /buscar with suggestion text |
| Presses Escape | Suggestions disappear, input keeps focus |
| Clicks outside | Suggestions disappear |

---

## 8. API Design

### 8.1 Modified Endpoint: `/api/products`

The existing `/api/products` endpoint (served via server components, not a route handler) will have its internal `searchByName()` replaced by the new search engine. **No external API contract changes.**

```
GET /api/products?q=memoria+microsd+64gb&page=1&limit=20
```

**Response** (backward-compatible, new fields optional):

```typescript
{
  products: Product[],        // ← Same shape as before
  total: number,
  page: number,
  limit: number,

  // NEW: optional search metadata (for debugging/analytics)
  searchMeta?: {
    query: string;
    tokens: SearchTokens;
    processingTimeMs: number;
    resultType: "exact" | "partial" | "fuzzy" | "related";
    totalCandidates: number;
  }
}
```

### 8.2 New Endpoint: `/api/search/autocomplete`

```
GET /api/search/autocomplete?q=king&limit=8&category=memorias
```

**Route file**: `src/app/api/search/autocomplete/route.ts`

```typescript
// src/app/api/search/autocomplete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { autocomplete } from "@/lib/search/autocomplete-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(15, Math.max(1, parseInt(searchParams.get("limit") || "8")));
  const category = searchParams.get("category") || undefined;

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [], processingTimeMs: 0 });
  }

  const start = performance.now();
  const suggestions = await autocomplete(q, { limit, category });
  const processingTimeMs = Math.round(performance.now() - start);

  return NextResponse.json({ suggestions, processingTimeMs });
}
```

### 8.3 New Endpoint: `/api/search` (main search)

```
GET /api/search?q=memoria+microsd+64gb&page=1&limit=20&category=almacenamiento
```

**Route file**: `src/app/api/search/route.ts`

```typescript
// src/app/api/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search/search-engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const category = searchParams.get("category") || undefined;

  if (!q.trim()) {
    return NextResponse.json({
      products: [],
      total: 0,
      page,
      limit,
      searchMeta: { query: q, tokens: null, processingTimeMs: 0, resultType: "exact", totalCandidates: 0 },
    });
  }

  const start = performance.now();
  const result = await searchProducts(q, { page, limit, category });
  const processingTimeMs = Math.round(performance.now() - start);

  return NextResponse.json({
    ...result,
    searchMeta: {
      ...result.searchMeta,
      processingTimeMs,
    },
  });
}
```

### 8.4 Backward Compatibility

| Consumer | Impact | Notes |
|----------|--------|-------|
| `/buscar` page (server component) | None | Uses `searchByName()` internally — transparent upgrade |
| Search bar (`search-bar.tsx`) | Minimal | Add autocomplete fetch, keep `router.push` |
| Admin product list | None | Uses `findPaginated()`, not search |
| Product detail page | None | Uses `findBySlug()` |

---

## 9. Category Awareness

### 9.1 Purpose

Prevent cross-category pollution (e.g., searching "memoria" in "Almacenamiento" category shouldn't show RAM sticks).

### 9.2 How Categories Prevent Cross-Category Pollution

1. **Category hint from URL**: When user navigates to `/buscar?q=memoria&category=almacenamiento`, the `category` param restricts results to that category.

2. **Category scoring boost**: Products in the hinted category get +50 points (§5.3).

3. **Category filtering**: When `category` param is present, MongoDB pipeline adds:
   ```typescript
   { $match: { categories: categorySlug } }
   ```
   BEFORE scoring. This is a hard filter, not just a score boost.

4. **Without category hint**: All categories are searched, but cross-category matches score lower due to no category bonus.

### 9.3 Category Weight in Scoring

| Scenario | Category Weight |
|----------|----------------|
| Category hint provided, product matches | +50 |
| Category hint provided, product doesn't match | Excluded from results (hard filter) |
| No category hint, product in any category | +0 (no penalty, no bonus) |

### 9.4 Category Slug Mapping

The search engine needs to map category slugs to `productType` for smarter matching:

```typescript
// src/lib/search/config/category-type-map.json

{
  "almacenamiento": ["ssd", "hdd", "nvme", "microsd", "pendrive"],
  "memorias": ["ram"],
  "componentes": ["gpu", "cpu", "motherboard", "fuente", "gabinete"],
  "perifericos": ["teclado", "mouse", "auricular", "monitor", "webcam"],
  "redes": ["router", "switch", "access-point"]
}
```

This allows: searching "ssd" while browsing "Almacenamiento" → boost SSD products. Searching "ssd" while browsing "Componentes" → still show SSDs but with lower category bonus.

---

## 10. Related Products

### 10.1 When Shown

Related products are shown ONLY when the main search returns fewer than 5 results.

```
Main search results >= 5? → Show results only
Main search results 1-4?  → Show results + related products section
Main search results = 0?  → Show "No results" + related products (broader match)
```

### 10.2 How "Related" Is Determined

1. **Relax type constraint**: Remove type match requirement, keep brand + capacity
2. **Same category**: Prefer products in the same category as the best match
3. **Same brand**: If brand was detected, prefer same brand
4. **Similar capacity**: Within ±50% of requested capacity (e.g., 32GB for 64GB query)

```typescript
// src/lib/search/related.ts

export async function findRelatedProducts(
  tokens: SearchTokens,
  excludeIds: string[],
  limit = 6
): Promise<Product[]> {
  const db = await getDb();
  const collection = db.collection("products");

  // Build relaxed query: same brand OR same type, exclude already-found
  const filter: Record<string, any> = {
    status: "active",
    _id: { $nin: excludeIds.map(id => new ObjectId(id)) },
    $or: [],
  };

  if (tokens.brand) {
    filter.$or.push({ brand: normalizeText(tokens.brand) });
  }
  if (tokens.type) {
    filter.$or.push({ productType: tokens.type });
  }
  if (tokens.capacity) {
    // Within ±50% capacity range
    const capacityRange = parseCapacityRange(tokens.capacity);
    if (capacityRange) {
      filter.$or.push({ capacity: { $in: capacityRange } });
    }
  }

  // If no $or conditions, fall back to random active products
  if (filter.$or.length === 0) {
    delete filter.$or;
  }

  const docs = await collection
    .find(filter)
    .limit(limit)
    .toArray();

  return docs.map(doc => productMapper.toDomain(doc as any));
}
```

### 10.3 UI Placement

Related products appear in a separate section below the main results:

```
┌──────────────────────────────────────┐
│ Search Results (4 items)             │
│ ┌──────────┐ ┌──────────┐           │
│ │ Product1 │ │ Product2 │           │
│ └──────────┘ └──────────┘           │
│ ┌──────────┐ ┌──────────┐           │
│ │ Product3 │ │ Product4 │           │
│ └──────────┘ └──────────┘           │
├──────────────────────────────────────┤
│ Related Products                     │
│ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │ Related1 │ │ Related2 │ │Relatd3 ││
│ └──────────┘ └──────────┘ └────────┘│
└──────────────────────────────────────┘
```

The related section uses a distinct visual treatment (lighter background, "Related" header) to differentiate from main results.

---

## 11. Acceptance Criteria

### 11.1 Text Normalization

| ID | Criterion | Test |
|----|-----------|------|
| N-1 | Normalizes accented characters | `"memória"` → `"memoria"` |
| N-2 | Lowercases all input | `"MEMORIA MicroSD"` → `"memoria microsd"` |
| N-3 | Collapses whitespace | `"memoria  micro   sd"` → `"memoria micro sd"` |
| N-4 | Strips special characters | `"GPU!!! $$"` → `"gpu"` |
| N-5 | Preserves dots in versions | `"USB 3.0"` → `"usb 3.0"` |
| N-6 | Preserves hyphens in DDR | `"DDR5-6400"` → `"ddr5-6400"` |
| N-7 | Returns empty string for empty/null input | `""` → `""`, `null` → `""` |
| N-8 | Handles zero-width spaces | `"micro\u200Bsd"` → `"microsd"` |

### 11.2 Synonym Dictionary

| ID | Criterion | Test |
|----|-----------|------|
| S-1 | Expands "pendrive" to include "memoria usb" | `"pendrive"` query matches product named "Memoria USB 32GB" |
| S-2 | Expands "microsd" to include "micro sd" | `"microsd"` matches "Micro SD 64GB" |
| S-3 | Expands "gpu" to include "placa de video" | `"gpu"` matches "Placa de Video RTX 4060" |
| S-4 | Bidirectional expansion | `"memoria usb"` also matches products named "Pendrive 32GB" |
| S-5 | New synonyms configurable via JSON file | Adding `"cooler": ["disipador", "ventilador"]` to synonyms.json works without code change |
| S-6 | No false expansions | `"ssd"` does NOT expand to include HDD products |

### 11.3 Smart Tokenization

| ID | Criterion | Test |
|----|-----------|------|
| T-1 | Extracts brand from query | `"kingston fury 16gb"` → brand: `"kingston"` |
| T-2 | Extracts capacity | `"64gb"` → capacity: `"64gb"` |
| T-3 | Extracts type | `"memoria ram"` → type: `"ram"` |
| T-4 | Extracts form factor | `"ddr4"` → formFactor: `"ddr4"` |
| T-5 | Handles ambiguous "memoria" | `"memoria microsd"` → type: `"microsd"` (not "ram") |
| T-6 | Handles "memoria ram" correctly | `"memoria ram 16gb"` → type: `"ram"`, capacity: `"16gb"` |
| T-7 | Priority: capacity > formFactor > type > brand | `"kingston 64gb ddr4 ram"` → capacity first, then formFactor, then type, then brand |
| T-8 | Unknown tokens preserved in raw | `"kingston fury 16gb"` → raw includes all words |

### 11.4 Product Data Model

| ID | Criterion | Test |
|----|-----------|------|
| D-1 | Migration script processes all ~2967 products | `backfill-search-fields.ts` completes with 0 errors |
| D-2 | Migration is idempotent | Running twice produces same result |
| D-3 | Brand extracted for 90%+ of products | Query products with `brand: { $exists: true }` count / total > 0.9 |
| D-4 | Capacity extracted for storage products | All SSD/HDD/RAM products have capacity field |
| D-5 | Scraper populates search fields for new products | New scraped product has brand, productType, capacity |
| D-6 | searchText covers name + description + keywords | Text search on searchText matches queries that match product description |

### 11.5 Scoring Algorithm

| ID | Criterion | Test |
|----|-----------|------|
| SC-1 | Exact match ranks highest | `"Memoria Kingston Fury 16GB DDR4"` exact match scores > all partial matches |
| SC-2 | 64GB ranks above 32GB for "64gb" query | Products with capacity "64gb" score higher than those with "32gb" |
| SC-3 | Brand match boosts score | Kingston product scores higher than Crucial for "kingston" query |
| SC-4 | Capacity mismatch penalizes | 32GB product gets -80 penalty when user queries "64gb" |
| SC-5 | Type mismatch penalizes | RAM product gets -50 penalty when user queries "ssd" |
| SC-6 | Multi-word bonus applies | Query matching 2+ words in name gets +40 bonus |
| SC-7 | Tie-breaker: in-stock first | Two equal-score products: in-stock appears first |
| SC-8 | Tie-breaker: lower price first | Two equal-score in-stock products: cheaper appears first |

### 11.6 Fuzzy Search

| ID | Criterion | Test |
|----|-----------|------|
| F-1 | Handles 1-char typo for 5+ char words | `"kingstom"` → matches "Kingston" |
| F-2 | Handles 1-char typo for 3-4 char words | `"samsng"` → matches "Samsung" |
| F-3 | No fuzzy for words < 3 chars | `"ab"` → does NOT fuzzy match anything |
| F-4 | Prefix matching works | `"king"` → matches "Kingston" |
| F-5 | Fuzzy only activates when < 5 exact results | If exact search returns 5+, fuzzy is skipped |
| F-6 | Performance: <200ms total (p95) | Benchmark test with 3000 products |

### 11.7 Autocomplete

| ID | Criterion | Test |
|----|-----------|------|
| A-1 | Returns suggestions for 2+ char queries | `"ki"` → returns Kingston products |
| A-2 | Returns empty for 1-char queries | `"k"` → returns empty |
| A-3 | Responds in <50ms | Benchmark test |
| A-4 | Limits results to `limit` param | `?limit=3` → max 3 suggestions |
| A-5 | Category filter works | `?category=almacenamiento` → only storage products |
| A-6 | Debounce prevents rapid requests | Typing "kingston" fires 1 request (not 9) |

### 11.8 API Design

| ID | Criterion | Test |
|----|-----------|------|
| AP-1 | Backward compatible | Existing consumers see no breaking changes |
| AP-2 | searchMeta is optional | Response without searchMeta is valid |
| AP-3 | Empty query returns empty results | `?q=` → `{ products: [], total: 0 }` |
| AP-4 | Autocomplete endpoint exists | `GET /api/search/autocomplete?q=ki` returns 200 |
| AP-5 | Main search endpoint exists | `GET /api/search?q=memoria` returns 200 |

### 11.9 Category Awareness

| ID | Criterion | Test |
|----|-----------|------|
| C-1 | Category hint filters results | `?category=almacenamiento&q=ssd` → only storage products |
| C-2 | No category hint searches all | `?q=ssd` → results from all categories |
| C-3 | Category boost affects ranking | Same query: product in hinted category ranks higher |

### 11.10 Related Products

| ID | Criterion | Test |
|----|-----------|------|
| R-1 | Shown when < 5 results | 3 results → related section visible |
| R-2 | Not shown when >= 5 results | 5+ results → no related section |
| R-3 | Related products are different from main results | No duplicates between main and related |
| R-4 | Related products are from similar category | Related items share category with main results |

### 11.11 End-to-End User Scenarios

| ID | Scenario | Expected Result |
|----|----------|----------------|
| E2E-1 | Search "memoria microSD 64GB" | Top result: 64GB microSD card. NOT 32GB. NOT RAM. |
| E2E-2 | Search "pendrive 32gb" | Results show USB flash drives of 32GB capacity |
| E2E-3 | Search "gpu nvidia" | Results show NVIDIA graphics cards |
| E2E-4 | Search "king" | Autocomplete shows Kingston products. Full search shows all Kingston products. |
| E2E-5 | Search "kingstom" (typo) | Fuzzy match returns Kingston products |
| E2E-6 | Search "ssd 1tb" in Almacenamiento category | Only SSDs with 1TB capacity from Almacenamiento |
| E2E-7 | Search "monitor 4k" (rare query) | Shows monitors, related products if < 5 results |
| E2E-8 | Search "base notebook" | Shows laptop bases/stands |

---

## Appendix A: File Structure (New)

```
src/lib/search/
├── index.ts                    # Public exports
├── types.ts                    # SearchTokens, ScoredProduct, etc.
├── normalizer.ts               # normalizeText()
├── tokenizer.ts                # tokenize()
├── synonym-dictionary.ts       # expandSynonyms()
├── scorer.ts                   # scoreProduct()
├── fuzzy-matcher.ts            # fuzzyMatch(), fuzzyFilter()
├── field-extractor.ts          # extractBrand/Type/Capacity/FormFactor
├── related.ts                  # findRelatedProducts()
├── search-engine.ts            # orchestrateSearch() — main entry
├── autocomplete-engine.ts      # autocomplete()
├── pipeline-stages.ts          # MongoDB aggregation stages
└── config/
    ├── synonyms.json           # Synonym groups (config file)
    ├── brands.json             # Known brands list
    └── category-type-map.json  # Category → productType mapping

src/app/api/search/
├── route.ts                    # GET /api/search?q=...
└── autocomplete/
    └── route.ts                # GET /api/search/autocomplete?q=...

scripts/
└── backfill-search-fields.ts   # Migration script
```

## Appendix B: Dependencies

| Dependency | Version | Purpose | Size |
|-----------|---------|---------|------|
| `fastest-levenshtein` | latest | Fuzzy matching | ~2KB |

No other new dependencies required.

## Appendix C: Performance Budget

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Normalization | <1ms | Pure string ops |
| Tokenization | <5ms | Regex + dictionary lookup |
| Synonym expansion | <2ms | Pre-built reverse index |
| MongoDB candidate fetch | <80ms | Compound indexes + $limit: 200 |
| Application scoring | <30ms | 200 candidates × simple arithmetic |
| Fuzzy filtering (Tier 2) | <50ms | fastest-levenshtein on 200 candidates |
| Autocomplete | <50ms | Prefix index + limit |
| **Total search** | **<200ms (p95)** | Combined pipeline |
| **Total autocomplete** | **<50ms (p95)** | Lightweight query |
