import { categoryRepository } from "@/api/repository/category.repository";
import { SiteHeader } from "./site-header";
import type { Category } from "@/domain/models/category";

interface SiteHeaderServerProps {
  categories?: Category[];
}

// This component fetches categories on the server and passes them to the client SiteHeader
export async function SiteHeaderServer() {
  // Fetch categories on the server only
  const categories = await categoryRepository.findAll();
  
  return <SiteHeader categories={categories} />;
}
