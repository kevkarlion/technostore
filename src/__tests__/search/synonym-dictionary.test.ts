import { describe, it, expect } from "vitest";
import { expand, hasSynonym, getOriginals } from "@/lib/search/synonym-dictionary";

describe("expand", () => {
  it("expands known synonym (microsd → related terms)", () => {
    const result = expand(["microsd"]);
    expect(result).toContain("microsd");
    expect(result).toContain("micro sd");
    expect(result).toContain("tarjeta sd");
  });

  it("expands reverse lookup (micro sd → related terms)", () => {
    const result = expand(["micro sd"]);
    expect(result).toContain("micro sd");
    expect(result).toContain("microsd");
    expect(result).toContain("tarjeta sd");
  });

  it("returns only the word for unknown tokens", () => {
    const result = expand(["xyznotaword"]);
    expect(result).toEqual(["xyznotaword"]);
  });

  it("expands multiple tokens in a single call", () => {
    const result = expand(["ssd", "ram"]);
    expect(result).toContain("ssd");
    expect(result).toContain("disco solido");
    expect(result).toContain("ram");
    expect(result).toContain("memoria");
  });

  it("deduplicates expanded terms", () => {
    const result = expand(["microsd", "micro sd"]);
    const microSdCount = result.filter((t) => t === "micro sd").length;
    expect(microSdCount).toBe(1);
  });
});

describe("hasSynonym", () => {
  it("returns true for known synonyms", () => {
    expect(hasSynonym("microsd")).toBe(true);
    expect(hasSynonym("ssd")).toBe(true);
    expect(hasSynonym("ram")).toBe(true);
    expect(hasSynonym("procesador")).toBe(true);
  });

  it("returns false for unknown words", () => {
    expect(hasSynonym("xyznotaword")).toBe(false);
    expect(hasSynonym("remera")).toBe(false);
  });
});

describe("getOriginals", () => {
  it("returns all configured synonym group keys", () => {
    const originals = getOriginals();
    expect(originals.length).toBeGreaterThanOrEqual(40);
    expect(originals).toContain("storage_ssd");
    expect(originals).toContain("memory_ram");
    expect(originals).toContain("gpu_generic");
    expect(originals).toContain("cpu_generic");
  });
});
