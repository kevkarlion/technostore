import type { CreateProductDTO, UpdateProductDTO } from "@/domain/dto/product.dto";
import type { Product } from "@/domain/models/product";
import { productRepository } from "../repository/product.repository";
import { notFound } from "../errors/http-error";

export interface ListProductsInput {
  page?: number;
  limit?: number;
}

export const productService = {
  async listProducts(input: ListProductsInput) {
    return productRepository.findPaginated({
      page: input.page,
      limit: input.limit,
    });
  },

  async listFeaturedProducts(limit = 8): Promise<Product[]> {
    return productRepository.findFeatured(limit);
  },

  async getProductById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw notFound("Product not found");
    }
    return product;
  },

  async createProduct(dto: CreateProductDTO): Promise<Product> {
    // Aquí podrían ir reglas de negocio adicionales (ej. validar categorías)
    return productRepository.create(dto);
  },

  async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    const updated = await productRepository.update(id, dto);
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

