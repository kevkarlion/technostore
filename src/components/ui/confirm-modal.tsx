"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when opened
  useEffect(() => {
    if (open) {
      // Small delay to let the modal mount before focusing
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/40 sm:p-6"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                variant === "danger"
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-[var(--accent)]/10 text-[var(--accent)]"
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="text-center text-lg font-semibold text-[var(--foreground)]">
              {title}
            </h3>

            {/* Message */}
            <p className="mt-2 text-center text-sm text-[var(--foreground-muted)]">
              {message}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={onCancel}
                className="order-2 w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-slate-800 sm:order-1"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className={`order-1 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition sm:order-2 ${
                  variant === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[var(--accent)] hover:brightness-110"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
