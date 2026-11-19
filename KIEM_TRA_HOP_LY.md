# BÁO CÁO KIỂM TRA ĐIỂM KHÔNG HỢP LÝ THEO TỪNG VAI (GIAI ĐOẠN 0)
**Dự án:** Hệ thống quản lý bán hàng & vật tư M&E — TDT M&E  
**Website kiểm tra thực tế:** https://tdtmaterial.id.vn  
**Ngày kiểm tra:** 19/11/2026  
**Môi trường kiểm tra:** Site production đang chạy trên AWS VPS (nhánh `fix/qa-retest-2026-11-17` mới nhất)  
**Tài khoản thực hiện kiểm tra:** 4 vai độc lập (Khách hàng, Nhân viên bán hàng, Quản lý, Tài xế giao hàng)

---

## BẢNG TỔNG HỢP CÁC ĐIỂM BẤT HỢP LÝ & LỆCH SỐ LIỆU PHÁT HIỆN ĐƯỢC

| # | Vai | Vị trí (đường dẫn trang) | Hiện tượng (đã thấy trên site thật, kèm số liệu/ví dụ cụ thể) | Ảnh hưởng (ai bị vướng, vướng việc gì) | Đề xuất |
|---|---|---|---|---|---|
| 1 | Tất cả | Toàn trang (Header, Footer, Floating Widget, Chi tiết sản phẩm, Tra cứu, Báo sự cố) | Thông tin hotline hỗ trợ mâu thuẫn giữa nhiều trang: Header ghi `0909 123 456`; Floating widget ghi `1900 6868` và Zalo `0937 292 769`; Chân trang sản phẩm ghi Zalo `0909123456`; Tra cứu đơn ghi `1900 6789`; Báo sự cố shipper ghi `1900 6868`; Báo giá B2B ghi `(028) 3899 9999` & `0912.888.999`. | Khách hàng và nhân viên bối rối khi cần gọi hỗ trợ khẩn cấp, không biết số nào là hotline chính thức đang tiếp nhận cuộc gọi. | Sửa code trước (thống nhất 1 số hotline và 1 số Zalo chuẩn toàn hệ thống) |
| 2 | Khách hàng | Quên mật khẩu (`/forgot-password`) | Tiêu đề form ghi sai ngữ cảnh: "Chào mừng trở lại. Đăng nhập để tiếp tục...". Khi nhập email và bấm gửi, giao diện chỉ hiển thị thông báo chung chung hoặc xóa trắng form, không có backend API gửi OTP/link reset mật khẩu thực tế (xử lý giao diện giả lập). | Khách hàng quên mật khẩu không thể tự khôi phục tài khoản qua email, bắt buộc phải liên hệ thủ công với kỹ thuật. | Ghi vào hướng dẫn ở mục "Đang khắc phục" (hướng dẫn khách liên hệ hotline) |
| 3 | Khách hàng | Tài khoản của tôi (`/profile` -> Tab Đơn hàng -> Modal Chi tiết đơn -> Hủy đơn) | Khi mở Modal "Chi tiết đơn hàng" rồi bấm "Hủy đơn hàng", popup "Hủy đơn hàng" bị nằm đè bên dưới (z-index thấp hơn) bảng chi tiết đơn hàng. Nút "Xác nhận hủy đơn" bị che khuất không bấm trực tiếp được, phải đóng modal chi tiết thì mới lộ ra modal hủy. | Khách hàng tưởng nút xác nhận bị liệt hoặc hệ thống bị lỗi, không hủy được đơn hàng khi đang mở xem chi tiết. | Sửa code trước (điều chỉnh z-index modal hủy đơn cao hơn modal chi tiết đơn hàng) |
| 4 | Khách hàng | Trang Liên hệ (`/contact`) | Truy cập đường dẫn `https://tdtmaterial.id.vn/contact` trả về trang mã lỗi 404 Not Found (chưa triển khai route này trên frontend). | Khách hàng bấm vào liên kết liên hệ từ các trang hoặc gõ URL trực tiếp bị báo lỗi trang không tồn tại. | Bỏ khỏi hướng dẫn (không mô tả trang `/contact` trong tài liệu) |
| 5 | Khách hàng | Chi tiết sản phẩm (`/product/[id]`) | Giá gạch ngang được tính ngược theo công thức `basePrice / (1 - rate)` từ giá niêm yết trong CSDL chứ không phải giá gốc thật, dẫn đến giá gạch ngang hiển thị số lẻ (ví dụ: sản phẩm giá 6.696 đ với CK 18% thì giá gạch thành 8.166 đ). | Người mua thắc mắc về con số giá gạch ngang lẻ và công thức tính giảm giá. | Ghi vào hướng dẫn ở mục "Đang khắc phục" (giải thích đây là giá tham chiếu trước CK hãng) |
| 6 | Sale | Dashboard Sale (`/sale/dashboard`) vs Báo cáo cá nhân (`/sale/reports`) | Lệch số liệu Doanh số tháng: Trên Dashboard Sale hiển thị `212.310.360 ₫`, trong khi trang Báo cáo cá nhân (`/sale/reports`) hiển thị `211.378.780 ₫` (lệch ~931.580 ₫). | Nhân viên Sale không biết con số nào là doanh số chính thức được chốt của mình trong tháng để đối soát KPI. | Ghi vào hướng dẫn ở mục "Đang khắc phục" (giải thích tiêu chí thống kê khác nhau giữa 2 trang) |
| 7 | Sale | Dashboard Sale (`/sale/dashboard`) vs Thanh toán & Công nợ (`/sale/payments`) | Lệch số liệu Nợ quá hạn: Dashboard Sale ghi Nợ quá hạn là `168.800 ₫`, nhưng trang Thanh toán & Công nợ (`/sale/payments`) hiển thị Nợ quá hạn (>30 ngày) là `1.349.364 ₫` (8 đơn quá hạn). Nguyên nhân do Dashboard tính theo `delivered_at < NOW() - 30 days` nhưng một số đơn cũ thiếu ngày giao. | Nhân viên Sale bị sót nợ quá hạn nếu chỉ theo dõi con số cảnh báo trên Dashboard. | Sửa code trước (đồng bộ điều kiện lọc đơn nợ quá hạn giữa backend Dashboard và trang Payments) |
| 8 | Sale | Bán tại quầy (`/sale/orders/new` -> Phiếu xuất in) | Khi tạo đơn Bán tại quầy thành công bằng phương thức Chuyển khoản QR ngân hàng, phiếu in xuất kho hiển thị phương thức chuyển khoản nhưng lại in thêm dòng chữ lớn: *"THU TIỀN KHI NHẬN HÀNG"*. | Gây hiểu lầm cho khách hàng và thủ kho rằng đơn giao hàng tận nơi và cần thu thêm tiền mặt khi nhận hàng. | Sửa code trước (ẩn dòng "Thu tiền khi nhận hàng" khi khách đã thanh toán tại quầy) |
| 9 | Sale | Bán tại quầy (`/sale/orders/new` -> Quản lý đơn hàng) | Tạo đơn POS bằng tiền mặt thì hệ thống chuyển ngay sang ĐÃ GIAO và trừ kho tức thì. Tuy nhiên, nếu khách chọn thanh toán Chuyển khoản tại quầy, đơn lại ở trạng thái CHỜ XỬ LÝ và KHÔNG trừ kho ngay (chờ Quản lý duyệt đơn). | Khách đứng tại quầy lấy hàng nhưng hệ thống chưa trừ kho, nhân viên phải chờ Quản lý duyệt trên hệ thống mới xuất kho được. | Ghi vào hướng dẫn ở mục "Đang khắc phục" (hướng dẫn Sale quy trình: đơn POS chuyển khoản cần báo Quản lý duyệt ngay) |
| 10 | Sale | CRM CSKH (`/sale/activities` -> Form Ghi nhật ký mới) | Ô `Thời điểm diễn ra` mặc định lấy theo giờ hệ thống UTC (`2026-11-19T00:47`) thay vì giờ Việt Nam UTC+7 (`07:47`). Khi lưu, mốc thời gian hiển thị trong danh sách nhật ký bị lùi lại 7 tiếng (`00:47`). | Mốc thời gian liên hệ khách hàng bị sai lệch 7 tiếng so với thực tế, gây nhầm lẫn về thời điểm tiếp xúc khách hàng. | Sửa code trước (đổi hàm lấy ngày giờ mặc định sang giờ địa phương Việt Nam UTC+7) |
| 11 | Sale | Khách hàng phụ trách (`/sale/customers` -> Modal Chi tiết) | Trong modal chi tiết khách hàng, tab "Nhật ký CSKH" chỉ xem được lịch sử cũ, không có nút thêm nhật ký mới. Nhân viên Sale muốn ghi nhật ký phải đóng modal và chuyển sang trang riêng `/sale/activities`. | Quy trình thao tác bị gián đoạn, tốn thời gian chuyển trang cho nhân viên Sale. | Ghi vào hướng dẫn ở mục "Đang khắc phục" (hướng dẫn Sale mở trang `/sale/activities` để ghi nhật ký) |
| 12 | Sale | Thanh toán & Công nợ (`/sale/payments`) | Các đơn hàng cũ `ORD-261013-1a5612` và `ORD-261012-85e08b` có trạng thái thanh toán là `UNPAID` nhưng cột Trạng thái thu hộ lại gắn badge xanh lá *"Đã nộp COD"*. Do dữ liệu cũ được quyết toán trước khi triển khai bản vá đồng bộ trạng thái thanh toán. | Nhân viên Sale bối rối khi thấy badge đã nộp tiền nhưng trạng thái đơn vẫn báo chưa thanh toán nợ. | Sửa code trước (chạy migration cập nhật các đơn COD đã quyết toán trong CSDL sang PAID) |
| 13 | Quản lý | Quản lý khách hàng (`/manager/customers` & Modal Chi tiết) | Toàn bộ 11 hồ sơ khách hàng đều hiển thị: Số đơn hàng: `0 (0 đã giao)`, Tổng chi tiêu: `0 ₫`, Lịch sử đơn hàng: *"Khách hàng chưa phát sinh đơn hàng nào"*, mặc dù tài khoản khách VIP Gold đã có 23 đơn hàng và chi tiêu 135.780 ₫ trên hệ thống. | Quản lý không xem được lịch sử mua sắm và tổng doanh thu thực tế của từng khách hàng để đánh giá chính sách công nợ/chiết khấu. | Sửa code trước (sửa query backend tổng hợp đơn hàng theo ID khách hàng) |
| 14 | Quản lý | Trang Bảng giá (`/manager/pricing`) | Đường dẫn `https://tdtmaterial.id.vn/manager/pricing` trả về HTTP 404 Not Found (hệ thống chưa có route riêng này; chính sách giá và chiết khấu hiện được quản lý trực tiếp tại `/manager/products`). | Người dùng gõ URL hoặc tìm module bảng giá riêng bị báo lỗi không tìm thấy trang. | Bỏ khỏi hướng dẫn (hướng dẫn Quản lý cấu hình giá tại trang Quản lý sản phẩm) |
| 15 | Quản lý & Sale | Dashboard Quản lý (`/manager/dashboard`) vs Dashboard Sale vs Báo cáo Sale | Xuất hiện 3 con số Doanh thu khác nhau trên hệ thống: Dashboard Quản lý ghi `212.564.160 ₫` (tính tất cả đơn DELIVERED); Dashboard Sale ghi `212.310.360 ₫` (lọc theo ngày tạo đơn trong tháng); Báo cáo Sale ghi `211.378.780 ₫` (tính theo kỳ giao hàng). | Các cấp quản lý và nhân viên có số liệu doanh thu chênh lệch nhau, gây khó khăn khi chốt sổ kế toán. | Ghi vào hướng dẫn ở mục "Đang khắc phục" (nêu rõ cách tính và mục đích của từng màn hình) |
| 16 | Shipper | Sổ quỹ COD (`/shipper/cod`) | Khi tài khoản shipper không giữ tiền COD, màn hình hiển thị: *"0 đơn đã giao thành công Chưa nộp thủ quỹ"*. Câu chữ ghép nối tạo cảm giác shipper chưa giao thành công đơn nào. | Gây hiểu nhầm cho tài xế về hiệu suất giao hàng thực tế của mình. | Sửa code trước (sửa nhãn chữ thành "0 đơn COD chờ nộp quỹ") |

