SET search_path TO me_supplies;

-- 1. Add phone column to users table if not exists (supporting shipper phone tracking)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Add POD, COD and incident tracking columns to orders table
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS pod_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS pod_recipient_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS pod_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cod_collected DECIMAL(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cod_remitted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cod_remitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS incident_detail TEXT,
    ADD COLUMN IF NOT EXISTS incident_reported_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS incident_reported_at TIMESTAMPTZ;

-- 3. Create cod_settlements table for end-of-shift COD settlement
CREATE TABLE IF NOT EXISTS cod_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(14,2) NOT NULL,
    order_count INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cod_settlements_total_amount CHECK (total_amount > 0),
    CONSTRAINT chk_cod_settlements_order_count CHECK (order_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_cod_settlements_shipper_id ON cod_settlements(shipper_id);
CREATE INDEX IF NOT EXISTS idx_orders_cod_remitted ON orders(cod_remitted, status, payment_method);
