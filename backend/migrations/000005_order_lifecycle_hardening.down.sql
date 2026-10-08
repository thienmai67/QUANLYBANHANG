SET search_path TO me_supplies;

-- 1. Drop indexes
DROP INDEX IF EXISTS idx_orders_shipper_id;
DROP INDEX IF EXISTS idx_orders_customer_id;

-- 2. Drop added columns
ALTER TABLE orders
    DROP COLUMN IF EXISTS version,
    DROP COLUMN IF EXISTS cancellation_reason,
    DROP COLUMN IF EXISTS delivered_at,
    DROP COLUMN IF EXISTS deadline_2h,
    DROP COLUMN IF EXISTS is_2h,
    DROP COLUMN IF EXISTS payment_method,
    DROP COLUMN IF EXISTS shipper_id,
    DROP COLUMN IF EXISTS customer_id;

-- 3. Revert order statuses: PACKING -> CONFIRMED, SHIPPING -> SHIPPED
UPDATE orders SET status = 'CONFIRMED' WHERE status = 'PACKING';
UPDATE orders SET status = 'SHIPPING' WHERE status = 'SHIPPING';

-- 4. Revert CHECK constraint to old enum
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'));
