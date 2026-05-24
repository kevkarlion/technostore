"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Bell } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useNotificationStore } from "@/store/notification-store";
import type { NotificationItem } from "@/store/notification-store";

// ─── Polling hook ───────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // every 15 seconds

function useNotificationPoller() {
  const {
    setNotifications,
    addLatest,
    lastPollAt,
    setPolling,
    polling,
  } = useNotificationStore();

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;

      const data = await res.json();
      const items: NotificationItem[] = data.notifications.map(
        (n: Record<string, unknown>) => ({
          _id: String(n._id),
          title: String(n.title),
          message: String(n.message),
          orderId: String(n.orderId),
          createdAt: String(n.createdAt),
        })
      );

      // Determine what's new since last poll
      const now = Date.now();
      const prevPoll = useNotificationStore.getState().lastPollAt;

      if (prevPoll) {
        const fresh = items.filter(
          (n) => new Date(n.createdAt).getTime() > prevPoll
        );
        if (fresh.length > 0) {
          addLatest(fresh);
        }
      }

      setNotifications(items);
      useNotificationStore.setState({ lastPollAt: now });
    } catch {
      // Silently retry next interval
    }
  }, [setNotifications, addLatest]);

  // Start polling when mounted
  useEffect(() => {
    setPolling(true);

    // Immediate first poll
    poll();

    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      setPolling(false);
      clearInterval(interval);
    };
  }, [poll, setPolling]);
}

// ─── Popup component ────────────────────────────────────────────────────────

function NotificationPopupCard({
  notification,
  onDismiss,
  onClick,
}: {
  notification: NotificationItem;
  onDismiss: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/80 p-4 shadow-2xl backdrop-blur-sm cursor-pointer group"
      onClick={onClick}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
        <ShoppingCart className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-300">
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-emerald-400/80 truncate">
          {notification.message}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="shrink-0 rounded-lg p-1 text-emerald-400/60 opacity-0 transition hover:bg-emerald-800/50 hover:text-emerald-300 group-hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function AdminNotificationPopup() {
  useNotificationPoller();

  const { latest, clearLatest, markRead, unreadCount } = useNotificationStore();
  const setActiveSection = useAdminStore((s) => s.setActiveSection);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide popups after 8 seconds
  useEffect(() => {
    if (latest.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        clearLatest();
      }, 8000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [latest.length, clearLatest]);

  const handleDismiss = (id: string) => {
    markRead(id);
    // Also remove from latest
    useNotificationStore.setState({
      latest: latest.filter((n) => n._id !== id),
    });
  };

  const handleClick = (notification: NotificationItem) => {
    markRead(notification._id);
    clearLatest();
    setActiveSection("orders");
  };

  if (latest.length === 0) return null;

  return (
    <>
      {/* Bell icon with badge when there are unread notifications in background */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="relative">
            <Bell className="h-5 w-5 text-[var(--foreground-muted)]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          </div>
        </div>
      )}

      {/* Popup stack — top right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-32px)]">
        <AnimatePresence mode="popLayout">
          {latest.slice(0, 3).map((notification) => (
            <NotificationPopupCard
              key={notification._id}
              notification={notification}
              onDismiss={() => handleDismiss(notification._id)}
              onClick={() => handleClick(notification)}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
