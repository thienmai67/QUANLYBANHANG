SET search_path TO me_supplies;

-- Revert Migration 000009: Restore ADMIN to check constraint
ALTER TABLE me_supplies.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE me_supplies.users ADD CONSTRAINT users_role_check
    CHECK (role IN ('CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER', 'ADMIN'));
