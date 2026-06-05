/**
 * HeroWrapper - Server Component optimizado para el Hero
 * 
 * Este componente envuelve el HeroCarousel y proporciona:
 * - Preloading de recursos críticos
 * - Optimización de LCP
 * - Meta tags para SEO
 * - Estructura semántica correcta
 * - Slots para contenido adicional
 */

import { Metadata } from "next";
import { HeroCarousel, HeroSlide } from "./hero-carousel";

export const metadata: Metadata = {
  title: "TechnoStore - Tu tienda de tecnología",
  description: "Encontrá las mejores laptops, componentes y periféricos gamer. Envíos a todo el país y garantía oficial.",
  openGraph: {
    title: "TechnoStore - Tu tienda de tecnología",
    description: "Encontrá las mejores laptops, componentes y periféricos gamer.",
    type: "website",
  },
};

// ============================================================================
// SLIDES DATA (Server-side, no se envía al cliente)
// ============================================================================

const heroSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Rendimiento Extremo",
    subtitle: "Componentes para armar tu PC",
    image: "/componentes-gamer.png",
    cta: { label: "Armá tu PC", href: "/arma-tu-pc" },
    badge: "TOP",
  },
  {
    id: "3",
    title: "Cada Frame Cuenta",
    subtitle: "144Hz+ para respuesta instantánea",
    image: "/monitores.png",
    cta: { label: "Ver monitores", href: "/categorias/monitores-tv" },
    badge: "NEW",
  },
  {
    id: "4",
    title: "Tu Trono Gamer",
    subtitle: "Ergonomía premium para sesiones maratón",
    image: "/sillas.png",
    cta: { label: "Ver sillas", href: "/categorias/silla-gamer" },
  },
];

// ============================================================================
// PROPS
// ============================================================================

interface HeroWrapperProps {
  /** Custom slides (override default) */
  slides?: HeroSlide[];
  /** Disable auto-play */
  autoPlayDisabled?: boolean;
  /** Custom className */
  className?: string;
  /** Show category badges */
  showBadges?: boolean;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function HeroWrapper({
  slides = heroSlides,
  autoPlayDisabled = false,
  className,
}: HeroWrapperProps) {
  return (
    <section 
      className={className}
      aria-label="Carrusel destacado"
    >
      {/* Preconnect a recursos críticos */}
      <link 
        rel="preconnect" 
        href="/" 
        crossOrigin="anonymous" 
      />
      
      {/* Preload de primera imagen del hero para LCP */}
      <link
        rel="preload"
        as="image"
        href={slides[0]?.image}
        fetchPriority="high"
      />

      {/* Hero Carousel Client Component */}
      <HeroCarousel 
        slides={slides}
        autoPlay={!autoPlayDisabled}
        autoPlayInterval={5000}
      />
    </section>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { HeroWrapperProps };
export default HeroWrapper;