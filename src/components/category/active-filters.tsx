"use client";

import { X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface ActiveFiltersProps {
  priceMin: number;
  priceMax: number;
  selectedBrands: string[];
  defaultPriceMin: number;
  defaultPriceMax: number;
  onPriceMinChange: (value: number) => void;
  onPriceMaxChange: (value: number) => void;
  onBrandToggle: (brand: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  priceMin,
  priceMax,
  selectedBrands,
  defaultPriceMin,
  defaultPriceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onBrandToggle,
  onClearAll,
}: ActiveFiltersProps) {
  const formatPrice = (value: number) => 
    new Intl.NumberFormat("es-AR", { 
      style: "currency", 
      currency: "ARS",
      maximumFractionDigits: 0 
    }).format(value);

  const hasPriceFilter = priceMin > defaultPriceMin || priceMax < defaultPriceMax;
  const hasBrandFilters = selectedBrands.length > 0;
  const hasFilters = hasPriceFilter || hasBrandFilters;

  if (!hasFilters) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 py-3"
    >
      {/* Price Chip */}
      {hasPriceFilter && (
        <div className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
          <span>
            {formatPrice(priceMin)} - {formatPrice(priceMax)}
          </span>
          <button
            onClick={() => {
              onPriceMinChange(defaultPriceMin);
              onPriceMaxChange(defaultPriceMax);
            }}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--accent)]/20"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Brand Chips */}
      {selectedBrands.map((brand) => (
        <div
          key={brand}
          className="flex items-center gap-1 rounded-full bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
        >
          <span>{brand}</span>
          <button
            onClick={() => onBrandToggle(brand)}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--surface-hover)]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Clear All */}
      <button
        onClick={onClearAll}
        className={clsx(
          "ml-2 flex items-center gap-1 text-xs font-medium transition-colors",
          "text-[var(--foreground-muted)] hover:text-rose-400"
        )}
      >
        <RotateCcw className="h-3 w-3" />
        Limpiar todo
      </button>
    </motion.div>
  );
}