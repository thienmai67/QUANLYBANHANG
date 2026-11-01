# Kế Hoạch Đợt 4 — Dữ Liệu Mặc Định, Tên Người Làm, Code Chết, Mật Khẩu

- **Nhánh làm việc:** `full-system`
- **Head commit bắt đầu:** `b9ea17a`
- **Mục tiêu:** Xóa bỏ toàn bộ dữ liệu bịa/mặc định (tồn kho 150, sẵn kho cứng, thương hiệu Cadivi mặc định, ảnh cáp mặc định, giảm giá 15% mặc định, hotline giả), ghi nhận đúng danh tính người thao tác đơn thay vì hardcode "Manager Hải Đăng", dọn sạch các file component chết không được import, thống nhất luật mật khẩu theo chuẩn backend (tối thiểu 6 ký tự), và bổ sung nút Sửa sản phẩm (PUT) trên trang Quản lý sản phẩm.

---

## 1. Checklist Chi Tiết Đợt 4

- [x] **D4.1 — Gỡ Mọi Giá Trị Mặc Định Bịa Ở Shop & Sản Phẩm:**
  - `frontend/src/app/product/[id]/page.tsx`:
    - Xóa tồn kho mặc định `150` $\rightarrow$ gán `0` (không tự bịa).
    - Xóa giảm giá mặc định `15%` $\rightarrow$ gán `0%`.
    - Xóa ảnh dây cáp mặc định `/images/products/day-cap-don-1.jpg` $\rightarrow$ để rỗng.
    - Xóa đơn vị "Bộ" cứng và thương hiệu "Cadivi" mặc định $\rightarrow$ hiển thị `—` khi không có dữ liệu thật.
  - `frontend/src/app/shop/page.tsx`:
    - Xóa `brand || 'Cadivi'`, `unit || 'Bộ'`, `image || '/images/products/day-cap-don-1.jpg'`, `discount: 15`.
    - Xóa badge cứng "Sẵn kho" trên mọi món hàng; chỉ hiển thị khi có dữ liệu tồn kho thật.
  - `frontend/src/components/CartDrawer.tsx`:
    - Gỡ hotline chưa xác minh: `1900 1234 (0901 234 567)` khỏi chân modal QR.

- [x] **D4.2 — Lịch Sử Đơn Ghi Đúng Người Làm:**
  - Trong `frontend/src/app/manager/orders/page.tsx`, `CancelOrderModal.tsx`, `ShipperAssignModal.tsx`, `StockAdjustModal.tsx`:
    - Lấy tên người dùng đăng nhập từ `useAuthStore.getState().user` thay vì hardcode chuỗi `'Manager Hải Đăng'`.
  - Trong `frontend/src/store/useManagerStore.ts`:
    - Các hàm `approveOrder`, `cancelOrder`, `assignShipper`, `adjustStock` sử dụng tên thật từ phiên đăng nhập hiện tại thay vì giá trị mặc định tĩnh `'Manager Hải Đăng'`.

- [x] **D4.3 — Dọn Code Chết Đã Xác Nhận & Bỏ Dummy POD Trong Repo:**
  - Đã xóa 5 file component quản trị mồ côi không có route nào import:
    - `frontend/src/components/admin/OrdersManager.tsx`
    - `frontend/src/components/admin/ProductsManager.tsx`
    - `frontend/src/components/admin/CustomersManager.tsx`
    - `frontend/src/components/admin/AnalyticsView.tsx`
    - `frontend/src/components/admin/DashboardOverview.tsx`
  - Trong `backend/internal/repository/product_repository.go`:
    - Gỡ bỏ việc tự chế ảnh POD `dummyPhoto` và lý do hủy `dummyReason` trong `UpdateOrderStatus`. Cập nhật `product_repository_regression_test.go` với POD/lý do rõ ràng.

- [x] **D4.4 — Thống Nhất Luật Mật Khẩu & Bổ Sung Nút Sửa Sản Phẩm:**
  - Thống nhất luật mật khẩu: Đồng bộ theo backend là tối thiểu 6 ký tự với thông báo chuẩn *"Mật khẩu phải chứa ít nhất 6 ký tự."*.
  - Bổ sung chức năng Sửa sản phẩm (PUT /api/v1/products/{id}):
    - Thêm hàm `updateProduct` trong `useManagerStore.ts`.
    - Tạo component `EditMaterialModal.tsx` cho phép chỉnh sửa thông tin vật tư.
    - Thêm nút "Sửa" trên giao diện danh sách sản phẩm `frontend/src/app/manager/products/page.tsx` (cả desktop table và mobile cards).

---

## 2. Kịch Bản Kiểm Tra Nghiệm Thu Đợt 4 (§7)

1. `go test ./...` (backend) $\rightarrow$ **PASS** (100% packages pass).
2. `npx tsc --noEmit` (frontend) $\rightarrow$ **PASS** (0 errors).
3. `npm test` (vitest) $\rightarrow$ **PASS** (15/15 suites, 185/185 tests pass).
4. `npm run build` (frontend) $\rightarrow$ **PASS** (34/34 routes pass).
