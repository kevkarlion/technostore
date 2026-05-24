import type { ObjectId } from "mongodb";

export type NotificationType = "new_order" | "order_confirmed" | "order_cancelled";

export interface AdminNotification {
  _id?: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  /** Order ID (MongoDB _id) so clicking redirects to order */
  orderId: string;
  /** External reference or orderId for display */
  orderRef: string;
  read: boolean;
  createdAt: Date;
}
