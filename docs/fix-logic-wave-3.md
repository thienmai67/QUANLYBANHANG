# Kế Hoạch Đợt 3 — Bổ Sung Nút Còn Thiếu (Khách Hàng)

- **Nhánh làm việc:** `full-system`
- **Head commit bắt đầu:** `93c69e2`
- **Mục tiêu:** Cung cấp đầy đủ các nút hành động hợp lệ cho khách hàng trên trang đơn hàng (`/profile` và `/account`), tuân thủ 100% chốt chặn Backend API. Khắc phục triệt để luồng giỏ hàng và thanh toán QR PayOS cho khách hàng.

---

## 1. Checklist Chi Tiết Đợt 3

- [x] **D3.1 — Nút Hủy Đơn Cho Khách Hàng:**
  - **Vị trí hiển thị:**
    - `frontend/src/app/profile/page.tsx`: Trên từng thẻ đơn hàng (`profile-order-card`) và trong popup chi tiết đơn hàng (`selectedOrder`).
    - `frontend/src/app/account/page.tsx`: Trên từng dòng đơn hàng trong danh sách.
  - **Điều kiện xuất hiện:**
    - Đơn có trạng thái `PENDING` (chờ xác nhận/chờ xử lý).
    - Đơn thuộc quyền sở hữu của chính khách hàng đăng nhập.
    - TUYỆT ĐỐI KHÔNG hiển thị nút hủy khi đơn ở các trạng thái khác (`PACKING`, `SHIPPING`, `DELIVERED`, `CANCELLED`).
  - **Quy trình hủy đơn:**
    - Tạo `CancelOrderModal.tsx`: Bấm nút "Hủy đơn" $\rightarrow$ Mở modal yêu cầu nhập lý do hủy.
    - Kiểm tra lý do: tối thiểu 5 ký tự (`trimmedReason.length >= 5`). Nếu dưới 5 ký tự, nút gửi bị vô hiệu hóa và cảnh báo trực quan.
    - Gọi API: `PATCH /api/v1/orders/{id}/status` với `{ status: "CANCELLED", cancellationReason: reason, version: order.version }`.
    - Sau khi Backend phản hồi 200 OK: Cập nhật state đơn hàng thành `CANCELLED`, lưu lý do hủy, hiển thị toast thông báo thành công.

- [x] **D3.2 — Nút Thanh Toán Lại / Thanh Toán Sau & Trải Nghiệm Khách Vãng Lai:**
  - **Nút "Thanh toán lại" (Tạo lại QR PayOS):**
    - **Điều kiện xuất hiện:** Đơn `BANK_TRANSFER` (hoặc `BANK`), `paymentStatus !== 'PAID'` (hoặc `UNPAID`), và trạng thái đơn là `PENDING`.
    - **Vị trí:** Cả trên thẻ đơn hàng và trong popup chi tiết đơn hàng tại `/profile` và `/account`.
    - Tạo component `PayOSModal.tsx`: Bấm "Thanh toán lại" / "Quét QR thanh toán" $\rightarrow$ Gọi API `POST /api/v1/orders/{id}/payment-link`, mở modal thanh toán QR PayOS với đầy đủ mã VietQR, số tiền, mã đơn, nút mở app ngân hàng, và cơ chế tự động kiểm tra trạng thái thanh toán (`GET /api/v1/orders/{id}/payment-status`).
  - **Nút "Thanh toán sau" trong Giỏ Hàng (`CartDrawer.tsx`):**
    - Tại màn hình quét mã VietQR trong `CartDrawer`: Bổ sung nút "Thanh toán sau (Lưu đơn vào tài khoản)" rõ ràng, thông báo hướng dẫn khách có thể vào mục Đơn hàng bất kỳ lúc nào để quét lại mã thanh toán.
    - Đơn hàng đã được lưu an toàn trên backend và xuất hiện ngay trong lịch sử đơn hàng của khách.
  - **Gỡ bỏ xóa giỏ hàng tự động:**
    - Gỡ bỏ `clearCart()` tự động khi chưa đăng nhập trong `MaterialHeader.tsx` và `CartDrawer.tsx`, đảm bảo khách vãng lai sau khi thêm giỏ được chuyển sang đăng nhập mà không bị mất giỏ hàng.
    - Khách vãng lai khi cố đặt hàng được cảnh báo rõ ràng từ trước: *"Vui lòng đăng nhập để đặt hàng"*.

---

## 2. Kịch Bản Kiểm Tra Nghiệm Thu Đợt 3 (§7)

1. `go test ./...` (backend) $\rightarrow$ **PASS** (100% packages pass).
2. `npx tsc --noEmit` (frontend) $\rightarrow$ **PASS** (0 errors).
3. `npm test` (vitest) $\rightarrow$ **PASS** (15/15 suites, 185/185 tests pass).
4. `npm run build` (frontend) $\rightarrow$ **PASS** (34/34 routes pass).
