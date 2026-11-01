# Kế Hoạch & Nhật Ký Nghiệm Thu Đợt 1 — Chặn Ở Backend (Không Đổi Schema)

- **Nhánh làm việc:** `full-system`
- **Head commit bắt đầu:** `7cd5d62`
- **Mục tiêu:** Khóa chặt toàn bộ logic bảo vệ ở tầng backend (CreateOrder, MarkPaid, UpdateOrderStatus, CreatePaymentLink), đảm bảo API trực tiếp không thể bị qua mặt bởi request tùy tiện từ client.

---

## 1. Checklist Chi Tiết Đợt 1 (Đã hoàn thành 100%)

- [x] **D1.1 (F03) — Khóa CreateOrder tại backend (`backend/internal/handler/handlers.go` & `product_repository.go`):**
  - [x] Ép `order.PaymentStatus = domain.PaymentStatusUnpaid` lúc tạo đơn (bất kể client gửi gì trong body).
  - [x] Ép `order.ShipperID = nil`, `order.DeliveredAt = nil`, `order.CancellationReason = nil`, xóa sạch các trường incident/pod/payos link do client gửi lúc tạo đơn.
  - [x] Chỉ nhận allowlist field: `items` (productId, quantity), `paymentMethod`, `shippingAddress`, `recipientName`, `recipientPhone`, `note`. Validate paymentMethod hợp lệ (`COD`, `BANK_TRANSFER`).
  - [x] Bằng chứng kiểm tra thực tế: Tạo đơn với `paymentStatus: "PAID"` và `paymentMethod: "BANK_TRANSFER"` qua POST `/orders` trả về `paymentStatus: "UNPAID"`. Chuyển đơn đó sang `PACKING` bị chặn với HTTP 400: `Đơn hàng chuyển khoản chưa được thanh toán`.

- [x] **D1.2 (F09) — Khóa MarkPaid tại backend (`backend/internal/handler/handlers.go`):**
  - [x] Kiểm đủ cả 4 điều kiện:
    1. Phương thức phải là `BANK_TRANSFER` (từ chối `COD` với HTTP 400 `Chỉ áp dụng đánh dấu thanh toán cho đơn chuyển khoản (BANK_TRANSFER)`).
    2. Đơn chưa `PAID` (nếu đã `PAID` thì báo lỗi 400 `Đơn hàng đã được thanh toán`).
    3. Trạng thái đơn không phải `CANCELLED` và không phải `DELIVERED` (từ chối 400 `Không thể đánh dấu thanh toán cho đơn hàng đã hủy hoặc đã giao`).
    4. Vai trò thực hiện phải là `MANAGER` hoặc `SALE` (các role khác bị 403 Forbidden).
  - [x] Ghi lại ID và Role của người đánh dấu (`ActorID`, `ActorRole`) vào log và lịch sử đơn.
  - [x] Bằng chứng kiểm tra: Test trực tiếp trên API thật và unit test `payment_handlers_test.go` xác nhận đơn COD, đơn CANCELLED, đơn DELIVERED đều bị từ chối 400.

- [x] **D1.3 — Quyền hủy đơn và báo sự cố (Chốt theo Backend):**
  - [x] Backend đã chặn: Shipper không được tự ý hủy đơn (`ErrCancelNotAllowedForShipper`).
  - [x] Frontend (`frontend/src/app/shipper/orders/[orderId]/page.tsx`, `frontend/src/components/shipper/IncidentModal.tsx`):
    - Đổi nút "Báo sự cố" thành "Liên hệ quản lý".
    - Popup hiển thị rõ quy định điều phối: *"Shipper không tự ý hủy đơn hàng. Khi phát sinh sự cố hiện trường, liên hệ Quản lý kho để được hỗ trợ điều phối."* (Không mở form hủy giả, không toast ảo).

