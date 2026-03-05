import type { WithId } from "mongodb";
import type { Product } from "../models/product";
import type { ProductResponseDTO } from "../dto/product.dto";

type ProductDocument = WithId<{
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  status: string;
  categories: string[];
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}>;

export const productMapper = {
  toDomain(doc: ProductDocument): Product {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      price: doc.price,
      currency: doc.currency,
      stock: doc.stock,
      status: doc.status as Product["status"],
      categories: doc.categories,
      imageUrls: doc.imageUrls,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  toResponse(product: Product): ProductResponseDTO {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      status: product.status,
      categories: product.categories,
      imageUrls: product.imageUrls,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  },
};

