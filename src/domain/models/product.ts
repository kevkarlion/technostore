export type ProductStatus = "draft" | "active" | "inactive" | "discontinued";

/** Key-value pair for product attributes/specs */
export interface ProductAttribute {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceRaw?: string; // Precio original USD del proveedor (ej: "98,75")
  costPrice?: number; // Precio de costo en USD
  profitMargin?: number; // Margen de ganancia en % (0-100)
  currency: string;
  stock: number;
  /** Indica si el producto está disponible para compra */
  inStock: boolean;
  status: ProductStatus;
  categories: string[];
  imageUrls: string[];
  /** URLs de imágenes subidas a Cloudinary */
  cloudinaryUrls?: string[];
  /** Product specifications/characteristics */
  attributes?: ProductAttribute[];
  // Search fields
  brand?: string;
  productType?: string;
  capacity?: string;
  formFactor?: string;
  searchKeywords?: string;
  searchText?: string;
  // Scraper fields
  externalId?: string;
  supplier?: string;
  /** Última vez que se sincronizó (scrapeo) */
  lastSyncedAt?: Date;
  /** Última vez que se vio el producto en la web */
  lastSeenAt?: Date;
  /** Fecha cuando se marcó como descontinuado */
  discontinuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

