import type { ObjectId } from "mongodb";

export interface CustomerOrderRef {
  orderId: string;
  total: number;
  status: string;
  createdAt: Date;
}

export interface Customer {
  _id?: ObjectId;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: Date | null;
  lastOrderDate: Date | null;
  orders: CustomerOrderRef[];
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
