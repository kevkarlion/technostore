"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { 
  ShoppingCart, Heart, Star, Truck, 
  AlertTriangle, ArrowRight, Package, Check, Plus, Minus
} from "lucide-react";
import type { Product } from "@/types/domain";
import { useCartStore } from "@/features/cart/store/cart-store";
import { useFavoritesStore } from "@/features/favorites/store/favorites-store";
import { toast } from "sonner";
import { getExchangeRate, usdToArs, formatARS } from "@/lib/exchange-rate";

// ============================================================================
// CONFIGURATION
// ============================================================================

const BADGE_STYLES: Record<string, string> = {
  new: "bg-gradient-to-r from-[var(--accent)] to-[#00b89c] text-[var(--background)]",
  sale: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  hot: "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--background)]",
  featured: "bg-gradient-to-r from-[var(--accent-purple)] to-purple-600 text-white",
  bestseller: "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)] text-white",
  lowstock: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
};

const BADGE_LABELS: Record<string, string> = {
  new: "NUEVO",
  sale: "OFERTA",
  hot: "HOT SALE",
  featured: "DESTACADO",
  bestseller: "MÁS VENDIDO",
  lowstock: "ÚLTIMAS",
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const CARD_VARIANTS = {
  rest: { 
    y: 0, 
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)" 
  },
  hover: { 
    y: -6,
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 225, 186, 0.15)"
  }
};

const IMAGE_VARIANTS = {
  rest: { scale: 1 },
  hover: { scale: 1.08 }
};

const BUTTON_VARIANTS = {
  rest: { scale: 1 },
  hover: { 
    backgroundColor: "rgba(0, 201, 167, 1)",
    boxShadow: "0 0 24px rgba(0, 225, 186, 0.35)"
  },
  tap: { scale: 0.97 }
};

// ============================================================================
// TYPES
// ============================================================================

export interface ProductCardV2Props {
  product: Product;
  loading?: boolean;
  index?: number;
  className?: string;
  onAddToCart?: (productId: string, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
}

// ============================================================================
// SKELETON LOADER - coincide con PremiumProductCardV2
// ============================================================================

function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx(
      "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3",
      "overflow-hidden",
      className
    )}>
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white/[0.03]">
        {/* Badge placeholder */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          <div className="h-5 w-12 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        
        {/* Wishlist placeholder */}
        <div className="absolute right-2 top-2 z-10 h-9 w-9 animate-pulse rounded-full bg-white/[0.06]" />
        
        {/* Image skeleton */}
        <div className="h-full w-full animate-pulse bg-white/[0.03]" />
      </div>
      
      {/* Content */}
      <div className="mt-3 space-y-2">
        {/* Title */}
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        
        {/* Short description */}
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
        
        {/* Price */}
        <div className="h-6 w-24 animate-pulse rounded bg-white/[0.06]" />
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-12 animate-pulse rounded bg-white/[0.06]" />
        </div>
        
        {/* Add to cart button */}
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}

// ============================================================================
// IMAGE COMPONENT
// ============================================================================

interface ProductCardImageProps {
  product: Product;
  isImageLoaded: boolean;
  onLoad: () => void;
}

function ProductCardImage({ product, isImageLoaded, onLoad }: ProductCardImageProps) {
  const primaryImage = product.images?.[0];
  
  if (!primaryImage) {
    return (
      <div className="aspect-square flex items-center justify-center bg-white/[0.03] rounded-t-2xl">
        <Package className="h-12 w-12 text-[var(--foreground-muted)]" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={IMAGE_VARIANTS}
      className="relative aspect-square overflow-hidden rounded-t-2xl bg-white/[0.03]"
    >
      <Image
        src={String(primaryImage?.src || "")}
        alt={String(primaryImage?.alt || product.name)}
        fill
        className={clsx(
          "object-contain p-4 transition-opacity duration-300",
          isImageLoaded ? "opacity-100" : "opacity-0"
        )}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onLoad={onLoad}
      />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}

// ============================================================================
// BADGES COMPONENT
// ============================================================================

interface ProductCardBadgesProps {
  badges?: string[];
  discount?: number;
}

function ProductCardBadges({ badges, discount }: ProductCardBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <>
      {/* Corner Badges */}
      <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
        {badges.slice(0, 2).map((badge) => (
          <motion.span
            key={badge}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={clsx(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              BADGE_STYLES[badge] || BADGE_STYLES.featured
            )}
          >
            {BADGE_LABELS[badge] || badge}
          </motion.span>
        ))}
      </div>

      {/* Discount Badge */}
      {discount && discount > 0 && (
        <div className="absolute right-3 bottom-3 rounded-lg bg-[var(--accent)] px-2 py-1 text-xs font-bold text-[var(--background)] z-10">
          -{discount}%
        </div>
      )}
    </>
  );
}

// ============================================================================
// WISHLIST BUTTON COMPONENT
// ============================================================================

interface WishlistButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
}

