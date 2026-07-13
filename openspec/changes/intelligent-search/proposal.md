# SDD Proposal: Intelligent E-Commerce Search Engine

**Change**: Rediseño completo del sistema de búsqueda hacia un buscador inteligente orientado a e-commerce
**Status**: Proposed
**Date**: 2026-07-13
**Author**: SDD Proposal Agent

---

## 1. Problem Statement

El sistema actual de búsqueda en TechnoStore tiene limitaciones críticas que afectan la experiencia de usuario:

- **Búsqueda puramente textual**: MongoDB `$text` index con TF-IDF no entiende semántica de productos
- **Sin atributos estructurados**: brand está hardcodeado a `"General"` en `product-to-presentation.ts:123`, no hay campos para type, capacity, model
- **Sin scoring inteligente**: "memoria microSD 64GB" no prioriza productos de 64GB sobre 32GB
- **Sin autocompletado**: El usuario debe escribir la query completa y hacer submit
- **Navegación completa por página**: Cada búsqueda requiere full page navigation (`router.push`)
- **Dead code**: `search()` method en `product.repository.ts:541` usa regex sin escape, nunca es llamado
- **getBrandsByCategory() es O(n)**: Carga todos los productos de una categoría para detectar marcas (`product.repository.ts:722`)
- **Rating es random por render**: `product-to-presentation.ts:131` genera `Math.random()` cada vez

---

## 2. Architecture Decision: Hybrid Approach (MongoDB + Application-Layer Scoring)

### Opciones Evaluadas

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **A. Solo MongoDB $text** | Simple, rápido | Sin scoring inteligente, sin synonyms, sin fuzzy |
| **B. Elasticsearch/MeiliSearch** | Full-text search completo | Infraestructura adicional, hosting cost, overkill para ~3k-50k productos |
| **C. MongoDB aggregation + app scoring** | Sin infra nueva, control total, escalable a 50k | Más código custom, processing en app layer |

### Decisión: Opción C — MongoDB Aggregation Pipeline + Application-Layer Scoring

**Justificación**:

1. **~3000 productos, crecimiento a 50k**: MongoDB aggregation pipeline con índices adecuados maneja esto sin problemas. Elasticsearch es overkill.

2. **Control total del scoring**: El algoritmo de scoring requerido (exact match +100, category +50, penalty por atributos no coincidentes) no se puede expresar con MongoDB textScore solo.

3. **Sin infraestructura nueva**: No requiere Elasticsearch, Redis, ni servicios externos. Todo corre en la misma Next.js app.

4. **Performance**: Con índices compuestos y pipeline optimizado, <200ms es alcanzable para 50k productos.

5. **Modularidad**: El scoring engine es un módulo puro que puede ser testado independientemente.

### Arquitectura Resultante

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  SearchBar   │────▶│  /api/search     │────▶│  Search Engine  │
│  (debounced) │     │  (route handler) │     │  (lib/search/)  │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                          ┌────────────┴────────────┐
                                          │                         │
                                   ┌──────▼──────┐          ┌──────▼──────┐
                                   │  MongoDB    │          │  Scoring    │
                                   │  Pipeline   │          │  Engine     │
                                   │  (filter +  │          │  (rank +    │
                                   │   text)     │          │   penalty)  │
                                   └─────────────┘          └─────────────┘
```

---

## 3. Data Model Enhancement

### Campos Nuevos en Product Schema

```typescript
// src/domain/models/product.ts — campos nuevos
export interface Product {
  // ... campos existentes ...

  // === NUEVOS CAMPOS DE BÚSQUEDA ===
  
  /** Marca del producto (extraída del nombre o scraper) */
  brand?: string;
  
  /** Tipo de producto normalizado: "memoria", "disco", "placa", "monitor", etc. */
  productType?: string;
  
  /** Capacidad/almacenamiento normalizado: "64gb", "16gb", "1tb", etc. */
  capacity?: string;
  
  /** Formato/factor: "m.2", "2.5", "3.5", "microsd", "ddr4", "ddr5" */
  formFactor?: string;
  
  /** Keywords adicionales para búsqueda (synonyms, modelos alternativos) */
  searchKeywords?: string[];
  