---

## ĐÃ KIỂM VÀ THẤY HỢP LÝ

Các luồng chức năng sau đã được kiểm thử trực tiếp trên site thật `https://tdtmaterial.id.vn` và hoạt động hoàn toàn chính xác, đúng nghiệp vụ:

1. **Khách hàng (Customer):**
   - Tìm kiếm sản phẩm theo tên tiếng Việt có dấu/không dấu (ví dụ: "Ống nhựa PVC", "Co 90") và tìm kiếm theo mã SKU rút gọn (ví dụ: "BM-CPVC-21") trả về kết quả chuẩn xác, tốc độ tức thì.
   - Bộ lọc Danh mục sản phẩm, lọc Thương hiệu (Bình Minh, Cadivi, Schneider, Panasonic) và Sắp xếp theo giá hoạt động tốt kết hợp với nút "Tìm kiếm".
   - Chi tiết sản phẩm hiển thị đầy đủ thông số kỹ thuật, quy cách đóng gói, giá niêm yết, tỷ lệ chiết khấu và tình trạng tồn kho thực tế.
   - Giỏ hàng (`/cart`): Thêm sản phẩm, tăng/giảm số lượng; tính toán Tạm tính, Phí ship (miễn phí), Thuế VAT 8% (đã bao gồm trong giá) và Tổng thanh toán chính xác.
   - Đặt hàng COD trực tuyến thành công, tự động cấp mã đơn chuẩn `ORD-YYMMDD-xxxxxx`.
   - Tra cứu đơn hàng vãng lai (`/tra-cuu-don-hang`): Nhập Mã đơn + SĐT tra cứu hiển thị đầy đủ thông tin đơn hàng, tiến trình vận chuyển và thông tin người nhận.
   - Hủy đơn hàng đang Chờ xử lý: Ràng buộc lý do hủy tối thiểu 5 ký tự (dưới 5 ký tự nút bấm bị khóa). Hủy thành công đơn chuyển ngay sang trạng thái "ĐÃ HỦY", lưu vết và hiển thị lý do hủy rõ ràng.
   - Tổng chi tiêu trong trang `/profile` hoạt động đúng nghiệp vụ kế toán: Chỉ cộng dồn giá trị của các đơn đã giao thành công và đã thanh toán (`DELIVERED` & `PAID`), không cộng đơn đang xử lý hoặc đơn đã hủy.

