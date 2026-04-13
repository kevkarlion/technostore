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
        .find({ status: "active" })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray(),
      collection.countDocuments({ status: "active" }),
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

  /**
   * Atomic upsert - solo actualiza campos que cambiaron
   * Similar a Git: solo hace commit si hay cambios reales
   */
  async atomicUpsertByExternalId(data: ScrapedProductDTO): Promise<{
    product: Product;
    created: boolean;
    updated: boolean;
    changes: string[];
  }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();
    const changes: string[] = [];

    // 1. Verificar si el producto existe
    const existing = await collection.findOne({
      externalId: data.externalId,
      supplier: data.supplier,
    });

    if (!existing) {
      // Producto nuevo - crear
      const result = await collection.insertOne({
        ...data,
        lastSyncedAt: now,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      const inserted = await collection.findOne({ _id: result.insertedId });
      return {
        product: productMapper.toDomain(inserted as any),
        created: true,
        updated: false,
        changes: ["CREATE"],
      };
    }

    // 2. Producto existente - comparar campos y solo actualizar los que cambiaron
    const updateOperations: Record<string, any> = {
      lastSyncedAt: now,
      updatedAt: now,
    };

    // Comparar cada campo
    const fieldsToCompare = [
      { key: "name", newVal: data.name },
      { key: "description", newVal: data.description },
      { key: "price", newVal: data.price },
      { key: "priceRaw", newVal: data.priceRaw },
      { key: "currency", newVal: data.currency },
      { key: "stock", newVal: data.stock },
      { key: "sku", newVal: data.sku },
      { key: "categories", newVal: data.categories },
      { key: "attributes", newVal: data.attributes || [] },
    ];

    for (const field of fieldsToCompare) {
      const existingVal = (existing as any)[field.key];
      const newVal = field.newVal;

      // Para priceRaw: siempre actualizar si viene en el nuevo data
      let hasChanged: boolean;
      if (field.key === 'priceRaw') {
        hasChanged = newVal !== undefined;
        console.log(`[Repo] priceRaw: existing=${existingVal}, new=${newVal}, hasChanged=${hasChanged}, willUpdate=${hasChanged ? newVal : 'skip'}`);
      } else {
        hasChanged = JSON.stringify(existingVal) !== JSON.stringify(newVal);
      }

      if (hasChanged) {
        updateOperations[field.key] = newVal;
        changes.push(field.key);
      }
    }

    // 3. Imágenes - lógica especial
    // Solo actualizar si vinieron nuevas Y son válidas
    const existingImages = existing.imageUrls || [];
    const newImages = data.imageUrls || [];

    // Si hay nuevas imágenes distintas a las existentes, actualizar
    const imagesChanged = newImages.length > 0 &&
      JSON.stringify(existingImages) !== JSON.stringify(newImages);

    if (imagesChanged) {
      updateOperations.imageUrls = newImages;
      changes.push("imageUrls");
    } else if (newImages.length === 0 && existingImages.length > 0) {
      // No vinieron imágenes pero ya existían - NO sobreescribir (preservar)
      console.log(`[Repo] Preservando imágenes existentes para ${data.externalId}`);
    }

    // 4. Si hay cambios, actualizar
    if (changes.length > 0) {
      await collection.updateOne(
        { _id: existing._id },
        { $set: updateOperations }
      );
    }

    // 5. Siempre marcar como "seen" (activo)
    await collection.updateOne(
      { _id: existing._id },
      { $set: { status: "active", lastSeenAt: now } }
    );

    const updated = await collection.findOne({ _id: existing._id });

    return {
      product: productMapper.toDomain(updated as any),
      created: false,
      updated: changes.length > 0,
      changes,
    };
  },

  /**
   * Marcar productos como descontinuados
   * Llama después del scrapeo para marcar los que no aparecen
   */
  async markDiscontinued(supplier: string, externalIds: string[]): Promise<number> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.updateMany(
      {
        supplier,
        externalId: { $nin: externalIds },
        status: "active",
      },
      {
        $set: {
          status: "discontinued",
          discontinuedAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  },

  /**
   * Obtener productos no vistos en el último scrapeo
   */
  async findUnseen(supplier: string, lastSync: Date): Promise<Product[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection
      .find({
        supplier,
        lastSeenAt: { $lt: lastSync },
        status: "active",
      })
      .toArray();

    return docs.map((doc) => productMapper.toDomain(doc as any));
  },

  // Wrapper legacy para compatibilidad
  async upsertByExternalId(data: ScrapedProductDTO): Promise<Product> {
    const result = await this.atomicUpsertByExternalId(data);
    return result.product;
  },

  async findByCategorySlug(
    categorySlug: string,
    limit = 20
  ): Promise<Product[]> {
    const db = await getDb();
    const productsCollection = db.collection(COLLECTION_NAME);
    const categoriesCollection = db.collection("categories");

    // Find category by slug to get its name and supplierCategoryId
    // Direct search by category slug - ignore categories collection
    const docs = await productsCollection
      .find({ 
        categories: categorySlug
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
// Direct search by category slug
    const filter = { 
      categories: categorySlug
    };
    
    const skip = (page - 1) * limit;

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

    // Find by matching slug generation (no fallback by externalId to avoid bugs)
    const docs = await collection
      .find({})
      .toArray();

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