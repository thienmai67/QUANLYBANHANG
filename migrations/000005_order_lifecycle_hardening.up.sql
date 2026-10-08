SET search_path TO me_supplies;

-- 1. Migrate existing order statuses before updating check constraint
UPDATE orders SET status = 'PACKING' WHERE status = 'CONFIRMED';
UPDATE orders SET status = 'SHIPPING' WHERE status = 'SHIPPED';

-- 2. Update CHECK constraint for orders.status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'));

-- 3. Add lifecycle, assignment, 2h flags and optimistic locking columns
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS shipper_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
    ADD COLUMN IF NOT EXISTS is_2h BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deadline_2h TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipper_id ON orders(shipper_id);
