# Project: QUANLYBANHANG-Ver1 — Logic Bug Audit & Input Reliability Hardening

## Architecture
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, TailwindCSS, Zustand stores (`useCartStore`, `useSaleStore`, `useCatalogStore`).
- **Backend**: Golang 1.22+, Chi router, PostgreSQL database, PayOS payment gateway integration.
- **Shared Validation & Error Handling Layer**: Centralized Vietnamese phone regex, numeric clamp helpers, and error stringifier in `frontend/src/lib/`.
- **Data Flow**:
  1. User enters inputs via direct keyboard typing or arrow Up/Down keys.
  2. Input state maintains transient typing buffer allowing backspace/empty without resetting prematurely.
  3. `onBlur` / `Enter` / form submission triggers validation:
     - Phone: exactly 10 digits starting with Vietnamese mobile prefixes `0[35789]`.
     - Quantities: positive numbers (`>= 1`, max limit), no `NaN`, no negative numbers.
     - Prices & Discounts: valid non-negative numbers, discounts clamped `[0, 50]` or `[0, 100]`.
     - Required text: non-empty, non-whitespace-only strings.
  4. Client-side toast errors and validation feedback formatted using `getFriendlyErrorMessage` into polite, clear Vietnamese.
  5. Backend Go handlers re-verify all inputs with optimistic concurrency locking and business invariant enforcement.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Friendly Vietnamese Error & Stringification | Defensive `getFriendlyErrorMessage` supporting raw strings, objects, and network errors without `[object Object]` | M1 | Survey 1, 2, 3 |
| F2 | Cart Store `NaN` & Deletion Guard | Guard `useCartStore.setQuantity` against `NaN`, negative numbers, and inadvertent zero-deletion | M1 | Survey 2 |
| F3 | Shared Input Validation Utilities | Centralized Vietnamese phone regex `^0[35789]\d{8}$`, whitespace cleaner, number boundary clampers | M1 | Survey 1, 2, 3 |
| F4 | POS Quantity & Float Input Hardening | Allow Backspace without reset to 1 in `OrderCreateForm.tsx`, support decimal quantities (`step="any"`), clamp on blur | M2 | Survey 1 |
| F5 | B2B Quote Form Clamp & Pricing Invariants | Prevent negative discounts and negative unit prices in `QuoteForm.tsx`, clamp `[0, 50%]` | M2 | Survey 1 |
| F6 | POS Cash Tendered & Change Calculation | Add cash tendered input, auto-calculate change, auto-mark paid on cash orders to sync with K80 receipt | M2 | Survey 1 |
| F7 | POS Customer Phone 10-Digit Validation | Enforce strict 10-digit Vietnamese phone validation for POS customers | M2 | Survey 1 |
| F8 | Storefront Cart Keyboard & Arrow Key Typing | Smooth typing in `cart/page.tsx`, backspace tolerance, min 1 clamp, Down arrow does not delete item | M3 | Survey 2 |
| F9 | Storefront Checkout Strict Phone & Notes | Strict 10-digit mobile phone regex, sanitize punctuation, retain customer `notes` in order payload | M3 | Survey 2 |
| F10 | Product Detail Interactive Quantity Input | Replace non-editable `<span>` with interactive `<input type="number">` supporting typing & arrow keys | M3 | Survey 2 |
| F11 | Public Order Lookup & Receipt Phone Format | Sanitize phone lookup to digits only, extract customer phone on K80 receipt when searched by order code | M3 | Survey 2 |
| F12 | Manager Material Modal Backspace Fix | Prevent Backspace from snapping to 0 in `EditMaterialModal.tsx`, permit typing freely | M4 | Survey 3 |
| F13 | Manager Required Fields & `NaN` Validation | Reject empty/whitespace unit in `AddMaterialModal` and `EditMaterialModal`, guard `NaN` in prices/stocks | M4 | Survey 3 |
| F14 | Manager Stock Adjust `NaN` Guard | Check `isNaN(newQuantity)` in `StockAdjustModal.tsx` | M4 | Survey 3 |
| F15 | Shipper POD & COD Flow Verification | Verify POD requirements, confirmation checkbox, and COD settlement integrity | M4 | Survey 3 |
| F16 | Full Test Suite Pass & Regression Hardening | 100% pass on `npx tsc --noEmit`, `npx vitest run`, and `go test ./...` with new unit tests | M5 | Survey 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Validation, API Errors & Cart Store | `api.ts`, shared validation helper, `useCartStore.ts` | none | DONE |
| M2 | POS Retail Sale & B2B Quote Forms | `OrderCreateForm.tsx`, `QuoteForm.tsx`, Sale customers | M1 | DONE |
| M3 | Storefront Cart, Checkout, Product & Lookup | `cart/page.tsx`, `checkout/page.tsx`, `product/[id]/page.tsx`, `tra-cuu-don-hang`, K80 modal | M1 | DONE |
| M4 | Manager Admin Modals & Shipper Verification | `EditMaterialModal.tsx`, `AddMaterialModal.tsx`, `StockAdjustModal.tsx`, `PodModal.tsx` | M1 | DONE |
| M5 | Comprehensive Testing & Final Verification | Full test suite execution (`tsc`, `vitest`, `go test`) & test expansions | M2, M3, M4 | DONE |

## Interface Contracts
### `frontend/src/lib/validation.ts`
- `isValidVietnamesePhone(phone: string): boolean`: returns true if sanitized phone matches `^0[35789]\d{8}$`.
- `sanitizePhone(phone: string): string`: strips whitespace, dots, dashes, parentheses.
- `clampNumber(val: number, min: number, max: number, fallback: number): number`: handles `NaN` safely.

### `frontend/src/lib/api.ts`
- `getFriendlyErrorMessage(err: unknown): string`: returns friendly polite Vietnamese string without `[object Object]`.

### `frontend/src/store/useCartStore.ts`
- `setQuantity(id: string, qty: number): void`: if `isNaN(qty)` or `qty < 1`, do not corrupt to `NaN`; if `qty <= 0`, require explicit action or clamp to 1.

## Code Layout
- `frontend/src/lib/`: `api.ts`, `validation.ts`
- `frontend/src/store/`: `useCartStore.ts`, `useSaleStore.ts`
- `frontend/src/components/sale/`: `OrderCreateForm.tsx`, `QuoteForm.tsx`, `CustomerDetailModal.tsx`
- `frontend/src/app/cart/`: `page.tsx`
- `frontend/src/app/checkout/`: `page.tsx`
- `frontend/src/app/product/[id]/`: `page.tsx`
- `frontend/src/app/tra-cuu-don-hang/`: `page.tsx`
- `frontend/src/components/ThermalReceiptModal.tsx`
- `frontend/src/components/manager/`: `AddMaterialModal.tsx`, `EditMaterialModal.tsx`, `StockAdjustModal.tsx`
- `frontend/src/components/shipper/`: `PodModal.tsx`
- `frontend/tests/`: `retailPosAndClickCollect.test.ts`, `cartInput.test.ts`, `validation.test.ts`
- `backend/`: `internal/handler/`, `internal/domain/`, `internal/repository/`
