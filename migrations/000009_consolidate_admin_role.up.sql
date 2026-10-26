SET search_path TO me_supplies;

-- Migration 000009: Consolidate ADMIN and MANAGER roles into MANAGER
-- Gộp quyền ADMIN và MANAGER: Chuyển toàn bộ user có role ADMIN sang MANAGER

UPDATE me_supplies.users
SET role = 'MANAGER',
    updated_at = NOW()
WHERE role = 'ADMIN';

-- Cập nhật check constraint của bảng users để loại bỏ ADMIN khỏi danh sách role hợp lệ
ALTER TABLE me_supplies.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE me_supplies.users ADD CONSTRAINT users_role_check
    CHECK (role IN ('CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER'));
