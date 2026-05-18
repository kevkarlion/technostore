import type { Metadata } from "next";
import { FavoritesClient } from "./favorites-client";

export const metadata: Metadata = {
  title: "Mis favoritos - TechnoStore",
  description: "Revisa los productos que guardaste en tus favoritos.",
};

export default function FavoritesPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <FavoritesClient />
    </div>
  );
}