2. **Nhân viên Bán hàng (Sale):**
   - Bán tại quầy POS (`/sale/orders/new`): Tự động nhận diện và áp dụng chiết khấu hạng thành viên (ví dụ: Khách hàng Gold được giảm thêm 15%). Tạo đơn và hiển thị phiếu in xuất kho nhanh chóng.
   - Lập báo giá dự án (`/sale/quotes/new`): Ràng buộc chiết khấu Sale tối đa 10%. Khi nhập CK Sale 15% (>10%), hệ thống tự động cảnh báo vượt thẩm quyền và thông báo báo giá sẽ chuyển sang trạng thái CHỜ DUYỆT để Quản lý phê duyệt. Tính toán tổng tiền sau CK Hãng và CK Sale hoàn toàn chính xác.
   - Quản lý công nợ (`/sale/payments`): Đơn COD đã được ẩn nút "Thu tiền" và thay bằng badge trạng thái nộp tiền rõ ràng ("Chờ shipper nộp" hoặc "Đã nộp COD"). Ô tìm kiếm đơn nợ hoạt động tốt (tìm đơn hủy trả về trống, tìm đơn đã giao hiển thị đúng).

3. **Quản lý (Manager):**
   - Dashboard (`/manager/dashboard`) và Danh sách đơn hàng (`/manager/orders`): Khớp tuyệt đối số lượng đơn hàng theo từng trạng thái (Tổng 101 đơn: 31 Chờ duyệt, 4 Đang đóng gói, 4 Đang giao, 19 Đã giao, 2 Sự cố, 41 Đã hủy).
   - Nút **Xuất Excel** hoạt động chuẩn xác: Xuất và tải về file `TDT_Don_Hang_2026-11-19.xlsx` chứa đầy đủ 101 đơn hàng với đầy đủ các cột dữ liệu.
   - Kiểm soát duyệt đơn: Đơn chuyển khoản bắt buộc phải được "Đánh dấu đã thanh toán" trước khi được phép bấm "Duyệt đơn", tránh thất thoát hàng hóa.
   - Trừ tồn kho tự động: Ngay khi Manager bấm "Duyệt đơn", tồn kho của sản phẩm trong đơn (`SCH-EZ9F34232`) được trừ ngay lập tức từ 493 cái xuống 492 cái (kiểm chứng tại trang Quản lý sản phẩm).
   - Điều phối Shipper: Modal phân công tải đầy đủ danh sách shipper khả dụng kèm trạng thái (Sẵn sàng 0/5 đơn, xe máy), giới hạn tối đa 5 đơn/shipper. Phân công xong đơn chuyển sang trạng thái "Đang giao hàng" và ghi nhận tên Shipper phụ trách.
   - Tab "Sự cố / Giao thất bại": Liệt kê rõ ràng các đơn gặp sự cố kèm tên shipper phụ trách và có sẵn nút "Thử lại giao" và "Hủy đơn".

