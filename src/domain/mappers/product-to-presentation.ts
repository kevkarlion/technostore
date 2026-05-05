import type { Product as DomainProduct } from "@/types/domain";
import type { Product as DbProduct } from "../models/product";

/**
 * Generates a URL-friendly slug from a product name.
 * Cleans the name first (removes price text) before generating the slug.
 */
export function generateProductSlug(name: string): string {
  // First clean the name (remove price text) using the exported function
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

  // Helper to check if image URL is valid
  // Some products don't have images on the supplier site (known invalid IDs)
  const invalidImageIds = ['000014645', '000014626'];
  
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
  
  // Use cloudinaryUrls first (uploaded images), then fallback to scraped imageUrls
  const dbCloudinaryUrls = dbProduct.cloudinaryUrls || [];
  
  // Check if cloudinaryUrls are actual Cloudinary URLs (not local paths)
  const hasValidCloudinaryUrls = dbCloudinaryUrls.length > 0 && 
    dbCloudinaryUrls.some(url => url.startsWith("http"));
  
  // Priority: valid cloudinaryUrls > imageUrls > placeholder
  let images;
  if (hasValidCloudinaryUrls) {
    // Use Cloudinary URLs
    images = dbCloudinaryUrls.map((url, index) => ({
      id: `img-${index}`,
      src: url,
      alt: dbProduct.name,
    }));
  } else if (validImageUrls.length > 0) {
    // Fallback to original imageUrls (will fail if jotakp is down)
    const baseImageUrl = "https://jotakp.dyndns.org";
    images = validImageUrls.map((url, index) => {
      // Normalize URL - add base if relative
      let src = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        src = `${baseImageUrl}/${url}`;
      }
      return {
        id: `img-${index}`,
        src,
        alt: dbProduct.name,
      };
    });
  } else {
    images = [
      {
        id: "placeholder",
        src: "/images/placeholder-product.svg",
        alt: dbProduct.name,
      },
    ];
  }

  // Use inStock field directly from database
  const inStock = dbProduct.inStock ?? false;

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
export function cleanProductName(name: string): string {
  // Remove patterns like "U$D XXX+ IVA..." or "U$D XXX+IVA..."
  return name
    .replace(/\([^)]*\)/g, "") // Remove parentheses content first
    .replace(/U\$D\s*[\d,]+\+?\s*IVA.*$/i, "")
    .replace(/\$[\d,]+\.?\d*/g, "") // Remove dollar amounts
    .replace(/\+?\s*IVA.*$/i, "")
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}
