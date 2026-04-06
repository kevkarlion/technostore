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
  imageUrls: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

// Schema for products scraped from supplier
export const scrapedProductSchema = z.object({
  externalId: z.string(),
  supplier: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().min(1).default("USD"),
  stock: z.number().int().nonnegative().default(0),
  sku: z.string().optional(),
  imageUrls: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  attributes: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional().default(() => []),
  rawData: z.record(z.string(), z.unknown()).optional(),
});

export type ScrapedProductDTO = z.infer<typeof scrapedProductSchema>;

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
  attributes?: Array<{ key: string; value: string }>;
  externalId?: string;
  supplier?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

