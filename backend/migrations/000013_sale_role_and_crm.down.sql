SET search_path TO me_supplies;

-- CẢNH BÁO NGUY HIỂM: Rollback migration này sẽ xóa TOÀN BỘ dữ liệu CRM, Báo giá, Hoạt động chăm sóc và Ghi chú thanh toán của phân hệ SALE!
-- BẮT BUỘC BACKUP CƠ SỞ DỮ LIỆU TRƯỚC KHI CHẠY TRÊN BẤT KỲ MÔI TRƯỜNG NÀO!

DROP TABLE IF EXISTS me_supplies.payment_notes;
DROP TABLE IF EXISTS me_supplies.customer_activities;
DROP TABLE IF EXISTS me_supplies.quote_items;
DROP TABLE IF EXISTS me_supplies.quotes;
DROP TABLE IF EXISTS me_supplies.customer_profiles;
DROP TABLE IF EXISTS me_supplies.customer_assignments;
ALTER TABLE me_supplies.orders DROP COLUMN IF EXISTS sale_id;
