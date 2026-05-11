"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const SCROLL_BLUR_THRESHOLD = 50;
const SCROLL_SHADOW_THRESHOLD = 100;

/**
 * SiteHeaderClient - Client-side scroll effects for the header
 * 
 * - Adds blur effect starting at 50px scroll
 * - Adds shadow effect starting at 100px scroll
 * - Uses motion for smooth transitions
 */
export function SiteHeaderClient() {
  const [scrollY, setScrollY] = useState(0);
  
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const blurOpacity = Math.min(scrollY / SCROLL_BLUR_THRESHOLD, 1);
  const shadowOpacity = Math.min(
    Math.max(0, scrollY - SCROLL_SHADOW_THRESHOLD) / SCROLL_SHADOW_THRESHOLD,
    1
  );
  
  const isBlurred = scrollY >= SCROLL_BLUR_THRESHOLD;
  const hasShadow = scrollY >= SCROLL_SHADOW_THRESHOLD;

  return {
    scrollY,
    isBlurred,
    hasShadow,
    blurStyles: {
      backdropFilter: `blur(${blurOpacity * 12}px)`,
      WebkitBackdropFilter: `blur(${blurOpacity * 12}px)`,
      backgroundColor: `rgba(12, 12, 16, ${0.95 + blurOpacity * 0.05})`,
      boxShadow: hasShadow 
        ? `0 ${4 + shadowOpacity * 8}px ${16 + shadowOpacity * 8}px rgba(0, 0, 0, ${0.1 + shadowOpacity * 0.1})`
        : "none",
    },
  };
}

export default SiteHeaderClient;