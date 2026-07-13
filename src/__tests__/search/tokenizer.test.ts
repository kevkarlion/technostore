import { describe, it, expect } from "vitest";
import { extractTokens } from "@/lib/search/tokenizer";
import { normalizeText } from "@/lib/search/normalizer";
import { expand } from "@/lib/search/synonym-dictionary";

describe("extractTokens", () => {
  describe("capacity extraction", () => {
    it("extracts 64gb capacity", () => {
      const tokens = extractTokens("memoria microsd 64gb");
      expect(tokens.capacity).toBe("64gb");
    });

    it("extracts 1tb capacity", () => {
      const tokens = extractTokens("ssd 1tb");
      expect(tokens.capacity).toBe("1tb");
    });

    it("extracts capacity with numeric part only", () => {
      const tokens = extractTokens("memoria ram 32gb ddr5");
      expect(tokens.capacity).toBe("32gb");
    });

    it("returns null when no capacity present", () => {
      const tokens = extractTokens("memoria microsd kingston");
      expect(tokens.capacity).toBeNull();
    });
  });

  describe("form factor extraction", () => {
    it("extracts m.2 form factor", () => {
      const tokens = extractTokens("ssd m.2 500gb");
      expect(tokens.formFactor).toBe("m.2");
    });

    it("extracts nvme form factor", () => {
      const tokens = extractTokens("ssd nvme 1tb");
      expect(tokens.formFactor).toBe("nvme");
    });

    it("extracts ddr4 form factor", () => {
      const tokens = extractTokens("memoria ram 16gb ddr4");
      expect(tokens.formFactor).toBe("ddr4");
    });

    it("extracts ddr5 form factor", () => {
      const tokens = extractTokens("memoria ram 32gb ddr5");
      expect(tokens.formFactor).toBe("ddr5");
    });
  });

  describe("product type extraction", () => {
    it("extracts microsd type from compound pattern", () => {
      const tokens = extractTokens("memoria microsd 64gb");
      expect(tokens.productType).toBe("microsd");
    });

    it("extracts pendrive type from compound pattern", () => {
      const tokens = extractTokens("pendrive 32gb");
      expect(tokens.productType).toBe("pendrive");
    });

    it("extracts ram type from compound pattern 'memoria ram'", () => {
      const tokens = extractTokens("memoria ram 16gb");
      expect(tokens.productType).toBe("ram");
    });

    it("extracts ssd type", () => {
      const tokens = extractTokens("ssd 500gb kingston");
      expect(tokens.productType).toBe("ssd");
    });

    it("extracts gpu type from compound pattern", () => {
      const tokens = extractTokens("placa de video nvidia");
      expect(tokens.productType).toBe("gpu");
    });

    it("extracts webcam type", () => {
      const tokens = extractTokens("camara web hd");
      expect(tokens.productType).toBe("webcam");
    });

    it("extracts monitor type from single pattern", () => {
      const tokens = extractTokens("monitor 24 pulgadas");
      expect(tokens.productType).toBe("monitor");
    });

    it("extracts teclado type", () => {
      const tokens = extractTokens("teclado mecanico");
      expect(tokens.productType).toBe("teclado");
    });

    it("extracts mouse type", () => {
      const tokens = extractTokens("mouse gamer");
      expect(tokens.productType).toBe("mouse");
    });

    it("extracts cpu type", () => {
      const tokens = extractTokens("procesador amd ryzen");
      expect(tokens.productType).toBe("cpu");
    });
  });

  describe("brand extraction", () => {
    it("extracts known brand kingston", () => {
      const tokens = extractTokens("memoria microsd 64gb kingston");
      expect(tokens.brand).toBe("kingston");
    });

    it("extracts known brand samsung", () => {
      const tokens = extractTokens("ssd samsung 500gb");
      expect(tokens.brand).toBe("samsung");
    });

    it("extracts known brand logitech", () => {
      const tokens = extractTokens("mouse logitech");
      expect(tokens.brand).toBe("logitech");
    });

    it("returns null for unknown brand", () => {
      const tokens = extractTokens("memoria ram 16gb");
      expect(tokens.brand).toBeNull();
    });
  });

  describe("model extraction", () => {
    it("extracts model from remaining unconsumed tokens", () => {
      // "memoria ram" is consumed as a pair by compound pattern
      // "fury" is the first unconsumed word → model
      const tokens = extractTokens("memoria ram 16gb kingston fury");
      expect(tokens.brand).toBe("kingston");
      expect(tokens.model).toBe("fury");
    });

    it("returns null when all tokens are consumed", () => {
      // "memoria microsd" consumed as pair, "64gb" as capacity, "kingston" as brand
      const tokens = extractTokens("memoria microsd 64gb kingston");
      expect(tokens.model).toBeNull();
    });
  });

  describe("compound pattern priority", () => {
    it("'memoria microsd' extracts as microsd, not ram", () => {
      const tokens = extractTokens("memoria microsd 64gb");
      expect(tokens.productType).toBe("microsd");
    });

    it("'memoria ram' extracts as ram, not just ram from 'memoria'", () => {
      const tokens = extractTokens("memoria ram 16gb");
      expect(tokens.productType).toBe("ram");
    });

    it("'placa de video' extracts as gpu", () => {
      const tokens = extractTokens("placa de video gigabyte");
      expect(tokens.productType).toBe("gpu");
    });
  });

  describe("raw and expandedRaw", () => {
    it("raw contains original normalized words", () => {
      const tokens = extractTokens("memoria microsd 64gb");
      expect(tokens.raw).toEqual(["memoria", "microsd", "64gb"]);
    });

    it("expandedRaw includes synonym expansions", () => {
      const tokens = extractTokens("pendrive 32gb");
      expect(tokens.expandedRaw).toContain("pendrive");
      expect(tokens.expandedRaw).toContain("memoria usb");
      expect(tokens.expandedRaw).toContain("flash drive");
    });
  });

  describe("full query tokenization", () => {
    it("tokenizes complex query correctly", () => {
      const tokens = extractTokens("memoria microsd 64gb kingston fury");
      expect(tokens.capacity).toBe("64gb");
      expect(tokens.productType).toBe("microsd");
      expect(tokens.brand).toBe("kingston");
      // "memoria microsd" consumed as pair by compound pattern, "fury" is unconsumed
      expect(tokens.model).toBe("fury");
    });

    it("handles empty query", () => {
      const tokens = extractTokens("");
      expect(tokens.capacity).toBeNull();
      expect(tokens.formFactor).toBeNull();
      expect(tokens.productType).toBeNull();
      expect(tokens.brand).toBeNull();
      expect(tokens.model).toBeNull();
      expect(tokens.raw).toEqual([]);
    });
  });

  describe("integration: full flow for 'Memoria Micro SD 64 Gb Clase 10'", () => {
    const raw = "Memoria Micro SD 64 Gb Clase 10";

    it("normalizeText produces the right string", () => {
      expect(normalizeText(raw)).toBe("memoria micro sd 64 gb clase 10");
    });

    it("extractTokens identifies capacity, productType, and model", () => {
      const normalized = normalizeText(raw);
      const tokens = extractTokens(normalized);

      expect(tokens.capacity).toBe("64gb");
      expect(tokens.productType).toBe("microsd");
      // "memoria" is consumed as part of compound pattern pair, "clase" and "10"
      // remain — first unconsumed word >= 2 chars is "clase"
      expect(tokens.model).not.toBe("memoria");
    });

    it("expand() includes multi-word synonyms from adjacent tokens", () => {
      const normalized = normalizeText(raw);
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const expanded = expand(tokens);

      // Multi-word synonym "micro sd" should be found via adjacent pair lookup
      expect(expanded).toContain("microsd");
      expect(expanded).toContain("tarjeta sd");
      expect(expanded).toContain("sd card");
      expect(expanded).toContain("micro sd");
    });
  });
});
