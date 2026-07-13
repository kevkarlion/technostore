import { describe, it, expect } from "vitest";
import { fuzzyMatch, enrichIfFew } from "@/lib/search/fuzzy-matcher";
import type { Product } from "@/domain/models/product";
import type { TokenizedQuery } from "@/lib/search/types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    name: "Test Product",
    slug: "test-product",
    description: "A test product",
    price: 1000,
    brand: "TestBrand",
    productType: "ssd",
    categories: ["almacenamiento"],
    inStock: true,
    stock: 10,
    status: "active",
    imageUrls: [],
    cloudinaryUrls: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Product;
}

function makeTokens(raw: string[]): TokenizedQuery {
  return {
    capacity: null,
    formFactor: null,
    productType: null,
    brand: null,
    model: null,
    raw,
    expandedRaw: raw,
    categoryHint: null,
  };
}

describe("fuzzyMatch", () => {
  it("returns true for exact match (distance 0)", () => {
    expect(fuzzyMatch("kingston", "kingston")).toBe(true);
  });

  it("returns true for 1-edit typo (Kingstom → Kingston)", () => {
    expect(fuzzyMatch("kingstom", "kingston")).toBe(true);
  });

  it("returns false for 2-edit typo on short word", () => {
    expect(fuzzyMatch("ab", "cd")).toBe(false);
  });

  it("returns true for 2-edit typo on longer word (5+ chars)", () => {
    expect(fuzzyMatch("kingstn", "kingston")).toBe(true);
  });

  it("returns false for completely different word", () => {
    expect(fuzzyMatch("mouse", "teclado")).toBe(false);
  });

  it("returns true when candidate starts with term", () => {
    expect(fuzzyMatch("king", "kingston")).toBe(true);
  });

  it("returns false when term is shorter than 3 chars", () => {
    expect(fuzzyMatch("ab", "abcdef")).toBe(false);
  });
});

describe("maxEditDistance (implicit via fuzzyMatch behavior)", () => {
  it("returns 0 for 1-2 char words (no match possible unless exact)", () => {
    expect(fuzzyMatch("ab", "ab")).toBe(true);
    expect(fuzzyMatch("ab", "ac")).toBe(false);
  });

  it("returns 1 for 3-4 char words", () => {
    expect(fuzzyMatch("king", "kings")).toBe(true);
    expect(fuzzyMatch("king", "kinx")).toBe(true);
    expect(fuzzyMatch("king", "kixgn")).toBe(false);
  });

  it("returns 2 for 5+ char words", () => {
    expect(fuzzyMatch("mouse", "moues")).toBe(true);
    expect(fuzzyMatch("mouse", "mozes")).toBe(false);
    expect(fuzzyMatch("mouse", "xyzab")).toBe(false);
  });
});

describe("enrichIfFew", () => {
  const tokens = makeTokens(["kingston"]);

  it("enriches when fewer than 5 results", () => {
    const scored = [
      { product: makeProduct({ id: "1", name: "Kingston SSD" }), score: 100 },
    ];
    const candidates = [
      makeProduct({ id: "1", name: "Kingston SSD" }),
      makeProduct({ id: "2", name: "Kingston RAM" }),
      makeProduct({ id: "3", name: "Kingston microsd" }),
    ];

    const result = enrichIfFew(scored, candidates, tokens);
    expect(result.length).toBeGreaterThan(1);
  });

  it("skips enrichment when 5+ results exist", () => {
    const scored = Array.from({ length: 5 }, (_, i) => ({
      product: makeProduct({ id: String(i), name: `Product ${i}` }),
      score: 100 - i,
    }));
    const candidates = [...scored.map((s) => s.product)];

    const result = enrichIfFew(scored, candidates, tokens);
    expect(result.length).toBe(5);
    expect(result.every((r) => r.matchType === "exact")).toBe(true);
  });

  it("adds fuzzy matches with type 'fuzzy'", () => {
    const scored = [
      { product: makeProduct({ id: "1", name: "Kingston SSD" }), score: 100 },
    ];
    const candidates = [
      makeProduct({ id: "1", name: "Kingston SSD" }),
      makeProduct({ id: "2", name: "Kingston RAM" }),
    ];

    const result = enrichIfFew(scored, candidates, tokens);
    const fuzzyItems = result.filter((r) => r.matchType === "fuzzy");
    expect(fuzzyItems.length).toBeGreaterThan(0);
  });
});
