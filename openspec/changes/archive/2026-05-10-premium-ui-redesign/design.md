# Design: Premium UI Redesign

## Technical Approach

Implement premium visual enhancements across the e-commerce UI using Framer Motion for animations and CSS custom properties for theming. The approach prioritizes mobile-first responsive design with progressive enhancement for glassmorphism and motion effects. All animations respect `prefers-reduced-motion`.

## Architecture Decisions

### Decision: Motion Configuration

**Choice**: Create a shared Framer Motion config with reduced motion detection and standardized transitions.

**Alternatives considered**: Inline motion configurations per component.

**Rationale**: Centralizes ease curves, durations, and reduced-motion handling for consistency. Single source of truth for animation behavior across hero, navbar, cards, and product page.

### Decision: CSS Custom Properties for Theming

**Choice**: Extend existing CSS variables (`--glass-blur`, `--glass-opacity`, `--transition-fast`, `--transition-medium`) instead of creating new ones.

**Alternatives considered**: Framer Motion `useSpring` or JavaScript-based animations.

**Rationale**: Leverages the existing theming pattern in `globals.css`. GPU-accelerated CSS transitions perform better than JS animations and work without Framer Motion if needed.

### Decision: Component Architecture

**Choice**: Create new UI component library at `@/components/ui/premium/` with reusable primitives (GlassContainer, AnimatedBadge, SkeletonCard).

**Alternatives considered**: Inline animations directly in page components.

**Rationale**: Reusability across Hero, Navbar, ProductCard, and Product Page. Single point for animation fixes and performance optimizations.

## Data Flow

```
Page (Server Component)
  └── PremiumHero (Client) ──→ motion.div (entrance animations)
  └── SiteHeader (Server + Client state) ──→ scroll listener → glass blur
  └── ProductCardList (Client) ──→ ProductCard[] ──→ each card has skeleton state
  └── ProductPage (Client) ──→ Gallery ──→ Lightbox Modal
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/globals.css` | Modify | Add glassmorphism and animation CSS variables |
| `lib/motion-config.ts` | Create | Shared Framer Motion config with reduced-motion support |
| `components/ui/premium/glass-container.tsx` | Create | Reusable glassmorphism wrapper component |
| `components/ui/premium/animated-badge.tsx` | Create | Badge with entrance animation and pulse for sales |
| `components/ui/premium/skeleton-card.tsx` | Create | Skeleton loader with shimmer animation |
| `components/ui/premium/ripple-button.tsx` | Create | Button with ripple effect on click |
| `components/layout/site-header-client.tsx` | Create | Client-side scroll handler for navbar effects |
| `components/premium-hero.tsx` | Create | Hero with staggered entrance, glassmorphism |
| `app/page.tsx` | Modify | Replace hero section with PremiumHero component |
| `app/products/[slug]/premium-gallery.tsx` | Create | Gallery with crossfade, swipe gestures, sticky panel, accordion |
| `app/products/[slug]/page.tsx` | Modify | Use PremiumGallery instead of ProductGallery |

## Interfaces / Contracts

```typescript
// Motion configuration
interface MotionConfig {
  default: {
    ease: [number, number, number, number];
    duration: number;
  };
  reducedMotion: boolean;
}

// Glass container props
interface GlassContainerProps {
  blur?: number;
  opacity?: number;
  children: React.ReactNode;
  className?: string;
}

// Skeleton shimmer
interface SkeletonCardProps {
  className?: string;
  delay?: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Animation configs, utility functions | Jest + @testing-library/react |
| Component | GlassContainer renders with correct styles | @testing-library Framer Motion wrapper |
| Integration | Hero entrance animations on mount | Playwright (verify no layout shift) |
| E2E | Full purchase flow with animations | Playwright (verify 60fps) |

## Migration / Rollout

No migration required. Changes are UI-only and backwards-compatible. Feature flag not needed—direct replacement of existing components.

## Open Questions

- [ ] Should the hero background use a video or static image? (Static for MVP)
- [ ] What image assets exist for the hero section? (Need assets)