export type ProductStatus = "draft" | "active" | "inactive";

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
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

