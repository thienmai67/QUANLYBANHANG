# TDT M&E Delivery Platform — Comprehensive Backend Security & Logic Audit Report

**Target Codebase**: `backend/internal/...` (TDT M&E Delivery Platform Go Backend)  
**Branch**: `full-system`  
**Working Directory**: `C:\Users\admin\Downloads\QUANLYBANHANG-Ver1`  
**Audit Standard**: Exhaustive Function-by-Function Read-Only Inspection  
**Assessment Mode**: Enterprise Security, Concurrency, RBAC & Business Logic Review  
**Date**: November 2026  
**Auditor**: Teamwork Security & Forensic Quality Assurance Division  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Audit Baseline & Previously Resolved Items Verification](#2-audit-baseline--previously-resolved-items-verification)
3. [Master Findings Catalog](#3-master-findings-catalog)
4. [Detailed Findings & Concrete Remediation Plans](#4-detailed-findings--concrete-remediation-plans)
   - [4.1. Critical Severity Findings](#41-critical-severity-findings)
   - [4.2. High Severity Findings](#42-high-severity-findings)
   - [4.3. Medium Severity Findings](#43-medium-severity-findings)
   - [4.4. Low Severity Findings](#44-low-severity-findings)
5. [Concurrency & Transaction Integrity Deep Dive](#5-concurrency--transaction-integrity-deep-dive)
6. [RBAC & Authorization Matrix](#6-rbac--authorization-matrix)
7. [Prioritized Remediation Roadmap](#7-prioritized-remediation-roadmap)
8. [Verification Methodology & Reproduction Commands](#8-verification-methodology--reproduction-commands)

---

## 1. Executive Summary

### 1.1. Overview & Audit Scope
An exhaustive, function-by-function security, business logic, transaction concurrency, and authorization audit was conducted across the entire Go backend of the **TDT M&E Delivery Platform** (`backend/internal/...`). The target repository serves an enterprise electromechanical supplies e-commerce and logistics network featuring four core actors: **Customer**, **Manager**, **Shipper**, and **Sale**.

The audit strictly adhered to a **read-only inspection mandate**, ensuring that no source files, database migrations, or configuration files were altered during analysis. The audited components encompass 18 Go source files across 6 major packages:
- `backend/internal/repository/` (`product_repository.go`, `user_repository.go`, `shipper_repository.go`, `sale_repository.go`)
- `backend/internal/handler/` (`handlers.go`, `auth_handler.go`, `sso_handler.go`, `shipper_handler.go`, `sale_handler.go`, `chat_handler.go`)
- `backend/internal/domain/` (`product.go`, `user.go`, `shipper.go`, `sale.go`, `errors.go`)
- `backend/internal/auth/` (`jwt.go`)
- `backend/internal/middleware/` (`auth.go`)
- `backend/internal/payos/` (`payos.go`)
- `backend/cmd/server/` (`main.go`)

### 1.2. Methodology
The audit combined multiple analytical methodologies:
1. **Static Analysis & Control-Flow Tracing**: Tracing execution paths from HTTP routing in `main.go`, through Chi middlewares, handler parameter decoding, domain validation, down to SQL transaction execution in repository layers.
2. **Concurrency & Race Condition Modeling**: Analyzing database isolation levels (PostgreSQL Read Committed), table locking semantics (`SELECT ... FOR UPDATE`), transaction rollback handling, and deadlocks arising from multi-row lock acquisitions.
3. **Broken Object-Level Authorization (IDOR) & RBAC Analysis**: Evaluating role-based access control filters (`RequireRole`), context-derived user claims, and object ownership verification across all endpoints.
4. **Edge Case & Boundary Stress Analysis**: Testing numeric overflow/truncation, floating-point precision on decimal items, unhandled nil pointers, zero-value conditions, and time-window calculations (2H SLAs, quote expirations).
5. **Baseline Verification**: Rigorously auditing and verifying all 10 baseline items resolved in prior milestones to prevent false positives.

### 1.3. Statistical Findings Summary

```
========================================================================================
AUDIT METRIC SUMMARY
========================================================================================
Total Core Source Files Audited:         18
Total Packages Inspected:                6
Total Discovered Vulnerabilities:        38
  - Critical Severity:                    6  (15.8%)
  - High Severity:                       13  (34.2%)
  - Medium Severity:                     10  (26.3%)
  - Low Severity:                         9  (23.7%)
Baseline Non-Bugs Verified & Cleared:    10  (100.0% Verified Intact)
========================================================================================
```

#### Findings Breakdown by Subsystem
| Subsystem / Functional Module | Critical | High | Medium | Low | Total |
|---|:---:|:---:|:---:|:---:|:---:|
| **Core Orders, Inventory & Payments** | 2 | 3 | 4 | 3 | **12** |
| **Authentication, RBAC & SSO** | 2 | 2 | 2 | 4 | **10** |
| **Shipper Dispatch, Logistics & COD** | 1 | 3 | 2 | 2 | **8** |
| **Sales, Quotes, Debt & Chat Copilot** | 1 | 5 | 2 | 0 | **8** |
| **Total Unique Findings** | **6** | **13** | **10** | **9** | **38** |

### 1.4. Key Risk Takeaways
1. **Inventory Integrity Compromise**: Zero-stock products can bypass approval checks into `PACKING`, and subsequent cancellation creates fabricated phantom stock in PostgreSQL (`product_repository.go:1181, 1216`). Furthermore, quote-to-order conversion lacks row-level locks on products, enabling concurrent inventory overselling (`sale_repository.go:1609`).
2. **Perpetual Account Suspension Bypass**: Deactivated users and revoked shippers can continuously generate fresh JWTs via `POST /api/v1/auth/refresh` or bypass deactivation via Google SSO because `HandleRefreshToken` and `HandleGoogleCallback` omit `user.IsActive` verification.
3. **Operational Deadlock in Shipper Recycling**: Reclaiming a pool email (`shipper01@gmail.com`) deactivates the user but retains the email string in `me_supplies.users`. Re-allocating the email causes an immediate SQL unique constraint violation (`23505`), permanently bricking applicant approvals.
4. **Financial Reconciliation Discrepancies**: Online PayOS order codes are overwritten if payment modals are reopened, discarding in-flight payments. Sales payment notes can be fraudulently recorded against already-paid orders, while sales revenue and commission reports aggregate cancelled and refunded orders.
5. **Public API Vulnerabilities**: The unauthenticated `/api/v1/chat` endpoint queries 1,000 product rows from PostgreSQL on every request and passes client-forged conversation history to Gemini without rate limiting or request body limits, leaving the backend vulnerable to denial of service, database connection pool exhaustion, and prompt manipulation.

---

## 2. Audit Baseline & Previously Resolved Items Verification

In accordance with requirement **R2**, all 10 baseline items from prior milestone resolutions were specifically inspected and verified against the current codebase state. **Each of the 10 items is confirmed operational and is NOT an active bug.**

```
========================================================================================================================
BASELINE NON-BUG VERIFICATION MATRIX
========================================================================================================================
#  | Baseline Item Description                       | Verified Source Location               | Audit Verification Status
---|-------------------------------------------------|----------------------------------------|--------------------------
1  | COD Settlement updates PAID and paid_at = NOW() | `product_repository.go:1509-1516`      | VERIFIED — NOT A BUG
2  | Order Cancellation Payment Status Transitions   | `product_repository.go:1310-1314`      | VERIFIED — NOT A BUG
3  | 2H Order Deadline Calculation (created_at + 2h) | `product_repository.go:963-966`        | VERIFIED — NOT A BUG
4  | Quote Conversion Stock Quantity Validation      | `sale_repository.go:1606-1621`         | VERIFIED — NOT A BUG
5  | Customer Profile Total Spend Filter             | `sale_repository.go:289, 377`          | VERIFIED — NOT A BUG
6  | CartDrawer 2H Option & Contact Validation       | `frontend/.../CartDrawer.tsx:288, 436`  | VERIFIED — NOT A BUG
7  | ShipperOrderCard Online Payment Check           | `handlers.go:1150-1207`, `Card.tsx:42` | VERIFIED — NOT A BUG
8  | Order List Manager REFUND_PENDING Badge         | `frontend/.../OrderList.tsx:67-73`      | VERIFIED — NOT A BUG
9  | MaterialHeader SALE Role Navigation & Guard     | `frontend/.../MaterialHeader.tsx:36`   | VERIFIED — NOT A BUG
10 | Login Support for from & redirect Parameters    | `frontend/.../login/page.tsx:105-111`   | VERIFIED — NOT A BUG
========================================================================================================================
```

### Detailed Item-by-Item Verification

#### Item 1: COD Settlement Updates `payment_status = 'PAID'` and `paid_at = NOW()`
- **Specification**: In `CreateCODSettlement`, remitting delivered COD orders must atomically update both `payment_status` to `PAID` and `paid_at` to the current database timestamp.
- **Audited Code** (`backend/internal/repository/product_repository.go:1509-1516`):
  ```go
  updateOrders := `
      UPDATE me_supplies.orders
      SET cod_remitted = TRUE,
          cod_remitted_at = NOW(),
          payment_status = 'PAID',
          paid_at = NOW(),
          updated_at = NOW()
      WHERE id = ANY($1)
  `
  ```
- **Verification Evidence**: The SQL statement executes inside an explicit database transaction (`tx`). It explicitly updates `payment_status = 'PAID'` and `paid_at = NOW()` for all order IDs included in the settlement batch. Unit test `TestCODSettlement_And_ListShippers` passes.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 2: Order Cancellation Payment Status Transitions
- **Specification**: When cancelling an order, orders with `PaymentStatusPaid` must transition to `REFUND_PENDING`, while orders with `PaymentStatusUnpaid` or `PaymentStatusPending` must transition to `CANCELLED`.
- **Audited Code** (`backend/internal/repository/product_repository.go:1310-1314`):
  ```go
  if o.PaymentStatus == domain.PaymentStatusPaid {
      newPaymentStatus = domain.PaymentStatusRefundPending
  } else if o.PaymentStatus == domain.PaymentStatusUnpaid || o.PaymentStatus == domain.PaymentStatusPending {
      newPaymentStatus = domain.PaymentStatusCancelled
  }
  ```
- **Verification Evidence**: In `UpdateOrderStatusWithDetails`, lines 1310–1314 evaluate `o.PaymentStatus`. If paid, `newPaymentStatus` is assigned `PaymentStatusRefundPending`. Otherwise, it transitions to `PaymentStatusCancelled`. Test `TestOrderCancellation_PaymentStatusTransitions` passes.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 3: 2H Order Deadline Calculation (`created_at + 2h`)
- **Specification**: When `is_2h = true` during order creation, the system must set `deadline_2h = created_at + 2h`.
- **Audited Code** (`backend/internal/repository/product_repository.go:963-966`):
  ```go
  if order.Is2H && order.Deadline2H == nil {
      d := order.CreatedAt.Add(2 * time.Hour)
      order.Deadline2H = &d
  }
  ```
- **Verification Evidence**: When `Is2H` is true, the repository computes `order.CreatedAt.Add(2 * time.Hour)` and assigns it to `Deadline2H`. Test `TestCreateOrder_2HDeadlineCalculation` asserts that the persisted deadline is exactly 2 hours after creation time.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 4: Quote Conversion Stock Quantity Validation
- **Specification**: In `ConvertQuoteToOrder`, product stock quantity must be validated against requested item quantity before creating the order.
- **Audited Code** (`backend/internal/repository/sale_repository.go:1606-1621`):
  ```go
  // Recheck price floor and stock on convert (P0-1)
  var basePrice float64
  var stockQuantity int
  err = tx.QueryRowContext(ctx, `SELECT base_price, COALESCE(stock_quantity, 0) FROM me_supplies.products WHERE id = $1`, it.productID).Scan(&basePrice, &stockQuantity)
  if err != nil {
      _ = tx.Rollback()
      return nil, fmt.Errorf("verify product price and stock on convert: %w", err)
  }
  if it.unitPrice < basePrice*0.10 {
      _ = tx.Rollback()
      return nil, domain.ErrPriceBelowFloor
  }
  if stockQuantity < int(it.quantity) {
      _ = tx.Rollback()
      return nil, domain.ErrInsufficientStock
  }
  ```
- **Verification Evidence**: Inside the conversion transaction, each line item queries `stock_quantity`. If `stockQuantity < int(it.quantity)`, the transaction rolls back immediately with `domain.ErrInsufficientStock`.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 5: Customer Profile Total Spend Only Sums DELIVERED or PAID Orders
- **Specification**: Customer lifetime spend must only aggregate orders that are either successfully delivered or fully paid.
- **Audited Code** (`backend/internal/repository/sale_repository.go:289, 377` and `frontend/src/app/profile/page.tsx:611-613`):
  Backend SQL (`sale_repository.go`):
  ```sql
  COALESCE((SELECT SUM(o.total_amount) FROM me_supplies.orders o WHERE o.customer_id = u.id AND o.status = 'DELIVERED'), 0) AS total_spent
  ```
  Frontend calculation (`profile/page.tsx`):
  ```typescript
  const totalSpend = orders
    .filter((o) => o.status === 'DELIVERED' || o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  ```
- **Verification Evidence**: Frontend Vitest suite `tests/logicAuditRegression.test.ts` asserts that `CANCELLED`, `PENDING` (unpaid), and `REFUND_PENDING` orders are ignored, and only `DELIVERED` or `PAID` orders contribute to the total.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 6: CartDrawer 2H Option and Phone/Name/Address Validation
- **Specification**: The slide-out cart drawer must offer a 2H delivery checkbox and enforce non-empty, formatted customer name, phone number, and delivery address.
- **Audited Code** (`frontend/src/components/cart/CartDrawer.tsx:288-297, 436-476`):
  Enforces `phone.trim().length >= 10`, `customerName.trim() !== ''`, and `shippingAddress.trim() !== ''`. Includes UI toggle for 2H express delivery and validation error states.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 7: ShipperOrderCard Checks `paymentStatus === 'PAID'` Before Recording Online Payment
- **Specification**: Shippers are barred from marking an order paid online or recording cash if the order is already marked `PAID`.
- **Audited Code** (`backend/internal/handler/handlers.go:1150-1207` and `frontend/src/components/shipper/ShipperOrderCard.tsx:42-50, 166-170`):
  Backend `MarkPaid` and `CreatePaymentLink` strictly block role `SHIPPER` with HTTP 403 Forbidden. `ShipperOrderCard.tsx` inspects `order.paymentStatus === 'PAID'` and disables payment action buttons.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 8: Order List Manager Displays "Chờ hoàn tiền" for `REFUND_PENDING`
- **Specification**: The manager order table must render the localized badge "Chờ hoàn tiền" when an order has `REFUND_PENDING` status.
- **Audited Code** (`frontend/src/components/manager/orders/OrderList.tsx:67-73`):
  ```tsx
  case 'REFUND_PENDING':
    return <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200">Chờ hoàn tiền</Badge>;
  ```
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 9: Header Navigation for `SALE` Role and Hydration Guard
- **Specification**: Header renders a "Sale Portal" link when the user role is `SALE` and protects against Next.js SSR hydration mismatches.
- **Audited Code** (`frontend/src/components/MaterialHeader.tsx:36-41, 167, 185-192`):
  Implements `const [mounted, setMounted] = useState(false)` with `useEffect(() => setMounted(true), [])`. When `mounted && user?.role === 'SALE'`, renders a dedicated portal button pointing to `/sale`.
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

#### Item 10: Login Supports Both `from` and `redirect` Parameters
- **Specification**: Login component accepts return URL parameters via either `?from=` or `?redirect=`.
- **Audited Code** (`frontend/src/app/login/page.tsx:105-111`):
  ```typescript
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const redirectParam = search ? (search.get('from') || search.get('redirect')) : null;
  if (redirectParam && redirectParam.startsWith('/')) {
    window.location.href = redirectParam;
    return;
  }
  ```
- **Verdict**: **VERIFIED RESOLVED — Compliant.**

---

## 3. Master Findings Catalog

The table below catalogs all 38 verified defects identified during the comprehensive audit, sorted by severity and categorized by functional area.

| Finding ID | Severity | Subsystem / Area | Affected Files & Lines | Finding Title |
|---|:---:|---|---|---|
| **F-CRIT-01** | **Critical** | Inventory & Orders | `product_repository.go:1181-1196, 1215-1221` | Zero-Stock Approval Check Bypass & Phantom Inventory Creation on Cancellation |
| **F-CRIT-02** | **Critical** | Payments & Integration | `payos.go:1-203`, `handlers.go:1-1218`, `main.go:106-238` | Complete Absence of PayOS Webhook Receiver, Signature Verification & Idempotency |
| **F-CRIT-03** | **Critical** | Shipper Email Pool | `shipper_repository.go:153-158, 269-277`, `main.go:333` | Reclaimed Pool Email Reuse Causes Unique Constraint Collision & DB 500 Failure |
| **F-CRIT-04** | **Critical** | Authentication & Sessions | `auth_handler.go:276-286` | Deactivated Accounts Retain Perpetual Access via Refresh Token Endpoint |
| **F-CRIT-05** | **Critical** | Authentication & SSO | `sso_handler.go:102-113` | Deactivated Users Can Completely Bypass Account Suspension via Google SSO |
| **F-CRIT-06** | **Critical** | Sales & Inventory | `sale_repository.go:1606-1622` | Missing Row-Level Locks (`FOR UPDATE`) on Products During Quote Conversion |
| **F-HIGH-01** | **High** | RBAC & Authorization | `handlers.go:1055-1067`, `main.go:151` | Broken Object-Level Authorization (IDOR) on Order Payment Status Endpoint |
| **F-HIGH-02** | **High** | Payments & Data Integrity | `handlers.go:979-984, 1012`, `payos.go:174-202` | PayOS OrderCode Overwrite Discards In-Flight Customer Payments on Modal Reopen |
| **F-HIGH-03** | **High** | Concurrency & Logistics | `product_repository.go:1241-1264` | Phantom Read Race Condition in Shipper Capacity Check Exceeds 5-Order Limit |
| **F-HIGH-04** | **High** | Transactions & Concurrency | `product_repository.go:1153-1196, 1200-1223` | Lock Order Inconsistency (Deadlock) and Silent Restocking Failures in Inventory |
| **F-HIGH-05** | **High** | Authentication & Privacy | `sso_handler.go:114-118` | Sensitive JWT Access & Refresh Tokens Leaked in URL Query Parameters via 307 Redirect |
| **F-HIGH-06** | **High** | COD Settlement & Assets | `shipper_repository.go:261-267` | Shipper Pool Email Reclamation Allows Deactivation with Unremitted Physical COD Cash |
| **F-HIGH-07** | **High** | Sales & Math Precision | `sale_repository.go:1618-1621` | Integer Truncation in Stock Quantity Check Allows Overselling of Fractional Units |
| **F-HIGH-08** | **High** | Sales & Quote Lifecycle | `sale_repository.go:1697-1712` | Manager Quote Approval Lacks Expiration Validation on `PENDING_APPROVAL` Quotes |
| **F-HIGH-09** | **High** | RBAC & Sales Management | `sale_handler.go:264-277`, `sale_repository.go:548-555` | Manager Locked Out from Updating Customer Profiles Due to Nil Scope Check |
| **F-HIGH-10** | **High** | Sales & Cash Accounting | `sale_repository.go:2314-2334` | `AddPaymentNote` Allows Recording Fraudulent Cash Notes on `PAID`/`REFUNDED` Orders |
| **F-HIGH-11** | **High** | Sales & Debt Accounting | `sale_repository.go:2206-2216` | False Outstanding Debt Reported for Online-Paid Orders in `GetPaymentList` |
| **F-HIGH-12** | **High** | Financial Reporting | `sale_repository.go:2415-2421, 2464-2471, 2514-2524` | Sales Performance Reports Include Refunded Orders in Delivered Revenue & Commission |
| **F-HIGH-13** | **High** | Public API & Resilience | `main.go:138`, `chat_handler.go:132-176` | Unauthenticated Public Chat Endpoint Susceptible to DoS, DB Starvation & Quota Exhaustion |
| **F-MED-01** | **Medium** | Payments & Lifecycle | `handlers.go:638-711`, `product_repository.go:1292-1316` | Active PayOS Payment Links Not Cancelled on Order Cancellation or Timeout |
| **F-MED-02** | **Medium** | Input Validation | `handlers.go:514-530`, `product_repository.go:963-966` | Unsanitized Client `Deadline2H` in CreateOrder Handler Allows Arbitrary Future SLA |
| **F-MED-03** | **Medium** | Catalog & Soft-Delete | `product_repository.go:927-928, 1176` | Product Soft-Delete (`is_active = FALSE`) Not Checked During Order Creation or Approval |
| **F-MED-04** | **Medium** | Inventory & Pricing | `product_repository.go:916-923, 946-947, 1190` | Fractional Quantities on Indivisible Units Over-Deduct Inventory and Distort Pricing |
| **F-MED-05** | **Medium** | Concurrency & Orders | `product_repository.go:1670-1687`, `handlers.go:1103, 1204` | Non-Atomic `UpdateOrderPaymentStatus` Allows Race Condition with Order Cancellation |
| **F-MED-06** | **Medium** | Cookie & Session Security | `sso_handler.go:60-67` | OAuth CSRF State Cookie Missing `Secure` Attribute |
| **F-MED-07** | **Medium** | Resource Management | `auth_handler.go:24-27, 84-103` | Unbounded In-Memory Map in Login Rate Limiter Causes DoS via Memory Leak |
| **F-MED-08** | **Medium** | Session Management | `jwt.go:81-112`, `auth_handler.go:411-480` | Stateless JWTs Lack Invalidation on Password Change; Refresh Tokens Lack Family Rotation |
| **F-MED-09** | **Medium** | Delivery Lifecycle | `product_repository.go:1109-1112, 1225-1251` | Inability to Report Delivery Incidents and Inability to Reassign Orders in `SHIPPING` |
| **F-MED-10** | **Medium** | Order Listing RBAC | `handlers.go:406-433` | Fall-Through Fail-Open in `ListOrders` Exposes All Customer Orders on Malformed UUID |
| **F-LOW-01** | **Low** | Database Performance | `product_repository.go:760-762, 798-800, 808-850` | N+1 Query Cascade and Error Swallowing in `loadOrderItems` |
| **F-LOW-02** | **Low** | Input Validation | `handlers.go:507-632`, `product_repository.go:873-875` | Missing Empty-Item and Customer Name Validation Causes HTTP 500 Internal Error |
| **F-LOW-03** | **Low** | Information Disclosure | `auth_handler.go:205-208` | Distinct Login Error Message for Google-Linked Accounts Enables User Enumeration |
| **F-LOW-04** | **Low** | Input Validation | `auth_handler.go:113-118` | Missing Email Format Validation on Registration Accepts Non-RFC 5322 Strings |
| **F-LOW-05** | **Low** | Security Edge Case | `auth_handler.go:127-131, 435-438` | Missing Password Maximum Length Limit (Bcrypt Silently Truncates at 72 Bytes) |
| **F-LOW-06** | **Low** | Cryptographic Hygiene | `jwt.go:28-30`, `main.go:51-54` | Absence of Minimum Secret Key Length Enforcement (>= 32 Bytes) for HMAC-SHA256 |
| **F-LOW-07** | **Low** | User Repository Integrity | `user_repository.go:83-88` | `UpdateProfile` RETURNING Clause Omits `is_active` and `must_change_password` |
| **F-LOW-08** | **Low** | Input Validation | `shipper_handler.go:157-172, 191-201` | Missing Length Validation on License Plate and Driver License Causes DB 500 |
| **F-LOW-09** | **Low** | Database Schema | `000010_shipper_applications.up.sql:11` | Missing Database Index on `shipper_applications.phone` Causes Sequential Scans |

---

## 4. Detailed Findings & Concrete Remediation Plans

### 4.1. Critical Severity Findings

---

#### Finding F-CRIT-01: Zero-Stock Approval Check Bypass & Phantom Inventory Creation on Cancellation
- **Subsystem**: Inventory Management / Order State Machine
- **Severity**: **CRITICAL**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:1181-1196` and `1215-1221`
- **Root Cause Analysis**:
  During order approval from `PENDING` to `PACKING`, stock deduction logic is guarded by two conditional blocks:
  ```go
  if currentStock > 0 && float64(currentStock) < it.qty {
      _ = tx.Rollback()
      return nil, domain.ErrInsufficientStock
  }
  if float64(currentStock) >= it.qty && it.qty > 0 {
      _, err = tx.ExecContext(ctx, `
          UPDATE me_supplies.products
          SET stock_quantity = stock_quantity - $1, updated_at = NOW()
          WHERE id = $2 AND stock_quantity >= $1
      `, int(math.Ceil(it.qty)), it.productID)
      ...
  }
  ```
  When physical inventory is completely depleted (`currentStock == 0`), the condition `currentStock > 0` evaluates to `false`. Therefore, the rollback with `domain.ErrInsufficientStock` is skipped. Next, `float64(currentStock) >= it.qty` evaluates to `false` (since `0 >= it.qty` is false for any positive quantity), so no deduction query executes. The order successfully transitions to `PACKING` without error despite having zero warehouse stock.
  
  Subsequently, when this order is cancelled (lines 1215–1221), the restocking logic unconditionally executes:
  ```go
  UPDATE me_supplies.products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2
  ```
  Because no stock was ever deducted, adding `it.qty` to `stock_quantity` creates fabricated phantom inventory in PostgreSQL that never existed in the physical warehouse.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Warehouse stock for product `Cadivi CV 2.5mm²` (`id = cadivi-uuid`) reaches `0`.
  2. Customer places order #ORD-001 for 100 meters. The order is inserted in `PENDING` status.
  3. Manager approves order #ORD-001 to `PACKING`.
  4. Repository executes line 1176: `currentStock = 0`.
  5. Condition at line 1181: `0 > 0 && 0.0 < 100.0` evaluates to `false`. `ErrInsufficientStock` is NOT returned.
  6. Condition at line 1185: `0.0 >= 100.0` evaluates to `false`. SQL `UPDATE` is skipped.
  7. Transaction commits. Order status becomes `PACKING`.
  8. Customer or Manager cancels order #ORD-001.
  9. Restock block at line 1216 executes: `stock_quantity = stock_quantity + 100`.
  10. Database stock for `Cadivi CV 2.5mm²` becomes `100`, creating 100 meters of ghost inventory.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `backend/internal/repository/product_repository.go:1181`, remove `currentStock > 0 &&` so that any stock level less than requested quantity immediately triggers rollback:
     ```go
     if float64(currentStock) < it.qty {
         _ = tx.Rollback()
         return nil, domain.ErrInsufficientStock
     }
     ```
  2. In `UpdateOrderStatusWithDetails`, record whether stock deduction actually succeeded before restocking on cancellation, or verify against the deduction log.
  3. Add a check on `res.RowsAffected() == 1` after stock deduction to prevent silent concurrency mismatches.

---

#### Finding F-CRIT-02: Complete Absence of PayOS Webhook Receiver, Signature Verification & Idempotency
- **Subsystem**: Payments / PayOS Payment Gateway Integration
- **Severity**: **CRITICAL**
- **Exact File & Line Numbers**:
  - `backend/internal/payos/payos.go:1-203`
  - `backend/internal/handler/handlers.go:1-1218`
  - `backend/cmd/server/main.go:106-238`
- **Root Cause Analysis**:
  PayOS is an event-driven payment gateway that delivers asynchronous HTTP POST webhooks to merchant endpoints upon completed bank transfers. 
  Inspection of the backend architecture reveals:
  1. `main.go` registers zero payment webhook endpoints under `/api/v1`. Any webhook dispatched by PayOS receives an immediate HTTP 404 Not Found.
  2. `backend/internal/payos/payos.go` contains `GenerateSignature` for outgoing checkout links, but contains zero functions to compute or verify incoming PayOS HMAC-SHA256 signatures (`VerifyWebhookSignature` is completely missing).
  3. No webhook idempotency table or distributed key cache exists to guard against duplicate webhook replays.
  4. The system relies entirely on client-side polling (`PayOSModal.tsx` querying every 5 seconds) and a 5-minute background reconciliation cron. If a customer scans the QR code on mobile and closes the browser tab, the payment remains unconfirmed for up to 5 minutes, and if the client never returns, it risks timeout cancellation.
- **Concrete Execution Trace / Triggering Scenario**:
  1. PayOS portal is configured to send notifications to `https://api.tdt.vn/api/v1/payment/payos-webhook`.
  2. Customer transfers 5,000,000 VND via VietQR.
  3. PayOS server dispatches HTTP POST with JSON body and HMAC signature to `https://api.tdt.vn/api/v1/payment/payos-webhook`.
  4. Chi router returns HTTP `404 Not Found`.
  5. PayOS retries with exponential backoff and eventually marks the webhook URL as unhealthy/disabled.
  6. The order remains in `UNPAID` status until the 5-minute background cron executes, degrading customer checkout experience and SLA tracking.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `backend/internal/payos/payos.go`, implement canonical key sorting and HMAC-SHA256 signature verification:
     ```go
     func (c *Client) VerifyWebhookSignature(webhookData map[string]any, signature string) bool {
         keys := make([]string, 0, len(webhookData))
         for k := range webhookData {
             if k != "signature" {
                 keys = append(keys, k)
             }
         }
         sort.Strings(keys)
         var sb strings.Builder
         for i, k := range keys {
             if i > 0 {
                 sb.WriteString("&")
             }
             sb.WriteString(fmt.Sprintf("%s=%v", k, webhookData[k]))
         }
         mac := hmac.New(sha256.New, []byte(c.ChecksumKey))
         mac.Write([]byte(sb.String()))
         expectedSig := hex.EncodeToString(mac.Sum(nil))
         return hmac.Equal([]byte(expectedSig), []byte(signature))
     }
     ```
  2. In `backend/internal/handler/handlers.go`, implement `HandlePayOSWebhook(w http.ResponseWriter, req *http.Request)`. Validate signature, parse `orderCode`, assert amount matches `total_amount`, and update `payment_status = 'PAID'` inside a transaction.
  3. Register the route in `backend/cmd/server/main.go`: `r.Post("/payment/payos-webhook", productHandler.HandlePayOSWebhook)`.
  4. Ensure idempotency using an `INSERT ... ON CONFLICT DO NOTHING` on a new `me_supplies.payment_webhook_events` table.

---

#### Finding F-CRIT-03: Reclaimed Shipper Pool Email Reuse Causes Unique Constraint Collision & DB 500 Failure
- **Subsystem**: Shipper Onboarding & Email Pool Management
- **Severity**: **CRITICAL**
- **Exact File & Line Numbers**:
  - `backend/internal/repository/shipper_repository.go:153-158, 269-277`
  - `backend/cmd/server/main.go:333`
- **Root Cause Analysis**:
  In PostgreSQL table `me_supplies.users`, column `email` has a global `UNIQUE` constraint (`main.go:333`).
  The logistics subsystem provisions 20 static pool emails (`shipper01@gmail.com` to `shipper20@gmail.com`).
  When a shipper resigns or is terminated, a manager calls `ReclaimPoolEmail`.
  Lines 269–277 execute:
  ```go
  if _, err := tx.ExecContext(ctx, `UPDATE me_supplies.users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, *pool.AssignedUserID); err != nil {
      return nil, err
  }
  if _, err := tx.ExecContext(ctx, `
      UPDATE me_supplies.shipper_email_pool
      SET status = 'FREE', assigned_user_id = NULL, assigned_at = NULL, updated_at = NOW()
      WHERE email = $1`, email); err != nil {
      return nil, err
  }
  ```
  The deactivated user row in `me_supplies.users` **retains** `email = 'shipper01@gmail.com'`.
  When a new applicant is approved, `ApproveApplication` allocates the freed email and executes:
  ```go
  INSERT INTO me_supplies.users (id, email, full_name, phone, password_hash, role, auth_provider, must_change_password, is_active)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
  ```
  PostgreSQL throws error `23505 (unique_violation: duplicate key value violates unique constraint "users_email_key")`. The transaction rolls back, returning HTTP 500. Reclaimed pool emails can never be re-used, leading to permanent email pool exhaustion.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Driver A is assigned `shipper01@gmail.com`. Row exists in `users` with `id = user-A-uuid, email = shipper01@gmail.com`.
  2. Driver A leaves. Manager calls `POST /api/v1/shipper-email-pool/shipper01@gmail.com/reclaim`.
  3. `ReclaimPoolEmail` marks `users.is_active = FALSE` for Driver A. Email remains `shipper01@gmail.com`.
  4. Pool record `shipper01@gmail.com` transitions to `FREE`.
  5. Applicant B applies for a shipper role. Manager approves application.
  6. Repository executes `INSERT INTO users (email...) VALUES ('shipper01@gmail.com'...)`.
  7. PostgreSQL aborts with `pq: duplicate key value violates unique constraint "users_email_key"`.
  8. Approval fails; applicant cannot be onboarded.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `backend/internal/repository/shipper_repository.go:269`, append an archive suffix to the deactivated user's email address during reclamation:
     ```go
     archivedEmail := fmt.Sprintf("%s_reclaimed_%s", email, pool.AssignedUserID.String()[:8])
     if _, err := tx.ExecContext(ctx, `
         UPDATE me_supplies.users 
         SET email = $1, is_active = FALSE, updated_at = NOW() 
         WHERE id = $2
     `, archivedEmail, *pool.AssignedUserID); err != nil {
         return nil, err
     }
     ```
  2. Alternatively, convert the `users_email_key` constraint to a partial unique index:
     ```sql
     DROP INDEX IF EXISTS me_supplies.users_email_key;
     CREATE UNIQUE INDEX idx_users_active_email ON me_supplies.users (email) WHERE is_active = TRUE;
     ```

---

#### Finding F-CRIT-04: Deactivated Accounts Retain Perpetual Access via Refresh Token Endpoint
- **Subsystem**: Authentication & Session Management
- **Severity**: **CRITICAL**
- **Exact File & Line Numbers**: `backend/internal/handler/auth_handler.go:276-286`
- **Root Cause Analysis**:
  In `HandleLogin` (`auth_handler.go:218-221`), the backend explicitly verifies `if !user.IsActive` and denies access with HTTP 403 `ACCOUNT_DEACTIVATED`.
  However, in `HandleRefreshToken` (`auth_handler.go:276-286`):
  ```go
  user, err := h.userRepo.FindByID(r.Context(), userID)
  if err != nil {
      writeJSONError(w, http.StatusUnauthorized, "Người dùng không tồn tại", "UNAUTHORIZED")
      return
  }

  tokenPair, err := h.jwtService.GenerateTokenPair(user)
  if err != nil {
      writeJSONError(w, http.StatusInternalServerError, "Không thể tạo phiên đăng nhập mới", "INTERNAL_ERROR")
      return
  }
  ```
  `HandleRefreshToken` fetches `user` but never checks `user.IsActive`. Any user or shipper whose account was deactivated or terminated can continue to submit their 7-day refresh token to `POST /api/v1/auth/refresh`, receiving a new 2-hour access token and a new 7-day refresh token perpetually.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Shipper `shipper05@gmail.com` is terminated for gross misconduct; Manager sets `is_active = FALSE`.
  2. Shipper attempts `POST /api/v1/auth/login` and is blocked with `403 ACCOUNT_DEACTIVATED`.
  3. Shipper's mobile app or script calls `POST /api/v1/auth/refresh` sending the existing refresh token.
  4. Server validates JWT refresh claims, finds the user in DB, ignores `is_active = FALSE`, and issues a brand-new access token.
  5. The rogue shipper continues accessing shipper APIs, claiming orders, and viewing customer contact numbers indefinitely.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `backend/internal/handler/auth_handler.go:281`, insert the active status guard:
     ```go
     if !user.IsActive {
         writeJSONError(w, http.StatusForbidden, "Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản lý", "ACCOUNT_DEACTIVATED")
         return
     }
     ```

---

#### Finding F-CRIT-05: Deactivated Users Can Completely Bypass Account Suspension via Google SSO
- **Subsystem**: Authentication & SSO Access Control
- **Severity**: **CRITICAL**
- **Exact File & Line Numbers**: `backend/internal/handler/sso_handler.go:102-113`
- **Root Cause Analysis**:
  In `HandleGoogleCallback`:
  ```go
  user, err := h.userRepo.UpsertGoogleUser(r.Context(), googleUser)
  if err != nil {
      h.errRedirect(w, r, "db_error")
      return
  }

  tokenPair, err := h.jwtService.GenerateTokenPair(user)
  if err != nil {
      h.errRedirect(w, r, "token_generation_failed")
      return
  }
  ```
  `UpsertGoogleUser` retrieves the existing user record, preserving their current `is_active` status (`is_active = FALSE`). However, `HandleGoogleCallback` never checks `user.IsActive` before calling `GenerateTokenPair`. Suspended employees or customers whose local passwords were disabled can bypass suspension entirely simply by clicking "Sign in with Google".
- **Concrete Execution Trace / Triggering Scenario**:
  1. Employee `sales02@tdt.vn` has account deactivated by management (`is_active = FALSE`).
  2. Employee navigates to `/api/v1/auth/google/login` and signs into their Google account.
  3. Google redirects to `HandleGoogleCallback`.
  4. Repository loads the existing user (`is_active = false`).
  5. Handler calls `GenerateTokenPair(user)` unconditionally.
  6. The deactivated employee is redirected to `/auth/callback` with active JWT tokens and full system access.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `backend/internal/handler/sso_handler.go:107`, insert the deactivation check:
     ```go
     if !user.IsActive {
         h.errRedirect(w, r, "account_deactivated")
         return
     }
     ```

---

#### Finding F-CRIT-06: Missing Row-Level Locks (`FOR UPDATE`) on Products During Quote Conversion Enables Inventory Overselling Under Concurrency
- **Subsystem**: Sales / Quotes to Order Conversion & Inventory Concurrency
- **Severity**: **CRITICAL**
- **Exact File & Line Numbers**: `backend/internal/repository/sale_repository.go:1606-1622`
- **Root Cause Analysis**:
  In `ConvertQuoteToOrder`, while the quote row is locked using `SELECT ... FOR UPDATE` (line 1515), the product rows verified at line 1609 are queried without row-level locking:
  ```go
  err = tx.QueryRowContext(ctx, `SELECT base_price, COALESCE(stock_quantity, 0) FROM me_supplies.products WHERE id = $1`, it.productID).Scan(&basePrice, &stockQuantity)
  ```
  `ConvertQuoteToOrder` creates an order in `PENDING` status without decrementing stock (stock decrement in this architecture occurs when transitioning to `PACKING`). Because product rows are not locked, two concurrent quote conversions (or a quote conversion racing against an e-commerce checkout) read identical stock levels, both pass validation, and both convert into orders, resulting in inventory overselling.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Product `Schneider Easy9 MCB 1P 16A` has `stock_quantity = 10`.
  2. Quote Q1 requests 10 units; Quote Q2 requests 10 units.
  3. Client A calls `POST /quotes/Q1/convert`; Transaction TX1 reads `stock_quantity = 10` without `FOR UPDATE`.
  4. Concurrently, Client B calls `POST /quotes/Q2/convert`; Transaction TX2 reads `stock_quantity = 10` without `FOR UPDATE`.
  5. Both transactions evaluate `10 >= 10`, pass validation, insert orders, and commit.
  6. Orders totaling 20 units are committed against 10 units of physical inventory.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `backend/internal/repository/sale_repository.go:1609`, add `FOR UPDATE` to the product query:
     ```go
     err = tx.QueryRowContext(ctx, `
         SELECT base_price, COALESCE(stock_quantity, 0) 
         FROM me_supplies.products 
         WHERE id = $1 
         FOR UPDATE
     `, it.productID).Scan(&basePrice, &stockQuantity)
     ```
  2. To avoid deadlocks across multiple line items, sort product IDs deterministically (e.g. `ORDER BY product_id ASC`) prior to lock acquisition.

---

### 4.2. High Severity Findings

---

#### Finding F-HIGH-01: Broken Object-Level Authorization (IDOR) on Order Payment Status Endpoint Exposes Data to Shippers
- **Subsystem**: RBAC & Authorization
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/handler/handlers.go:1055-1067`, `backend/cmd/server/main.go:151`
- **Root Cause Analysis**:
  In `main.go:151`, `GET /orders/{id}/payment-status` is registered under `RequireAuth` without role restrictions.
  In `handlers.go:1055-1067`:
  ```go
  if claims.Role == domain.RoleCustomer {
      if order.CustomerID == nil || order.CustomerID.String() != claims.UserID {
          writeAPIError(w, http.StatusForbidden, "FORBIDDEN", "...")
          return
      }
  } else if claims.Role == domain.RoleSale {
      saleUUID, parseErr := uuid.Parse(claims.UserID)
      if parseErr != nil || !h.isOrderInSaleScope(req.Context(), saleUUID, order) {
          writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "...")
          return
      }
  }
  ```
  While `Customer` ownership and `Sale` scoping are enforced, there is NO check for `domain.RoleShipper`. When an authenticated shipper queries this endpoint for an arbitrary order ID, execution skips both branches and proceeds directly to line 1069, returning full payment information, PayOS order code, and timestamps.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Shipper S logs in and receives a valid token with role `SHIPPER`.
  2. Shipper queries `GET /api/v1/orders/550e8400-e29b-41d4-a716-446655440000/payment-status`.
  3. Handler skips Customer check (role != Customer) and Sale check (role != Sale).
  4. Handler responds with HTTP 200 containing PayOS transaction data for an order not assigned to Shipper S.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `handlers.go:1067`, add the shipper scoping check:
     ```go
     } else if claims.Role == domain.RoleShipper {
         shipperUUID, parseErr := uuid.Parse(claims.UserID)
         if parseErr != nil || order.ShipperID == nil || *order.ShipperID != shipperUUID {
             writeAPIError(w, http.StatusNotFound, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng")
             return
         }
     }
     ```

---

#### Finding F-HIGH-02: PayOS OrderCode Overwrite Discards In-Flight Customer Payments on Modal Reopen
- **Subsystem**: Payments / Data Integrity & Concurrency
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/handler/handlers.go:979-984, 1012`, `backend/internal/payos/payos.go:174-202`
- **Root Cause Analysis**:
  In `handlers.go:979-984`:
  ```go
  if order.PayOSOrderCode != nil && *order.PayOSOrderCode > 0 {
      _ = h.payosClient.CancelPayment(req.Context(), *order.PayOSOrderCode, "Tạo lại mã thanh toán mới")
  }
  orderCode := time.Now().UnixMicro()
  ...
  _ = h.productRepo.UpdateOrderPaymentLink(req.Context(), order.ID, orderCode, linkData.CheckoutURL)
  ```
  `CancelPayment` in `payos.go` ignores HTTP status errors (`_, _ = io.Copy(io.Discard, resp.Body); return nil`). If a customer has already transferred money to PayOS, PayOS rejects link cancellation. However, `handlers.go` ignores this failure, generates a new `orderCode`, and overwrites `orders.payos_order_code` in the database.
  Subsequent polling queries the new, unpaid `orderCode`. The customer's transfer on the original code is permanently orphaned, and after 24 hours `CancelTimedOutBankTransferOrders` cancels the order for payment timeout.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Customer creates order (Amount: 3,000,000 VND). PayOS code `1730000000000001` is generated.
  2. Customer scans QR code and confirms transfer in banking app.
  3. Network flickers or user reloads page, triggering `CreatePaymentLink`.
  4. PayOS rejects cancellation because the transfer is already settling.
  5. Backend ignores error, generates code `1730000000000002`, and overwrites DB record.
  6. Backend status check polls code `1730000000000002` (Status: UNPAID).
  7. 24 hours later, the order is cancelled. Customer has transferred 3,000,000 VND with no active order.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `handlers.go:CreatePaymentLink`, before generating a new link or attempting cancellation, check `GetPaymentStatus(*order.PayOSOrderCode)`.
  2. If the existing link is `PAID`, update database `payment_status = 'PAID'` and return immediately.
  3. If cancellation fails, abort `CreatePaymentLink` and do not overwrite the existing `orderCode`.

---

#### Finding F-HIGH-03: Phantom Read Race Condition in Shipper Capacity Check Exceeds 5-Order Limit
- **Subsystem**: Shipper Logistics / Concurrency Control
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:1241-1264`
- **Root Cause Analysis**:
  When transitioning an order from `PACKING` to `SHIPPING`, shipper capacity is checked:
  ```go
  var activeShippingCount int
  err = tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM me_supplies.orders WHERE shipper_id = $1 AND status = 'SHIPPING'`, *newShipperID).Scan(&activeShippingCount)
  if activeShippingCount >= 5 {
      _ = tx.Rollback()
      return nil, domain.ErrShipperCapacityExceeded
  }
  ```
  Neither the shipper row in `me_supplies.users` nor the count is locked. Since concurrent order updates target different order rows, their transactions do not lock each other. In PostgreSQL Read Committed mode, two dispatchers assigning orders to the same driver simultaneously read `activeShippingCount = 4`, both pass the check, and both commit, assigning 6 active orders to the driver.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Shipper S currently has 4 active orders in `SHIPPING`.
  2. Dispatcher A assigns Order #1 to Shipper S; TX1 reads count = 4.
  3. Dispatcher B assigns Order #2 to Shipper S; TX2 reads count = 4.
  4. Both TX1 and TX2 pass `activeShippingCount >= 5` validation.
  5. Both commit. Shipper S now has 6 active deliveries, violating the strict capacity limit of 5.
- **Actionable Step-by-Step Remediation Plan**:
  1. Acquire an exclusive row lock on the shipper in `me_supplies.users` before checking count:
     ```go
     err = tx.QueryRowContext(ctx, `SELECT role, is_active FROM me_supplies.users WHERE id = $1 FOR UPDATE`, parsedShipperID).Scan(&shipperRole, &isActive)
     ```
  2. This serializes all order assignments targeting the same shipper.

---

#### Finding F-HIGH-04: Lock Order Inconsistency (Deadlock) and Silent Restocking Failures in Inventory
- **Subsystem**: Transactions, Concurrency & Inventory Accounting
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:1153-1196, 1200-1223`
- **Root Cause Analysis**:
  1. **Lock Inversion Deadlocks**: During order approval to `PACKING`, line items are fetched with `SELECT product_id, quantity FROM order_items WHERE order_id = $1` without `ORDER BY product_id`. Each product is subsequently locked in loop order via `SELECT ... FOR UPDATE`. If Order 1 contains products [A, B] and Order 2 contains products [B, A], concurrent approvals will acquire locks in reverse order, causing PostgreSQL deadlock `40P01`.
  2. **Error Swallowing on Restock**: In lines 1200–1223, `restoreRows, err := tx.QueryContext(...)` checks `if err == nil { ... }`. If an error occurs, it is silently ignored without rollback. Inside the loop, `_, _ = tx.ExecContext(...)` discards errors. Failed inventory replenishment allows orders to be cancelled while leaving inventory unrecovered.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Manager 1 approves Order 10 (Products: Cadivi, Schneider). TX1 locks Cadivi.
  2. Manager 2 approves Order 20 (Products: Schneider, Cadivi). TX2 locks Schneider.
  3. TX1 attempts to lock Schneider (blocks on TX2).
  4. TX2 attempts to lock Cadivi (blocks on TX1).
  5. PostgreSQL terminates one transaction with error `40P01 (deadlock_detected)`.
- **Actionable Step-by-Step Remediation Plan**:
  1. Enforce deterministic lock ordering: query line items with `ORDER BY product_id ASC`.
  2. In restocking logic, check all query and execution errors and call `tx.Rollback()` on failure.

---

#### Finding F-HIGH-05: Sensitive JWT Access & Refresh Tokens Leaked in URL Query Parameters via 307 Redirect
- **Subsystem**: Authentication & SSO Security
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/handler/sso_handler.go:114-118`
- **Root Cause Analysis**:
  In `HandleGoogleCallback`:
  ```go
  redirectURL := fmt.Sprintf(
      "%s/auth/callback?token=%s&refresh=%s",
      h.frontendURL, tokenPair.AccessToken, tokenPair.RefreshToken,
  )
  http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
  ```
  Both `AccessToken` and `RefreshToken` are transmitted as clear URL query parameters in an HTTP 307 Temporary Redirect. Query parameters are permanently stored in browser history, proxy access logs, web server logs, and transmitted via the `Referer` header to third-party assets loaded on `/auth/callback`, exposing credentials to session hijacking.
- **Concrete Execution Trace / Triggering Scenario**:
  1. User authenticates via Google OAuth.
  2. Server responds with 307 redirect containing `?token=eyJ...&refresh=eyJ...`.
  3. Browser loads `/auth/callback`. Third-party analytics or CDN scripts capture the full URL via `document.location` or `Referer`.
  4. Attacker reading proxy or access logs extracts the 7-day refresh token and impersonates the user.
- **Actionable Step-by-Step Remediation Plan**:
  1. Implement single-use Authorization Code exchange: redirect with `?code=auth_code_xyz`, then have frontend exchange the code via POST request to `/api/v1/auth/google/exchange`.
  2. Alternatively, set tokens directly in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.

---

#### Finding F-HIGH-06: Shipper Pool Email Reclamation Allows Deactivation with Unremitted Physical COD Cash
- **Subsystem**: COD Settlement & Asset Protection
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/shipper_repository.go:261-267`
- **Root Cause Analysis**:
  In `ReclaimPoolEmail`:
  ```go
  var activeOrders int
  if err := tx.GetContext(ctx, &activeOrders, `SELECT COUNT(*) FROM me_supplies.orders WHERE shipper_id = $1 AND status IN ('PACKING', 'SHIPPING')`, *pool.AssignedUserID); err != nil {
      return nil, err
  }
  if activeOrders > 0 {
      return nil, domain.ErrReclaimBlocked
  }
  ```
  The guard only counts orders in `PACKING` and `SHIPPING`. When a driver delivers COD orders, the order status transitions to `DELIVERED` with `payment_method = 'COD'` and `cod_remitted = FALSE`. The driver holds physical cash until a manager submits `CreateCODSettlement`. A manager can reclaim the pool email and deactivate the shipper while they still hold millions of VND in unremitted cash.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Driver delivers 5 COD orders, collecting 15,000,000 VND in physical cash. Orders are `DELIVERED`, `cod_remitted = FALSE`.
  2. Driver requests termination. Manager runs `POST /shipper-email-pool/{email}/reclaim`.
  3. `activeOrders` counts 0 (orders are `DELIVERED`, not `PACKING` or `SHIPPING`).
  4. Account is deactivated and email returned to pool before cash is physically counted and remitted.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `shipper_repository.go:262`, block reclamation if unremitted COD orders exist:
     ```go
     var unremittedCOD int
     if err := tx.GetContext(ctx, &unremittedCOD, `
         SELECT COUNT(*) FROM me_supplies.orders 
         WHERE shipper_id = $1 AND status = 'DELIVERED' AND payment_method = 'COD' AND cod_remitted = FALSE
     `, *pool.AssignedUserID); err != nil {
         return nil, err
     }
     if unremittedCOD > 0 {
         return nil, errors.New("shipper has unremitted COD collections")
     }
     ```

---

#### Finding F-HIGH-07: Integer Truncation in Stock Quantity Check Allows Overselling of Fractional Units
- **Subsystem**: Sales / Quotes to Order Conversion
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/sale_repository.go:1618-1621`
- **Root Cause Analysis**:
  In `ConvertQuoteToOrder`:
  ```go
  if stockQuantity < int(it.quantity) {
      _ = tx.Rollback()
      return nil, domain.ErrInsufficientStock
  }
  ```
  `it.quantity` is a `float64` representing fractional quantities (e.g. 10.9 meters of wire). In Go, converting `float64` to `int` truncates the decimal component (`int(10.9) == 10`). If `stockQuantity == 10` and `it.quantity == 10.9`, the check `10 < 10` evaluates to `false`. The order is approved for 10.9 meters despite only 10 meters being physically in stock.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Product `Cadivi CV 2.5mm²` has remaining stock `10`.
  2. Quote requests `10.85` meters.
  3. Go converts `10.85` to `int` -> `10`.
  4. Condition `10 < 10` is `false`. Conversion succeeds.
  5. 10.85m is committed when only 10m exists in stock.
- **Actionable Step-by-Step Remediation Plan**:
  1. Compare floating-point values directly:
     ```go
     if float64(stockQuantity) < it.quantity {
         _ = tx.Rollback()
         return nil, domain.ErrInsufficientStock
     }
     ```

---

#### Finding F-HIGH-08: Manager Quote Approval Lacks Expiration Validation on `PENDING_APPROVAL` Quotes
- **Subsystem**: Sales / Quote Lifecycle State Machine
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/sale_repository.go:1697-1712`
- **Root Cause Analysis**:
  `ApproveQuote` executes:
  ```go
  res, err := r.db.ExecContext(ctx, `
      UPDATE me_supplies.quotes
      SET status = 'ACCEPTED', rejection_reason = NULL, approved_by = $1, approved_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND status = 'PENDING_APPROVAL'
  `, managerID, quoteID)
  ```
  There is no condition checking `valid_until >= NOW()`. While read methods (`GetQuoteByID`, `ListQuotes`) lazily transition expired quotes to `EXPIRED`, `ApproveQuote` executes directly against the database. If a quote expired days or weeks ago, a manager calling `PATCH /quotes/{id}/approve` can still approve it into `ACCEPTED` status, binding the company to stale pricing.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Quote Q has `valid_until = 2026-10-01` with special discount pricing. Status is `PENDING_APPROVAL`.
  2. On 2026-11-05, Manager opens approval queue and approves Quote Q.
  3. SQL update succeeds because `status = 'PENDING_APPROVAL'` matched.
  4. Expired quote is now `ACCEPTED` and can be converted to an order at outdated prices.
- **Actionable Step-by-Step Remediation Plan**:
  1. Enforce expiration in the SQL query:
     ```sql
     UPDATE me_supplies.quotes
     SET status = 'ACCEPTED', rejection_reason = NULL, approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND status = 'PENDING_APPROVAL' AND valid_until >= NOW()
     ```

---

#### Finding F-HIGH-09: Manager Locked Out from Updating Customer Profiles Due to Nil Scope Check
- **Subsystem**: RBAC & Customer Management
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/handler/sale_handler.go:264-277`, `backend/internal/repository/sale_repository.go:548-555`
- **Root Cause Analysis**:
  In `sale_handler.go:264-267`:
  ```go
  var targetSaleID uuid.UUID
  if saleScope != nil {
      targetSaleID = *saleScope
  }
  err = h.saleRepo.UpdateCustomerProfile(req.Context(), customerID, targetSaleID, reqBody)
  ```
  When a user with role `MANAGER` calls `PUT /api/v1/sale/customers/{id}`, `getActorSaleScope` returns `nil` (managers have organization-wide visibility). Thus, `targetSaleID` defaults to `uuid.Nil` (`00000000-0000-0000-0000-000000000000`).
  In `sale_repository.go:549`:
  ```go
  inScope, err := r.IsCustomerInSaleScope(ctx, saleID, customerID)
  if !inScope { return domain.ErrCustomerNotFound }
  ```
  `IsCustomerInSaleScope` queries `customer_assignments` for `sale_id = '00000000-0000-0000-0000-000000000000'`, which always returns `false`. Consequently, Managers can never update customer profiles through this endpoint, always receiving 404 `CUSTOMER_NOT_FOUND`.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Manager views customer profile `/sale/customers/c-uuid`.
  2. Manager edits customer credit limit and clicks Save.
  3. Handler sends `targetSaleID = uuid.Nil`.
  4. Repository returns `domain.ErrCustomerNotFound`.
  5. UI displays 404 error; update fails.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `sale_repository.go:UpdateCustomerProfile`, bypass scope check if `saleID == uuid.Nil`:
     ```go
     if saleID != uuid.Nil {
         inScope, err := r.IsCustomerInSaleScope(ctx, saleID, customerID)
         if err != nil { return err }
         if !inScope { return domain.ErrCustomerNotFound }
     }
     ```

---

#### Finding F-HIGH-10: `AddPaymentNote` Allows Recording Fraudulent Cash Notes on Already `PAID` or `REFUNDED` Orders
- **Subsystem**: Sales / Debt Accounting
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/sale_repository.go:2314-2334`
- **Root Cause Analysis**:
  In `AddPaymentNote`:
  ```go
  if order.Status == domain.OrderStatusCancelled {
      _ = tx.Rollback()
      return nil, errors.New("không thể thêm ghi chú thu tiền cho đơn hàng đã hủy")
  }
  var currentCollected float64
  err = tx.QueryRowContext(ctx, `SELECT COALESCE(SUM(amount), 0) FROM me_supplies.payment_notes WHERE order_id = $1`, orderID).Scan(&currentCollected)
  remaining := math.Max(0, order.TotalAmount-currentCollected)
  if req.Amount > remaining {
      _ = tx.Rollback()
      return nil, domain.ErrPaymentNoteExceedsRemaining
  }
  ```
  `AddPaymentNote` only checks `order.Status == OrderStatusCancelled`. It never checks `order.PaymentStatus`!
  If an order was paid online via PayOS or remitted via COD settlement, `order.PaymentStatus == domain.PaymentStatusPaid`, but zero records exist in `me_supplies.payment_notes`. `currentCollected` returns `0`, and `remaining` equals `order.TotalAmount`. A sales representative can submit payment notes for the entire order value, creating fabricated cash collection entries against orders already settled electronically.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Order ORD-77 (value 50,000,000 VND) is paid via PayOS QR transfer (`payment_status = PAID`).
  2. Rogue sales rep submits `POST /sale/payments/{ORD-77}/notes` with `amount = 50000000`, `method = "TIỀN MẶT"`.
  3. Query finds 0 notes; `remaining = 50,000,000`.
  4. Note is inserted. System records 50M VND in physical cash as collected when it was already received via bank transfer.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `AddPaymentNote`, validate `order.PaymentStatus`:
     ```go
     if order.PaymentStatus == domain.PaymentStatusPaid {
         _ = tx.Rollback()
         return nil, errors.New("đơn hàng đã hoàn tất thanh toán, không thể ghi thêm phiếu thu")
     }
     if order.PaymentStatus == domain.PaymentStatusRefunded || order.PaymentStatus == domain.PaymentStatusRefundPending {
         _ = tx.Rollback()
         return nil, errors.New("đơn hàng đang trong quy trình hoàn tiền, không thể ghi chú thu tiền")
     }
     ```

---

#### Finding F-HIGH-11: False Outstanding Debt Reported for Online-Paid Orders in `GetPaymentList`
- **Subsystem**: Sales / Debt Tracking
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/sale_repository.go:2206-2216`
- **Root Cause Analysis**:
  In `GetPaymentList`:
  ```go
  remaining := math.Max(0, o.TotalAmount-totalNotes)
  items = append(items, domain.SalePaymentItem{
      Order:         *o,
      DaysDelivered: daysDelivered,
      IsOverdue:     isOverdue,
      TotalNotes:    totalNotes,
      RemainingDebt: remaining,
      Notes:         r.loadPaymentNotes(ctx, o.ID),
  })
  ```
  When an order is paid online via PayOS or settled through COD, `o.PaymentStatus == domain.PaymentStatusPaid`. Because no notes exist in `payment_notes`, `totalNotes` is `0`, and `remaining` is computed as `o.TotalAmount`. In the sales debt management UI, orders that have been 100% paid online are displayed as having unpaid customer debt equal to the full invoice amount.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Customer pays 20,000,000 VND for order ORD-12 via PayOS.
  2. Order is delivered (`status = DELIVERED`, `payment_status = PAID`).
  3. Sales rep opens `/sale/payments`.
  4. Row shows `order.paymentStatus = 'PAID'`, but `remainingDebt = 20,000,000`.
  5. Rep contacts customer demanding 20,000,000 VND, damaging customer trust.
- **Actionable Step-by-Step Remediation Plan**:
  1. In `GetPaymentList`, set `RemainingDebt = 0` if `PaymentStatus == PAID`:
     ```go
     remaining := 0.0
     if o.PaymentStatus != domain.PaymentStatusPaid {
         remaining = math.Max(0, o.TotalAmount-totalNotes)
     }
     ```

---

#### Finding F-HIGH-12: Sales Performance Reports Include Refunded Orders in Delivered Revenue & Commission Base
- **Subsystem**: Financial Reporting & Commission Calculation
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/internal/repository/sale_repository.go:2415-2421, 2464-2471, 2514-2524`
- **Root Cause Analysis**:
  In `GetReportSummary`:
  ```sql
  -- Total delivered revenue
  SELECT COALESCE(SUM(o.total_amount), 0)
  FROM me_supplies.orders o
  WHERE %s AND o.status = 'DELIVERED'
  ```
  Neither the total delivered revenue query, the revenue by date query, nor the revenue by brand query checks `o.payment_status`. When a customer cancels or returns an order post-delivery and receives a refund (`payment_status = 'REFUNDED'`), `o.status` remains `'DELIVERED'`. The report continues to count refunded orders as revenue, artificially inflating reported sales performance and commission payouts.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Order ORD-99 (value 100,000,000 VND) is delivered.
  2. Customer discovers defects and is refunded (`payment_status = REFUNDED`).
  3. At month-end, `GetReportSummary` includes the 100M VND order in `TotalDeliveredRevenue`.
  4. Sales rep receives commission on refunded revenue.
- **Actionable Step-by-Step Remediation Plan**:
  1. Append `AND o.payment_status = 'PAID'` (or `AND o.payment_status NOT IN ('REFUNDED', 'REFUND_PENDING')`) to all revenue aggregation queries.

---

#### Finding F-HIGH-13: Unauthenticated Public Chat Endpoint Susceptible to DoS, DB Starvation & Quota Exhaustion
- **Subsystem**: Chat Handler & Public API Security
- **Severity**: **HIGH**
- **Exact File & Line Numbers**: `backend/cmd/server/main.go:138`, `backend/internal/handler/chat_handler.go:132-176`
- **Root Cause Analysis**:
  In `main.go:138`, `POST /chat` is registered as a public endpoint without authentication:
  ```go
  r.Post("/chat", chatHandler.HandleChat)
  ```
  In `chat_handler.go`:
  1. Every incoming request executes: `allProducts, err := h.productRepo.ListProducts(ctx, 1000, 0)`.
  2. It connects to the external Google Gemini API with a 25-second timeout.
  3. No rate limiter or IP throttle is applied.
  4. No `http.MaxBytesReader` bounds the request body.
  An attacker can flood `/api/v1/chat` with concurrent requests. The 20-connection PostgreSQL pool is quickly exhausted, starving checkout and login transactions, while external Gemini API quotas and budgets are drained.
- **Concrete Execution Trace / Triggering Scenario**:
  1. Attacker sends 50 concurrent `POST /api/v1/chat` requests with 10MB JSON payloads.
  2. Server attempts to parse bodies and opens 50 concurrent database queries for 1,000 products.
  3. PostgreSQL connection pool (max 20) exhausts instantly.
  4. Legitimate e-commerce checkouts fail with connection timeout errors.
- **Actionable Step-by-Step Remediation Plan**:
  1. Wrap `/chat` with IP-based rate limiting (e.g., 10 req/minute per IP).
  2. Apply `http.MaxBytesReader(w, req.Body, 16*1024)` to cap payload size at 16KB.
  3. Cache the product catalog in memory with a 5-minute TTL rather than querying 1,000 rows on every user prompt.

---

### 4.3. Medium Severity Findings

---

#### Finding F-MED-01: Active PayOS Payment Links Not Cancelled on Order Cancellation or Timeout
- **Subsystem**: Payments / Order Lifecycle
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/handler/handlers.go:638-711`, `backend/internal/repository/product_repository.go:1292-1316, 1720-1744`
- **Root Cause Analysis**:
  When an order transitions to `CANCELLED` via `UpdateOrderStatusWithDetails` or `CancelTimedOutBankTransferOrders`, `orders.status` is updated to `CANCELLED`. However, the backend never invokes `h.payosClient.CancelPayment` to close the open payment link on PayOS. The QR code remains active on PayOS servers. If the customer subsequently transfers funds using the cached QR code, PayOS accepts the payment. Because the local order is already `CANCELLED`, background reconciliation ignores it, leaving the customer charged and uncredited.
- **Remediation Plan**:
  In `handlers.go:UpdateOrderStatus` and `CancelTimedOutBankTransferOrders`, if `order.PayOSOrderCode != nil`, invoke `h.payosClient.CancelPayment(ctx, *order.PayOSOrderCode, "Order cancelled")`.

---

#### Finding F-MED-02: Unsanitized Client `Deadline2H` in CreateOrder Handler Allows Arbitrary Future SLA
- **Subsystem**: 2H Delivery SLA / Input Validation
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/handler/handlers.go:514-530`, `backend/internal/repository/product_repository.go:963-966`
- **Root Cause Analysis**:
  In `handlers.go:514-530`, `CreateOrder` sanitizes client input by clearing `Status`, `PaymentStatus`, `ShipperID`, `DeliveredAt`, etc., but fails to reset `Deadline2H`. In `product_repository.go:963`, the server checks `if order.Is2H && order.Deadline2H == nil`. If an attacker passes a pre-populated `deadline2h` timestamp in the JSON payload, the server retains it, allowing arbitrary delivery deadlines (e.g. 1 year in the future) that bypass SLA tracking.
- **Remediation Plan**:
  In `handlers.go:CreateOrder`, explicitly set `order.Deadline2H = nil`. In `product_repository.go`, compute `order.Deadline2H = order.CreatedAt.Add(2 * time.Hour)` unconditionally when `order.Is2H` is true.

---

#### Finding F-MED-03: Product Soft-Delete (`is_active = FALSE`) Not Checked During Order Creation or Approval
- **Subsystem**: Product Catalog & Order Processing
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:927-928, 1176`
- **Root Cause Analysis**:
  In `CreateOrderTx` (line 927) and `UpdateOrderStatusWithDetails` (line 1176), product verification queries check `stock_quantity` but omit `is_active`. When an administrator soft-deletes a product (`is_active = FALSE`), customers can continue placing orders for the discontinued product, and managers can approve them into fulfillment.
- **Remediation Plan**:
  Append `AND COALESCE(is_active, TRUE) = TRUE` to product queries in `CreateOrderTx` and `UpdateOrderStatusWithDetails`.

---

#### Finding F-MED-04: Fractional Quantities on Indivisible Units Over-Deduct Inventory and Distort Pricing
- **Subsystem**: Product Inventory & Pricing Validation
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:916-923, 946-947, 1190`
- **Root Cause Analysis**:
  `order_items.quantity` allows fractional values (`DECIMAL(12,4)`). Products have discrete unit types such as `COUNT` (Cái), `BOX` (Hộp), and `DEVICE` (Thiết bị). If a customer orders `0.001` units of an aptomat priced at 200,000 VND, the price charged is `200 VND`. During stock deduction at line 1190, the server executes `int(math.Ceil(0.001))`, which rounds up to `1` full integer unit. An attacker can drain physical units from inventory for negligible amounts.
- **Remediation Plan**:
  In `CreateOrderTx`, check product `unit_type`. If `unit_type` is discrete (`COUNT`, `DEVICE`, `BOX`), reject non-integer quantities: `if math.Mod(item.Quantity, 1.0) != 0 { return ErrInvalidQuantity }`.

---

#### Finding F-MED-05: Non-Atomic `UpdateOrderPaymentStatus` Allows Race Condition with Order Cancellation
- **Subsystem**: Transactions & Concurrency
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:1670-1687`, `backend/internal/handler/handlers.go:1103, 1204`
- **Root Cause Analysis**:
  `UpdateOrderPaymentStatus` updates `payment_status` without checking `version` or locking the order row. If a customer cancels an order concurrently while PayOS polling detects payment, `UpdateOrderPaymentStatus` overwrites `payment_status = 'PAID'` on a cancelled order without incrementing version or triggering `REFUND_PENDING` routing.
- **Remediation Plan**:
  Include `AND status != 'CANCELLED' AND version = $4` in `UpdateOrderPaymentStatus` and increment `version = version + 1`.

---

#### Finding F-MED-06: OAuth CSRF State Cookie Missing `Secure` Attribute
- **Subsystem**: Authentication & Cookie Security
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/handler/sso_handler.go:60-67`
- **Root Cause Analysis**:
  In `HandleGoogleLogin`:
  ```go
  http.SetCookie(w, &http.Cookie{
      Name:     oauthStateCookie,
      Value:    state,
      Path:     "/",
      MaxAge:   600,
      HttpOnly: true,
      SameSite: http.SameSiteLaxMode,
  })
  ```
  The cookie omits `Secure: true`. Over non-HTTPS or mixed network environments, the CSRF mitigation cookie can be sniffed or injected by network adversaries.
- **Remediation Plan**:
  Set `Secure: true` in production or when `strings.HasPrefix(h.frontendURL, "https://")`.

---

#### Finding F-MED-07: Unbounded In-Memory Map in Login Rate Limiter Causes DoS via Memory Leak
- **Subsystem**: Authentication & Resource Management
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/handler/auth_handler.go:24-27, 84-103`
- **Root Cause Analysis**:
  `failedLoginMap` is an unbounded package-level `map[string]*loginAttempt`. Keys are only purged when a user successfully logs in or after 15 minutes if `>= 5` attempts occurred. An unauthenticated attacker sending millions of random email addresses will cause unbounded memory growth, leading to process crash via OOM.
- **Remediation Plan**:
  Replace with a fixed-size LRU cache (e.g. 20,000 entries) or a distributed Redis rate limiter with automatic TTL key expiration.

---

#### Finding F-MED-08: Stateless JWTs Lack Invalidation on Password Change; Refresh Tokens Lack Family Rotation
- **Subsystem**: Authentication & Session Management
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/auth/jwt.go:81-112`, `backend/internal/handler/auth_handler.go:411-480`
- **Root Cause Analysis**:
  JWT validation is purely stateless. When a user changes their password following a suspected breach, existing access tokens (up to 2 hours) and refresh tokens (up to 7 days) remain fully valid. Furthermore, refresh tokens can be re-used repeatedly without automatic family rotation.
- **Remediation Plan**:
  Add `token_version INT DEFAULT 1` to `users`. Embed `token_version` in JWT claims. Increment `token_version` upon password change or logout, invalidating all outstanding tokens immediately.

---

#### Finding F-MED-09: Inability to Report Delivery Incidents and Inability to Reassign Orders in `SHIPPING`
- **Subsystem**: Delivery Lifecycle State Machine
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:1109-1112, 1225-1251`
- **Root Cause Analysis**:
  Shippers are strictly blocked from cancelling orders (`ErrCancelNotAllowedForShipper`), and `incident_detail` is only stored on cancellation. Furthermore, orders in `SHIPPING` cannot have their `shipper_id` reassigned. If a driver suffers a vehicle breakdown or accident, they cannot record an incident, and managers cannot reassign the order to an alternate driver without cancelling the entire order.
- **Remediation Plan**:
  1. Introduce an `INCIDENT` sub-status or update mechanism allowing drivers to log incident notes while retaining `SHIPPING` status.
  2. Permit managers to reassign `shipper_id` on active `SHIPPING` orders with audit logging.

---

#### Finding F-MED-10: Fall-Through Fail-Open in `ListOrders` Exposes All Customer Orders on Malformed UUID
- **Subsystem**: Order Listing Authorization
- **Severity**: **MEDIUM**
- **Exact File & Line Numbers**: `backend/internal/handler/handlers.go:406-433`
- **Root Cause Analysis**:
  In `ListOrders`:
  ```go
  if claims.Role == domain.RoleShipper {
      if parsedID, err := uuid.Parse(claims.UserID); err == nil {
          orders, err := h.productRepo.ListOrdersByShipper(...)
          ...
          return
      }
  }
  ...
  orders, err := h.productRepo.ListOrders(req.Context(), customerID, limit, offset)
  ```
  If `uuid.Parse(claims.UserID)` produces an error, execution falls through to line 425 with `customerID == nil`. The server executes an unconstrained `SELECT` query and returns all customer orders across the platform to the caller.
- **Remediation Plan**:
  Fail closed: if `uuid.Parse` fails, immediately return HTTP 401 Unauthorized:
  ```go
  if claims.Role == domain.RoleShipper {
      parsedID, err := uuid.Parse(claims.UserID)
      if err != nil {
          writeAPIError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Mã shipper không hợp lệ")
          return
      }
      ...
  }
  ```

---

### 4.4. Low Severity Findings

---

#### Finding F-LOW-01: N+1 Query Cascade and Error Swallowing in `loadOrderItems`
- **Subsystem**: Database Repository / Performance
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/repository/product_repository.go:760-762, 798-800, 808-850`
- **Root Cause Analysis**:
  In `ListOrders` and `ListOrdersByShipper`, orders are loaded via a single query, followed by a loop calling `orders[i].Items = r.loadOrderItems(ctx, orders[i].ID)`. Listing 100 orders results in 101 round-trips to PostgreSQL, exhausting connection pool slots. Furthermore, `loadOrderItems` swallows query errors (`if err != nil { return items }`), rendering empty items rather than reporting errors.
- **Remediation Plan**:
  Batch-load order items using `WHERE order_id = ANY($1)` and assemble in memory.

---

#### Finding F-LOW-02: Missing Empty-Item and Customer Name Validation Causes HTTP 500 Internal Error
- **Subsystem**: Input Validation
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/handler/handlers.go:507-632`, `backend/internal/repository/product_repository.go:873-875`
- **Root Cause Analysis**:
  `CreateOrder` does not validate `len(order.Items) > 0` or customer name length. Sending `{"items": []}` triggers a repository error that falls through to `500 INTERNAL_ERROR` rather than `400 BAD_REQUEST`. Similarly, customer names exceeding 100 characters trigger a database column overflow error.
- **Remediation Plan**:
  Validate `len(order.Items) > 0` and string bounds upfront in `handlers.go`.

---

#### Finding F-LOW-03: Distinct Login Error Message for Google-Linked Accounts Enables User Enumeration
- **Subsystem**: Information Disclosure
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/handler/auth_handler.go:205-208`
- **Root Cause Analysis**:
  Returning `"Tài khoản này được đăng ký bằng Google. Vui lòng bấm Đăng nhập với Google."` reveals to an unauthenticated attacker that the queried email belongs to an existing user.
- **Remediation Plan**:
  Return generic error `"Email hoặc mật khẩu không chính xác"`.

---

#### Finding F-LOW-04: Missing Email Format Validation on Registration Accepts Non-RFC 5322 Strings
- **Subsystem**: Input Validation
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/handler/auth_handler.go:113-118`
- **Root Cause Analysis**:
  Registration only checks `cleanEmail == ""`. Invalid email formats such as `"user@"` or `"plainaddress"` are accepted and inserted.
- **Remediation Plan**:
  Validate syntax using `net/mail.ParseAddress(cleanEmail)`.

---

#### Finding F-LOW-05: Missing Password Maximum Length Limit (Bcrypt Silently Truncates at 72 Bytes)
- **Subsystem**: Security Edge Cases
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/handler/auth_handler.go:127-131, 435-438`
- **Root Cause Analysis**:
  Bcrypt algorithms discard input bytes after 72. Passwords sharing the first 72 bytes produce identical hashes. Unbounded inputs also expose hashing functions to CPU exhaustion.
- **Remediation Plan**:
  Enforce `len(req.Password) <= 72`.

---

#### Finding F-LOW-06: Absence of Minimum Secret Key Length Enforcement (>= 32 Bytes) for HMAC-SHA256
- **Subsystem**: Cryptographic Hygiene
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/auth/jwt.go:28-30`, `backend/cmd/server/main.go:51-54`
- **Root Cause Analysis**:
  `NewJWTService` accepts any non-empty string. Weak secrets (e.g. `"secret"`) expose HMAC-SHA256 tokens to offline dictionary recovery.
- **Remediation Plan**:
  Enforce `if len(secret) < 32 { log.Fatal("JWT_SECRET must be at least 32 bytes") }`.

---

#### Finding F-LOW-07: `UpdateProfile` RETURNING Clause Omits `is_active` and `must_change_password`
- **Subsystem**: Data Integrity
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/repository/user_repository.go:83-88`
- **Root Cause Analysis**:
  In `UpdateProfile`, the RETURNING clause omits `is_active` and `must_change_password`. The returned in-memory struct sets these boolean fields to Go zero-values (`false`).
- **Remediation Plan**:
  Add `is_active, must_change_password` to the RETURNING clause.

---

#### Finding F-LOW-08: Missing Length Validation on License Plate and Driver License Causes DB 500
- **Subsystem**: Input Validation
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/internal/handler/shipper_handler.go:157-172, 191-201`
- **Root Cause Analysis**:
  Strings exceeding column definitions (`license_plate VARCHAR(20)`, `driver_license VARCHAR(50)`) are not checked in handler logic, causing database truncation 500 errors.
- **Remediation Plan**:
  Validate string lengths before database insertion.

---

#### Finding F-LOW-09: Missing Database Index on `shipper_applications.phone` Causes Sequential Scans
- **Subsystem**: Database Schema & Performance
- **Severity**: **LOW**
- **Exact File & Line Numbers**: `backend/migrations/000010_shipper_applications.up.sql:11`
- **Root Cause Analysis**:
  Table `shipper_applications` lacks an index on `phone`, forcing full table scans on applicant phone lookups and active application checks.
- **Remediation Plan**:
  Add `CREATE INDEX IF NOT EXISTS idx_shipper_applications_phone ON me_supplies.shipper_applications(phone);`.

---

## 5. Concurrency & Transaction Integrity Deep Dive

### 5.1. Locking Semantics & Row-Level Gaps (`FOR UPDATE`)
A rigorous examination of concurrency controls revealed significant discrepancies between intended isolation semantics and actual SQL locking behaviors:
1. **Quote Conversion Concurrency Gap (`sale_repository.go:1609`)**: While `quotes` is locked with `FOR UPDATE`, `products` is queried without row locking. Concurrent quote conversions bypass inventory ceilings.
2. **Shipper Capacity Check Concurrency Gap (`product_repository.go:1241, 1254`)**: The count query `SELECT COUNT(*) FROM orders WHERE shipper_id = $1 AND status = 'SHIPPING'` does not lock the shipper's user row, allowing parallel order assignments to exceed the 5-order limit.
3. **Optimistic Locking Incomplete Coverage (`product_repository.go:1670`)**: `UpdateOrderPaymentStatus` does not check `version = $x` or increment `version`, enabling dirty writes over concurrent cancellations.

### 5.2. Deadlock Vulnerabilities in Inventory Workflows
In `UpdateOrderStatusWithDetails` (`product_repository.go:1153-1196`), order line items are retrieved without deterministic ordering:
```sql
SELECT product_id, quantity FROM me_supplies.order_items WHERE order_id = $1
```
Locks on `products` rows are subsequently acquired sequentially via `SELECT ... FOR UPDATE`. When two concurrent order approvals contain intersecting products in differing row order, transactions acquire locks in opposing sequences, triggering PostgreSQL deadlock error `40P01`.
**Remediation**: Append `ORDER BY product_id ASC` to all multi-row queries preceding `FOR UPDATE` locking.

### 5.3. Transaction Rollback Integrity
The codebase demonstrates excellent transaction discipline in `CreateCODSettlement` and `CreateOrderTx`. However, critical rollback omissions exist in:
- `product_repository.go:1200-1223`: Stock restoration on cancellation discards query and execution errors (`_, _ = tx.ExecContext`), allowing partial commits.
- `handlers.go:979-984`: PayOS order code overwrite occurs after a swallowed cancellation failure, desynchronizing the database state from the gateway.

---

## 6. RBAC & Authorization Matrix

The table below delineates the verified authorization policy across the platform's four primary roles plus unauthenticated visitors.

| Endpoint / Action | Anonymous | Customer | Manager | Shipper | Sale |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /api/v1/auth/login` | **Allowed** | **Allowed** | **Allowed** | **Allowed** | **Allowed** |
| `POST /api/v1/auth/refresh` | **Allowed** (Token) | **Allowed** | **Allowed** | **Allowed** | **Allowed** |
| `GET /api/v1/products` | **Allowed** | **Allowed** | **Allowed** | **Allowed** | **Allowed** |
| `POST /api/v1/orders` | Blocked (401) | **Allowed** | **Allowed** | Blocked (403) | Blocked (403) |
| `GET /api/v1/orders` | Blocked (401) | Owned Only | All Orders | Assigned Only (F-MED-10) | Scoped Only |
| `GET /api/v1/orders/{id}/payment-status` | Blocked (401) | Owned Only | All Orders | **Vulnerable (F-HIGH-01)** | Scoped Only |
| `PATCH /api/v1/orders/{id}/status` | Blocked (401) | Cancel Only | All Transitions | Deliver / Pod Only | Blocked (403) |
| `POST /api/v1/orders/{id}/mark-paid` | Blocked (401) | Blocked (403) | **Allowed** | Blocked (403) | Blocked (403) |
| `POST /api/v1/orders/{id}/payment-link` | Blocked (401) | Owned Only | **Allowed** | Blocked (403) | Blocked (403) |
| `POST /api/v1/cod-settlements` | Blocked (401) | Blocked (403) | **Allowed** | Blocked (403) | Blocked (403) |
| `POST /api/v1/shipper-email-pool/{email}/reclaim` | Blocked (401) | Blocked (403) | **Allowed** | Blocked (403) | Blocked (403) |
| `GET /api/v1/sale/quotes` | Blocked (401) | Blocked (403) | All Quotes | Blocked (403) | Scoped Only |
| `PATCH /api/v1/sale/quotes/{id}/approve` | Blocked (401) | Blocked (403) | **Allowed** | Blocked (403) | Blocked (403) |
| `PUT /api/v1/sale/customers/{id}` | Blocked (401) | Blocked (403) | **Broken 404 (F-HIGH-09)** | Blocked (403) | Scoped Only |
| `POST /api/v1/sale/payments/{id}/notes` | Blocked (401) | Blocked (403) | **Allowed** | Blocked (403) | Scoped Only |
| `POST /api/v1/chat` | **Vulnerable (F-HIGH-13)**| **Allowed** | **Allowed** | **Allowed** | **Allowed** |

---

## 7. Prioritized Remediation Roadmap

The remediation strategy is divided into three execution phases prioritized by risk impact and implementation complexity:

```
========================================================================================
REMEDIATION TIMELINE & ROADMAP
========================================================================================
[Phase 1: Sprint 1] Immediate Critical Hotfixes (Zero-Stock, Auth Bypass, Pool Collision)
   ├── F-CRIT-01: Fix zero-stock approval bypass & phantom stock generation
   ├── F-CRIT-03: Archive email on shipper reclamation to unblock applicant approval
   ├── F-CRIT-04 & F-CRIT-05: Enforce user.IsActive check in refresh token & Google SSO
   ├── F-CRIT-06: Add FOR UPDATE on products in ConvertQuoteToOrder
   └── F-HIGH-03: Row-level lock shipper in users during capacity check

[Phase 2: Sprint 2] Short-Term Hardening (PayOS Webhook, RBAC Gaps, Financial Debt)
   ├── F-CRIT-02: Implement PayOS webhook receiver with HMAC signature verification
   ├── F-HIGH-01: Plug Shipper IDOR vulnerability on order payment status
   ├── F-HIGH-02: Block PayOS OrderCode overwrite on active/paid transfers
   ├── F-HIGH-06: Block email reclamation if unremitted physical COD cash exists
   ├── F-HIGH-08: Enforce valid_until >= NOW() on quote approval
   ├── F-HIGH-09: Fix manager customer profile update 404
   ├── F-HIGH-10 & F-HIGH-11: Validate paymentStatus in payment notes and debt list
   └── F-HIGH-12: Exclude refunded orders from revenue & commission reports

[Phase 3: Sprint 3] Architectural Hardening & API Resilience (Rate Limiting, Ledgers)
   ├── F-HIGH-13: Add rate limiting, body size caps, and caching to public chat endpoint
   ├── F-MED-07: Replace unbounded in-memory rate limiter with Redis/LRU cache
   ├── F-MED-08: Implement token_version for instant JWT revocation upon password change
   ├── F-MED-09: Add delivery incident reporting and active shipping reassignment
   └── F-LOW-01: Batch-load order items to eliminate N+1 queries in listing APIs
========================================================================================
```

---

## 8. Verification Methodology & Reproduction Commands

To independently reproduce, verify, and validate all observations and findings documented in this report:

### 8.1. Running the Go Backend Test Suite
Ensure that the baseline Go test suite executes cleanly:
```powershell
cd C:\Users\admin\Downloads\QUANLYBANHANG-Ver1\backend
go test -v ./internal/...
```

### 8.2. Independent Code Inspection Checkpoints
1. **Zero-Stock Bypass (F-CRIT-01)**:
   Inspect `backend/internal/repository/product_repository.go` at lines 1181–1196. Note that `currentStock > 0` evaluates to false when `currentStock == 0`, skipping `ErrInsufficientStock`. Note that line 1216 unconditionally increments `stock_quantity` on cancellation.
2. **Missing PayOS Webhook (F-CRIT-02)**:
   Inspect `backend/cmd/server/main.go:106-238` and `backend/internal/payos/payos.go`. Confirm absence of webhook routes and signature verification logic.
3. **Reclaimed Pool Email Collision (F-CRIT-03)**:
   Inspect `backend/internal/repository/shipper_repository.go:153-158` and lines 269–277. Confirm that `ReclaimPoolEmail` leaves the reclaimed email in `users`, and `ApproveApplication` executes an unconditional `INSERT` that collides with `users_email_key`.
4. **Deactivated Token Refresh (F-CRIT-04)**:
   Inspect `backend/internal/handler/auth_handler.go:276-286`. Confirm `user.IsActive` is never verified.
5. **Google SSO Deactivation Bypass (F-CRIT-05)**:
   Inspect `backend/internal/handler/sso_handler.go:102-113`. Confirm `user.IsActive` is never verified.
6. **Shipper IDOR on Payment Status (F-HIGH-01)**:
   Inspect `backend/internal/handler/handlers.go:1055-1067`. Confirm absence of `domain.RoleShipper` check.
7. **Manager Customer Profile 404 (F-HIGH-09)**:
   Inspect `backend/internal/handler/sale_handler.go:264-267` and `backend/internal/repository/sale_repository.go:548-555`. Confirm that `targetSaleID == uuid.Nil` causes `IsCustomerInSaleScope` to return `false`.

### 8.3. Baseline Non-Bug Integration Verifications
Execute the targeted baseline verification tests:
```powershell
cd C:\Users\admin\Downloads\QUANLYBANHANG-Ver1\backend
go test -v -run "TestOrderCancellation_PaymentStatusTransitions|TestCreateOrder_2HDeadlineCalculation|TestCODSettlement_And_ListShippers" ./internal/repository/...
```
Verify frontend baseline tests:
```powershell
cd C:\Users\admin\Downloads\QUANLYBANHANG-Ver1\frontend
npx vitest run tests/logicAuditRegression.test.ts
```

---

*End of Comprehensive Backend Security & Logic Audit Report.*
