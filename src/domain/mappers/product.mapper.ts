import type { WithId } from "mongodb";
import type { Product } from "../models/product";
import type { ProductImage } from "@/types/domain";
import type { ProductResponseDTO } from "../dto/product.dto";

type ProductDocument = WithId<{
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  inStock: boolean; // Required field from database
  status: string;
  categories: string[];
  imageUrls: string[];
  cloudinaryUrls?: string[];
  slug?: string;
  brand?: string;
  originalPrice?: number;
  rating?: number;
  ratingCount?: number;
  badges?: string[];
  shortDescription?: string;
  specs?: Record<string, string | number>;
  attributes?: Array<{ key: string; value: string }>;
  externalId?: string;
  supplier?: string;
  costPrice?: number;
  profitMargin?: number;
  lastSyncedAt?: Date;
  productType?: string;
  capacity?: string;
  formFactor?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

/**
 * Convert imageUrls (string[]) to images (ProductImage[])
 * DB stores: string[], UI expects: ProductImage[]
 */
function convertToImages(imageUrls: string[] = []): ProductImage[] {
  return imageUrls.map((url, index) => ({
    id: `img-${index}`,
    src: url,
    alt: `Product image ${index + 1}`,
  }));
}

export const productMapper = {
  toDomain(doc: ProductDocument): Product {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      currency: doc.currency,
      stock: doc.stock,
      inStock: doc.inStock ?? false, // Use inStock field directly, default to false
      status: doc.status as Product["status"],
      categories: doc.categories,
      imageUrls: doc.imageUrls,
      cloudinaryUrls: doc.cloudinaryUrls,
      // Include all fields that UI expects
      slug: doc.slug || doc.externalId || "",
      brand: doc.brand || "",
      originalPrice: doc.originalPrice,
      rating: doc.rating || 0,
      ratingCount: doc.ratingCount || 0,
      badges: doc.badges,
      shortDescription: doc.shortDescription || doc.name,
      specs: doc.specs,
      attributes: doc.attributes,
      externalId: doc.externalId,
      supplier: doc.supplier,
      costPrice: doc.costPrice ?? undefined,
      profitMargin: doc.profitMargin ?? undefined,
      lastSyncedAt: doc.lastSyncedAt,
      productType: doc.productType,
      capacity: doc.capacity,
      formFactor: doc.formFactor,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  toResponse(product: Product, exchangeRate?: number): ProductResponseDTO {
    // Use scraped price directly if it exists (> 0), otherwise calculate from cost + margin
    let sellingPrice = product.price;
    
    // Only recalculate from costPrice + margin if price is 0/null/undefined
    // This preserves the scraped price (which already includes IVA) as the final price
    if ((!product.price || product.price === 0) && product.costPrice != null && product.costPrice > 0) {
      if (product.profitMargin != null) {
        sellingPrice = Math.round(product.costPrice * (1 + product.profitMargin / 100) * 100) / 100;
      } else {
        // No margin set: use costPrice as selling price (0% margin)
        sellingPrice = product.costPrice;
      }
    }

    // Convert price to ARS if exchangeRate is provided
    let priceInArs = sellingPrice;
    if (exchangeRate && exchangeRate > 0 && sellingPrice) {
      // If price appears to be in USD (less than 10000), convert to ARS
      if (sellingPrice < 10000) {
        priceInArs = Math.round(sellingPrice * exchangeRate * 100) / 100;
      }
    }

    // Resolve relative image URLs to full jotakp URLs
    const SUPPLIER_BASE = "https://jotakp.dyndns.org";
    const resolveUrls = (urls?: string[]): string[] =>
      (urls || []).map((url) =>
        url.startsWith("http") ? url : `${SUPPLIER_BASE}/${url.replace(/^\//, "")}`
      );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: priceInArs,
      currency: exchangeRate && exchangeRate > 0 ? "ARS" : product.currency,
      stock: product.stock,
      inStock: product.inStock,
      status: product.status,
      categories: product.categories,
      imageUrls: resolveUrls(product.imageUrls),
      cloudinaryUrls: resolveUrls(product.cloudinaryUrls),
      attributes: product.attributes,
      externalId: product.externalId,
      supplier: product.supplier,
      costPrice: product.costPrice,
      profitMargin: product.profitMargin,
      lastSyncedAt: product.lastSyncedAt?.toISOString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  },
};

