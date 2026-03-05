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
  createdAt: Date;
  updatedAt: Date;
}

