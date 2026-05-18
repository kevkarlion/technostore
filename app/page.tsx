import type { Product as CatalogProduct } from "@/types/domain";
import { productService } from "@/api/services/product.service";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { ScrollRevealSection } from "@/components/home/scroll-reveal-section";
import { HeroWrapper } from "@/components/home/hero-wrapper";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { PremiumFeaturedProducts } from "@/components/home/premium-featured-products";
import type { FeaturedProduct, FeaturedBadge } from "@/components/home/premium-featured-products";
import { TrustBadges } from "@/components/home/trust-badges";
import { ServiceDifferentials } from "@/components/home/service-differentials";
import { ContactLocation } from "@/components/home/contact-location";

// Assign badges dynamically based on position
const badgeSequence: FeaturedBadge[] = ["featured", "new", "sale", "hot", "featured", "new", "sale", "hot"];

function mapToFeaturedProducts(products: CatalogProduct[]): FeaturedProduct[] {
  return products.map((product, index) => ({
    ...product,
    featuredBadge: badgeSequence[index % badgeSequence.length],
  }));
}

export default async function Home() {
  // Fetch featured products from DB
  const featuredBackendProducts = await productService.listFeaturedProducts(8);
  const featuredProducts: CatalogProduct[] = featuredBackendProducts.map(
    toPresentationProduct
  );
  const featuredProductsWithBadges = mapToFeaturedProducts(featuredProducts);

  // Fetch categories from DB (used in CategoryShowcase)
  // (Categories are now displayed in HeroCarousel + CategoryShowcase)

  return (
    <div className="space-y-20 pb-4 px-4 sm:px-6 lg:px-8">
      {/* 1. Premium Hero - Compact version */}
      <section className="space-y-3">
        <h1 className="text-2xl font-bold md:text-3xl">
          <span className="text-[var(--foreground)]">Tu tienda de </span>
          <span className="text-[var(--accent)]">tecnología</span>
        </h1>
        <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--foreground-muted)]">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            Envíos a todo el país
          </span>
          <span className="h-1 w-1 rounded-full bg-[var(--foreground-muted)]"></span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Los mejores precios
          </span>
          <span className="h-1 w-1 rounded-full bg-[var(--foreground-muted)]"></span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Garantía oficial
          </span>
        </p>
      </section>

      {/* 1.5. Hero Carousel - Categories visual */}
      <ScrollRevealSection animation="fade-up" delay={0.05}>
        <HeroWrapper />
      </ScrollRevealSection>

      {/* 2. ScrollRevealSection + ServiceDifferentials */}
      <ScrollRevealSection animation="fade-up" delay={0.1}>
        <ServiceDifferentials />
      </ScrollRevealSection>

      {/* 3. ScrollRevealSection + CategoryShowcase */}
      <ScrollRevealSection animation="fade-up" delay={0.15}>
        <CategoryShowcase />
      </ScrollRevealSection>

      {/* 4. ScrollRevealSection + PremiumFeaturedProducts */}
      <ScrollRevealSection animation="fade-up" delay={0.2}>
        <PremiumFeaturedProducts
          products={featuredProductsWithBadges}
          title="Productos Destacados"
        />
      </ScrollRevealSection>

      {/* 5. ScrollRevealSection + TrustBadges */}
      <ScrollRevealSection animation="fade-up" delay={0.15}>
        <TrustBadges />
      </ScrollRevealSection>

      {/* 6. ScrollRevealSection + ContactLocation - Antes del footer */}
      <ScrollRevealSection animation="fade-up" delay={0.12}>
        <ContactLocation />
      </ScrollRevealSection>

      {/* 7. CTA Final - WhatsApp */}
      <ScrollRevealSection animation="fade-up" delay={0.08}>
        <div className="text-center">
          <a
            href="https://wa.me/541112345678"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold rounded-2xl bg-[var(--accent)] text-zinc-900 hover:opacity-90 transition-all shadow-xl shadow-[var(--accent)]/40"
          >
            Potencia tu setup
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </a>
        </div>
      </ScrollRevealSection>
    </div>
  );
}
