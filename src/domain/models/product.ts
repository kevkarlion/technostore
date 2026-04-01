export type ProductStatus = "draft" | "active" | "inactive";

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
  // Scraper fields
  externalId?: string;
  supplier?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