4. **Tài xế giao vận (Shipper):**
   - Giao diện mobile-friendly chuyên dụng cho tài xế (`/shipper`).
   - Nút **Trực ca / Chưa nhận ca** hoạt động tốt, cho phép tài xế linh hoạt check-in và check-out ca làm việc.
   - Đơn hàng được Manager phân công lập tức xuất hiện ở vị trí ưu tiên "Đơn tiếp theo cần xử lý".
   - Luồng Báo cáo sự cố: Tích hợp nút gọi khẩn cấp cho Quản lý (1900 6868), có phân loại sự cố đa dạng (Không liên lạc được, Khách hẹn lại, Sai địa chỉ, Khách bom hàng, Vật tư hư hỏng, Khác) và ô nhập ghi chú hiện trường.
   - Luồng Xác nhận giao hàng (POD): Rất hoàn chỉnh với nút điền nhanh demo, vùng vẽ chữ ký điện tử trực tiếp, cơ chế tải và nén canvas 1–3 ảnh hiện trường/biên bản, kiểm tra trạng thái thu tiền (thông báo rõ đơn đã chuyển khoản trước, không thu tiền mặt).
   - Sổ quỹ COD (`/shipper/cod`): Theo dõi chính xác số tiền COD đang giữ, nút nộp quỹ kế toán (tự disable khi 0 đơn), lưu vết lịch sử 10 lần nộp tiền gần nhất chi tiết đến từng mã phiếu, thời gian và số đơn.

---

## CHƯA KIỂM ĐƯỢC

1. **Trang Liên hệ (`/contact`)**: Không kiểm tra được nội dung do URL trả về mã lỗi 404 (chưa triển khai route này trên production).
2. **Trang Bảng giá Quản lý (`/manager/pricing`)**: Không kiểm tra được do URL trả về mã lỗi 404 (chức năng bảng giá riêng chưa có route này, chính sách giá đang tích hợp trực tiếp trong `/manager/products`).
3. **Thanh toán chuyển khoản thực tế qua cổng PayOS/VietQR ngân hàng**: Không quét mã chuyển khoản tiền thật từ tài khoản ngân hàng bên ngoài nhằm tránh phát sinh giao dịch tài chính không mong muốn trên production (tuy nhiên đã kiểm tra toàn bộ luồng tạo đơn, sinh mã QR, xác nhận thanh toán thủ công của Quản lý và xử lý giao vận của Shipper).
