"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, SlidersHorizontal, Check } from "lucide-react";
import { clsx } from "clsx";

interface BrandCount {
  brand: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface ProductFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  brands: BrandCount[];
  priceRange: PriceRange;
  selectedPriceMin: number;
  selectedPriceMax: number;
  selectedBrands: string[];
  onPriceMinChange: (value: number) => void;
  onPriceMaxChange: (value: number) => void;
  onBrandToggle: (brand: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function ProductFilters({
  isOpen,
  onClose,
  brands,
  priceRange,
  selectedPriceMin,
  selectedPriceMax,
  selectedBrands,
  onPriceMinChange,
  onPriceMaxChange,
  onBrandToggle,
  onClearFilters,
  hasFilters,
}: ProductFiltersProps) {
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [brandsExpanded, setBrandsExpanded] = useState(true);

  const formatPrice = (value: number) => 
    new Intl.NumberFormat("es-AR", { 
      style: "currency", 
      currency: "ARS",
      maximumFractionDigits: 0 
    }).format(value);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Mobile Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl bg-[var(--surface)] shadow-2xl lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Filtros</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background)] text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-5 pb-32 pt-4" style={{ maxHeight: "calc(85vh - 140px)" }}>
              {/* Price Filter */}
              <div className="mb-6">
                <button
                  onClick={() => setPriceExpanded(!priceExpanded)}
                  className="flex w-full items-center justify-between py-2"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
                    Precio
                  </h3>
                  {priceExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
                  )}
                </button>

                {priceExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-4 pt-2"
                  >
                    {/* Range Display */}
                    <div className="flex items-center justify-center gap-3 rounded-xl bg-[var(--background)] py-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {formatPrice(selectedPriceMin)}
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)]">-</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {formatPrice(selectedPriceMax)}
                      </span>
                    </div>

                    {/* Slider */}
                    <div className="relative h-12 px-2">
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={selectedPriceMin}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val < selectedPriceMax) {
                            onPriceMinChange(val);
                          }
                        }}
                        className="absolute w-full cursor-pointer appearance-none bg-transparent [--thumb-size:20px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--border-subtle)]"
                      />
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={selectedPriceMax}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val > selectedPriceMin) {
                            onPriceMaxChange(val);
                          }
                        }}
                        className="absolute w-full cursor-pointer appearance-none bg-transparent [--thumb-size:20px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent"
                      />
                      {/* Track Background */}
                      <div 
                        className="absolute left-2 right-2 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--border-subtle)]"
                        style={{
                          left: `${((selectedPriceMin - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                          right: `${100 - ((selectedPriceMax - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`
                        }}
                      />
                    </div>

                    {/* Manual Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-[var(--foreground-muted)]">Mínimo</label>
                        <input
                          type="number"
                          value={selectedPriceMin}
                          onChange={(e) => onPriceMinChange(parseInt(e.target.value) || priceRange.min)}
                          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)] focus:outline-none"
                          placeholder="Min"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-[var(--foreground-muted)]">Máximo</label>
                        <input
                          type="number"
                          value={selectedPriceMax}
                          onChange={(e) => onPriceMaxChange(parseInt(e.target.value) || priceRange.max)}
                          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)] focus:outline-none"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Brands Filter */}
              <div className="mb-6">
                <button
                  onClick={() => setBrandsExpanded(!brandsExpanded)}
                  className="flex w-full items-center justify-between py-2"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
                    Marca
                  </h3>
                  {brandsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
                  )}
                </button>

                {brandsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-1 pt-2"
                  >
                    {brands.map((item) => (
                      <button
                        key={item.brand}
                        type="button"
                        onClick={() => onBrandToggle(item.brand)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--background)]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "flex h-5 w-5 items-center justify-center rounded border-2 transition-all",
                              selectedBrands.includes(item.brand)
                                ? "border-[var(--accent)] bg-[var(--accent)]"
                                : "border-[var(--border-subtle)]"
                            )}
                          >
                            {selectedBrands.includes(item.brand) && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>
                          <span className="text-sm text-[var(--foreground)]">{item.brand}</span>
                        </div>
                        <span className="text-xs text-[var(--foreground-muted)]">
                          ({item.count})
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right0 flex w-full gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-4 pb-6">
              {hasFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--background)] transition-transform active:scale-[0.98]"
              >
                Ver resultados
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}