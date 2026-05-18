"use client";

import Link from "next/link";
import { useFavoritesCount } from "@/features/favorites/store/favorites-store";
import { Heart } from "lucide-react";

export interface FavoritesLinkProps {
  className?: string;
  variant?: "full" | "icon";
}

export function FavoritesLink({ className, variant = "full" }: FavoritesLinkProps) {
  const count = useFavoritesCount();

  if (variant === "icon") {
    return (
      <Link href="/favoritos" className={`relative ${className || ''}`} aria-label="Favoritos">
        <Heart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/favoritos" className={`flex items-center gap-1.5 ${className || ''}`}>
      <Heart className="h-4 w-4" />
      Favoritos
      {count > 0 && (
        <span className="ml-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export default FavoritesLink;