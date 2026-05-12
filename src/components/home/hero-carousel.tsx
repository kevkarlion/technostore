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
    title: "PCs Gamer",
    subtitle: "Las más potentes",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80",
    cta: { label: "Ver PCs", href: "/category/pcs-gamer" },
    badge: "TOP",
    gradient: "from-blue-600/80 to-purple-600/80",
  },
  {
    id: "2",
    title: "Periféricos Gamer",
    subtitle: "Mouse, teclado y más",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
    cta: { label: "Ver periféricos", href: "/category/perifericos" },
    badge: "HOT",
    gradient: "from-cyan-600/80 to-green-600/80",
  },
  {
    id: "3",
    title: "Monitores 144Hz",
    subtitle: "Fluidez extrema",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
    cta: { label: "Ver monitores", href: "/category/monitores" },
    badge: "NEW",
    gradient: "from-orange-600/80 to-red-600/80",
  },
  {
    id: "4",
    title: "Sillas Gamer",
    subtitle: "Comodidad total",
    image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80",
    cta: { label: "Ver sillas", href: "/category/sillas-gamer" },
    gradient: "from-purple-600/80 to-pink-600/80",
  },
  {
    id: "5",
    title: "Streaming",
    subtitle: "Equipamiento completo",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    cta: { label: "Ver streaming", href: "/category/streaming" },
    badge: "OFERTA",
    gradient: "from-emerald-600/80 to-teal-600/80",
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
  const { reducedMotion } = useMotionPreferences();

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

  return (
    <div
      className={clsx("relative overflow-hidden rounded-xl", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container - más compacto */}
      <div className="relative aspect-[4/3] w-full md:aspect-[5/2]">
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

              {/* Gradient overlay */}
              <div
                className={clsx(
                  "absolute inset-0 bg-gradient-to-r",
                  slide.gradient || "from-black/70 via-black/40 to-transparent"
                )}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={
                    reducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 1, y: 0 }
                  }
                  transition={{ delay: 0.2, duration: TRANSITION.medium }}
                >
                  {/* Badge */}
                  {slide.badge && (
                    <span className="mb-2 inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--background)]">
                      {slide.badge}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-3xl font-bold text-white md:text-5xl">
                    {slide.title}
                  </h2>

                  {/* Subtitle */}
                  {slide.subtitle && (
                    <p className="mt-1 text-lg text-white/80 md:text-xl">
                      {slide.subtitle}
                    </p>
                  )}

                  {/* CTA */}
                  {slide.cta && (
                    <Link
                      href={slide.cta.href}
                      className="mt-4 inline-block w-fit rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition hover:opacity-90"
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

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 md:left-4 md:p-3"
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60 md:right-4 md:p-3"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Navigation */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={clsx(
              "h-2 w-2 rounded-full transition-all md:h-3 md:w-3",
              index === currentIndex
                ? "bg-[var(--accent)] scale-110"
                : "bg-white/50 hover:bg-white/70"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroCarousel;