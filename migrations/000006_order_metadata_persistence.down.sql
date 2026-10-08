SET search_path TO me_supplies;

-- 1. Drop cod_settlements table and indexes
DROP INDEX IF EXISTS idx_orders_cod_remitted;
DROP TABLE IF EXISTS cod_settlements;

-- 2. Drop added columns from orders table (DO NOT drop columns from 000005)
ALTER TABLE orders
    DROP COLUMN IF EXISTS incident_reported_at,
    DROP COLUMN IF EXISTS incident_reported_by,
    DROP COLUMN IF EXISTS incident_detail,
    DROP COLUMN IF EXISTS cod_remitted_at,
    DROP COLUMN IF EXISTS cod_remitted,
    DROP COLUMN IF EXISTS cod_collected,
    DROP COLUMN IF EXISTS pod_confirmed_at,
    DROP COLUMN IF EXISTS pod_recipient_name,
    DROP COLUMN IF EXISTS pod_photo_url;

-- 3. Drop phone column from users
ALTER TABLE users
    DROP COLUMN IF EXISTS phone;