  /** Tokens pre-computados del nombre (brand, type, capacity, etc.) */
  searchTokens?: string[];
  
  /** Texto normalizado completo para búsqueda (pre-computado) */
  searchText?: string;
}
```

### Migración del Mapper

```typescript
// src/domain/mappers/product.mapper.ts — brand ya no es hardcodeado
toDomain(doc: ProductDocument): Product {
  return {
    // ...
    brand: doc.brand || extractBrandFromName(doc.name), // Fallback inteligente
    productType: doc.productType,
    capacity: doc.capacity,
    formFactor: doc.formFactor,
    searchKeywords: doc.searchKeywords,
    searchTokens: doc.searchTokens,
    searchText: doc.searchText,
  };
}
```

### Eliminar Hardcode de Brand

```typescript
// ANTES (product-to-presentation.ts:123):
brand: "General", // Could be extracted from product name in the future

// DESPUÉS:
brand: dbProduct.brand || extractBrandFromName(dbProduct.name),
```

### Población de Campos

**Opción elegida**: Migration script + scraper enhancement

1. **Migration script** (`scripts/backfill-search-fields.ts`):
   - Itera todos los productos existentes
   - Extrae brand del nombre usando diccionario de marcas conocidas
   - Extrae capacity/type del nombre usando regex patterns
   - Genera searchTokens y searchText
   - Batch update en MongoDB (bulkWrite)

2. **Scraper enhancement** (`scraper.service.ts`):
   - El scraper ya tiene acceso al nombre y categorías
   - Agregar extracción de brand/type/capacity en el pipeline de scraping
   - Guardar directamente en el documento

3. **Admin UI** (futuro v2):
   - Campo manual de brand/type en el form de edición de producto

---

## 4. Search Engine Architecture

### Estructura de Módulos

```
src/lib/search/
├── index.ts                    # Export público
├── search-engine.ts            # Orquestador principal
├── normalizer.ts               # Normalización de texto
├── tokenizer.ts                # Tokenización inteligente
├── synonym-dictionary.ts       # Diccionario de sinónimos
├── scorer.ts                   # Motor de scoring
├── fuzzy-matcher.ts            # Búsqueda difusa
├── pipeline-stages.ts          # Stages de MongoDB aggregation
└── types.ts                    # Tipos compartidos
```

### Pipeline de Búsqueda

```
Query: "memoria microSD 64GB kingston"

1. NORMALIZE
   → "memoria microsd 64gb kingston"
   → Remove accents, lowercase, normalize spaces

2. EXPAND SYNONYMS
   → ["memoria", "microsd", "64gb", "kingston"]
   → microsd → [microsd, micro sd, tarjeta sd]

3. TOKENIZE (smart tokenizer)
   → {
       brand: "kingston",
       type: "memoria",
       capacity: "64gb",
       formFactor: "microsd",
       raw: ["memoria", "microsd", "64gb", "kingston"]
     }

4. MONGODB CANDIDATE FETCH
   → $match con $or sobre searchText + searchTokens + brand
   → Limit: 200 candidatos (pre-filter)
   → Index: compound text index + brand + productType

5. APPLICATION SCORING
   → Para cada candidato, calcular score:
     - Exact name match: +100
     - Category match: +50
     - Type match: +50
     - Brand match: +40
     - Capacity match: +60
     - Multi-word match: +40
     - Partial match: +10
     - Generic word: +2
     - PENALTY: capacity mismatch: -80
     - PENALTY: type mismatch: -50

6. SORT + PAGINATE
   → Sort by score descending
   → Paginate top 20

7. RELATED PRODUCTS (si < 5 resultados)
   → Relajar scoring, buscar productos relacionados
```

---

## 5. Scoring Algorithm Detail

```typescript
// src/lib/search/scorer.ts

interface ScoredProduct {
  product: Product;
  score: number;
  breakdown: Record<string, number>;
}

