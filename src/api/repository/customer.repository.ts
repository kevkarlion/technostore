import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import type { Customer, CustomerOrderRef } from "@/domain/models/customer";

const COLLECTION = "customers";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const customerRepository = {
  async findPaginated(
    params: ListCustomersParams
  ): Promise<PaginatedResult<Customer>> {
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
        { lastName: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ lastOrderDate: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items: docs as unknown as Customer[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    detail?: string
  ): Promise<void> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    await collection.updateOne(
      { "orders.orderId": orderId },
      {
        $set: { "orders.$.status": status },
      }
    );
  },

  async findById(id: string): Promise<Customer | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    return doc as unknown as Customer | null;
  },

  async findByEmail(email: string): Promise<Customer | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const doc = await collection.findOne({ email });
    return doc as unknown as Customer | null;
  },

  async upsertFromOrder(data: {
    email: string;
    name: string;
    lastName: string;
    phone: string;
    address: string;
    street: string;
    number: string;
    floor?: string;
    apartment?: string;
    tower?: string;
    province: string;
    city: string;
    postalCode: string;
    additionalInstructions?: string;
    saveAddress: boolean;
    sameForBilling: boolean;
    orderRef: CustomerOrderRef;
  }): Promise<Customer> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    const now = new Date();

    const existing = await collection.findOne({ email: data.email });

    if (existing) {
      // Update existing customer
      const existingCustomer = existing as unknown as Customer;
      const newTotalOrders = existingCustomer.totalOrders + 1;
      const newTotalSpent = (existingCustomer.totalSpent ?? 0) + data.orderRef.total;

      await collection.updateOne(
        { email: data.email },
        {
          $set: {
            name: data.name,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address,
            street: data.street,
            number: data.number,
            floor: data.floor ?? null,
            apartment: data.apartment ?? null,
            tower: data.tower ?? null,
            province: data.province,
            city: data.city,
            postalCode: data.postalCode,
            additionalInstructions: data.additionalInstructions ?? null,
            saveAddress: data.saveAddress,
            sameForBilling: data.sameForBilling,
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
            lastOrderDate: data.orderRef.createdAt,
            status: "active" as const,
            updatedAt: now,
          },
          $push: {
            orders: data.orderRef,
          },
          $min: {
            firstOrderDate: existingCustomer.firstOrderDate ?? data.orderRef.createdAt,
          },
        }
      );

      const updated = await collection.findOne({ email: data.email });
      return updated as unknown as Customer;
    }

    // Create new customer
    const newCustomer = {
      email: data.email,
      name: data.name,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      street: data.street,
      number: data.number,
      floor: data.floor ?? null,
      apartment: data.apartment ?? null,
      tower: data.tower ?? null,
      province: data.province,
      city: data.city,
      postalCode: data.postalCode,
      additionalInstructions: data.additionalInstructions ?? null,
      saveAddress: data.saveAddress,
      sameForBilling: data.sameForBilling,
      totalOrders: 1,
      totalSpent: data.orderRef.total,
      firstOrderDate: data.orderRef.createdAt,
      lastOrderDate: data.orderRef.createdAt,
      orders: [data.orderRef],
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(newCustomer);
    const inserted = await collection.findOne({ email: data.email });
    return inserted as unknown as Customer;
  },
};
