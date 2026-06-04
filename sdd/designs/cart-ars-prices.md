# Design: Cart and Checkout ARS Prices

## Technical Approach
Store ARS price in `CartProduct.price` at add-to-cart time instead of USD, then add `currency="ARS"` to every `<Price>` in cart/checkout so it renders via `formatARS()`. This keeps the data flow linear — USD lives in the DB, ARS is computed once by the product card mapper and stored in the cart payload.

## Architecture Decisions

### Decision: Store ARS vs Convert on Display
**Choice**: Store ARS price in cart at add-to-cart time  
**Alternatives considered**: Convert USD→ARS client-side in each Price component  
**Rationale**: Avoids async flash of USD→ARS, keeps Price simple, single source of truth. The product card mapper (`product-to-presentation.ts`) already computes `priceARS` from USD + exchange rate — we reuse that value.

### Decision: Price component currency="ARS" prop
**Choice**: Add `currency="ARS"` prop handling to reuse existing `formatARS()`  
**Alternatives considered**: Auto-detect from amount, add `convertToArs` everywhere  
**Rationale**: Minimal change, explicit intent at call site, reuses existing `formatARS`. No new async behavior needed.

## Data Flow

```
Product DB (USD)
  ↓ product-to-presentation.ts computes priceARS
    ↓ premium-product-card-v2.tsx builds cartProduct with product.priceARS
      ↓ cart-store (localStorage) — CartProduct.price is now ARS
        ↓ cart-client.tsx computes totals from ARS prices (same math, different unit)
          ↓ CartItemRow <Price currency="ARS">
          ↓ CartSummary <Price currency="ARS">
          ↓ checkout page <Price currency="ARS">
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/product-card/premium-product-card-v2.tsx` | Modify | L412: use `product.priceARS ?? product.price`, add `slug` and `stock` |
| `src/components/ui/price.tsx` | Modify | When `currency="ARS"`, render `formatARS()` instead of raw number |
| `src/features/cart/types/cart.ts` | Modify | (optional) `mapProductToCartProduct` — no change needed, it's not used by the card |
| `src/features/cart/components/cart-item-row.tsx` | Modify | Add `currency="ARS"` to all 4 `<Price>` calls (L184, L191, L257, L286) |
| `src/features/cart/components/cart-summary.tsx` | Modify | Add `currency="ARS"` to all 4 `<Price>` calls (L94, L103, L113, L124) |
| `app/(main)/carrito/cart-client.tsx` | Modify | L51-58: in `migrateLegacyItem`, fetch exchange rate + compute ARS (API returns USD) |
| `app/(main)/checkout/page.tsx` | Modify | Add `currency="ARS"` to all 5 `<Price>` calls (L488, L498, L502, L506, L511) |
| `src/components/checkout/checkout-form.tsx` | Modify | Add `currency="ARS"` to 2 `<Price>` calls (L340, L358) |
| `src/components/checkout/mercado-pago-form.tsx` | Modify | Add `currency="ARS"` to 1 `<Price>` call (L264) |

## Interfaces
No new types needed. `CartProduct.price` will now hold ARS instead of USD — this is a semantic change, not a structural one. Existing `CartProduct` type stays unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Cart shows ARS prices | Manual: add product, check /carrito |
| Visual | Checkout sidebar shows ARS prices | Manual: proceed to /checkout |
| Visual | Legacy cart items survive page reload | Manual: refresh /carrito after adding |
| Unit | Price component with currency="ARS" | `formatARS` is already tested by exchange-rate |

## Migration
No data migration. Legacy cart items (USD in localStorage) are handled by `migrateLegacyItem` in `cart-client.tsx:40`. The API (`/api/products/{id}`) returns a `ProductResponseDTO` with `price` in USD — it does NOT include `priceARS`. So the migration path must explicitly compute the ARS equivalent:

In `migrateLegacyItem`, fetch the exchange rate alongside the product and compute `priceARS = usdPrice * rate`:

```typescript
const [productData, exchangeRate] = await Promise.all([
  fetch(`/api/products/${item.productId}`).then(r => r.json()),
  getExchangeRate(),
]);
const arsPrice = usdToArs(productData.price, exchangeRate?.venta ?? null);
```

This keeps ARS as the single currency in the cart. Fresh items from the product card already have `priceARS` available synchronously from the domain model.

## Open Questions
None
