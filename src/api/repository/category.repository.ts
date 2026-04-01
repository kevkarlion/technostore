import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import type { Category } from "@/domain/models/category";

const COLLECTION_NAME = "categories";

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const docs = await collection.find().sort({ name: 1 }).toArray();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      parentId: doc.parentId,
      supplierId: doc.supplierId,
      supplierCategoryId: doc.supplierCategoryId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const doc = await collection.findOne({ slug });

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      parentId: doc.parentId,
      supplierId: doc.supplierId,
      supplierCategoryId: doc.supplierCategoryId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    supplierId?: string;
    supplierCategoryId?: number;
  }): Promise<Category> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();

    const result = await collection.insertOne({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await collection.findOne({ _id: result.insertedId });

    if (!inserted) {
      throw new Error("Failed to load inserted category");
    }

    return {
      id: inserted._id.toString(),
      name: inserted.name,
      slug: inserted.slug,
      description: inserted.description,
      parentId: inserted.parentId,
      supplierId: inserted.supplierId,
      supplierCategoryId: inserted.supplierCategoryId,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    };
  },

  async deleteAll(): Promise<{ deletedCount: number }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteMany({});
    return { deletedCount: result.deletedCount };
  },

  async upsertMany(
    categories: Array<{
      name: string;
      slug: string;
      description?: string;
      supplierId: string;
      supplierCategoryId: number;
    }>
  ): Promise<{ inserted: number; updated: number }> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    let inserted = 0;
    let updated = 0;

    for (const cat of categories) {
      const result = await collection.updateOne(
        { slug: cat.slug },
        {
          $set: {
            ...cat,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (result.upsertedId) {
        inserted++;
      } else {
        updated++;
      }
    }

    return { inserted, updated };
  },
};
