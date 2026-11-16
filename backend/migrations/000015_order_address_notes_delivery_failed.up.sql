ALTER TABLE me_supplies.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE me_supplies.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status check constraint to include DELIVERY_FAILED
ALTER TABLE me_supplies.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE me_supplies.orders ADD CONSTRAINT orders_status_check 
  CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'PACKING'::character varying, 'SHIPPING'::character varying, 'DELIVERED'::character varying, 'CANCELLED'::character varying, 'DELIVERY_FAILED'::character varying]::text[]));
