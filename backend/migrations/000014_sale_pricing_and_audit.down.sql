SET search_path TO me_supplies;

-- CẢNH BÁO NGUY HIỂM: Rollback migration này sẽ xóa thông tin audit duyệt báo giá và phân tách chiết khấu. Hãy backup DB trước khi thực hiện!
DROP INDEX IF EXISTS me_supplies.idx_quotes_status_valid_until;
DROP INDEX IF EXISTS me_supplies.idx_payment_notes_order;
DROP INDEX IF EXISTS me_supplies.idx_payment_notes_sale;
DROP INDEX IF EXISTS me_supplies.idx_activities_customer;

ALTER TABLE me_supplies.quote_items
    DROP COLUMN IF EXISTS brand_discount_rate,
    DROP COLUMN IF EXISTS additional_discount_rate;

ALTER TABLE me_supplies.quotes
    DROP COLUMN IF EXISTS approved_by,
    DROP COLUMN IF EXISTS approved_at;

ALTER TABLE me_supplies.users
    DROP COLUMN IF EXISTS must_change_password;

