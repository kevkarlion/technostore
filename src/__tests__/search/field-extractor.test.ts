import { describe, it, expect } from "vitest";
import { extractFields } from "@/lib/search/field-extractor";

describe("extractFields", () => {
  it("extracts split capacity pairs like '64' + 'Gb'", () => {
    const result = extractFields(
      "Memoria Micro SD 64 Gb Clase 10 Kingston 100 MB/s (SDCS3/64GB) Canvas Select Plus"
    );
    expect(result.capacity).toBe("64gb");
  });

  it("extracts brand as Kingston", () => {
    const result = extractFields(
      "Memoria Micro SD 64 Gb Clase 10 Kingston 100 MB/s (SDCS3/64GB) Canvas Select Plus"
    );
    expect(result.brand).toBe("kingston");
  });

  it("extracts productType as microsd for 'Memoria Micro SD'", () => {
    const result = extractFields(
      "Memoria Micro SD 64 Gb Clase 10 Kingston 100 MB/s (SDCS3/64GB) Canvas Select Plus"
    );
    expect(result.productType).toBe("microsd");
  });

  it("returns null formFactor for SD cards", () => {
    const result = extractFields(
      "Memoria Micro SD 64 Gb Clase 10 Kingston 100 MB/s (SDCS3/64GB) Canvas Select Plus"
    );
    expect(result.formFactor).toBeNull();
  });

  it("model is NOT 'memoria' for SD card products", () => {
    const result = extractFields(
      "Memoria Micro SD 64 Gb Clase 10 Kingston 100 MB/s (SDCS3/64GB) Canvas Select Plus"
    );
    expect(result.model).not.toBe("memoria");
  });

  it("full extraction for the known failing case", () => {
    const result = extractFields(
      "Memoria Micro SD 64 Gb Clase 10 Kingston 100 MB/s (SDCS3/64GB) Canvas Select Plus"
    );
    expect(result).toEqual({
      brand: "kingston",
      productType: "microsd",
      capacity: "64gb",
      formFactor: null,
      model: "canvas select plus",
    });
  });

  it("handles already-merged capacity like '64gb'", () => {
    const result = extractFields("Memoria Micro SD 64gb Kingston");
    expect(result.capacity).toBe("64gb");
  });

  it("handles TB split pairs", () => {
    const result = extractFields("Disco Solido 2 Tb Samsung");
    expect(result.capacity).toBe("2tb");
    expect(result.productType).toBe("ssd");
  });

  it("extracts pendrive type", () => {
    const result = extractFields("Memoria USB 32 Gb Kingston");
    expect(result.productType).toBe("pendrive");
    expect(result.capacity).toBe("32gb");
  });

  it("extracts SSD type", () => {
    const result = extractFields("Disco Solido 500 Gb Crucial");
    expect(result.productType).toBe("ssd");
    expect(result.capacity).toBe("500gb");
  });

  it("extracts RAM from 'Memoria Ram'", () => {
    const result = extractFields("Memoria Ram DDR4 8Gb Kingston");
    expect(result.productType).toBe("ram");
    expect(result.capacity).toBe("8gb");
    expect(result.formFactor).toBe("ddr4");
  });
});
