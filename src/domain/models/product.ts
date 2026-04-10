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
  currency: string;
  stock: number;
  status: ProductStatus;
  categories: string[];
  imageUrls: string[];
  /** Product specifications/characteristics */
  attributes?: ProductAttribute[];
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

