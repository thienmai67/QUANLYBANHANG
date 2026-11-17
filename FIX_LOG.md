# NHẬT KÝ SỬA LỖI QA VÒNG 2 (FIX_LOG.md) — TDT M&E (tdtmaterial.id.vn)

**Môi trường:** Production `https://tdtmaterial.id.vn`  
**Nhánh:** `fix/qa-vong2`  
**Ngày bắt đầu:** 17/11/2026  
**Quy tắc:** Chỉ đánh dấu `FIXED` khi đã kiểm chứng bằng click thật trên live với 4 vai tài khoản và có ảnh chụp màn hình đối chứng. Không hardcode, không sửa dữ liệu tay, không xóa tính năng. Không "sửa" 3 tính năng QA Vòng 2 đã xác nhận PASS (khóa tài khoản 15 phút, mật khẩu tối thiểu 8 ký tự, double-click tạo 1 đơn).

---

## BẢNG THEO DÕI TIẾN ĐỘ TỔNG HỢP (CHUẨN BÁO CÁO VÒNG 2)

| Đợt | Phạm vi | Số lượng | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Đợt 0** | Tái hiện 8 lỗi Critical trên live site | 8 lỗi | **ĐÃ HOÀN TẤT TÁI HIỆN (8/8 REPRODUCED)** |
| **Đợt 1** | Sửa triệt để 8 lỗi Critical (BUG-01 → BUG-08) | 8 lỗi | Sẵn sàng bắt đầu |
| **Đợt 2** | Sửa 48 lỗi Major (BUG-09 → BUG-56) | 48 lỗi | Chờ Đợt 1 |
| **Đợt 3** | Sửa 53 Minor (BUG-57 → BUG-109) + 8 Trivial (BUG-110 → BUG-117) | 61 lỗi | Chờ Đợt 2 |
| **Tổng kết** | Chạy toàn bộ luồng E2E với đơn TEST_ mới | Toàn sàn | Chờ hoàn tất |

---

## ĐỢT 0 — KẾT QUẢ TÁI HIỆN THỰC TẾ TRÊN LIVE SITE (8 CRITICAL)

Đã thực hiện click thật trên live `https://tdtmaterial.id.vn` với đủ 4 vai: Khách (`khachhang@gmail.com`), Quản lý (`quanly@tdt.vn`), Kinh doanh (`sale@tdt.vn`), Giao hàng (`0901234567`).

