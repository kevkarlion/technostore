import { z } from "zod";
import type { ProductStatus } from "../models/product";

export const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().min(1).default("USD"),
  stock: z.number().int().nonnegative().default(0),
  status: z.custom<ProductStatus>().default("draft"),
  categories: z.array(z.string()).default([]),
  imageUrls: z.array(z.string().url()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

export interface ProductResponseDTO {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  status: ProductStatus;
  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

