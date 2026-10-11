SET search_path TO me_supplies;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
