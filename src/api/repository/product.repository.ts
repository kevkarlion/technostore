import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import type { CreateProductDTO, UpdateProductDTO, ScrapedProductDTO } from "@/domain/dto/product.dto";
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
  totalPages: number;
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
      totalPages: Math.ceil(total / limit),
    };
  },

  async findFeatured(limit = 8): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({ 
        status: "active"
      })
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

  async deleteAll(): Promise<{ deletedCount: number }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteMany({});
    return { deletedCount: result.deletedCount };
  },

  async upsertByExternalId(data: ScrapedProductDTO): Promise<Product> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();

    // Build the update object - map scraped data to product fields
    const updateFields = {
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      stock: data.stock,
      sku: data.sku,
      imageUrls: data.imageUrls,
      categories: data.categories,
      attributes: data.attributes || [],
      externalId: data.externalId,
      supplier: data.supplier,
      lastSyncedAt: now,
      // Products from scraper are set to active for display
      status: "active" as const,
      updatedAt: now,
    };

    // Use findOneAndUpdate with upsert
    const doc = await collection.findOneAndUpdate(
      { externalId: data.externalId, supplier: data.supplier },
      { $set: updateFields, $setOnInsert: { createdAt: now } },
      { returnDocument: "after", upsert: true }
    );

    return productMapper.toDomain(doc as any);
  },

  async findByCategorySlug(
    categorySlug: string,
    limit = 20
  ): Promise<Product[]> {
    const db = await getDb();
    const productsCollection = db.collection(COLLECTION_NAME);
    const categoriesCollection = db.collection("categories");

    // Find category by slug to get its name and supplierCategoryId
    const category = await categoriesCollection.findOne({ slug: categorySlug });
    
    // Use both the category name (from DB) and the slug for matching
    // The scraper stores categories with proper case, so we need to match both
    const categoryName = category?.name || categorySlug;
    const supplierCategoryId = category?.supplierCategoryId?.toString();
    
    // Search using the category name, slug, AND supplierCategoryId (for products scraped with numeric ID)
    // Show all active products (stock will be displayed on the card)
    const docs = await productsCollection
      .find({ 
        status: "active",
        $or: [
          { categories: { $regex: new RegExp(`^${categoryName}$`, "i") } },
          { categories: { $regex: new RegExp(`^${categorySlug}$`, "i") } },
          ...(supplierCategoryId ? [{ categories: supplierCategoryId }] : []),
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  async findByCategorySlugPaginated(
    categorySlug: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<Product>> {
    const db = await getDb();
    const productsCollection = db.collection(COLLECTION_NAME);
    const categoriesCollection = db.collection("categories");

    // Find category by slug to get its name and supplierCategoryId
    const category = await categoriesCollection.findOne({ slug: categorySlug });
    
    const categoryName = category?.name || categorySlug;
    const supplierCategoryId = category?.supplierCategoryId?.toString();
    
    const skip = (page - 1) * limit;
    
    const filter = { 
      status: "active",
      $or: [
        { categories: { $regex: new RegExp(`^${categoryName}$`, "i") } },
        { categories: { $regex: new RegExp(`^${categorySlug}$`, "i") } },
        ...(supplierCategoryId ? [{ categories: supplierCategoryId }] : []),
      ]
    };

    const [docs, total] = await Promise.all([
      productsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      productsCollection.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => productMapper.toDomain(doc as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findBySlug(slug: string): Promise<Product | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Fetch all active products and find the one whose slug matches
    // This is needed because the slug is generated from the cleaned name
    const docs = await collection
      .find({ status: "active" })
      .toArray();

    // Generate slug from product name (same logic as toPresentationProduct)
    const generateSlug = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Also check with cleaned name (without price text)
    const cleanProductName = (name: string) =>
      name
        .replace(/U\$D\s*[\d,]+\+?\s*IVA.*$/i, "")
        .replace(/\$[\d,]+\.?\d*/g, "")
        .replace(/\+?\s*IVA.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

    const targetSlug = slug.toLowerCase();

    for (const doc of docs) {
      const fullSlug = generateSlug(doc.name);
      const cleanedSlug = generateSlug(cleanProductName(doc.name));

      if (fullSlug === targetSlug || cleanedSlug === targetSlug) {
        return productMapper.toDomain(doc as any);
      }
    }

    return null;
  },

  async search(query: string, limit = 20): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({
        status: "active",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },
};