SET search_path TO me_supplies;

ALTER TABLE me_supplies.products 
ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_quantity_non_negative'
    ) THEN
        ALTER TABLE me_supplies.products
        ADD CONSTRAINT chk_stock_quantity_non_negative CHECK (stock_quantity >= 0);
    END IF;
END $$;