function WishlistButton({ isFavorite, onToggle }: WishlistButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60 z-20"
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart 
        className={clsx(
          "h-4 w-4 transition-all duration-300",
          isFavorite 
            ? "fill-red-500 text-red-500 scale-110" 
            : "text-white hover:scale-110"
        )} 
      />
    </motion.button>
  );
}

// ============================================================================
// PRICE COMPONENT
// ============================================================================

interface ProductCardPriceProps {
  price: number;
  originalPrice?: number;
}

function ProductCardPrice({ price, originalPrice }: ProductCardPriceProps) {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    getExchangeRate().then((data) => setRate(data?.venta ?? null));
  }, []);

  // Convertir USD → ARS
  const arsPrice = rate && rate > 0 ? usdToArs(price, rate) : price;
  const arsOriginal =
    originalPrice && rate && rate > 0
      ? usdToArs(originalPrice, rate)
      : originalPrice;

  const hasDiscount = arsOriginal && arsOriginal > arsPrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - arsPrice / arsOriginal) * 100)
    : 0;

  return (
    <div className="space-y-1">
      {/* Main price in ARS */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          {formatARS(arsPrice)}
        </span>
        {hasDiscount && discountPercent > 0 && (
          <span className="rounded bg-[var(--accent)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Original price */}
      {hasDiscount && (
        <span className="text-sm text-[var(--foreground-muted)] line-through decoration-[var(--foreground-muted)]/50">
          {formatARS(arsOriginal!)}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// BENEFITS COMPONENT
// ============================================================================

interface ProductCardBenefitsProps {
  badges?: string[];
  inStock?: boolean;
  stockQuantity?: number;
}

function ProductCardBenefits({ 
  badges, 
  inStock = true,
  stockQuantity
}: ProductCardBenefitsProps) {
  // Auto-detect benefits from badges
  const showFreeShipping = badges?.includes("sale");
  
  if (!showFreeShipping) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {showFreeShipping && (
        <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
          <Truck className="h-3 w-3" />
          Envío gratis
        </span>
      )}
    </div>
  );
}

// ============================================================================
// CTA BUTTON COMPONENT
// ============================================================================

interface ProductCardCTAProps {
  onClick: () => void;
}

function ProductCardCTA({ onClick }: ProductCardCTAProps) {
  return (
    <motion.button
      whileTap="tap"
      whileHover="hover"
      variants={BUTTON_VARIANTS}
      onClick={onClick}
      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold uppercase tracking-wide text-[var(--background)] transition-all hover:shadow-[0_0_20px_rgba(0,225,186,0.3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
    >
      <ShoppingCart className="h-4 w-4" />
      <span>Agregar</span>
      <ArrowRight className="hidden h-4 w-4 transition-transform group-hover:translate-x-1 lg:inline-flex" />
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PremiumProductCardV2 - Nueva versión optimizada para conversión
 * 
 * Características:
 * - Diseño mobile-first con excellent touch targets
 * - Sistema de badges premium (corner + discount)
 * - Precio destacado con cuotas visibles
 * - CTAs optimizados para conversión
 * - Microinteracciones suaves con Framer Motion
 * - Wishlist button integrado
 * - Loading skeleton profesional
 */
export function PremiumProductCardV2({
  product,
  loading = false,
  index = 0,
  className,
  onAddToCart,
  onToggleWishlist
}: ProductCardV2Props) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Favorites store - estado reactivo
  const isFavorite = useFavoritesStore((state) => 
    state.items.some((item) => item.id === product.id)
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  
  const primaryImage = product.images?.[0];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice!) * 100) 
    : 0;

  // Loading state
  if (loading || !primaryImage) {
    return <ProductCardSkeleton className={className} />;
  }

  const addItem = useCartStore((state) => state.addItem);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    
const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.priceARS ?? product.price,
      imageUrl: product.images?.[0]?.src || "",
      stock: product.stockQuantity,
      inStock: product.inStock ?? true,
    };
    
    const result = addItem(product.id, quantity, cartProduct);
    
    if (result.success) {
      toast.success(`${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} agregada${quantity > 1 ? 's' : ''} al carrito`);
    } else {
      toast.error(result.message || "Error al agregar al carrito");
    }
    
    // Reset animation state after a delay
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const maxQty = product.stockQuantity || 99;
    if (newQuantity >= 1 && newQuantity <= maxQty) {
      setQuantity(newQuantity);
    }
  };

  const handleToggleWishlist = () => {
    const isNowFavorite = toggleFavorite(product);
    if (isNowFavorite) {
      toast.success("Agregado a favoritos");
    } else {
      toast("Eliminado de favoritos", { 
        duration: 2000,
        icon: "💔"
      });
    }
    onToggleWishlist?.(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      variants={CARD_VARIANTS}
      whileHover="hover"
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]",
        className
      )}
    >
      <Link href={`/productos/${product.slug}`} className="block">
        {/* Image Section */}
        <div className="relative">
          <ProductCardImage
            product={product}
            isImageLoaded={isImageLoaded}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          <ProductCardBadges 
            badges={product.badges} 
            discount={discountPercent}
          />
          
          <WishlistButton
            isFavorite={isFavorite}
            onToggle={handleToggleWishlist}
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-1 flex-col p-4">
          {/* Brand */}
          {product.brand && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {product.brand}
            </span>
          )}
          
          {/* Title */}
          <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-[var(--foreground)]">
            {product.name}
          </h3>
          
          {/* Rating */}
          {product.rating && product.rating > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={clsx(
                      "h-3 w-3",
                      i < Math.floor(product.rating) 
                        ? "fill-amber-400 text-amber-400" 
                        : "fill-gray-600 text-gray-600"
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] text-[var(--foreground-muted)]">
                ({product.ratingCount?.toLocaleString() || 0})
              </span>
            </div>
          )}
          
          {/* Price */}
          <div className="mt-3">
            <ProductCardPrice
              price={product.price}
              originalPrice={product.originalPrice}
            />
          </div>
          
          {/* Benefits */}
          <ProductCardBenefits
            badges={product.badges}
            inStock={product.inStock}
            stockQuantity={product.stockQuantity}
          />
        </div>
      </Link>
        
        {/* Quantity Controls + CTA - fuera del Link */}
        <div className="px-4 pb-4">
          <div className="mt-3 flex items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-[var(--foreground)]">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= (product.stockQuantity || 99)}
                className="flex h-10 w-10 items-center justify-center text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleAddToCart}
              className={clsx(
                "flex flex-1 h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all",
                isAdding 
                  ? "bg-emerald-500 text-white" 
                  : "bg-[var(--accent)] text-[var(--background)] hover:bg-[#00c9a7] hover:shadow-[0_0_20px_rgba(0,225,186,0.3)]"
              )}
            >
              {isAdding ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Agregado</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Agregar</span>
                </>
              )}
            </motion.div>
          </div>

          {/* Ver detalles */}
          <Link
            href={`/productos/${product.slug}`}
            className="mt-2 flex h-9 w-full items-center justify-center rounded-xl border border-[var(--border-subtle)] text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Ver detalles
          </Link>
        </div>
    </motion.div>
  );
}

export default PremiumProductCardV2;