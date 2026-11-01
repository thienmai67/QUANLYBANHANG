SET search_path TO me_supplies;

ALTER TABLE me_supplies.products DROP CONSTRAINT IF EXISTS chk_stock_quantity_non_negative;
ALTER TABLE me_supplies.products DROP COLUMN IF EXISTS stock_quantity;
