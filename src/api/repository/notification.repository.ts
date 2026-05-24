import { ObjectId } from "mongodb";
import { getDb } from "@/config/db";
import type { AdminNotification, NotificationType } from "@/domain/models/notification";

const COLLECTION = "notifications";

export const notificationRepository = {
  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    orderId: string;
    orderRef: string;
  }): Promise<void> {
    const db = await getDb();
    const insertData = {
      ...data,
      read: false,
      createdAt: new Date(),
    };
    console.log(`[NotifRepo] Inserting into "${COLLECTION}" collection:`, JSON.stringify(insertData));
    const result = await db.collection(COLLECTION).insertOne(insertData);
    console.log(`[NotifRepo] Insert result: acknowledged=${result.acknowledged}, id=${result.insertedId}`);
  },

  /** Get unread notifications, newest first */
  async getUnread(): Promise<AdminNotification[]> {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTION)
      .find({ read: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    console.log(`[NotifRepo] getUnread: found ${docs.length} docs`);
    if (docs.length > 0) {
      console.log(`[NotifRepo] First doc:`, JSON.stringify({ _id: docs[0]._id, type: docs[0].type, title: docs[0].title, read: docs[0].read, createdAt: docs[0].createdAt }));
    }

    return docs.map((doc) => ({
      _id: doc._id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      orderId: doc.orderId,
      orderRef: doc.orderRef,
      read: doc.read,
      createdAt: doc.createdAt,
    })) as AdminNotification[];
  },

  /** Mark a single notification as read */
  async markRead(id: string): Promise<void> {
    const db = await getDb();
    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );
  },

  /** Mark all notifications as read */
  async markAllRead(): Promise<void> {
    const db = await getDb();
    await db
      .collection(COLLECTION)
      .updateMany({ read: false }, { $set: { read: true } });
  },

  /** Delete notifications older than N days */
  async pruneOlderThan(days: number): Promise<number> {
    const db = await getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await db
      .collection(COLLECTION)
      .deleteMany({ createdAt: { $lt: cutoff } });

    return result.deletedCount;
  },
};
