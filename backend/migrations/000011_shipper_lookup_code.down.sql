SET search_path TO me_supplies;

-- Rollback migration 000011.
ALTER TABLE me_supplies.shipper_applications DROP COLUMN IF EXISTS password_set_at;
ALTER TABLE me_supplies.shipper_applications DROP COLUMN IF EXISTS lookup_code_hash;
ALTER TABLE me_supplies.users DROP COLUMN IF EXISTS is_active;
