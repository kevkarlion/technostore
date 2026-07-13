import { describe, it, expect } from "vitest";
import { scoreProduct, scoreAndSort } from "@/lib/search/scorer";
import type { Product } from "@/domain/models/product";
import type { TokenizedQuery } from "@/lib/search/types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "507f1f77bcf86cd799439011",
    name: "Memoria MicroSD 64GB Kingston",
    price: 15.99,
    currency: "USD",
    stock: 10,
    inStock: true,
    status: "active",
    categories: ["almacenamiento"],
    imageUrls: [],
    brand: "kingston",
    productType: "microsd",
    capacity: "64gb",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function makeTokens(overrides: Partial<TokenizedQuery> = {}): TokenizedQuery {
  return {
    capacity: null,
    formFactor: null,
    productType: null,
    brand: null,
    model: null,
    raw: [],
    expandedRaw: [],
    categoryHint: null,
    ...overrides,
  };
}

describe("scoreProduct", () => {
  describe("exact name match", () => {
    it("awards +100 for exact name match", () => {
      const product = makeProduct();
      const tokens = makeTokens();
      const score = scoreProduct(product, tokens, "Memoria MicroSD 64GB Kingston");
      expect(score).toBeGreaterThanOrEqual(100);
    });

    it("awards partial score for name containing query", () => {
      const product = makeProduct();
      const tokens = makeTokens();
      const score = scoreProduct(product, tokens, "Memoria MicroSD");
      expect(score).toBeGreaterThan(0);
      // Name contains query → 0.8*100=80 partial + multi-word bonus (2+ words) = 120+
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });

  describe("type match", () => {
    it("awards +50 for matching productType", () => {
      const product = makeProduct();
      const tokens = makeTokens({ productType: "microsd" });
      const scoreWithout = scoreProduct(product, makeTokens(), "microsd");
      const scoreWith = scoreProduct(product, tokens, "microsd");
      expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(50);
    });

    it("applies -50 penalty for mismatched productType", () => {
      const product = makeProduct({ productType: "microsd" });
      const tokens = makeTokens({ productType: "ram" });
      const scoreWithout = scoreProduct(product, makeTokens(), "ram");
      const scoreWith = scoreProduct(product, tokens, "ram");
      expect(scoreWith).toBeLessThan(scoreWithout);
    });
  });

  describe("capacity match", () => {
    it("awards +60 for matching capacity", () => {
      const product = makeProduct({ capacity: "64gb" });
      const tokens = makeTokens({ capacity: "64gb" });
      const scoreWithout = scoreProduct(product, makeTokens(), "64gb");
      const scoreWith = scoreProduct(product, tokens, "64gb");
      expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(60);
    });

    it("applies -80 penalty for mismatched capacity", () => {
      const product = makeProduct({ capacity: "64gb" });
      const tokens = makeTokens({ capacity: "128gb" });
      const scoreWithout = scoreProduct(product, makeTokens(), "128gb");
      const scoreWith = scoreProduct(product, tokens, "128gb");
      expect(scoreWith).toBeLessThan(scoreWithout);
    });
  });

  describe("brand match", () => {
    it("awards +40 for matching brand", () => {
      const product = makeProduct({ brand: "kingston" });
      const tokens = makeTokens({ brand: "kingston" });
      const scoreWithout = scoreProduct(product, makeTokens(), "kingston");
      const scoreWith = scoreProduct(product, tokens, "kingston");
      expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(40);
    });

    it("awards partial brand score when brand contains token", () => {
      const product = makeProduct({ brand: "kingston technology" });
      const tokens = makeTokens({ brand: "kingston" });
      const scoreWithout = scoreProduct(product, makeTokens(), "kingston");
      const scoreWith = scoreProduct(product, tokens, "kingston");
      expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(20);
    });
  });

  describe("form factor match", () => {
    it("awards +50 for matching form factor", () => {
      const product = makeProduct({ formFactor: "ddr4" });
      const tokens = makeTokens({ formFactor: "ddr4" });
      const scoreWithout = scoreProduct(product, makeTokens(), "ddr4");
      const scoreWith = scoreProduct(product, tokens, "ddr4");
      expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(50);
    });
  });

  describe("category match", () => {
    it("awards +50 for matching category hint", () => {
      const product = makeProduct({ categories: ["almacenamiento"] });
      const tokens = makeTokens({ categoryHint: "almacenamiento" });
      const scoreWithout = scoreProduct(product, makeTokens(), "memoria");
      const scoreWith = scoreProduct(product, tokens, "memoria");
      expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(50);
    });
  });

  describe("multi-word bonus", () => {
    it("awards +40 when 2+ query words appear in name", () => {
      const product = makeProduct({ name: "Memoria MicroSD 64GB Kingston" });
      const tokens = makeTokens();
      const scoreShort = scoreProduct(product, tokens, "memoria");
      const scoreMulti = scoreProduct(product, tokens, "memoria microsd");
      expect(scoreMulti).toBeGreaterThan(scoreShort);
    });
  });

  describe("partial match", () => {
    it("awards partial bonus for token appearing in name", () => {
      const product = makeProduct({ name: "Memoria MicroSD 64GB Kingston" });
      const tokens = makeTokens();
      const score = scoreProduct(product, tokens, "kingston");
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("scoring order", () => {
    it("exact match scores higher than partial", () => {
      const product = makeProduct({ name: "Memoria MicroSD 64GB Kingston" });
      const tokens = makeTokens();
      const exactScore = scoreProduct(product, tokens, "Memoria MicroSD 64GB Kingston");
      const partialScore = scoreProduct(product, tokens, "Memoria MicroSD");
      expect(exactScore).toBeGreaterThan(partialScore);
    });
  });
});

describe("scoreAndSort", () => {
  it("sorts products by score descending", () => {
    const products = [
      makeProduct({ id: "1", name: "Memoria RAM 16GB", productType: "ram", capacity: "16gb" }),
      makeProduct({ id: "2", name: "Memoria MicroSD 64GB", productType: "microsd", capacity: "64gb" }),
      makeProduct({ id: "3", name: "SSD Kingston 500GB", productType: "ssd", capacity: "500gb" }),
    ];
    const tokens = makeTokens({ productType: "microsd", capacity: "64gb" });
    const scored = scoreAndSort(products, tokens, "memoria microsd 64gb");
    expect(scored[0].product.id).toBe("2");
  });

  it("applies tie-breakers: inStock first", () => {
    const products = [
      makeProduct({ id: "1", name: "Same Product", inStock: false }),
      makeProduct({ id: "2", name: "Same Product", inStock: true }),
    ];
    const tokens = makeTokens();
    const scored = scoreAndSort(products, tokens, "Same Product");
    expect(scored[0].product.inStock).toBe(true);
  });

  it("applies tie-breakers: lower price first", () => {
    const products = [
      makeProduct({ id: "1", name: "Same Product", inStock: true, price: 20 }),
      makeProduct({ id: "2", name: "Same Product", inStock: true, price: 10 }),
    ];
    const tokens = makeTokens();
    const scored = scoreAndSort(products, tokens, "Same Product");
    expect(scored[0].product.price).toBe(10);
  });

  it("filters by inStockOnly when option is set", () => {
    const products = [
      makeProduct({ id: "1", name: "Product A", inStock: true }),
      makeProduct({ id: "2", name: "Product B", inStock: false }),
    ];
    const tokens = makeTokens();
    const scored = scoreAndSort(products, tokens, "Product", { inStockOnly: true });
    expect(scored.every((s) => s.product.inStock)).toBe(true);
  });

  it("paginates results", () => {
    const products = Array.from({ length: 25 }, (_, i) =>
      makeProduct({ id: String(i), name: `Product ${i}` })
    );
    const tokens = makeTokens();
    const page1 = scoreAndSort(products, tokens, "Product", { page: 1, limit: 10 });
    const page2 = scoreAndSort(products, tokens, "Product", { page: 2, limit: 10 });
    expect(page1).toHaveLength(10);
    expect(page2).toHaveLength(10);
    expect(page1[0].product.id).not.toBe(page2[0].product.id);
  });
});
