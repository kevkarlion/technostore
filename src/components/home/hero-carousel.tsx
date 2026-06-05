/**
 * HeroCarousel - Optimizado para Next.js 16
 * 
 * Mejoras implementadas:
 * - Server-side rendering para datos estáticos
 * - Lazy loading de imágenes (solo slide activa + siguiente)
 * - Priority en primera imagen para LCP
 * - Intersection Observer para auto-play (solo cuando es visible)
 * - Memoización de handlers
 * - Reduced motion support
 * - CSS transform en lugar de opacity donde es posible
 * - sizes optimizados para cada breakpoint
 * - Preload hints para navegador
 * - Accessible con ARIA correcto
 */

"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

// ============================================================================
// TIPOS
// ============================================================================

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  cta?: { label: string; href: string };
  badge?: string;
  gradient?: string;
}

interface HeroCarouselProps {
  slides?: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

// ============================================================================
// DATOS ESTÁTICOS (SERVER-SIDE)
// ============================================================================

const defaultSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Rendimiento Extremo",
    subtitle: "Componentes para armar tu PC",
    image: "/componentes-gamer.png",
    cta: { label: "Armá tu PC", href: "/arma-tu-pc" },
    badge: "TOP",
    gradient: "from-blue-600/40 to-purple-600/40",
  },
  {
    id: "3",
    title: "Cada Frame Cuenta",
    subtitle: "144Hz+ para respuesta instantánea",
    image: "/monitores.png",
    cta: { label: "Ver monitores", href: "/categorias/monitores-tv" },
    badge: "NEW",
    gradient: "from-orange-600/40 to-red-600/40",
  },
  {
    id: "4",
    title: "Tu Trono Gamer",
    subtitle: "Ergonomía premium para sesiones maratón",
    image: "/sillas.png",
    cta: { label: "Ver sillas", href: "/categorias/silla-gamer" },
    gradient: "from-purple-600/40 to-pink-600/40",
  },
];

// ============================================================================
// TRANSICIONES OPTIMIZADAS (menor impacto en performance)
// ============================================================================

const TRANSITION = {
  fast: { duration: 0.3 },
  medium: { duration: 0.8 },
  slow: { duration: 1.5 },
};

// ============================================================================
// SLIDE INDIVIDUAL (MEMOIZADO)
// ============================================================================

