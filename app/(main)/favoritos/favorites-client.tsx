"use client";

import { useFavoritesStore, useFavoritesItems } from "@/features/favorites/store/favorites-store";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";
import Link from "next/link";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/features/cart/store/cart-store";
import { toast } from "sonner";

export function FavoritesClient() {
  const favorites = useFavoritesItems();
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const clearAll = useFavoritesStore((state) => state.clearAll);
  const addItem = useCartStore((state) => state.addItem);

  const handleRemove = (productId: string, productName: string) => {
    removeFavorite(productId);
    toast(`${productName} eliminado de favoritos`, { duration: 2000 });
  };

  const handleClearAll = () => {
    clearAll();
    toast("Todos los favoritos eliminados", { duration: 2000 });
  };

  const handleAddToCart = (product: any) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      inStock: product.inStock ?? true,
    };
    
    const result = addItem(product.id, 1, cartProduct);
    
    if (result.success) {
      toast.success("Agregado al carrito");
    } else {
      toast.error(result.message || "Error al agregar al carrito");
    }
  };

  // Empty state
  if (favorites.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-[var(--surface)] flex items-center justify-center">
            <Heart className="w-12 h-12 text-[var(--foreground-muted)]" />
          </div>
          <div className="absolute inset-0 rounded-full bg-[var(--accent)]/10 animate-ping" />
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          No tenés favoritos aún
        </h2>
        
        <p className="text-[var(--foreground-muted)] text-center max-w-md mb-8">
          Cuando encontrés productos que te gusten, hacé clic en el corazón para guardarlos aquí.
        </p>
        
        <Link
          href="/buscar"
          className="group flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-all hover:bg-[#00c9a7] hover:shadow-lg hover:shadow-[var(--accent)]/25"
        >
          <span>Explorar productos</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
            Mis favoritos
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            {favorites.length} producto{favorites.length !== 1 ? 's' : ''} guardado{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--foreground-muted)] text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Vaciar favoritos</span>
        </button>
      </div>

      {/* Grid de productos */}
      <motion.div 
        layout
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {favorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <FavoriteCard
                favorite={favorite}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Card individual de favorito
function FavoriteCard({
  favorite,
  index,
}: {
  favorite: any;
  index: number;
}) {
  // Convertir el formato de favorito al formato de Product que espera la card
  const product = {
    id: favorite.id,
    name: favorite.name,
    slug: favorite.slug,
    price: favorite.price,
    originalPrice: favorite.originalPrice,
    images: favorite.imageUrl ? [{ src: favorite.imageUrl, alt: favorite.name }] : [],
    brand: favorite.brand,
    inStock: favorite.inStock,
  };

  return (
    <div className="relative group">
      <PremiumProductCardV2 product={product} index={index} />
    </div>
  );
}

export default FavoritesClient;