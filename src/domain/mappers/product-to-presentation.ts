import type { Product as DomainProduct } from "@/types/domain";
import type { Product as DbProduct } from "../models/product";

/**
 * Generates a URL-friendly slug from a product name.
 * Cleans the name first (removes price text) before generating the slug.
 */
export function generateProductSlug(name: string): string {
  // First clean the name (remove price text)
  const cleaned = cleanProductName(name);
  
  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Maps a database Product to the domain Product type expected by UI components.
 * This handles the transformation from the scraped product model to the presentation layer.
 */
export function toPresentationProduct(dbProduct: DbProduct): DomainProduct {
  // Generate slug from cleaned name (consistent with generateStaticParams)
  const slug = generateProductSlug(dbProduct.name);

  // Use the first category as the main category, or default to 'components'
  const mainCategory = dbProduct.categories?.[0] || "components";

  // Convert imageUrls to the expected format, or use placeholder
  // Try to get image from scraped data, otherwise generate a dynamic placeholder
  const images = (dbProduct.imageUrls && dbProduct.imageUrls.length > 0)
    ? dbProduct.imageUrls.map((url, index) => ({
        id: `img-${index}`,
        src: url,
        alt: dbProduct.name,
      }))
    : [
        {
          id: "placeholder",
          // Use a dynamic placeholder service that generates image from product name
          src: `https://placehold.co/600x400/1a1a2e/533483?text=${encodeURIComponent(cleanProductName(dbProduct.name).substring(0, 30))}`,
          alt: dbProduct.name,
        },
      ];

  // Determine stock status
  const inStock = dbProduct.stock > 0;

  // Default values for fields that aren't scraped
  return {
    id: dbProduct.id,
    slug,
    name: cleanProductName(dbProduct.name),
    category: mainCategory as DomainProduct["category"],
    brand: "General", // Could be extracted from product name in the future
    price: dbProduct.price,
    originalPrice: undefined, // Not scraped
    inStock,
    stockQuantity: dbProduct.stock,
    rating: 4.5, // Default rating
    ratingCount: Math.floor(Math.random() * 50) + 10, // Random count for demo
    badges: [],
    shortDescription: dbProduct.description || `${cleanProductName(dbProduct.name)} - Available at TechnoStore`,
    specs: {}, // Could be populated from scraped data in the future
    images,
  };
}

/**
 * Cleans product name by removing price text that gets scraped along with the name.
 * Examples: "Kingston Fury 16GB U$D 50+ IVA 21%" -> "Kingston Fury 16GB"
 */
function cleanProductName(name: string): string {
  // Remove patterns like "U$D XXX+ IVA..." or "U$D XXX+IVA..."
  return name
    .replace(/U\$D\s*[\d,]+\+?\s*IVA.*$/i, "")
    .replace(/\$[\d,]+\.?\d*/g, "") // Remove dollar amounts
    .replace(/\+?\s*IVA.*$/i, "")
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}
