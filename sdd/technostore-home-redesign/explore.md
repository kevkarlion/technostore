# Exploration: Home Redesign - TechnoStore

## Current State
Home page is functional but basic. Uses:
- `PremiumHero` component with staggered entrance animations (badge → title → description → CTAs)
- Grid of `ProductCard` components (8 products)
- Categories displayed as small clickable cards in hero's right panel
- No scroll animations, no testimonials, no promotions, no dynamic content

## Affected Areas

| File | Why Affected |
|------|--------------|
| `app/page.tsx` | Main entry — will need new sections and structure |
| `src/components/premium-hero.tsx` | Already exists, reusable with modifications |
| `src/features/catalog/components/product-card.tsx` | Basic card — could be replaced with `PremiumProductCard` |
| `src/components/ui/premium/premium-product-card.tsx` | Higher fidelity card with hover zoom, glass effects, stagger |
| `src/lib/motion-config.ts` | Animation utilities already available |
| `src/api/repository/category.repository.ts` | Data source for categories |
| `src/api/services/product.service.ts` | Data source for featured products |

## Gaps Identified

1. **No scroll-triggered animations** — content appears all at once
2. **No social proof section** — testimonials, reviews, trust badges
3. **No promotional banners** — flash sales, seasonal offers, new arrivals
4. **No hero carousel** — static hero with no visual movement
5. **No category showcase** — categories only visible as small cards in hero
6. **No brand/showcase section** — featured brands or collections
7. **No newsletter CTA** — user retention opportunity missing
8. **No lazy-loaded sections** — everything loads synchronously
9. **No micro-interactions on CTAs** — buttons lack hover feedback

## Opportunities

| Opportunity | Detail |
|-------------|--------|
| **Framer Motion is already installed** | `v12.34.3` — full animation capability available |
| **Premium components exist** | `GlassContainer`, `AnimatedBadge`, `RippleButton`, `PremiumProductCard` ready to reuse |
| **Reduced motion respected** | `useMotionPreferences()` hook already implemented |
| **Motion config available** | `entranceVariants`, `staggerContainer`, `hoverVariants` ready to use |
| **Dark theme system in place** | CSS variables `--accent`, `--background`, `--surface` etc. defined |

## Components to Create

| Component | Purpose |
|-----------|---------|
| `AnimatedHeroCarousel` | Auto-rotating hero with 3-5 slides, dots navigation, parallax effect |
| `ScrollRevealSection` | Wrapper that triggers fade-in-up when section enters viewport |
| `SocialProofBanner` | Trust badges, stats (X customers, Y products, Z reviews) |
| `TestimonialCarousel` | Customer reviews with avatar, rating, quote |
| `PromotionalBanner` | Flash sale / seasonal offer banner with countdown timer |
| `CategoryShowcase` | Large visual category cards with hover effects |
| `NewsletterCTA` | Email capture section with glassmorphism styling |
| `BrandShowcase` | Partner logos or featured brands grid |
| `HomepageProductGrid` | Optimized product grid with `PremiumProductCard` and load-more |

## Proposed Architecture

```
app/page.tsx
├── PremiumHero (existing, keep)
├── ScrollRevealSection
│   └── TestimonialCarousel (NEW)
├── ScrollRevealSection
│   └── PromotionalBanner (NEW)
├── ScrollRevealSection
│   └── CategoryShowcase (NEW)
├── ScrollRevealSection
│   └── ProductGridSection
│       └── PremiumProductCard × N (existing, upgrade)
├── ScrollRevealSection
│   └── BrandShowcase (NEW)
└── ScrollRevealSection
    └── NewsletterCTA (NEW)

Components:
src/components/home/
├── animated-hero-carousel.tsx
├── scroll-reveal-section.tsx
├── social-proof-banner.tsx
├── testimonial-carousel.tsx
├── promotional-banner.tsx
├── category-showcase.tsx
├── brand-showcase.tsx
└── newsletter-cta.tsx

Shared (reuse):
src/components/ui/premium/ — GlassContainer, AnimatedBadge, RippleButton
src/features/catalog/components/product-card.tsx → PremiumProductCard
```

## Approach Comparison

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **Incremental** — Add one section at a time | Low risk, easy to test | Slower delivery, inconsistent look | Low |
| **Big Bang** — Full redesign | Cohesive result, faster | Higher risk, harder to revert | High |
| **Hybrid** — Core sections now + future expansion | Balanced risk/benefit | Requires clear phase boundaries | Medium |

## Recommendation

**Hybrid approach**: Implement the most impactful sections first:
1. `ScrollRevealSection` wrapper (enables all scroll animations)
2. `PromotionalBanner` (immediate conversion impact)
3. Upgrade to `PremiumProductCard` (visual lift)
4. `CategoryShowcase` (category discovery)
5. `TestimonialCarousel` (social proof)
6. `NewsletterCTA` (retention)

This gives a premium feel in phases while maintaining stability.

## Risks

- **Performance**: Framer Motion on many elements may impact mobile — use `lazyMotion` and optimize re-renders
- **Scope creep**: Premium feel has no ceiling — enforce phase boundaries
- **Break existing UX**: Users familiar with current layout — A/B test or gradual rollout

## Ready for Proposal

**Yes** — clear gaps and opportunities identified. Next step: `sdd-propose` to define scope, budget, and rollback plan.