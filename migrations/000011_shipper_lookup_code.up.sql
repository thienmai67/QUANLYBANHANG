SET search_path TO me_supplies;

-- Migration 000011: Mã tra cứu hồ sơ shipper + vô hiệu hóa tài khoản (thu hồi mail).
-- Mã tra cứu chỉ lưu dạng băm SHA-256 (lookup_code_hash), không lưu bản text gốc.
-- Tài khoản bị thu hồi chỉ bị vô hiệu hóa (is_active = FALSE), không xóa hẳn,
-- để lịch sử đơn hàng và sổ quỹ COD vẫn còn nguyên.

ALTER TABLE me_supplies.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE me_supplies.shipper_applications ADD COLUMN IF NOT EXISTS lookup_code_hash TEXT;
ALTER TABLE me_supplies.shipper_applications ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;
