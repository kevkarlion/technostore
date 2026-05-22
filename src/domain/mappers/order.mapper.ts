import type { Order } from "@/domain/models/order";
import type { WithId, Document } from "mongodb";

export const orderMapper = {
  toDomain(doc: WithId<Document>): Order {
    return {
      _id: doc._id,
      orderId: doc.orderId,
      externalReference: doc.externalReference,
      status: doc.status,
      statusDetail: doc.statusDetail,
      items: doc.items,
      totals: doc.totals,
      customer: doc.customer,
      payment: doc.payment,
      timeline: doc.timeline ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
};
