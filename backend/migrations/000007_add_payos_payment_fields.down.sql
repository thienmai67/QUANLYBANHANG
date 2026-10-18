SET search_path TO me_supplies;

DROP INDEX IF EXISTS idx_orders_payos_order_code;
DROP INDEX IF EXISTS idx_orders_payment_status;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
    DROP COLUMN IF EXISTS refunded_at,
    DROP COLUMN IF EXISTS refund_tx_code,
    DROP COLUMN IF EXISTS payment_receipt_url,
    DROP COLUMN IF EXISTS paid_at,
    DROP COLUMN IF EXISTS payos_order_code,
    DROP COLUMN IF EXISTS payment_status;
