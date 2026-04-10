export type ProductBadge = "new" | "sale" | "featured";

export type CategorySlug =
  | "laptops"
  | "components"
  | "peripherals"
  | "monitors"
  | "networking";

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description?: string;
  featured?: boolean;
}

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  brand: string;
  price: number;
  priceRaw?: string; // Precio original USD del proveedor (ej: "98,75")
  originalPrice?: number;
  inStock: boolean;
  stockQuantity?: number;
  rating: number;
  ratingCount: number;
  badges?: ProductBadge[];
  shortDescription: string;
  specs: Record<string, string | number>;
  images: ProductImage[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

