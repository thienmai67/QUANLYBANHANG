# Kế Hoạch Đợt 2 — Gỡ Mọi "Thành Công Giả" Ở Frontend (FE ↔ BE Honesty)

- **Nhánh làm việc:** `full-system`
- **Head commit bắt đầu:** `0bff266`
- **Mục tiêu:** Loại bỏ hoàn toàn cơ chế "thành công giả", client-signed token, biên lai giả lập local, fallback sản phẩm sai lệch, và state leak trong modal. Đảm bảo 100% phản hồi trên UI phản ánh đúng sự thật từ Backend API.

---

## 1. Checklist Chi Tiết Đợt 2

- [x] **D2.1 (F04) — Báo sự cố: Endpoint thật ở Backend hoặc Gỡ nút hoàn toàn:**
  - Backend đã có endpoint `POST /api/v1/orders/{id}/incident` lưu `incident_category`, `incident_detail`, `incident_reported_at`, `incident_reported_by`.
  - Frontend gọi đúng endpoint và chỉ toast thành công khi API trả về 200.

- [x] **D2.2 (F05) — Bỏ quyết toán COD cục bộ:**
  - Gỡ bỏ hoàn toàn `settleCod` local fallback trong `frontend/src/app/shipper/cod/page.tsx`.
  - CẤM tự tạo biên lai local, CẤM tự sinh mã `SETTLE-...`. Khi backend lỗi hoặc chưa xác nhận, thông báo lỗi trung thực và giữ nguyên trạng thái chưa nộp.
  - Sửa mapper `fetchCodSettlements` trong `useManagerStore.ts` để đọc đúng `order_ids` từ backend thay vì hardcode `[]`.

- [x] **D2.3 (F02) — Bỏ fallback giỏ hàng lấy sản phẩm khác & Chống trùng đơn:**
  - Trong `frontend/src/components/CartDrawer.tsx`: Gỡ bỏ hoàn toàn fallback `catalogProducts[idx % length]`. Khi SKU không khớp ID thật trong cơ sở dữ liệu, ném lỗi rõ ràng cho khách *"Sản phẩm '{item.name}' không còn trong cơ sở dữ liệu hệ thống..."*.
  - Khóa nút "Xác nhận đặt hàng" bằng cờ `isSubmitting` chống double-click gửi trùng đơn.

- [x] **D2.4 — Mock login & Tài khoản demo: Bỏ client-signed token:**
  - Trong `frontend/src/app/login/page.tsx`:
    - Xóa bỏ hoàn toàn hàm `createMockJwtToken` tự tạo JWT giả ở client.
    - Nút demo chỉ điền sẵn email/mật khẩu vào form và gọi API `/api/v1/auth/login` thật.
    - Modal quên mật khẩu: Xóa banner nói dối "Đã gửi hướng dẫn...", thay bằng thông báo trung thực hướng dẫn liên hệ quản trị viên admin@tdt.vn.
  - Trong `frontend/src/app/register/page.tsx`:
    - Xóa bỏ hoàn toàn luồng OTP 6 số tự sinh giả lập trên client. Đăng ký gọi trực tiếp API `/api/v1/auth/register` thật.

- [x] **D2.5 — Manager Store: Bỏ "thành công giả", gắn API thật hoặc gỡ hàm:**
  - `assignShipper` trong `useManagerStore.ts`: Ràng buộc trạng thái chặt chẽ (`PACKING` hoặc điều phối lại khi `SHIPPING`), cập nhật số lượng tải đơn chính xác của shipper, có rollback state nếu API trả về lỗi.

- [x] **D2.6 — Reset State modal POD & Modal sự cố:**
  - Trong `PodModal.tsx`: Bổ sung `useEffect` lắng nghe `isOpen` và `order?.id` để reset 100% state (`receiverName`, `photos`, `codConfirmed`, `processing`) về rỗng. Đảm bảo dữ liệu giữa các đơn không bị rò rỉ.

---

## 2. Kịch Bản Kiểm Tra Nghiệm Thu Đợt 2 (§7)

1. `go test ./...` (backend) $\rightarrow$ PASS (100% tests pass).
2. `npx tsc --noEmit` (frontend) $\rightarrow$ PASS (0 errors).
3. `npm test` (vitest) $\rightarrow$ PASS (15 suites, 185 tests pass).
4. `npm run build` (frontend) $\rightarrow$ PASS (34/34 routes pass).
5. Frontend & Backend daemons running on ports 3000 & 8080.