- [x] **D1.4 — Gán shipper & Chặn giới hạn tải tại backend (`backend/internal/repository/product_repository.go`):**
  - [x] Khi chuyển `PACKING` $\rightarrow$ `SHIPPING`:
    - Kiểm tra shipper tồn tại trong bảng `users` với `role = 'SHIPPER'` và `is_active = true`.
    - Kiểm tra số lượng đơn đang giao hiện tại của shipper (`SELECT COUNT(*) FROM me_supplies.orders WHERE shipper_id = $1 AND status = 'SHIPPING'`).
    - Chặn nếu số đơn đang giao $\ge 5$ với `ErrShipperCapacityExceeded` (HTTP 400 `SHIPPER_CAPACITY_EXCEEDED: Shipper đã đạt giới hạn tối đa 5 đơn đang giao cùng lúc`).
  - [x] Không giả định tính năng điểm danh khi hệ thống chưa có bảng điểm danh.

- [x] **D1.5 — Khóa PayOS Payment Link & Sửa Toast Frontend:**
  - [x] Backend (`backend/internal/handler/handlers.go`):
    - `CreatePaymentLink` chỉ cho phép đơn có `payment_method = 'BANK_TRANSFER'`. Đơn `COD` gọi tạo link thanh toán bị từ chối HTTP 400: `Chỉ hỗ trợ tạo link thanh toán PayOS cho đơn hàng chuyển khoản (BANK_TRANSFER)`.
    - Quyền tạo link: Chỉ chủ đơn (`CUSTOMER` sở hữu `customer_id`) hoặc `MANAGER`. Khóa các role khác (Shipper tạo link PayOS bị từ chối 403 Forbidden).
  - [x] Frontend (`frontend/src/components/CartDrawer.tsx`):
    - Sửa câu toast sai ở dòng 98: `"Thanh toán thành công! Đơn hàng đang chờ quản lý duyệt đóng gói."` (thay vì tự ý nói đã chuyển sang đóng gói).
    - Sửa thông báo dòng 624: `"Đơn hàng đã được xác nhận thanh toán thành công và đang chờ duyệt đóng gói."`.

- [x] **D1.6 — Tạo đơn: Giới hạn số lượng và tính lại giá từ DB:**
  - [x] Giữ nguyên giới hạn 10.000 đơn vị/món (đã có ở backend).
  - [x] Đơn giá và tổng tiền bắt buộc tính lại 100% từ giá niêm yết trong bảng `products` của DB, không tin tưởng giá client gửi lên.
  - [x] Đơn của ai chỉ người đó xem/sửa (quyền sở hữu đơn).

---

## 2. Kết Quả Kiểm Tra Nghiệm Thu Đợt 1 (§7)

1. **Backend Tests:**
   - Command: `cd backend; go test ./...`
   - Kết quả: **ALL PASS** (100% pass trên toàn bộ packages `auth`, `domain`, `handler`, `middleware`, `payos`, `repository`). 0 failures.
2. **Frontend Type Check:**
   - Command: `cd frontend; npx tsc --noEmit`
   - Kết quả: **0 errors** (hoàn toàn sạch kiểu).
3. **Frontend Unit / Integration Tests:**
   - Command: `cd frontend; npm test` (vitest run)
   - Kết quả: **15/15 test files pass (185/185 tests pass)**.
4. **Frontend Production Build:**
   - Command: `cd frontend; npm run build`
   - Kết quả: **34/34 routes build thành công** (100% static & dynamic routes).
5. **Live API Testing (Chạy trực tiếp trên server backend port 8080):**
   - `POST /api/v1/orders` kèm `paymentStatus: "PAID"`, `paymentMethod: "BANK_TRANSFER"` $\rightarrow$ Backend trả về HTTP 201 với `paymentStatus: "UNPAID"`.
   - `PATCH /api/v1/orders/{id}/status` sang `PACKING` cho đơn vừa tạo $\rightarrow$ Backend từ chối HTTP 400: *"Đơn hàng chuyển khoản chưa được thanh toán"*.
   - `POST /api/v1/orders/{id}/mark-paid` cho đơn COD $\rightarrow$ Backend từ chối HTTP 400: *"Chỉ áp dụng đánh dấu thanh toán cho đơn chuyển khoản (BANK_TRANSFER)"*.
   - `POST /api/v1/orders/{id}/payment-link` cho đơn COD $\rightarrow$ Backend từ chối HTTP 400: *"Chỉ hỗ trợ tạo link thanh toán PayOS cho đơn hàng chuyển khoản (BANK_TRANSFER)"*.
