## TechnoStore Frontend Architecture

This document describes the high-level folder structure and responsibilities for the TechnoStore ecommerce frontend.

### Root

- `app/` – Next.js App Router entry point and route definitions.
- `public/` – Static assets such as logos, product placeholders and icons.
- `src/` – All feature, UI and shared application code (recommended import root as `@/*`).

### `app/` (routing)

- `layout.tsx` – Root layout, global providers and shell (header, footer).
- `page.tsx` – Home page (storefront).
- `category/[slug]/page.tsx` – Category listing pages.
- `products/[slug]/page.tsx` – Product details pages.
- `search/page.tsx` – Search results.
- `cart/page.tsx` – Cart summary and editing.
- `checkout/page.tsx` – Checkout UI (no real payments).
- `globals.css` – Tailwind and design tokens.
- `error.tsx`, `loading.tsx` – Global error boundary and loading skeleton.

### `src/` (feature-based)

- `components/` – Reusable presentational components.
  - `ui/` – Primitive UI elements (buttons, inputs, cards, badges, skeletons, etc.).
  - `layout/` – Shell components (header, footer, navigation, container).
- `features/` – Feature-specific vertical slices.
  - `catalog/` – Product list, filters and sorting.
  - `product/` – Product detail layout, gallery, specs.
  - `cart/` – Cart UI and hooks.
  - `checkout/` – Checkout steps UI.
  - `search/` – Search bar and results list.
- `store/` – Zustand stores (e.g. cart store).
- `lib/` – Utilities, mock data and formatting helpers.
- `types/` – Shared TypeScript types and enums (e.g. `Product`, `Category`).