function scoreProduct(
  product: Product,
  tokens: SearchTokens,
  query: string
): ScoredProduct {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // === MATCHES POSITIVOS ===

  // Exact name match (normalized)
  const normalizedName = normalizeText(product.name);
  const normalizedQuery = normalizeText(query);
  if (normalizedName === normalizedQuery) {
    score += 100;
    breakdown.exactName = 100;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 80;
    breakdown.nameContains = 80;
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

  // Category match
  if (tokens.type && product.productType) {
    if (normalizeText(product.productType) === tokens.type) {
      score += 50;
      breakdown.type = 50;
    }
  }

  // Capacity match (CRITICAL for "64GB" vs "32GB")
  if (tokens.capacity) {
    const productCapacity = normalizeText(product.capacity || "");
    if (productCapacity === tokens.capacity) {
      score += 60;
      breakdown.capacity = 60;
    } else if (productCapacity.includes(tokens.capacity)) {
      score += 30;
      breakdown.capacityPartial = 30;
    }
  }

  // Form factor match
  if (tokens.formFactor && product.formFactor) {
    if (normalizeText(product.formFactor) === tokens.formFactor) {
      score += 50;
      breakdown.formFactor = 50;
    }
  }

  // Multi-word match bonus
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  const matchedWords = queryWords.filter(w => normalizedName.includes(w));
  if (matchedWords.length > 1) {
    score += 40;
    breakdown.multiWord = 40;
  }

  // === PENALTIES ===

  // Capacity mismatch penalty (32GB when user wants 64GB)
  if (tokens.capacity && product.capacity) {
    const productCapacity = normalizeText(product.capacity);
    if (productCapacity !== tokens.capacity) {
      score -= 80;
      breakdown.capacityPenalty = -80;
    }
  }

  // Type mismatch penalty (RAM when user wants microSD)
  if (tokens.type && product.productType) {
    if (normalizeText(product.productType) !== tokens.type) {
      score -= 50;
      breakdown.typePenalty = -50;
    }
  }

  return { product, score, breakdown };
}
```

---

## 6. Synonym & Tokenization System

### Diccionario de Sinónimos

```typescript
// src/lib/search/synonym-dictionary.ts

const SYNONYMS: Record<string, string[]> = {
  // Formatos de almacenamiento
  "micro sd": ["microsd", "tarjeta sd", "sd card", "sdhc", "sdxc"],
  "microsd": ["micro sd", "tarjeta sd", "sd card"],
  "pendrive": ["memoria usb", "usb", "flash drive", "memory stick"],
  "memoria usb": ["pendrive", "usb", "flash drive"],
  
  // Componentes
  "gpu": ["placa de video", "tarjeta de video", "video card", "graphics card"],
  "placa de video": ["gpu", "tarjeta de video"],
  "cpu": ["procesador", "processor"],
  "procesador": ["cpu", "processor"],
  "ram": ["memoria", "memory", "memoria ram"],
  "memoria ram": ["ram", "memoria", "memory"],
  
  // Tipos de disco
  "ssd": ["disco solido", "solid state", "disco estado solido"],
  "hdd": ["disco mecanico", "disco duro", "hard drive"],
  "nvme": ["m.2", "pcie"],
  
  // Marcas comunes
  "kingston": ["kingston technology"],
  "sandisk": ["san disk", "western digital"],
  "wd": ["western digital", "sandisk"],
  "seagate": ["seagate technology"],
  "crucial": ["crucial technology", "micron"],
};

// Reverse index para lookup rápido
const REVERSE_SYNONYMS = buildReverseIndex(SNONYMS);

function expandSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms);
  for (const term of terms) {
    const normalized = normalizeText(term);
    if (REVERSE_SYNONYMS[normalized]) {
      for (const syn of REVERSE_SYNONYMS[normalized]) {
        expanded.add(syn);
      }
    }
  }
  return [...expanded];
}
```

### Smart Tokenizer

```typescript
// src/lib/search/tokenizer.ts

interface SearchTokens {
  brand: string | null;
  type: string | null;
  capacity: string | null;
  formFactor: string | null;
  model: string | null;
  raw: string[];
  expandedRaw: string[];
}

// Marcas conocidas (extraídas del scraper + catálogo)
const KNOWN_BRANDS = new Set([
  "kingston", "sandisk", "crucial", "samsung", "wd", "western digital",
  "seagate", "toshiba", "lexar", "pny", "adata", "teamgroup", "silicon power",
  "logitech", "redragon", "hyperx", "razer", "corsair", "steelseries",
  "jbl", "sony", "xiaomi", "philips", "lg", "asus", "msi", "gigabyte",
  "kolke", "ugreen", "netmak", "nisuta", "fantech", "trust", "genius",
]);

