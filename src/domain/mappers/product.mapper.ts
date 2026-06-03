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
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  toResponse(product: Product, exchangeRate?: number): ProductResponseDTO {
    // Convert price to ARS if exchangeRate is provided
    let priceInArs = product.price;
    if (exchangeRate && exchangeRate > 0 && product.price) {
      // If price appears to be in USD (less than 10000), convert to ARS
      if (product.price < 10000) {
        priceInArs = Math.round(product.price * exchangeRate * 100) / 100;
      }
    }
    
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
      imageUrls: product.imageUrls,
      cloudinaryUrls: product.cloudinaryUrls,
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

