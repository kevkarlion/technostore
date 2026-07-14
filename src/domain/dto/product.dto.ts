import { z } from "zod";
import type { ProductStatus } from "../models/product";

// Base schema — used as update schema (all fields optional to avoid overwriting existing values)
const baseProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(), // Ignored on write — computed server-side from costPrice + profitMargin
  costPrice: z.number().nonnegative().optional(), // Required on create, optional on update
  profitMargin: z.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  inStock: z.boolean().optional(),
  status: z.custom<ProductStatus>().optional(),
  categories: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const createProductSchema = baseProductSchema.extend({
  name: z.string().min(3),
  costPrice: z.number().nonnegative(),
  profitMargin: z.number().nonnegative().default(0),
  currency: z.string().min(1).default("USD"),
  stock: z.number().int().nonnegative().default(0),
  inStock: z.boolean().default(false),
  status: z.custom<ProductStatus>().default("draft"),
  categories: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
});

// Update schema uses the base WITHOUT defaults to avoid overwriting existing fields
export const updateProductSchema = baseProductSchema;

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

// Schema for products scraped from supplier
export const scrapedProductSchema = z.object({
  externalId: z.string(),
  supplier: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  priceRaw: z.string().optional(), // Precio original USD del proveedor (ej: "98,75")
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
  costPrice: number;
  profitMargin: number;
  currency: string;
  stock: number;
  inStock: boolean;
  status: ProductStatus;
  categories: string[];
  imageUrls: string[];
  cloudinaryUrls?: string[];
  attributes?: Array<{ key: string; value: string }>;
  externalId?: string;
  supplier?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