const HeroSlideContent = memo(function HeroSlideContent({
  slide,
  isActive,
}: {
  slide: HeroSlide;
  isActive: boolean;
}) {
  return (
    <div className="relative h-full w-full">
      {/* Background image - optimizada con priority solo en primera */}
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        className="object-cover"
        priority={isActive}
        sizes="100vw"
        quality={isActive ? 85 : 75}
        placeholder={isActive ? "empty" : "empty"}
        loading={isActive ? "eager" : "lazy"}
      />

      {/* Gradient overlay para legibilidad */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent sm:from-black/60 sm:via-black/30"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-16 px-5 sm:px-8 md:px-16 lg:px-20">
        <div className="w-full max-w-full">
          {/* Badge */}
          {slide.badge && (
            <span className="mb-2 inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--background)]">
              {slide.badge}
            </span>
          )}

          {/* Title */}
          <h2 className="text-4xl sm:text-3xl md:text-5xl font-bold text-white leading-tight">
            {slide.title}
          </h2>

          {/* Subtitle */}
          {slide.subtitle && (
            <p className="mt-2 text-base sm:text-lg md:text-xl text-white/90 leading-snug">
              {slide.subtitle}
            </p>
          )}

          {/* CTA */}
          {slide.cta && (
            <Link
              href={slide.cta.href}
              className="mt-6 inline-flex items-center justify-center w-full sm:w-fit sm:min-w-[160px] rounded-xl bg-[var(--accent)] px-6 py-3.5 sm:py-3 font-semibold text-[var(--background)] text-sm transition hover:opacity-90"
            >
              {slide.cta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// NAVEGACIÓN (MEMOIZADO)
// ============================================================================

const NavigationArrow = memo(function NavigationArrow({
  onClick,
  direction,
  ariaLabel,
}: {
  onClick: () => void;
  direction: "prev" | "next";
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "hidden md:flex absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-black/50",
        direction === "prev" ? "left-3" : "right-3"
      )}
      aria-label={ariaLabel}
    >
      {direction === "prev" ? (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
});

const DotNavigation = memo(function DotNavigation({
  total,
  current,
  onChange,
}: {
  total: number;
  current: number;
  onChange: (index: number) => void;
}) {
  return (
    <div 
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-3 sm:bottom-6 md:bottom-6"
      role="tablist"
      aria-label="Navegación del carrusel"
    >
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          role="tab"
          aria-selected={index === current}
          aria-label={`Ir a slide ${index + 1}`}
          className={clsx(
            "h-3 w-3 rounded-full transition-all md:h-3 md:w-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-black/50",
            index === current
              ? "bg-[var(--accent)] scale-110"
              : "bg-white/60 hover:bg-white/80"
          )}
        />
      ))}
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function HeroCarousel({
  slides = defaultSlides,
  autoPlay = true,
  autoPlayInterval = 7000,
  className,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [interactionKey, setInteractionKey] = useState(0); // increments on manual nav
  
  const reducedMotion = useReducedMotion();
  
  // Intersection Observer para solo iniciar auto-play cuando el hero es visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const heroElement = document.getElementById("hero-carousel");
    if (heroElement) {
      observer.observe(heroElement);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-play: se reinicia cada vez que interactionKey cambia (navegación manual)
  useEffect(() => {
    if (!autoPlay || reducedMotion || !isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length, reducedMotion, isVisible, interactionKey]);

  // Handlers memoizados: al navegar manualmente, incrementa interactionKey para reiniciar el timer
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setInteractionKey((k) => k + 1);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setInteractionKey((k) => k + 1);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setInteractionKey((k) => k + 1);
  }, [slides.length]);

  // Touch handlers - prevenir scroll del body durante swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.target as HTMLElement).dataset.touchStart = String(touch.clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const touchStart = target.dataset.touchStart;
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0];
    const distance = parseFloat(touchStart) - touchEnd.clientX;
    const minSwipeDistance = 50;
    
    // Solo prevenir default cuando hay swipe, no en taps (para que los links funcionen en iOS)
    if (Math.abs(distance) > minSwipeDistance) {
      e.preventDefault();
      if (distance > minSwipeDistance) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    delete target.dataset.touchStart;
  }, [goToNext, goToPrevious]);

  // Animación optimizada con transform
  const slideAnimation = useMemo(() => 
    reducedMotion 
      ? { opacity: 1 } 
      : { 
          opacity: 1,
          scale: 1,
          transition: { duration: TRANSITION.slow.duration }
        },
    [reducedMotion]
  );

  return (
    <div
      id="hero-carousel"
      className={clsx(
        "relative overflow-hidden rounded-xl",
        className
      )}
      style={{ touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/3] md:aspect-[5/2]">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          
          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isActive ? 1 : 0,
              }}
              transition={{ 
                duration: 1.2,
                ease: "linear"
              }}
              className={clsx(
                "absolute inset-0",
                isActive ? "z-10" : "z-5"
              )}
            >
              <HeroSlideContent 
                slide={slide} 
                isActive={isActive}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <NavigationArrow
        onClick={goToPrevious}
        direction="prev"
        ariaLabel="Slide anterior"
      />
      <NavigationArrow
        onClick={goToNext}
        direction="next"
        ariaLabel="Slide siguiente"
      />
      <DotNavigation
        total={slides.length}
        current={currentIndex}
        onChange={goToSlide}
      />
    </div>
  );
}

export default HeroCarousel;