// Capacity patterns: 64gb, 16gb, 1tb, 2tb, etc.
const CAPACITY_PATTERN = /^(\d+(?:\.\d+)?)\s*(gb|tb|mb|pb)$/i;

// Form factor patterns
const FORM_FACTOR_PATTERNS: [RegExp, string][] = [
  [/^m\.?2$/i, "m.2"],
  [/^(?:2\.5|3\.5)(?:\s*(?:inch|pulgada))?$/i, (m) => m[1].replace(".", "")],
  [/^ddr[345]?$/i, (m) => m[0].toLowerCase()],
  [/^sata\s*(?:iii|3)?$/i, "sata3"],
  [/^nvme$/i, "nvme"],
  [/^pcie$/i, "pcie"],
];

// Type patterns
const TYPE_PATTERNS: [RegExp, string][] = [
  [/(?:memoria|memory|ram)/i, "ram"],
  [/(?:micro\s*sd|microsd|tarjeta\s*sd|sd\s*card)/i, "microsd"],
  [/(?:pendrive|memoria\s*usb|usb|flash)/i, "pendrive"],
  [/(?:ssd|disco\s*solido)/i, "ssd"],
  [/(?:hdd|disco\s*mecanico|disco\s*duro)/i, "hdd"],
  [/(?:gpu|placa\s*de\s*video|tarjeta\s*de\s*video)/i, "gpu"],
  [/(?:procesador|cpu|processor)/i, "cpu"],
  [/(?:monitor|pantalla)/i, "monitor"],
  [/(?:teclado|keyboard)/i, "teclado"],
  [/(?:mouse|raton)/i, "mouse"],
  [/(?:auricular|headset|headphone)/i, "auricular"],
];

function tokenize(query: string): SearchTokens {
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  let brand: string | null = null;
  let type: string | null = null;
  let capacity: string | null = null;
  let formFactor: string | null = null;
  let model: string | null = null;
  const matchedIndices = new Set<number>();

  // 1. Detect capacity (e.g., "64gb", "1tb")
  for (let i = 0; i < words.length; i++) {
    const capMatch = words[i].match(CAPACITY_PATTERN);
    if (capMatch) {
      capacity = `${capMatch[1]}${capMatch[2].toLowerCase()}`;
      matchedIndices.add(i);
      break;
    }
  }

  // 2. Detect brand
  for (let i = 0; i < words.length; i++) {
    if (KNOWN_BRANDS.has(words[i])) {
      brand = words[i];
      matchedIndices.add(i);
      break;
    }
  }

  // 3. Detect type
  for (let i = 0; i < words.length; i++) {
    for (const [pattern, typeValue] of TYPE_PATTERNS) {
      if (pattern.test(words[i])) {
        type = typeof typeValue === "function" ? typeValue(words[i].match(pattern)!) : typeValue;
        matchedIndices.add(i);
        break;
      }
    }
    if (type) break;
  }

  // 4. Detect form factor
  for (let i = 0; i < words.length; i++) {
    if (matchedIndices.has(i)) continue;
    for (const [pattern, ffValue] of FORM_FACTOR_PATTERNS) {
      const match = words[i].match(pattern);
      if (match) {
        formFactor = typeof ffValue === "function" ? ffValue(match) : ffValue;
        matchedIndices.add(i);
        break;
      }
    }
    if (formFactor) break;
  }

  // 5. Remaining unmatched words might be model numbers
  const unmatched = words.filter((_, i) => !matchedIndices.has(i));
  if (unmatched.length === 1 && /^\d+/.test(unmatched[0])) {
    model = unmatched[0];
  }

  return {
    brand,
    type,
    capacity,
    formFactor,
    model,
    raw: words,
    expandedRaw: expandSynonyms(words),
  };
}
```

---

## 7. Fuzzy Search Strategy

### Approach: MongoDB Atlas Text Search + Application-Layer Fuzzy

Para ~3k-50k productos, la mejor estrategia es combinar:

1. **MongoDB text index** con stemming para候选人 retrieval
2. **Application-layer Levenshtein** para fuzzy matching de tokens individuales

```typescript
// src/lib/search/fuzzy-matcher.ts

