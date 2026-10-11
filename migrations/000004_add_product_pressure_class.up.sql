SET search_path TO me_supplies;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS pressure_class VARCHAR(50);
