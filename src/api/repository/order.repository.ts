import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import { orderMapper } from "@/domain/mappers/order.mapper";
import type { Order, OrderStatus } from "@/domain/models/order";
import type { CreateOrderDTO, ListOrdersQueryDTO } from "@/domain/dto/order.dto";

const COLLECTION = "orders";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const orderRepository = {
  async findPaginated(
    params: ListOrdersQueryDTO
  ): Promise<PaginatedResult<Order>> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (params.status) {
      filter.status = params.status;
    }
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { "customer.name": { $regex: escaped, $options: "i" } },
        { "customer.lastName": { $regex: escaped, $options: "i" } },
        { "customer.email": { $regex: escaped, $options: "i" } },
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
      items: docs.map((doc) => orderMapper.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string): Promise<Order | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return orderMapper.toDomain(doc);
  },

  async findByExternalRef(ref: string): Promise<Order | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const doc = await collection.findOne({ externalReference: ref });
    if (!doc) return null;

    return orderMapper.toDomain(doc);
  },

  async findByPaymentId(paymentId: string): Promise<Order | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const doc = await collection.findOne({ "payment.paymentId": paymentId });
    if (!doc) return null;

    return orderMapper.toDomain(doc);
  },

  async create(data: CreateOrderDTO): Promise<Order> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const now = new Date();
    const doc = {
      ...data,
      timeline:
        data.timeline.length > 0
          ? data.timeline
          : [
              {
                status: data.status || "reserved",
                timestamp: now.toISOString(),
                detail: data.statusDetail || "Order created",
              },
            ],
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    const inserted = await collection.findOne({ _id: result.insertedId });

    return orderMapper.toDomain(inserted!);
  },

  async upsertByExternalRef(data: CreateOrderDTO): Promise<{
    order: Order;
    created: boolean;
  }> {
    const existing = await this.findByExternalRef(data.externalReference);
    if (existing) {
      return { order: existing, created: false };
    }

    const order = await this.create(data);
    return { order, created: true };
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    detail?: string
  ): Promise<Order | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION);

    const now = new Date();
    const timelineEntry = {
      status,
      timestamp: now.toISOString(),
      detail: detail || `Status changed to ${status}`,
    };

    const doc = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: { status, statusDetail: detail, updatedAt: now },
        $push: { timeline: timelineEntry },
      },
      { returnDocument: "after" }
    );

    if (!doc) return null;
    return orderMapper.toDomain(doc);
  },
};
