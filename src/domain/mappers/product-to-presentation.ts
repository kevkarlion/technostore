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

  // Helper to convert image URLs - handle both local and remote paths
  const baseImageUrl = "https://jotakp.dyndns.org";
  const normalizeImageUrl = (url: string): string => {
    if (!url) return "";
    
    // If it's already a full URL (including Cloudinary), return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Don't convert Cloudinary URLs!
      if (url.includes("cloudinary.com")) {
        return url;
      }
      // For other external URLs, also keep as-is
      return url;
    }
    
    // If it's a local path from our server (/images/suppliers/...) use as-is for Next.js
    if (url.startsWith("/images/") || url.startsWith("images/suppliers/")) {
      return url.startsWith("/") ? url : `/${url}`;
    }
    
    // Handle relative paths from original site (imagenes/min/... or imagenes/...)
    // Convert to proper format: imagenes/000012509.PNG
    let convertedUrl = url;
    if (url.startsWith("imagenes/") || url.startsWith("/imagenes/")) {
      // Extract image ID and convert to proper URL format
      const numbers = url.match(/0+\d+/)?.[0];
      if (numbers) {
        convertedUrl = `${baseImageUrl}/imagenes/${numbers}.PNG`;
      } else {
        convertedUrl = `${baseImageUrl}/${url.replace(/^\//, "")}`;
      }
    } else {
      convertedUrl = `${baseImageUrl}/${url}`;
    }
    
    return convertedUrl;
  };

  // Helper to check if image URL is valid
  // Some products don't have images on the supplier site (known invalid IDs)
  const invalidImageIds = ['000014645', '000014626', '000012509', '000014112', '000015886'];
  
  const isValidImageUrl = (url: string): boolean => {
    // Skip external URLs that are known to be invalid
    if (url.includes("jotakp.dyndns.org")) {
      for (const invalidId of invalidImageIds) {
        if (url.includes(invalidId)) {
          return false;
        }
      }
    }
    return true;
  };

  // Filter valid images from the scraped URLs
  const validImageUrls = (dbProduct.imageUrls || []).filter(isValidImageUrl);

  // Convert imageUrls to the expected format, or use placeholder
  // Try to get image from scraped data, otherwise generate a dynamic placeholder
  const images = validImageUrls.length > 0
    ? validImageUrls.map((url, index) => ({
        id: `img-${index}`,
        src: normalizeImageUrl(url),
        alt: dbProduct.name,
      }))
    : [
        {
          id: "placeholder",
          // Use a local placeholder image - create a simple SVG or use external service
          src: "/images/placeholder-product.svg",
          alt: dbProduct.name,
        },
      ];

  // Determine stock status
  const inStock = dbProduct.stock > 0;

  // Convert attributes to specs object
  const specs: Record<string, string> = {};
  if (dbProduct.attributes && dbProduct.attributes.length > 0) {
    for (const attr of dbProduct.attributes) {
      specs[attr.key] = attr.value;
    }
  }

  // Default values for fields that aren't scraped
  return {
    id: dbProduct.id,
    slug,
    name: cleanProductName(dbProduct.name),
    category: mainCategory as DomainProduct["category"],
    brand: "General", // Could be extracted from product name in the future
    price: dbProduct.price,
    priceRaw: dbProduct.priceRaw, // Precio original USD
    originalPrice: undefined, // Not scraped
    inStock,
    stockQuantity: dbProduct.stock,
    rating: 4.5, // Default rating
    ratingCount: Math.floor(Math.random() * 50) + 10, // Random count for demo
    badges: [],
    shortDescription: dbProduct.description || `${cleanProductName(dbProduct.name)} - Available at TechnoStore`,
    specs, // Populated from scraped attributes
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
