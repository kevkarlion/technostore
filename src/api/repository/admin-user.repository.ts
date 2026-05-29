import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/config/db";
import type { AdminUser, AdminRole, AdminStatus } from "@/domain/models/admin-user";

const COLLECTION = "admin_users";
const SALT_ROUNDS = 10;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const adminUserRepository = {
  async findPaginated(
    params: ListAdminUsersParams
  ): Promise<PaginatedResult<AdminUser>> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: docs as unknown as AdminUser[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string): Promise<AdminUser | null> {
    const db = await getDb();
    const doc = await db
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    return doc as unknown as AdminUser | null;
  },

  async findByEmail(email: string): Promise<AdminUser | null> {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({ email });
    return doc as unknown as AdminUser | null;
  },

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: AdminRole;
  }): Promise<AdminUser> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const now = new Date();

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user: AdminUser = {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role ?? "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(user);
    const created = await collection.findOne({ email: data.email });
    return created as unknown as AdminUser;
  },

  async update(
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      role: AdminRole;
      status: AdminStatus;
      passwordHash: string;
    }>
  ): Promise<AdminUser | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const setFields: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    // Remove undefined values
    Object.keys(setFields).forEach(
      (key) => setFields[key] === undefined && delete setFields[key]
    );

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: setFields }
    );

    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .collection(COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  },

  async comparePassword(
    plainPassword: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  },

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },
};
