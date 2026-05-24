"use client";

import { create } from "zustand";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  orderId: string;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  /** IDs of notifications that are new since last poll (shown as popup) */
  latest: NotificationItem[];
  polling: boolean;
  lastPollAt: number | null;

  setNotifications: (items: NotificationItem[]) => void;
  addLatest: (items: NotificationItem[]) => void;
  clearLatest: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setPolling: (polling: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  latest: [],
  polling: false,
  lastPollAt: null,

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount: items.length,
    }),

  addLatest: (items) => {
    const existing = get().latest;
    // Only add items not already in latest (avoid duplicates)
    const existingIds = new Set(existing.map((n) => n._id));
    const trulyNew = items.filter((n) => !existingIds.has(n._id));

    if (trulyNew.length > 0) {
      set({ latest: [...trulyNew, ...existing] });
    }
  },

  clearLatest: () => set({ latest: [] }),

  markRead: async (id) => {
    // Optimistic UI update
    const prev = get().notifications.filter((n) => n._id !== id);
    set({ notifications: prev, unreadCount: prev.length });

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Revert on failure
      set({ notifications: get().notifications, unreadCount: get().notifications.length });
    }
  },

  markAllRead: async () => {
    set({ notifications: [], unreadCount: 0 });

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // Revert
      const store = get();
      set({ notifications: store.notifications, unreadCount: store.notifications.length });
    }
  },

  setPolling: (polling) => set({ polling }),
}));
