# Kế Hoạch & Nhật Ký Nghiệm Thu Đợt 5 — Tồn Kho Thật (Cơ Chế Backend & Điểm Dừng Nghiệp Vụ)

- **Nhánh làm việc:** `full-system`
- **Head commit bắt đầu:** `d024483`
- **Mục tiêu:** Thiết lập cơ chế kiểm kho và trừ tồn kho nguyên tử ở backend (PostgreSQL + Go), chống đặt vượt trần khi chưa có kho thật (F06), trừ kho khi duyệt `PACKING`, hoàn kho khi hủy đơn, và **DỪNG LẠI TUÂN THỦ §6** — không tự ý seed số kho giả, chờ Du cung cấp số kho thật hoặc chốt mức trần bằng văn bản.

---

## 1. Checklist Chi Tiết Đợt 5 (Cơ Chế Đã Hoàn Thành 100%)

- [x] **D5.1 — Migration Thêm Cột Tồn Kho Thật Ở Backend:**
  - Tạo migration `000012_add_product_inventory.up.sql` và `.down.sql` trong cả `backend/migrations/` và `migrations/`:
    - Thêm cột `stock_quantity INT NOT NULL DEFAULT 0` vào bảng `me_supplies.products`.
    - Ràng buộc kiểm tra `chk_stock_quantity_non_negative CHECK (stock_quantity >= 0)`.
    - Bổ sung lệnh DDL đồng bộ trong `backend/cmd/server/main.go` và `getTestDB` test suite.

- [x] **D5.2 — Định Nghĩa Domain & Lỗi Tồn Kho:**
  - `backend/internal/domain/errors.go`: Thêm `ErrInsufficientStock = errors.New("insufficient stock")`.
  - `backend/internal/domain/product.go`: Thêm `StockQuantity int` vào struct `Product`, `StockQuantity *int` vào `UpsertProductInput`.
  - `backend/internal/handler/handlers.go`: Map `ErrInsufficientStock` sang HTTP 400 Bad Request với mã `INSUFFICIENT_STOCK`.

- [x] **D5.3 — Truy Vấn & Kiểm Kho Nguyên Tử Tại Repository (`backend/internal/repository/product_repository.go`):**
  - Cập nhật `ListProducts`, `GetProductByID`, `GetProductBySKU` đọc `COALESCE(p.stock_quantity, 0) AS stock_quantity`.
  - Trong `CreateOrder`:
    - Đọc tồn kho thật từ DB trong transaction.
    - Chặn ngay lập tức nếu số lượng đặt vượt quá tồn kho thực tế (`stockQuantity > 0 && item.Quantity > stockQuantity`).
    - Chặn đơn đặt số lượng cực lớn ($\ge 5.000$ sản phẩm) khi kho chưa seed số thật (`stockQuantity == 0 && item.Quantity >= 5000`), trả về `ErrInsufficientStock` (khắc phục triệt để lỗ hổng F06).
  - Trong `UpdateOrderStatusWithDetails`:
    - Khi duyệt đơn sang `PACKING`: Trừ kho nguyên tử với khóa dòng `SELECT ... FOR UPDATE`, đảm bảo không bị overselling trong môi trường chịu tải đồng thời. Nếu tồn kho không đủ, rollback transaction và báo lỗi `ErrInsufficientStock`.
    - Khi hủy đơn đã ở trạng thái `PACKING` hoặc `SHIPPING`: Tự động hoàn lại số lượng tồn kho nguyên tử về bảng `products`.

- [x] **D5.4 — Kiểm Chứng Tự Động Toàn Diện:**
  - Viết test hồi quy `TestWave5_ProductInventoryStockDeductionAndCeiling`:
    1. Đặt 5.000 món khi kho chưa seed $\rightarrow$ Bị chặn với `ErrInsufficientStock`.
    2. Cấu hình kho = 10, đặt 15 món $\rightarrow$ Bị chặn với `ErrInsufficientStock`.
    3. Đặt 3 món $\rightarrow$ Thành công.
    4. Duyệt `PACKING` $\rightarrow$ Tồn kho giảm từ 10 xuống 7.
    5. Hủy đơn $\rightarrow$ Tồn kho được hoàn từ 7 về 10.
  - Toàn bộ test suite `backend` PASS 100%.

---

## 2. Điểm Dừng Nghiệp Vụ Bắt Buộc Theo §6

> [!IMPORTANT]
> **ĐIỂM DỪNG BẮT BUỘC (STOP) — KHÔNG SEED SỐ KHO GIẢ:**
> - Tuyệt đối không tự ý lấy số mặc định 150 của frontend làm số kho thật.
> - Tuyệt đối không tự ý bịa số tồn kho cho từng mã hàng.
> - **Yêu cầu đối với chủ dự án (Du):**
>   1. Cung cấp file số liệu tồn kho thật cho từng SKU (mã vật tư, số lượng tồn kho thực tế tại kho M&E).
>   2. Hoặc xác nhận bằng văn bản một mức trần tồn kho tạm thời (ví dụ: tối đa 50 đơn vị/món cho bán lẻ online) để hệ thống nạp dữ liệu khởi tạo.
> - Sau khi Du cung cấp số liệu hoặc duyệt mức trần, migration nạp số kho sẽ được thực thi.