import { distance } from "fastest-levenshtein";

// UMBRAL: tolerancia de 1-2 caracteres para palabras de 5+ chars
function fuzzyMatch(term: string, candidate: string, maxDistance = 1): boolean {
  if (term === candidate) return true;
  if (term.length < 3) return false; // No fuzzy para palabras cortas
  
  const maxDist = term.length <= 5 ? 1 : 2;
  return distance(term.toLowerCase(), candidate.toLowerCase()) <= Math.min(maxDistance, maxDist);
}

// Para prefix search ("king" → "kingston")
function prefixMatch(term: string, candidate: string): boolean {
  return candidate.toLowerCase().startsWith(term.toLowerCase());
}

// Buscar productos fuzzy cuando el match exacto falla
function fuzzySearch(
  tokens: SearchTokens,
  candidates: Product[]
): Product[] {
  return candidates.filter(product => {
    const name = normalizeText(product.name);
    const words = name.split(/\s+/);
    
    // Al menos UN token debe hacer fuzzy match
    return tokens.raw.some(token => {
      // Prefix match
      if (prefixMatch(token, name)) return true;
      
      // Fuzzy match against product name words
      return words.some(word => fuzzyMatch(token, word));
    });
  });
}
```

### MongoDB Index Strategy

```javascript
// Compound index para búsqueda rápida
db.products.createIndex(
  { searchText: "text", brand: 1, productType: 1, capacity: 1 },
  { weights: { searchText: 10 } }
);

