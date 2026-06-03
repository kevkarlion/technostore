import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = "force-dynamic";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct, generateProductSlug } from "@/domain/mappers/product-to-presentation";
import { PremiumGallery } from "@/components/ui/premium/premium-gallery";
import { PageTransition } from "@/components/ui/premium/page-transition";

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

  return (
    <PageTransition>
      <PremiumGallery product={presentationProduct} />
    </PageTransition>
  );
}