| Mã BUG | Mã tạm | Mô tả gốc trong Báo cáo Vòng 2 | Trạng thái | Kết quả kiểm chứng thực tế trên Live (URL + Vai + Quan sát) | Ảnh chụp đối chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | P2-01 | Cùng từ khóa 'Ống' cho kết quả khác nhau giữa 2 lần chạy cách nhau 2 phút [Tìm kiếm /shop] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/shop`<br>• **Vai:** Khách (chưa đăng nhập)<br>• **Thực tế:** Gõ `Ống` (chữ Ố hoa) khớp 14 sản phẩm ống; gõ `ống` (thường) khớp 30 sản phẩm (lẫn 8 công tắc Schneider, 7 đèn LED, 1 đồng hồ Zenner DN20 do khớp chuỗi phụ 'ong'); gõ `ong` (không dấu) chỉ khớp 16 sản phẩm (không có ống nào vì ống mang chữ Ố). Kết quả trồi sụt theo cách gõ. | `evidence/BUG-01-reproduce-search-ong.png` |
| **BUG-02** | P3-06 | Tồn kho không trừ sau khi đặt đơn thành công [Tồn kho / Đặt hàng] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/product/...` & `/checkout`<br>• **Vai:** Customer (`khachhang@gmail.com`)<br>• **Thực tế:** Khi đặt đơn hàng mới, đơn được tạo ở trạng thái `PENDING`. DB không có lệnh trừ tồn kho lúc đặt đơn, tồn kho thực tế trong DB vẫn giữ nguyên (BM-CPVC-21 là 496, CAD-CV-2.5 là 497). Tồn chỉ bị trừ khi Manager bấm duyệt sang `PACKING`, tạo ra khoảng trống bán vượt tồn nếu có nhiều khách cùng đặt. | `evidence/BUG-02-reproduce-stock-pending.png` |
| **BUG-03** | P5-01 | Phân công shipper báo thành công nhưng không được lưu; đơn Đang giao không có shipper, không gán lại được [Phân công shipper] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/manager/orders`<br>• **Vai:** Manager (`quanly@tdt.vn`)<br>• **Thực tế:** Sau khi phân công shipper báo thành công, tải lại trang thì cột SHIPPER trên danh sách đơn Manager hiển thị toàn bộ là 'Chưa gán' (kể cả các đơn đã giao thành công). Tại các đơn có trạng thái 'Đang giao hàng', nút 'Điều phối Shipper' biến mất hoàn toàn (chỉ còn nút Hủy). | `evidence/BUG-03-reproduce-assign-shipper.png` |
| **BUG-04** | P6-01 | Một đơn POS có 3 tổng tiền khác nhau [POS / Tính tiền] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/sale/orders/new`<br>• **Vai:** Sale (`sale@tdt.vn`)<br>• **Thực tế:** Khi chọn sản phẩm BM-CPVC-21 (giá niêm yết 3.780đ, CK hãng 18%), màn hình POS tính `3780 * 0.82 = 3099.6đ` và làm tròn hiển thị `3.100đ`. Nhưng biên lai in ra nhận số float thô `3.099,6đ`, còn đơn hàng khi lưu vào DB thì backend lại lấy giá gốc `3.780đ` (1 đơn 3 giá tiền khác nhau). | `evidence/BUG-04-BUG-06-reproduce-pos-cash.png` |
| **BUG-05** | P6-02 | Chiết khấu báo giá bị nhân đôi khi lưu: thực thu 2.419đ thay vì 3.100đ [Báo giá Sale] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/sale/quotes/new`<br>• **Vai:** Sale (`sale@tdt.vn`)<br>• **Thực tế:** Form báo giá cho BM-CPVC-21 có CK hãng 18%. Khi Sale nhập CK thêm 0%, hệ thống lại lấy CK hãng cộng dồn thành CK thêm 18%, dẫn đến tổng CK = 18% + 18% = 36% (CK −1.361đ, thực thu chỉ còn 2.419đ). Do CK thêm bị tính là 18% > 10% nên báo giá tự động nhảy sang 'Chờ duyệt CK'. | `evidence/BUG-05-reproduce-quote-double-discount.png` |
| **BUG-06** | P6-03 | Không thu được đúng số tiền mặt 3.100đ; chỉ nhập được bội số 1.000đ [POS / Thanh toán tiền mặt] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/sale/orders/new`<br>• **Vai:** Sale (`sale@tdt.vn`)<br>• **Thực tế:** Ô nhập tiền mặt POS nhận số float `3099.60009765625` và bị trình duyệt/form validation chặn lỗi vì không phải số nguyên hoặc chỉ cho phép bội số 1000. Sale buộc phải nhập 4.000đ và hệ thống tính thối 900đ. | `evidence/BUG-04-BUG-06-reproduce-pos-cash.png` |
| **BUG-07** | P8-01 | Báo cáo sự cố của Shipper hoàn toàn không hiển thị cho Manager [Sự cố giao hàng] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/shipper` & `https://tdtmaterial.id.vn/manager/orders`<br>• **Vai:** Shipper (`0901234567`) & Manager (`quanly@tdt.vn`)<br>• **Thực tế:** Shipper gửi báo cáo sự cố (đơn 41592c), nhưng phía Manager mở chi tiết đơn không hề thấy nội dung/giờ sự cố; bộ lọc 'Sự cố / Giao thất bại' trên trang Manager hiển thị số đếm = 0 và danh sách trống. | `evidence/BUG-07-BUG-08-reproduce-incident-manager.png`<br>`evidence/BUG-07-BUG-08-shipper-portal.png` |
| **BUG-08** | P8-02 | Tên shipper đã phân công biến mất ở phía Manager sau khi Shipper báo sự cố [Phân công shipper] | **REPRODUCED** | • **URL:** `https://tdtmaterial.id.vn/manager/orders`<br>• **Vai:** Manager (`quanly@tdt.vn`)<br>• **Thực tế:** Đơn 41592c sau khi shipper báo sự cố thì phía Manager hiển thị cột Shipper là 'Chưa gán', chi tiết đơn ghi 'Chưa phân công' (mặc dù trong DB `shipper_id` vẫn lưu và trong cổng Shipper đơn vẫn xuất hiện). | `evidence/BUG-07-BUG-08-reproduce-incident-manager.png` |

---
