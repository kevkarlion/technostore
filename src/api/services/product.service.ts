import type { CreateProductDTO, UpdateProductDTO } from "@/domain/dto/product.dto";
import type { Product } from "@/domain/models/product";
import { productRepository } from "../repository/product.repository";
import { categoryRepository } from "../repository/category.repository";
import { notFound } from "../errors/http-error";

export interface ListProductsInput {
  page?: number;
  limit?: number;
  search?: string;
  allStatuses?: boolean;
  status?: string;
}

export const productService = {
  async listProducts(input: ListProductsInput) {
    return productRepository.findPaginated({
      page: input.page,
      limit: input.limit,
      search: input.search,
      allStatuses: input.allStatuses,
      status: input.status,
    });
  },

  async listFeaturedProducts(limit = 8): Promise<Product[]> {
    return productRepository.findFeatured(limit);
  },

  async listFeaturedBySearchTerms(
    terms: string[],
    options: { perTerm?: number; maxTotal?: number } = {}
  ): Promise<Product[]> {
    return productRepository.findFeaturedBySearchTerms(terms, options);
  },

  async getProductById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw notFound("Product not found");
    }
    return product;
  },

  async createProduct(dto: CreateProductDTO): Promise<Product> {
    let productData = { ...dto };

    // Inherit profitMargin from category if not explicitly provided
    if (dto.profitMargin === undefined && dto.costPrice !== undefined && dto.categories && dto.categories.length > 0) {
      try {
        const category = await categoryRepository.findBySlug(dto.categories[0]);
        if (category?.defaultProfitMargin != null) {
          productData.profitMargin = category.defaultProfitMargin;
        }
      } catch (err) {
        console.warn("[ProductService] Could not resolve category margin:", err);
      }
    }

    if (dto.price !== undefined) {
      // Price explicitly provided — use as-is (manual override)
    } else if (dto.costPrice !== undefined && productData.profitMargin !== undefined) {
      // Calculate price from cost + margin
      productData.price = Math.round(dto.costPrice * (1 + productData.profitMargin / 100) * 100) / 100;
    } else if (dto.costPrice !== undefined && productData.profitMargin === undefined) {
      // Cost provided but no margin — use cost as price (0% margin)
      productData.price = dto.costPrice;
    }

    if ((dto.costPrice === undefined) !== (dto.profitMargin === undefined)) {
      console.warn(
        "[ProductService] costPrice and profitMargin should be provided together; partial data may produce unexpected results"
      );
    }

    return productRepository.create(productData);
  },

  async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    let updateData = { ...dto };

    if (dto.price !== undefined) {
      // Price explicitly provided — use as-is (manual override)
    } else if (dto.costPrice !== undefined && dto.profitMargin !== undefined) {
      // Both provided — calculate price
      updateData.price = Math.round(dto.costPrice * (1 + dto.profitMargin / 100) * 100) / 100;
    } else if (dto.profitMargin !== undefined && dto.costPrice === undefined) {
      // Only margin changed — use existing costPrice from DB
      const existing = await productRepository.findById(id);
      if (existing?.costPrice != null && existing.costPrice > 0) {
        updateData.price = Math.round(existing.costPrice * (1 + dto.profitMargin / 100) * 100) / 100;
      } else if (existing?.price != null && existing.price > 0) {
        // Fallback: si costPrice es null pero price existe, tratar price como costo
        updateData.costPrice = existing.price;
        updateData.price = Math.round(existing.price * (1 + dto.profitMargin / 100) * 100) / 100;
      }
    }

    if ((dto.costPrice === undefined) !== (dto.profitMargin === undefined)) {
      console.warn(
        "[ProductService] costPrice and profitMargin should be provided together; partial data may produce unexpected results"
      );
    }

    const updated = await productRepository.update(id, updateData);
    if (!updated) {
      throw notFound("Product not found");
    }
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    // Se podría comprobar si el producto está referenciado en pedidos, etc.
    await productRepository.delete(id);
  },
};

