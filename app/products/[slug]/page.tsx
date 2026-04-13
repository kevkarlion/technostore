import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct, generateProductSlug } from "@/domain/mappers/product-to-presentation";
import { ProductGallery } from "./product-gallery";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await productRepository.findFeatured(20);
  
  return products.map((p) => ({
    slug: generateProductSlug(p.name),
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.findBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }

  const presentationProduct = toPresentationProduct(product);

  return {
    title: presentationProduct.name,
    description: presentationProduct.shortDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await productRepository.findBySlug(slug);
  
  if (!product) return notFound();

  const presentationProduct = toPresentationProduct(product);

  return <ProductGallery product={presentationProduct} />;
}