// Index para prefix search
db.products.createIndex({ searchText: 1 });
db.products.createIndex({ brand: 1, productType: 1 });
db.products.createIndex({ capacity: 1 });
```

---

## 8. API Design

### Endpoint Modificado: `/api/products?q=...`

**Request** (sin cambios en contrato):
```
GET /api/products?q=memoria+microsd+64gb&page=1&limit=20
```

**Response** (extendido, backward-compatible):
```typescript
{
  products: Product[],      // ← Sin cambios en shape
  total: number,
  page: number,
  limit: number,
  
  // NUEVOS campos opcionales
  searchMeta?: {
    query: string;
    tokens: SearchTokens;
    processingTimeMs: number;
    resultType: "exact" | "partial" | "fuzzy" | "related";
    totalCandidates: number;
  }
}
```

### Nuevo Endpoint: `/api/search/autocomplete`

```
GET /api/search/autocomplete?q=king&limit=8
```

**Response**:
```typescript
{
  suggestions: Array<{
    text: string;           // "Kingston Fury 16GB DDR4"
    brand?: string;         // "Kingston"
    type?: string;          // "ram"
    score: number;
  }>;
  processingTimeMs: number;
}
```

### Mantener Contrato Existente

La `/buscar` page sigue usando `searchByName()` internamente. El cambio es transparente para el front — solo mejora la calidad de resultados.

---

## 9. Migration Strategy

### Fase 1: Preparación (sin breaking changes)

1. **Crear índices compuestos** en MongoDB:
   ```javascript
   db.products.createIndex({ searchText: "text" }, { weights: { searchText: 10 } });
   db.products.createIndex({ brand: 1, productType: 1 });
   ```

2. **Agregar campos al schema** (opcionales, no rompen existentes):
   ```typescript
   // product.ts — brand ya existe en mapper, solo agregar los nuevos
   brand?: string;       // Ya existe en mapper como fallback
   productType?: string; // Nuevo
   capacity?: string;    // Nuevo
   formFactor?: string;  // Nuevo
   searchKeywords?: string[]; // Nuevo
   searchText?: string;       // Nuevo
   ```

3. **Migration script** (`scripts/backfill-search-fields.ts`):
   - Batch de 500 productos
   - Extraer brand/type/capacity del nombre
   - Generar searchText
   - `bulkWrite` con `updateMany` por lotes
   - Idempotente (puede re-ejecutarse)

### Fase 2: Implementación (sin breaking changes)

4. **Crear módulos de búsqueda** (`src/lib/search/`)
5. **Modificar `searchByName()`** para usar el nuevo pipeline
6. **Mantener API contract** — response shape idéntica

### Fase 3: Cleanup

7. **Eliminar dead code**: `search()` method en `product.repository.ts:541`
8. **Eliminar hardcode de brand**: `product-to-presentation.ts:123`
9. **Eliminar rating random**: `product-to-presentation.ts:131`

---

## 10. Scope Boundaries

### v1 (Incluido)

- [ ] Normalización de texto (accents, case, spaces)
- [ ] Diccionario de sinónimos (~50 synonyms)
- [ ] Smart tokenizer (brand, type, capacity, formFactor)
- [ ] Scoring engine con pesos configurables
- [ ] Penalty system (capacity mismatch, type mismatch)
- [ ] MongoDB aggregation pipeline optimizado
- [ ] Migration script para campos de búsqueda
- [ ] Eliminar dead code y hardcodes
- [ ] Autocomplete básico (prefix search)
- [ ] Fuzzy search (Levenshtein para typos)
- [ ] Performance testing (<200ms target)

### v2 (Diferido)

- [ ] Admin UI para brand/type manual override
- [ ] Sinónimos dinámicos (admin-editable en DB)
- [ ] Analytics de búsquedas (qué buscan los usuarios)
- [ ] A/B testing de scoring weights
- [ ] Synonym suggestions basadas en búsquedas fallidas
- [ ] Multi-language support (inglés + español)
- [ ] Search history / "búsquedas recientes"
- [ ] Faceted search (filtros laterales por marca, precio, capacity)

### NO Incluido (Explícitamente)

- Elasticsearch / MeiliSearch / Algolia
- Machine learning para ranking
- Personalización de resultados por usuario
- Indexación en tiempo real (scraper handles this)

---

## 11. Risks and Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Performance degradation** con pipeline complejo | Media | Alto | Benchmark con 50k productos; lazy evaluation; candidate limit 200 |
| **Migration script falla** en productos edge-case | Media | Medio | Idempotente; dry-run mode; logging detallado |
| **Sinónimos incompletos** al launch | Alta | Bajo | Diccionario base cubre 90% de casos; fácil de extender |
| **Brand extraction incorrecta** | Media | Medio | Fallback a "General"; admin override en v2 |
| **Capacity parsing falla** en nombres edge-case | Media | Bajo | Regex conservador; si no parsea, no penaliza |
| **MongoDB text index limits** | Baja | Alto | Ya funciona; estamos mejorando encima |
| **Breaking changes en API** | Baja | Alto | Response shape idéntica; campos nuevos son opcionales |
| **Dead code persiste** | Baja | Bajo | Checklist de cleanup en v1 scope |

---

## 12. Success Metrics

- **Relevancia**: "memoria microSD 64GB" muestra productos de 64GB microSD en top 3
- **Performance**: Búsqueda completa <200ms (p95)
- **Cobertura**: 100% de productos activos con campos de búsqueda poblados
- **Autocomplete**: Sugerencias en <50ms
- **Fuzzy tolerance**: "Kingstom" → "Kingston" funciona
- **No regression**: API contract intacto, /buscar page funciona igual

---

## 13. Dependencies

- `fastest-levenshtein` (~2KB, zero dependencies) — para fuzzy matching
- MongoDB text index — ya existe
- No nuevas dependencias de infraestructura

---

## 14. Testing Strategy

- **Unit tests**: tokenizer, scorer, normalizer, synonym expansion
- **Integration tests**: search engine pipeline end-to-end
- **Performance tests**: benchmark con 50k productos simulados
- **Manual QA**: queries de prueba con resultados esperados documentados

```typescript
// test/search/scorer.test.ts
describe("Scorer", () => {
  it("ranks 64GB above 32GB for 'memoria microSD 64GB'", () => {
    const tokens = tokenize("memoria microsd 64gb");
    const scored = products.map(p => scoreProduct(p, tokens, "memoria microsd 64gb"));
    const sorted = scored.sort((a, b) => b.score - a.score);
    expect(sorted[0].product.capacity).toBe("64gb");
  });
});
```
