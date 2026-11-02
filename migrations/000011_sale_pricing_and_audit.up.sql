SET search_path TO me_supplies;

-- P0-2: Cờ bắt buộc đổi mật khẩu lần đầu cho tài khoản khách do sale tạo
ALTER TABLE me_supplies.users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- P1-2: Audit trail người duyệt báo giá và thời gian duyệt
ALTER TABLE me_supplies.quotes
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES me_supplies.users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- P1-6: Tách bạch chiết khấu hãng và chiết khấu cộng thêm của sale
ALTER TABLE me_supplies.quote_items
    ADD COLUMN IF NOT EXISTS brand_discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS additional_discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- P2-6: Bổ sung các chỉ số còn thiếu giữa DDL và migration
CREATE INDEX IF NOT EXISTS idx_payment_notes_order ON me_supplies.payment_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_notes_sale ON me_supplies.payment_notes(sale_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON me_supplies.customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status_valid_until ON me_supplies.quotes(status, valid_until);
