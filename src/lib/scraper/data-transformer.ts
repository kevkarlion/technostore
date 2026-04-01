import { scrapedProductSchema, type ScrapedProductDTO } from "@/domain/dto/product.dto";
import type { RawProduct } from "./types";

/**
 * Parse price string to number
 * Handles formats like "$1,234.56", "1.234,56 €", "1234", etc.
 */
export function parsePrice(priceRaw: string): number {
  if (!priceRaw) return 0;

  // Remove currency symbols and whitespace
  let cleaned = priceRaw
    .replace(/[$€£¥₹]/g, "")
    .replace(/\s/g, "")
    .trim();

  // Handle European format (1.234,56) vs US format (1,234.56)
  // If there's a comma after the last dot, it's European format
  const lastDotIndex = cleaned.lastIndexOf(".");
  const lastCommaIndex = cleaned.lastIndexOf(",");

  if (lastCommaIndex > lastDotIndex) {
    // European format: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // US format: 1,234.56 -> remove commas
    cleaned = cleaned.replace(/,/g, "");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse stock string to number
 * Handles formats like "in stock", "5 available", "out of stock", etc.
 */
export function parseStock(stockRaw?: string): number {
  if (!stockRaw) return 0;

  const lower = stockRaw.toLowerCase();

  // Check for out of stock
  if (lower.includes("out of stock") || lower.includes("sin stock") || lower.includes("no disponible")) {
    return 0;
  }

  // Try to extract a number from the string
  const match = stockRaw.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  // If it says "in stock" or similar but no number, assume available
  if (lower.includes("in stock") || lower.includes("disponible") || lower.includes("available")) {
    return 1; // At least 1
  }

  return 0;
}

/**
 * Extract product ID from URL or element
 * This is a placeholder - actual implementation depends on the supplier's URL structure
 */
export function extractExternalId(productUrl: string, fallbackName: string): string {
  // Try to extract ID from URL patterns like /product/123 or ?id=123
  const urlMatch = productUrl.match(/\/(?:product|item|p)\/([a-zA-Z0-9-]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  const queryMatch = productUrl.match(/[?&](?:id|product|p)=([a-zA-Z0-9-]+)/);
  if (queryMatch) {
    return queryMatch[1];
  }

  // Fallback: use a slugified version of the name
  return fallbackName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Transform raw product data to ScrapedProductDTO
 * @param raw - Raw product data from the scraper
 * @param supplier - Supplier identifier
 * @returns Validated ScrapedProductDTO
 */
export function transformProduct(raw: RawProduct, supplier: string): ScrapedProductDTO {
  const price = parsePrice(raw.priceRaw);
  const stock = parseStock(raw.stockRaw);

  if (!raw.name || raw.name.trim().length === 0) {
    throw new Error("Product name is required");
  }

  if (price < 0) {
    throw new Error(`Invalid price: ${raw.priceRaw}`);
  }

  // Create the scraped product DTO
  const scrapedProduct = {
    externalId: raw.externalId,
    supplier,
    name: raw.name.trim(),
    description: raw.description?.trim(),
    price,
    currency: "USD", // Default - could be made configurable
    stock,
    sku: raw.sku,
    imageUrls: raw.imageUrls,
    categories: raw.categories,
    rawData: raw.rawElement ? { rawElement: "Available" } : undefined,
  };

  // Validate with Zod schema
  const validated = scrapedProductSchema.parse(scrapedProduct);

  return validated;
}

/**
 * Transform multiple raw products
 * @param rawProducts - Array of raw products
 * @param supplier - Supplier identifier
 * @returns Object with successfully transformed products and errors
 */
export function transformProducts(
  rawProducts: RawProduct[],
  supplier: string
): { products: ScrapedProductDTO[]; errors: string[] } {
  const products: ScrapedProductDTO[] = [];
  const errors: string[] = [];

  for (const raw of rawProducts) {
    try {
      const transformed = transformProduct(raw, supplier);
      products.push(transformed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Failed to transform product "${raw.name || raw.externalId}": ${errorMessage}`);
    }
  }

  return { products, errors };
}
