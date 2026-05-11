# Tasks: Premium UI Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500-700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: CSS vars, motion config, UI primitives | PR 1 | Base = main; tests included |
| 2 | Navbar + Hero components | PR 2 | Base = PR 1; integrates foundation |
| 3 | Cards, Product Page, Micro-interactions | PR 3 | Base = PR 2; full integration |

## Phase 1: Foundation (PR 1)

- [x] 1.1 Add glassmorphism CSS variables to `app/globals.css` (`--glass-blur`, `--glass-opacity`, `--transition-fast`, `--transition-medium`)
- [x] 1.2 Create `lib/motion-config.ts` with shared Framer Motion config and `prefers-reduced-motion` detection
- [x] 1.3 Create `components/ui/premium/glass-container.tsx` — reusable glassmorphism wrapper component
- [x] 1.4 Create `components/ui/premium/animated-badge.tsx` — badge with entrance animation and sale pulse
- [x] 1.5 Create `components/ui/premium/skeleton-card.tsx` — skeleton loader with shimmer animation and ARIA attributes

## Phase 2: Navbar + Hero (PR 2)

- [x] 2.1 Create `components/ui/premium/ripple-button.tsx` — button with ripple effect on click
- [x] 2.2 Create `components/layout/site-header-client.tsx` — client-side scroll handler with blur at 50px, shadow at 100px
- [x] 2.3 Modify existing site-header to import and use site-header-client
- [x] 2.4 Create `components/premium-hero.tsx` — hero with staggered entrance, glassmorphism container
- [x] 2.5 Modify `app/page.tsx` to replace hero section with PremiumHero component
- [x] 2.6 Add mobile hamburger menu animation to navbar (slide-down at 768px)

## Phase 3: Cards + Product Page + Micro-interactions (PR 3)

- [x] 3.1 Create `components/ui/premium/premium-product-card.tsx` — card with 1.05x image zoom, elevation shadow, badge animations
- [x] 3.2 Create `components/ui/premium/premium-gallery.tsx` — gallery with crossfade (300ms), swipe gestures (30px threshold), sticky panel, accordion specs, lightbox modal
- [x] 3.3 Add sticky purchase panel to product page (sticky at `top: 80px` on desktop, fixed bottom on mobile)
- [x] 3.4 Create product specs accordion with expand/collapse (250ms, only one open at a time)
- [x] 3.5 Create lightbox modal for image zoom (escape key + backdrop click to close)
- [x] 3.6 Modify `app/products/[slug]/page.tsx` to use PremiumGallery
- [x] 3.7 Add page transition fade (150ms out + 150ms in, max 300ms total)
- [x] 3.8 Add enhanced focus rings to interactive elements (2px outline, 2px offset) — already in globals.css

## Phase 4: Testing

- [ ] 4.1 Write unit tests for `lib/motion-config.ts` — verify reduced motion detection
- [ ] 4.2 Write component tests for GlassContainer — verify blur and opacity styles
- [ ] 4.3 Write component tests for SkeletonCard — verify shimmer animation and ARIA attributes
- [ ] 4.4 Write integration test for PremiumHero entrance animation — verify staggered timing
- [ ] 4.5 Write integration test for navbar scroll effects — verify blur at 50px
- [ ] 4.6 Write e2e test for product gallery — verify crossfade and swipe gestures
- [ ] 4.7 Verify all acceptance criteria from spec files

## Phase 5: Cleanup

- [ ] 5.1 Verify Lighthouse performance score maintains 90+
- [ ] 5.2 Remove any temporary debug code or comments
- [ ] 5.3 Update component documentation if needed