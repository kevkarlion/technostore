import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import type { CreateProductDTO, UpdateProductDTO } from "@/domain/dto/product.dto";
import { productMapper } from "@/domain/mappers/product.mapper";
import type { Product } from "@/domain/models/product";

const COLLECTION_NAME = "products";

export interface ListProductsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const productRepository = {
  async findPaginated(
    params: ListProductsParams = {}
  ): Promise<PaginatedResult<Product>> {
    const db = await getDb();

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const collection = db.collection(COLLECTION_NAME);

    const [docs, total] = await Promise.all([
      collection
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      collection.countDocuments(),
    ]);

    return {
      items: docs.map((doc) => productMapper.toDomain(doc as any)),
      total,
      page,
      limit,
    };
  },

  async findFeatured(limit = 8): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  async create(data: CreateProductDTO): Promise<Product> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();

    const result = await collection.insertOne({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await collection.findOne({
      _id: result.insertedId,
    });

    if (!inserted) {
      throw new Error("Failed to load inserted product");
    }

    return productMapper.toDomain(inserted as any);
  },

  async findById(id: string): Promise<Product | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const doc = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!doc) return null;

    return productMapper.toDomain(doc as any);
  },

  async update(id: string, data: UpdateProductDTO): Promise<Product | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();

    const doc = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: now } },
      { returnDocument: "after" }
    );

    if (!doc) return null;

    return productMapper.toDomain(doc as any);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    await collection.deleteOne({
      _id: new ObjectId(id),
    });
  },
};