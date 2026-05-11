import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Order {
  id: string;
  externalReference: string;
  totalAmount: number;
  status: "pending" | "reserved" | "captured" | "cancelled" | "failed";
  statusDetail?: string;
  paymentMethodId?: string;
  createdAt: number;
  customerEmail?: string;
  customerName?: string;
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  getOrder: (id: string) => Order | undefined;
  getOrdersByStatus: (status: Order["status"]) => Order[];
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      
      addOrder: (order) => {
        set((state) => ({
          orders: [...state.orders, order],
        }));
      },
      
      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id ? { ...order, ...updates } : order
          ),
        }));
      },
      
      getOrder: (id) => {
        return get().orders.find((order) => order.id === id);
      },
      
      getOrdersByStatus: (status) => {
        return get().orders.filter((order) => order.status === status);
      },
    }),
    {
      name: "technostore-orders",
    }
  )
);