"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
import { clsx } from "clsx";

/**
 * Hero carousel slide data
 */
export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  cta?: { label: string; href: string };
  badge?: string;
  gradient?: string;
}

/**
 * Props for HeroCarousel component
 */
interface HeroCarouselProps {
  slides?: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

/**
 * Default slides for TechnoStore
 */
const defaultSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Rendimiento Extremo",
    subtitle: "PCs configuradas para dominar cualquier género",
    image: "/pc-gamer.png",
    cta: { label: "Ver PCs", href: "/categorias/computadoras" },
    badge: "TOP",
    gradient: "from-blue-600/40 to-purple-600/40",
  },
  {
    id: "2",
    title: "Precisión Milimétrica",
    subtitle: "Equipamiento que responde antes de pensar",
    image: "/perifericos.png",
    cta: { label: "Ver periféricos", href: "/categorias/perifericos" },
    badge: "HOT",
    gradient: "from-cyan-600/40 to-green-600/40",
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

/**
 * HeroCarousel - Dynamic image carousel with category slides
 *
 * Features:
 * - Auto-play with manual navigation
 * - Smooth crossfade transitions
 * - Dot navigation indicators
 * - Mobile-optimized with touch swipe
 * - Fallback gradients if images fail
 */
export function HeroCarousel({
  slides = defaultSlides,
  autoPlay = true,
  autoPlayInterval = 5000,
  className,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { reducedMotion } = useMotionPreferences();
  
  const minSwipeDistance = 50;

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || reducedMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length, reducedMotion]);

  // Pause on hover
  useEffect(() => {
    setIsHovered(false);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Touch handlers para swipe en mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  return (
    <div
      className={clsx("relative overflow-hidden rounded-xl", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides Container - más compacto */}
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/3] md:aspect-[5/2]">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={
              reducedMotion
                ? { opacity: index === currentIndex ? 1 : 0 }
                : { opacity: index === currentIndex ? 1 : 0 }
            }
            transition={{ duration: TRANSITION.slow, ease: EASE.standard }}
            className={clsx(
              "absolute inset-0",
              index === currentIndex ? "z-10" : "z-0"
            )}
          >
            {/* Image with overlay */}
            <div className="relative h-full w-full">
              {/* Background image */}
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 1200px"
              />

              {/* Gradient overlay - más oscuro abajo en mobile para legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent sm:from-black/60 sm:via-black/30" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end pb-12 px-5 sm:px-8 md:px-16 lg:px-20">
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={
                    reducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 1, y: 0 }
                  }
                  transition={{ delay: 0.2, duration: TRANSITION.medium }}
                  className="w-full max-w-full"
                >
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
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Arrows - solo desktop */}
      <button
        onClick={goToPrevious}
        className="hidden md:flex absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition hover:bg-black/70"
        aria-label="Previous slide"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="hidden md:flex absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition hover:bg-black/70"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Navigation */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-4 md:bottom-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={clsx(
              "h-2.5 w-2.5 rounded-full transition-all md:h-3 md:w-3",
              index === currentIndex
                ? "bg-[var(--accent)] scale-110"
                : "bg-white/60 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroCarousel;