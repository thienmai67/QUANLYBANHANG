SET search_path TO me_supplies;

DROP TABLE IF EXISTS me_supplies.shipper_applications;
DROP TABLE IF EXISTS me_supplies.shipper_email_pool;
ALTER TABLE me_supplies.users DROP COLUMN IF EXISTS must_change_password;
