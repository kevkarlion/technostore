import { describe, it, expect } from "vitest";
import { normalizeText, normalizeForSearch } from "@/lib/search/normalizer";

describe("normalizeText", () => {
  it("trims whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("lowercases text", () => {
    expect(normalizeText("MEMORIA MICROSD")).toBe("memoria microsd");
  });

  it("strips accents via NFD normalization", () => {
    // NFD decomposes accented chars; combining marks in U+0300-U+036F are stripped
    expect(normalizeText("Memoria áéíóúñ")).toBe("memoria aeioun");
  });

  it("collapses multiple spaces into one", () => {
    expect(normalizeText("memoria   microsd   64gb")).toBe("memoria microsd 64gb");
  });

  it("normalizes en-dash and em-dash to hyphen", () => {
    expect(normalizeText("cable\u2013hdmi")).toBe("cable-hdmi");
    expect(normalizeText("cable\u2014hdmi")).toBe("cable-hdmi");
  });

  it("strips special characters but keeps alphanumeric, spaces, hyphens, and dots", () => {
    expect(normalizeText("Kingston 64GB! @#$%")).toBe("kingston 64gb");
  });

  it("preserves GB/TB/MB units in text", () => {
    expect(normalizeText("Memoria 64GB DDR4")).toBe("memoria 64gb ddr4");
  });

  it("returns empty string for falsy input", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText(null as unknown as string)).toBe("");
    expect(normalizeText(undefined as unknown as string)).toBe("");
  });

  it("handles typical product query", () => {
    expect(normalizeText("  Memoria MicroSD  64GB  ")).toBe("memoria microsd 64gb");
  });

  it("handles mixed case and accents", () => {
    // NFD decomposes accented vowels; combining marks in U+0300-U+036F are stripped
    expect(normalizeText("SAMSUNG ÁÉÍÓÚ")).toBe("samsung aeiou");
  });

  it("strips zero-width and non-breaking spaces", () => {
    // Non-breaking space (U+00A0) matches \s in JS, so \s+ collapse replaces it with a normal space
    expect(normalizeForSearch("memoria\u00A0microsd", false)).toBe("memoria microsd");
    // Zero-width space (U+200B) does NOT match \s, but is in the explicit strip regex
    expect(normalizeForSearch("memoria\u200Bmicrosd", false)).toBe("memoriamicrosd");
  });
});

describe("normalizeForSearch", () => {
  it("returns normalized text without synonym expansion by default", () => {
    expect(normalizeForSearch("Pendrive 32GB")).toBe("pendrive 32gb");
  });

  it("returns normalized text when expandSynonyms is false", () => {
    expect(normalizeForSearch("Pendrive 32GB", false)).toBe("pendrive 32gb");
  });

  it("expands synonyms when expandSynonyms is true", () => {
    const result = normalizeForSearch("pendrive", true);
    expect(result).toContain("pendrive");
    expect(result).toContain("memoria usb");
    expect(result).toContain("flash drive");
  });

  it("does not expand tokens without synonyms", () => {
    const result = normalizeForSearch("remera", true);
    expect(result).toBe("remera");
  });
});
