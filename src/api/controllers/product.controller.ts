import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createProductSchema,
  updateProductSchema,
} from "@/domain/dto/product.dto";
import { productService } from "../services/product.service";
import { productMapper } from "@/domain/mappers/product.mapper";
import { badRequest } from "../errors/http-error";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const productController = {
  async list(req: NextRequest) {
    const url = new URL(req.url);
    const parsed = listQuerySchema.safeParse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    });
    if (!parsed.success) {
      throw badRequest("Invalid query params", parsed.error.flatten());
    }

    const result = await productService.listProducts(parsed.data);
    return {
      items: result.items.map((p) => productMapper.toResponse(p)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  },

  async create(req: NextRequest) {
    const json = await req.json();
    const parsed = createProductSchema.safeParse(json);
    if (!parsed.success) {
      throw badRequest("Invalid product data", parsed.error.flatten());
    }

    const created = await productService.createProduct(parsed.data);
    return productMapper.toResponse(created);
  },
};

