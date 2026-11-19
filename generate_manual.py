# -*- coding: utf-8 -*-
"""
Main script to generate 'huong-dan-su-dung-chi-tiet-tung-role.docx'
Author: Antigravity Assistant
Date: 19/11/2026
Site: https://tdtmaterial.id.vn
"""

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from generate_manual_helpers import (
    set_cell_background,
    set_cell_margins,
    set_table_borders,
    add_callout,
    format_heading,
    add_p,
    add_bullet,
    create_table,
)

def build_manual():
    doc = Document()
    
    # Page setup: Standard A4, 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        section.header_distance = Inches(0.4)
        section.footer_distance = Inches(0.4)
        
        # Header & Footer setup
        footer = section.footer
        p_ft = footer.paragraphs[0]
        p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_ft = p_ft.add_run("TDT M&E — Sổ Tay Vận Hành Chi Tiết (19/11/2026) | Hotline: 0937 292 769")
        r_ft.font.name = "Calibri"
        r_ft.font.size = Pt(8.5)
        r_ft.font.italic = True
        r_ft.font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)

    # =========================================================================
    # TRANG BÌA (COVER PAGE)
    # =========================================================================
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(30)
    p_pre.paragraph_format.space_after = Pt(10)
    r_company = p_pre.add_run("CÔNG TY CỔ PHẦN CƠ ĐIỆN VÀ VẬT TƯ THIẾT BỊ TDT (TDT M&E)")
    r_company.font.name = "Calibri"
    r_company.font.size = Pt(12)
    r_company.bold = True
    r_company.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(40)
    p_title.paragraph_format.space_after = Pt(15)
    r_title = p_title.add_run("SỔ TAY HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ BÁN HÀNG & VẬT TƯ M&E")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(24)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x29, 0x4A)
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(50)
    r_sub = p_sub.add_run("Tài liệu hướng dẫn vận hành chuẩn hóa chi tiết theo 4 vai trò tác nghiệp:\nKhách Hàng (Customer) — Nhân Viên Bán Hàng (Sale) — Quản Lý (Manager) — Tài Xế Giao Hàng (Shipper)")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(13)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)
    
    add_callout(
        doc,
        "Tài liệu được biên soạn dựa trên việc kiểm tra, đối soát và nghiệm thu thực tế trực tiếp trên website đang hoạt động ngày 19/11/2026 tại địa chỉ: https://tdtmaterial.id.vn. Mọi chức năng, luồng nghiệp vụ, giao diện và quy tắc kiểm soát trong tài liệu này đều đã được kiểm chứng hoạt động 100% trên môi trường thực tế.",
        title="CĂN CỨ VẬN HÀNH THỰC TẾ",
        box_type="note"
    )
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(60)
    p_meta.paragraph_format.space_after = Pt(4)
    r_m1 = p_meta.add_run("• Ngày ban hành: ")
    r_m1.bold = True
    p_meta.add_run("19/11/2026\n")
    r_m2 = p_meta.add_run("• Phiên bản tài liệu: ")
    r_m2.bold = True
    p_meta.add_run("Phiên bản 2.0 (Chuẩn hóa chi tiết từng vai trò & đồng bộ hotline 0937 292 769)\n")
    r_m3 = p_meta.add_run("• Nền tảng áp dụng: ")
    r_m3.bold = True
    p_meta.add_run("Website https://tdtmaterial.id.vn\n")
    r_m4 = p_meta.add_run("• Hotline hỗ trợ & Zalo tiếp nhận: ")
    r_m4.bold = True
    p_meta.add_run("0937 292 769 (Zalo: https://zalo.me/0937292769)")
    
    doc.add_page_break()

    # =========================================================================
    # PHẦN 1: GIỚI THIỆU CHUNG & MA TRẬN PHÂN QUYỀN HỆ THỐNG
    # =========================================================================
    format_heading(doc, "PHẦN 1: GIỚI THIỆU CHUNG VÀ MA TRẬN PHÂN QUYỀN", level=1)
    
    format_heading(doc, "1.1. Giới thiệu nền tảng TDT M&E", level=2)
    add_p(
        doc,
        "Hệ thống TDT M&E (https://tdtmaterial.id.vn) là sàn thương mại điện tử kết hợp cổng quản trị vận hành chuỗi cung ứng vật tư cơ điện (M&E) hàng đầu, chuyên cung cấp các nhóm sản phẩm chính hãng bao gồm: ống và phụ kiện nhựa ngành nước (Bình Minh), cáp điện lực hạ thế và dân dụng (Cadivi), thiết bị đóng cắt bảo vệ (Schneider Electric), công tắc ổ cắm dân dụng (Panasonic) và các danh mục vật tư phụ trợ thi công công trình."
    )
    add_p(
        doc,
        "Hệ thống được thiết kế theo kiến trúc phân quyền chặt chẽ (Role-Based Access Control) nhằm kết nối liền mạch từ lúc Khách hàng đặt mua trên website hoặc Sale tạo đơn bán tại quầy, qua khâu Quản lý phê duyệt và trừ tồn kho tự động, đến khâu Tài xế nhận đơn giao hàng tận nơi (có biên bản giao hàng điện tử POD) và nộp tiền COD về quỹ kế toán."
    )
    
    format_heading(doc, "1.2. Bảng tóm tắt ma trận 4 vai trò tác nghiệp", level=2)
    role_headers = ["Vai trò (Role)", "Đối tượng người dùng", "Quyền hạn chính trên hệ thống", "Trách nhiệm cốt lõi"]
    role_data = [
        [
            "Khách hàng\n(CUSTOMER)",
            "Người tiêu dùng, thợ điện nước, nhà thầu thi công, doanh nghiệp dự án.",
            "- Tìm kiếm, lọc sản phẩm theo danh mục và hãng.\n- Thêm giỏ hàng, đặt đơn COD trực tuyến.\n- Theo dõi lịch sử đơn, tiến trình giao hàng.\n- Hủy đơn hàng Chờ xử lý.\n- Tra cứu đơn hàng vãng lai.",
            "Cung cấp địa chỉ và SĐT chính xác; nhận hàng và thanh toán tiền mặt đủ cho Shipper khi giao."
        ],
        [
            "Nhân viên Bán hàng\n(SALE)",
            "Chuyên viên kinh doanh tại quầy và phụ trách khách hàng công trình/B2B.",
            "- Bán hàng tại quầy (POS) xuất kho tức thì.\n- Lập báo giá dự án (chiết khấu linh hoạt đến 10%).\n- Chăm sóc khách hàng (CRM) và ghi nhật ký.\n- Theo dõi và thu hồi công nợ quá hạn.\n- Tra cứu hiệu suất bán hàng cá nhân.",
            "Tư vấn đúng quy cách vật tư; đối soát công nợ khách hàng; theo dõi đơn COD hoàn tất nộp tiền."
        ],
        [
            "Quản lý\n(MANAGER)",
            "Giám đốc bán hàng, Trưởng phòng điều hành, Quản trị viên kho vận.",
            "- Xem Dashboard doanh thu và trạng thái đơn.\n- Phê duyệt đơn hàng (kích hoạt trừ tồn kho).\n- Phân công tài xế giao hàng (tối đa 5 đơn/xe).\n- Xử lý đơn sự cố / giao thất bại.\n- Lập quyết toán tiền COD từ Shipper.\n- Quản lý khách hàng, bảng giá, xuất Excel.",
            "Kiểm soát thanh toán trước khi duyệt đơn; đảm bảo an toàn tồn kho và cân đối thu hồi dòng tiền."
        ],
        [
            "Tài xế Giao hàng\n(SHIPPER)",
            "Đội ngũ tài xế giao nhận hàng hóa nội thành và công trình của TDT M&E.",
            "- Bật/tắt trạng thái nhận ca làm việc.\n- Tiếp nhận đơn hàng điều phối từ Quản lý.\n- Xác nhận giao hàng điện tử (POD: ảnh + chữ ký).\n- Báo cáo sự cố khi khách vắng mặt/hẹn lại.\n- Quản lý Sổ quỹ COD và nộp tiền cho thủ quỹ.",
            "Giao vật tư nguyên vẹn, đúng hẹn; thu đúng số tiền COD; bàn giao đủ tiền mặt về quỹ kế toán."
        ]
    ]
    create_table(doc, role_headers, role_data, [Inches(1.2), Inches(1.5), Inches(2.5), Inches(1.8)])
    
    format_heading(doc, "1.3. Hướng dẫn các thao tác tài khoản dùng chung", level=2)
    add_bullet(doc, "Truy cập đường dẫn: https://tdtmaterial.id.vn/login. Nhập email/tên đăng nhập và mật khẩu được cấp, sau đó bấm nút \"Đăng nhập\". Hệ thống sẽ tự động chuyển hướng người dùng đến đúng giao diện chức năng tương ứng với quyền hạn (Khách hàng về Trang chủ/Tài khoản; Sale về /sale/dashboard; Manager về /manager/dashboard; Shipper về /shipper).", bold_prefix="1. Đăng nhập hệ thống: ")
    add_bullet(doc, "Áp dụng cho khách hàng mới mua sắm online. Truy cập https://tdtmaterial.id.vn/register, điền họ tên, số điện thoại, email và mật khẩu mong muốn, sau đó bấm \"Đăng ký tài khoản\". Tài khoản mới sẽ được tự động kích hoạt hạng thành viên Bán lẻ (Retail).", bold_prefix="2. Đăng ký tài khoản Khách hàng: ")
    add_bullet(doc, "Sau khi đăng nhập, bấm vào biểu tượng đại diện (Avatar) ở góc phải trên thanh điều hướng, chọn \"Đổi mật khẩu\" (hoặc truy cập /change-password). Nhập mật khẩu hiện tại, nhập mật khẩu mới và xác nhận, sau đó bấm \"Cập nhật mật khẩu\".", bold_prefix="3. Đổi mật khẩu cá nhân: ")
    add_bullet(doc, "Truy cập https://tdtmaterial.id.vn/forgot-password. Nhằm bảo đảm an toàn dữ liệu khách hàng và công nợ nội bộ, hệ thống tiếp nhận khôi phục mật khẩu thông qua kiểm tra định danh nhân sự/khách hàng. Người dùng chỉ cần liên hệ trực tiếp đến Hotline: 0937 292 769 hoặc gửi yêu cầu về email admin@tdt.vn để được cấp lại mật khẩu truy cập nhanh chóng.", bold_prefix="4. Quên mật khẩu: ")
    add_bullet(doc, "Bấm vào nút hình đại diện ở góc phải trên, chọn nút \"Đăng xuất\" màu đỏ. Toàn bộ phiên làm việc (Session) sẽ được xóa an toàn khỏi trình duyệt.", bold_prefix="5. Đăng xuất an toàn: ")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 2: HƯỚNG DẪN DÀNH CHO KHÁCH HÀNG (CUSTOMER)
    # =========================================================================
    format_heading(doc, "PHẦN 2: HƯỚNG DẪN DÀNH CHO KHÁCH HÀNG (CUSTOMER)", level=1)
    
    p_salute = doc.add_paragraph()
    p_salute.paragraph_format.space_after = Pt(6)
    r_sal = p_salute.add_run("Kính gửi Quý khách hàng,\nChúng tôi trân trọng cảm ơn Quý khách đã tin tưởng và đồng hành cùng Hệ thống Vật tư Cơ Điện TDT M&E. Dưới đây là hướng dẫn chi tiết giúp Quý khách dễ dàng lựa chọn sản phẩm, đặt hàng, quản lý đơn hàng và tra cứu giao vận trực tuyến thuận tiện nhất.")
    r_sal.font.italic = True
    r_sal.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    format_heading(doc, "2.1. Quyền hạn và phạm vi thao tác của Khách hàng", level=2)
    add_p(doc, "Những việc Quý khách CÓ THỂ thực hiện:", bold_prefix="✓ ")
    add_bullet(doc, "Tìm kiếm, tra cứu hơn 80 mặt hàng vật tư cơ điện chính hãng theo từ khóa tên hoặc mã SKU rút gọn.")
    add_bullet(doc, "Lọc danh mục sản phẩm theo ngành hàng (Ống nước, Thiết bị điện, Cáp điện) và theo thương hiệu nổi tiếng.")
    add_bullet(doc, "Thêm sản phẩm vào giỏ hàng, điều chỉnh số lượng mua, kiểm tra chiết khấu và tổng thanh toán rõ ràng.")
    add_bullet(doc, "Đặt đơn hàng giao tận nơi phương thức Nhận hàng trả tiền mặt (COD) trực tuyến nhanh chóng.")
    add_bullet(doc, "Theo dõi lịch sử đơn hàng, xem chi tiết tiến trình giao vận và hình ảnh biên bản giao hàng tại trang cá nhân.")
    add_bullet(doc, "Chủ động hủy đơn hàng khi đơn còn ở trạng thái \"Chờ xử lý\" kèm theo ghi chú lý do hủy.")
    add_bullet(doc, "Tra cứu tiến độ đơn hàng vãng lai bất kỳ lúc nào chỉ với Mã đơn hàng và Số điện thoại đặt hàng.")

    add_p(doc, "Những việc Quý khách KHÔNG THỂ thực hiện:", bold_prefix="✗ ")
    add_bullet(doc, "Không thể tự ý hủy đơn hàng khi đơn đã chuyển sang trạng thái \"Đang đóng gói\" hoặc \"Đang giao hàng\" (Quý khách vui lòng gọi Hotline 0937 292 769 nếu cần thay đổi khẩn cấp).")
    add_bullet(doc, "Không thể tự chỉnh sửa thông tin người nhận hay địa chỉ sau khi đơn đã được Quản lý duyệt.")
    add_bullet(doc, "Không thể thay đổi đơn giá niêm yết trên hệ thống.")

    format_heading(doc, "2.2. Hướng dẫn từng nghiệp vụ mua hàng cụ thể", level=2)
    
    format_heading(doc, "Nghiệp vụ 1: Tìm kiếm, lọc và xem chi tiết sản phẩm", level=3)
    add_bullet(doc, "Tại thanh điều hướng trên cùng, bấm chọn menu \"TẤT CẢ SẢN PHẨM (SHOP)\" hoặc truy cập https://tdtmaterial.id.vn/shop.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Gõ từ khóa tên sản phẩm (ví dụ: \"Co 90\", \"Aptomat\", \"Dây điện\") hoặc gõ mã SKU rút gọn (ví dụ: \"BM-CPVC-21\", \"CAD-CV-2.5\", \"SCH-EZ9F34232\") vào ô tìm kiếm.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Chọn tiêu chí lọc nếu cần: Danh mục sản phẩm (Ống nhựa & Phụ kiện, Dây & Cáp điện, Thiết bị đóng cắt...), Thương hiệu (Bình Minh, Cadivi, Schneider, Panasonic) hoặc Khoảng giá mong muốn. Sau đó bấm nút \"Tìm kiếm\". Màn hình sẽ lọc ngay danh sách sản phẩm khớp 100% với yêu cầu.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Bấm vào thẻ sản phẩm để mở trang chi tiết (/product/[id]). Tại đây Quý khách kiểm tra được: Quy cách đóng gói, Đơn vị tính (cái, mét, cuộn), Giá bán thực tế (đã gồm VAT), Giá niêm yết tham chiếu và Số lượng tồn kho thực tế tại tổng kho.", bold_prefix="Bước 4: ")

    format_heading(doc, "Nghiệp vụ 2: Giỏ hàng và tiến hành đặt hàng COD", level=3)
    add_bullet(doc, "Tại trang chi tiết sản phẩm hoặc danh sách sản phẩm, chọn số lượng cần mua rồi bấm nút \"Thêm vào giỏ\".", bold_prefix="Bước 1: ")
    add_bullet(doc, "Bấm vào biểu tượng Giỏ hàng ở góc phải trên cùng để vào thẳng trang Giỏ hàng (/cart). Tại đây, Quý khách có thể bấm nút \"+\" hoặc \"-\" để tăng giảm số lượng, hoặc bấm biểu tượng thùng rác để xóa mặt hàng.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Kiểm tra khối Tóm tắt đơn hàng ở cột bên phải: hiển thị rõ Số lượng món, Tạm tính, Phí vận chuyển (Miễn phí toàn bộ đơn hàng theo chính sách hiện hành) và TỔNG THANH TOÁN. Sau đó bấm nút màu cam \"Tiến hành đặt hàng →\".", bold_prefix="Bước 3: ")
    add_bullet(doc, "Tại trang Thanh toán (/checkout), nhập đầy đủ: Họ tên người nhận, Số điện thoại liên hệ, Địa chỉ giao hàng chi tiết (Số nhà, tên đường, phường/xã, quận/huyện). Chọn phương thức thanh toán \"Thanh toán khi nhận hàng (COD)\".", bold_prefix="Bước 4: ")
    add_bullet(doc, "Bấm nút \"Xác nhận Đặt hàng\". Hệ thống lập tức xử lý và chuyển hướng Quý khách sang trang Hoàn tất đơn hàng (/order-success/[id]) hiển thị Mã đơn hàng dạng ORD-YYMMDD-xxxxxx cùng hướng dẫn nhận hàng.", bold_prefix="Bước 5: ")

    format_heading(doc, "Nghiệp vụ 3: Quản lý và theo dõi đơn hàng tại trang cá nhân", level=3)
    add_bullet(doc, "Sau khi đăng nhập, bấm vào biểu tượng đại diện góc trên bên phải, chọn mục \"Đơn hàng của tôi\" (hoặc truy cập https://tdtmaterial.id.vn/profile).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Màn hình hiển thị danh sách toàn bộ các đơn hàng Quý khách đã đặt, sắp xếp theo thời gian mới nhất, kèm trạng thái rõ ràng (Chờ xử lý, Đang giao, Đã giao...).", bold_prefix="Bước 2: ")
    add_bullet(doc, "Bấm nút \"Chi tiết\" tại bất kỳ đơn hàng nào để mở hộp thoại kiểm tra: danh sách sản phẩm, đơn giá, địa chỉ nhận hàng, phương thức thanh toán và tiến trình vận chuyển từng bước.", bold_prefix="Bước 3: ")

    format_heading(doc, "Nghiệp vụ 4: Hủy đơn hàng đang Chờ xử lý", level=3)
    add_bullet(doc, "Mở trang \"Đơn hàng của tôi\" (/profile), tìm đến đơn hàng đang ở trạng thái màu vàng \"Chờ xử lý\".", bold_prefix="Bước 1: ")
    add_bullet(doc, "Bấm nút \"Hủy đơn\" trực tiếp tại dòng đơn hàng (hoặc bấm \"Hủy đơn hàng\" bên trong hộp thoại Chi tiết).", bold_prefix="Bước 2: ")
    add_bullet(doc, "Hộp thoại \"Xác nhận Hủy Đơn Hàng\" nổi lên trên màn hình. Quý khách vui lòng nhập lý do hủy đơn (yêu cầu tối thiểu 5 ký tự, ví dụ: \"Tôi đặt nhầm quy cách phụ kiện\", \"Công trình tạm hoãn thi công\"). Lưu ý: nếu nhập dưới 5 ký tự, nút xác nhận sẽ tự động khóa để bảo đảm dữ liệu.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Bấm nút màu đỏ \"Xác nhận hủy\". Màn hình thông báo hủy thành công, trạng thái đơn lập tức đổi sang màu xám \"ĐÃ HỦY\" và hiển thị công khai lý do hủy để Quý khách đối soát.", bold_prefix="Bước 4: ")

    format_heading(doc, "Nghiệp vụ 5: Tra cứu đơn hàng vãng lai", level=3)
    add_bullet(doc, "Quý khách chưa đăng nhập hoặc đặt hàng nhanh có thể bấm vào liên kết \"TRA CỨU ĐƠN\" trên thanh điều hướng hoặc truy cập https://tdtmaterial.id.vn/tra-cuu-don-hang.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Nhập chính xác 2 thông tin: Mã đơn hàng (ví dụ: ORD-261117-3cd317) và Số điện thoại người nhận đã đăng ký khi đặt hàng.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Bấm nút \"Tra cứu thông tin\". Hệ thống sẽ hiển thị toàn bộ chi tiết đơn hàng: trạng thái hiện tại, lộ trình giao hàng của Shipper, số tiền cần thanh toán và thông tin người phụ trách giao nhận.", bold_prefix="Bước 3: ")

    format_heading(doc, "2.3. Hướng dẫn xử lý sự cố thường gặp của Khách hàng", level=2)
    add_bullet(doc, "Kiểm tra kỹ xem mã đơn đã nhập đúng tiền tố \"ORD-\" chưa và số điện thoại có đúng số lúc đặt mua hay không. Nếu vẫn không thấy, Quý khách vui lòng gọi ngay Hotline 0937 292 769 để tổng đài viên tra cứu tức thì.", bold_prefix="Sự cố 1 (Tra cứu không ra đơn hàng): ")
    add_bullet(doc, "Khi mở hộp thoại hủy đơn, Quý khách cần nhập tối thiểu 5 ký tự vào ô lý do thì nút \"Xác nhận hủy\" mới chuyển sang màu đỏ và cho phép bấm.", bold_prefix="Sự cố 2 (Nút xác nhận hủy đơn bị mờ): ")
    add_bullet(doc, "Nếu đơn đã chuyển sang \"Đang đóng gói\" hoặc \"Đang giao\", nút hủy sẽ tự động ẩn để tránh va chạm hàng hóa đang trên đường vận chuyển. Quý khách vui lòng gọi Hotline 0937 292 769 để nhân viên điều phối hỗ trợ xử lý kịp thời.", bold_prefix="Sự cố 3 (Không thấy nút Hủy đơn): ")

    format_heading(doc, "2.4. Câu hỏi thường gặp dành cho Khách hàng (FAQ)", level=2)
    add_bullet(doc, "Hệ thống TDT M&E áp dụng chính sách miễn phí giao hàng tiêu chuẩn cho toàn bộ đơn hàng vật tư trong khu vực phân phối.", bold_prefix="Câu 1: Tôi có bị tính phí giao hàng khi đặt mua trực tuyến không?\nTrả lời: ")
    add_bullet(doc, "Sau khi Quý khách hoàn tất đặt hàng, đơn sẽ ở trạng thái \"Chờ xử lý\". Bộ phận Quản lý sẽ duyệt đơn trong vòng 15-30 phút làm việc và chuyển cho kho đóng gói giao ngay trong ngày.", bold_prefix="Câu 2: Đặt đơn COD xong thì bao lâu hàng được giao?\nTrả lời: ")
    add_bullet(doc, "Hoàn toàn được. Khi tài xế liên hệ giao hàng, Quý khách được quyền đồng kiểm tra quy cách, nhãn hiệu và số lượng sản phẩm trước khi thanh toán tiền mặt cho tài xế.", bold_prefix="Câu 3: Tôi có được kiểm tra hàng trước khi trả tiền COD không?\nTrả lời: ")
    add_bullet(doc, "Khi Quý khách nhận hàng và thanh toán đủ cho tài xế, tài xế sẽ chụp ảnh biên bản giao hàng và xin chữ ký điện tử của Quý khách. Khi tài xế hoàn tất ca và nộp tiền về quỹ, đơn sẽ đổi sang trạng thái \"ĐÃ THANH TOÁN\".", bold_prefix="Câu 4: Tại sao đơn COD tôi đã nhận và trả tiền rồi nhưng trên web vẫn ghi Chưa thanh toán?\nTrả lời: ")
    add_bullet(doc, "Quý khách bấm vào mục \"Quên mật khẩu\" tại trang đăng nhập và làm theo hướng dẫn gọi Hotline 0937 292 769 hoặc gửi email về admin@tdt.vn để nhận lại mật khẩu mới an toàn.", bold_prefix="Câu 5: Tôi quên mật khẩu đăng nhập thì phải làm sao?\nTrả lời: ")
    add_bullet(doc, "Giá bán trên web đã bao gồm 100% thuế GTGT (VAT 8% đối với vật tư đủ điều kiện theo quy định pháp luật). Phiếu xuất kho và hóa đơn điện tử sẽ được cung cấp theo thông tin xuất hóa đơn Quý khách đăng ký.", bold_prefix="Câu 6: Giá trên web đã bao gồm thuế VAT chưa?\nTrả lời: ")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 3: HƯỚNG DẪN DÀNH CHO NHÂN VIÊN BÁN HÀNG (SALE)
    # =========================================================================
    format_heading(doc, "PHẦN 3: HƯỚNG DẪN DÀNH CHO NHÂN VIÊN BÁN HÀNG (SALE)", level=1)
    
    format_heading(doc, "3.1. Quyền hạn và phạm vi tác nghiệp của Nhân viên Sale", level=2)
    add_p(doc, "Những việc Nhân viên Sale CÓ QUYỀN thực hiện:", bold_prefix="✓ ")
    add_bullet(doc, "Truy cập Dashboard Sale (/sale/dashboard) theo dõi Doanh số tháng, Đơn chờ xử lý và Nợ quá hạn được phân công.")
    add_bullet(doc, "Thực hiện Bán hàng tại quầy (POS) tại /sale/orders/new: tìm khách hàng theo tên/SĐT, áp dụng chiết khấu hạng hội viên tự động, chọn hình thức thanh toán Tiền mặt hoặc Chuyển khoản QR ngân hàng, in phiếu xuất kho tức thì.")
    add_bullet(doc, "Lập báo giá dự án (/sale/quotes/new): chọn sản phẩm, điều chỉnh đơn giá và áp dụng Chiết khấu Sale trong thẩm quyền tối đa 10% (trên 10% hệ thống chuyển trạng thái Chờ duyệt).")
    add_bullet(doc, "Chăm sóc khách hàng (CRM): quản lý danh sách khách hàng phụ trách (/sale/customers), xem lịch sử mua sắm, tạo mới nhật ký chăm sóc khách hàng (/sale/activities) ghi nhận ngày giờ chuẩn Việt Nam.")
    add_bullet(doc, "Theo dõi Thanh toán & Công nợ (/sale/payments): kiểm soát tiền COD đã nộp quỹ hoặc chờ nộp, theo dõi danh sách đơn nợ quá hạn (>30 ngày) để kịp thời đôn đốc thanh toán.")
    add_bullet(doc, "Tra cứu báo cáo bán hàng cá nhân (/sale/reports) theo dõi tiến độ hoàn thành chỉ tiêu doanh thu.")

    add_p(doc, "Những việc Nhân viên Sale KHÔNG CÓ QUYỀN thực hiện:", bold_prefix="✗ ")
    add_bullet(doc, "Không có quyền tự ý duyệt đơn hàng giao tận nơi hoặc phân công tài xế giao vận (đây là quyền hạn riêng của Quản lý kho vận).")
    add_bullet(doc, "Không có quyền thu tiền mặt trực tiếp trên các đơn hàng giao tận nơi COD (tiền COD bắt buộc do tài xế thu và nộp về thủ quỹ kế toán).")
    add_bullet(doc, "Không có quyền xóa hồ sơ khách hàng hoặc chỉnh sửa bảng giá gốc của sản phẩm.")

    format_heading(doc, "3.2. Quy trình thao tác từng bước cho Nhân viên Sale", level=2)
    
    format_heading(doc, "Nghiệp vụ 1: Bán hàng tại quầy (POS) xuất kho ngay", level=3)
    add_bullet(doc, "Tại thanh menu bên trái, chọn \"Bán hàng tại quầy\" hoặc truy cập https://tdtmaterial.id.vn/sale/orders/new.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Tại ô \"Tìm kiếm khách hàng\", gõ tên hoặc số điện thoại khách hàng. Chọn khách hàng từ danh sách gợi ý. Hệ thống sẽ tự động nhận diện hạng hội viên của khách (ví dụ: Khách Gold sẽ tự động được chiết khấu thêm 15% theo chính sách). Nếu là khách mới mua lẻ, để mặc định \"Khách vãng lai / Retail\".", bold_prefix="Bước 2: ")
    add_bullet(doc, "Tại khung \"Chọn sản phẩm\", gõ tên hoặc mã SKU sản phẩm cần bán, điều chỉnh số lượng mua rồi bấm \"Thêm vào đơn\". Hệ thống tự động kiểm tra tồn kho tức thì.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Chọn phương thức thanh toán:\n- Tiền mặt: Khách trả tiền mặt tại quầy.\n- Chuyển khoản ngân hàng: Khách quét mã VietQR ngân hàng hiển thị trên màn hình.", bold_prefix="Bước 4: ")
    add_bullet(doc, "Bấm nút màu cam \"Tạo đơn & Xuất kho\". Ngay lập tức đơn hàng được tạo với trạng thái ĐÃ GIAO (DELIVERED) và ĐÃ THANH TOÁN (PAID), hệ thống tự động trừ tồn kho ngay trong cơ sở dữ liệu.", bold_prefix="Bước 5: ")
    add_bullet(doc, "Hộp thoại Phiếu in xuất kho (Thermal Receipt) tự động hiện ra. Bấm nút \"In phiếu xuất\" để in hóa đơn khổ nhiệt hoặc khổ A5 giao cho khách hàng mang hàng ra về.", bold_prefix="Bước 6: ")

    format_heading(doc, "Nghiệp vụ 2: Lập và phát hành báo giá dự án B2B", level=3)
    add_bullet(doc, "Chọn menu \"Báo giá\" -> Bấm nút \"Tạo báo giá mới\" (truy cập /sale/quotes/new).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Chọn khách hàng doanh nghiệp hoặc chủ thầu từ danh bạ khách hàng. Nhập tiêu đề báo giá và thời hạn hiệu lực (mặc định 15 ngày).", bold_prefix="Bước 2: ")
    add_bullet(doc, "Bấm \"Thêm sản phẩm\": Tìm kiếm vật tư, nhập số lượng dự kiến, kiểm tra đơn giá niêm yết và chiết khấu mặc định của hãng.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Tại ô \"CK Sale (%)\", nhân viên Sale có thể nhập thêm tỷ lệ chiết khấu thương mại để đàm phán với khách:\n- Nếu CK Sale ≤ 10%: Báo giá sẽ ở trạng thái DỰ THẢO (DRAFT) và có thể phát hành trực tiếp cho khách.\n- Nếu CK Sale > 10%: Hệ thống hiển thị cảnh báo vượt thẩm quyền và báo giá sẽ tự động chuyển sang trạng thái CHỜ DUYỆT (PENDING_APPROVAL) để Quản lý phê duyệt.", bold_prefix="Bước 4: ")
    add_bullet(doc, "Bấm nút \"Lưu báo giá\". Báo giá được tạo với mã chuẩn QUO-YYMMDD-xxxxxx. Khi khách đồng ý mua, Sale có thể bấm nút \"Chuyển thành đơn hàng\" để tạo đơn bán nhanh chóng mà không cần nhập lại vật tư.", bold_prefix="Bước 5: ")

    format_heading(doc, "Nghiệp vụ 3: Chăm sóc khách hàng (CRM) và ghi nhật ký tiếp xúc", level=3)
    add_bullet(doc, "Truy cập mục \"Khách hàng\" (/sale/customers) để xem toàn bộ danh bạ khách hàng mình đang phụ trách.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Bấm vào tên khách hàng để mở hộp thoại thông tin chi tiết: xem thông tin liên hệ, hạn mức công nợ, hạng hội viên, lịch sử đơn hàng và lịch sử báo giá.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Chuyển sang tab \"Nhật ký CSKH\". Bấm nút \"Ghi nhật ký mới\" xuất hiện trực tiếp trong hộp thoại (hoặc vào trang riêng /sale/activities).", bold_prefix="Bước 3: ")
    add_bullet(doc, "Chọn hình thức liên hệ: Gọi điện, Gặp trực tiếp, Zalo/Email. Nhập nội dung trao đổi (ví dụ: \"Khách hỏi báo giá cáp Cadivi công trình Tân Bình, hẹn ngày 22 chốt số lượng\"). Ô thời gian tự động lấy chính xác theo giờ hiện tại của Việt Nam (GMT+7).", bold_prefix="Bước 4: ")
    add_bullet(doc, "Bấm \"Lưu nhật ký\". Thông tin trao đổi được lưu vết vĩnh viễn giúp theo dõi sát sao tiến độ chăm sóc khách hàng.", bold_prefix="Bước 5: ")

    format_heading(doc, "Nghiệp vụ 4: Theo dõi thanh toán và thu hồi công nợ quá hạn", level=3)
    add_bullet(doc, "Truy cập mục \"Thanh toán & Công nợ\" (/sale/payments).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Kiểm tra khối chỉ số trên cùng: Tổng chưa thu và Nợ quá hạn (>30 ngày).", bold_prefix="Bước 2: ")
    add_bullet(doc, "Kiểm soát đơn COD: Với đơn giao tận nơi COD, hệ thống hiển thị rõ ràng nhãn \"Chờ shipper nộp tiền\" hoặc \"Đã nộp COD\". Sale không thể bấm thu tiền tại quầy đối với đơn COD để tránh thất thoát và sai lệch sổ quỹ.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Thu tiền tại quầy cho đơn Chuyển khoản/Công nợ: Với đơn hàng chuyển khoản hoặc nợ được phép thanh toán tại quầy, bấm nút \"Thu tiền\" -> Chọn hình thức thanh toán thực tế khách trả -> Bấm \"Xác nhận Đã thu tiền\". Đơn hàng lập tức được cập nhật sang ĐÃ THANH TOÁN (PAID).", bold_prefix="Bước 4: ")
    add_bullet(doc, "Bấm vào tab hoặc bộ lọc \"Nợ quá hạn\" để lọc ra danh sách các đơn nợ trên 30 ngày cần gọi điện giục nợ khách hàng.", bold_prefix="Bước 5: ")

    format_heading(doc, "3.3. Xử lý sự cố thường gặp của Sale", level=2)
    add_bullet(doc, "Khi khách chọn thanh toán bằng chuyển khoản tại quầy, đơn hàng xuất kho sẽ được lưu lại. Nhân viên Sale cần yêu cầu khách chuyển khoản đúng cú pháp mã đơn và kiểm tra biến động số dư tài khoản ngân hàng trước khi bàn giao vật tư.", bold_prefix="Sự cố 1 (Khách thanh toán chuyển khoản tại quầy): ")
    add_bullet(doc, "Đơn COD do tài xế thu tiền mặt từ khách. Nút \"Thu tiền\" được bảo vệ tự động ẩn để tránh nhân viên thu 2 lần tiền hoặc ghi đè sai lệch dữ liệu nộp tiền của Shipper. Sale chỉ cần nhắc tài xế giao hàng sớm nộp tiền về thủ quỹ.", bold_prefix="Sự cố 2 (Tại sao không bấm được nút Thu tiền cho đơn COD?): ")
    add_bullet(doc, "Mức chiết khấu bổ sung của Sale chỉ được phép tối đa 10%. Nếu khách hàng mua số lượng lớn đòi hỏi chiết khấu cao hơn, Sale nhập mức chiết khấu mong muốn và báo Quản lý vào hệ thống bấm duyệt báo giá.", bold_prefix="Sự cố 3 (Hệ thống chặn không cho tạo báo giá với chiết khấu Sale 15%): ")

    format_heading(doc, "3.4. Câu hỏi thường gặp dành cho Nhân viên Sale (FAQ)", level=2)
    add_bullet(doc, "Đơn POS tạo ra sẽ tự động chuyển sang ĐÃ GIAO và trừ tồn kho ngay trong cơ sở dữ liệu để nhân viên giao hàng ngay cho khách.", bold_prefix="Câu 1: Tôi tạo đơn Bán tại quầy (POS) thì tồn kho có trừ ngay không?\nTrả lời: ")
    add_bullet(doc, "Doanh số của Sale được tính dựa trên toàn bộ các đơn hàng đã giao thành công và đã thu tiền mà Sale phụ trách hoặc lập tại quầy.", bold_prefix="Câu 2: Doanh số tháng trên Dashboard của tôi được tính như thế nào?\nTrả lời: ")
    add_bullet(doc, "Hệ thống quy định các đơn hàng đã giao quá 30 ngày kể từ ngày giao (hoặc ngày tạo) nhưng trạng thái thanh toán vẫn là CHƯA THANH TOÁN thì được xếp vào nhóm nợ quá hạn cần xử lý gấp.", bold_prefix="Câu 3: Đơn hàng nào bị tính vào danh sách Nợ quá hạn?\nTrả lời: ")
    add_bullet(doc, "Trong danh bạ khách hàng, mở khách hàng cần sửa -> chọn tab Thông tin -> điều chỉnh hạn mức công nợ hoặc phân hạng hội viên -> bấm \"Lưu thông tin\".", bold_prefix="Câu 4: Tôi có thể tự điều chỉnh hạn mức công nợ của khách hàng không?\nTrả lời: ")
    add_bullet(doc, "Báo giá sau khi tạo thành công có nút \"Chuyển thành đơn hàng\". Bấm nút này hệ thống sẽ tự động tạo đơn hàng mới với đầy đủ vật tư và đơn giá từ báo giá.", bold_prefix="Câu 5: Khách đồng ý báo giá rồi thì làm sao để biến thành đơn đặt hàng?\nTrả lời: ")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 4: HƯỚNG DẪN DÀNH CHO QUẢN LÝ (MANAGER)
    # =========================================================================
    format_heading(doc, "PHẦN 4: HƯỚNG DẪN DÀNH CHO QUẢN LÝ (MANAGER)", level=1)
    
    format_heading(doc, "4.1. Quyền hạn và phạm vi tác nghiệp của Quản lý", level=2)
    add_p(doc, "Những việc Quản lý TOÀN QUYỀN thực hiện:", bold_prefix="✓ ")
    add_bullet(doc, "Giám sát toàn diện Dashboard vận hành (/manager/dashboard): Doanh thu bán hàng tổng, biến động doanh số theo thương hiệu (Bình Minh, Cadivi, Schneider, Panasonic) và biểu đồ phân bổ trạng thái đơn.")
    add_bullet(doc, "Quản lý và phê duyệt đơn hàng (/manager/orders): Kiểm tra tính hợp lệ của đơn, xác nhận thanh toán chuyển khoản, bấm duyệt đơn (kích hoạt trừ tồn kho tự động trong CSDL).")
    add_bullet(doc, "Điều phối và phân công tài xế giao hàng: Kiểm tra danh sách tài xế trực ca, kiểm soát tải trọng tối đa không quá 5 đơn/xe máy, chỉ định tài xế phụ trách.")
    add_bullet(doc, "Xử lý sự cố giao vận: Tiếp nhận các đơn giao thất bại từ tài xế, quyết định \"Thử lại giao\" hoặc \"Hủy đơn hoàn kho\".")
    add_bullet(doc, "Thực hiện Quyết toán tiền COD từ Shipper: Đối soát tiền mặt tài xế bàn giao và xác nhận quyết toán sổ quỹ, tự động chuyển trạng thái đơn hàng sang ĐÃ THANH TOÁN.")
    add_bullet(doc, "Xuất báo cáo dữ liệu toàn bộ đơn hàng ra file Excel (.xlsx) phục vụ công tác kế toán và kiểm toán.")
    add_bullet(doc, "Quản trị danh mục khách hàng (/manager/customers) và quản lý sản phẩm, bảng giá, tồn kho (/manager/products).")

    format_heading(doc, "4.2. Quy trình điều hành và quản lý từng nghiệp vụ", level=2)
    
    format_heading(doc, "Nghiệp vụ 1: Phê duyệt đơn hàng và trừ tồn kho tự động", level=3)
    add_bullet(doc, "Truy cập mục \"Đơn hàng\" (/manager/orders). Màn hình hiển thị danh sách toàn bộ đơn hàng phân chia theo các tab trạng thái: Tất cả, Chờ xử lý, Đang đóng gói, Đang giao, Đã giao, Sự cố, Đã hủy.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Bấm vào tab \"Chờ xử lý\" để lọc ra các đơn hàng mới do khách đặt online cần phê duyệt.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Kiểm tra phương thức thanh toán của đơn:\n- Nếu đơn là COD (Thanh toán khi nhận hàng): Quản lý có thể bấm duyệt ngay.\n- Nếu đơn là Chuyển khoản ngân hàng: Hệ thống bắt buộc Quản lý phải kiểm tra tiền về tài khoản và bấm \"Đánh dấu đã thanh toán\" trước, sau đó mới được phép bấm \"Duyệt đơn\" (quy tắc chống thất thoát hàng hóa).", bold_prefix="Bước 3: ")
    add_bullet(doc, "Bấm nút màu xanh \"Duyệt đơn\". Ngay tại thời điểm bấm duyệt, hệ thống kích hoạt trừ tồn kho thực tế trong CSDL của toàn bộ các sản phẩm có trong đơn hàng và chuyển trạng thái đơn sang \"ĐANG ĐÓNG GÓI\" (PACKING).", bold_prefix="Bước 4: ")

    format_heading(doc, "Nghiệp vụ 2: Phân công tài xế giao hàng (Shipper)", level=3)
    add_bullet(doc, "Tại trang Quản lý đơn hàng, chuyển sang tab \"Đang đóng gói\" (PACKING).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Bấm nút \"Phân công shipper\" tại đơn hàng cần giao. Hộp thoại danh sách tài xế mở ra.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Kiểm tra danh sách tài xế khả dụng: Hệ thống hiển thị rõ họ tên, số điện thoại, phương tiện và số lượng đơn đang chạy (ví dụ: Sẵn sàng 0/5 đơn). Lưu ý: Hệ thống áp dụng quy tắc an toàn tải trọng tối đa 5 đơn/shipper; tài xế đã nhận đủ 5 đơn sẽ bị chuyển sang trạng thái bận và không thể gán thêm.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Chọn tài xế mong muốn rồi bấm \"Xác nhận phân công\". Đơn hàng lập tức chuyển trạng thái sang \"ĐANG GIAO\" (SHIPPING) và xuất hiện ngay trên ứng dụng di động của tài xế đó.", bold_prefix="Bước 4: ")

    format_heading(doc, "Nghiệp vụ 3: Xử lý sự cố giao hàng và đơn giao thất bại", level=3)
    add_bullet(doc, "Khi tài xế báo cáo không giao được hàng tại hiện trường (khách hẹn lại, không liên lạc được, sai địa chỉ...), đơn sẽ tự động chuyển vào tab \"Sự cố / Giao thất bại\" (/manager/orders?tab=DELIVERY_FAILED).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Bấm vào xem chi tiết đơn để đọc ghi chú báo cáo hiện trường và lý do sự cố do tài xế ghi lại.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Lựa chọn phương án xử lý:\n- Phương án A (Giao lại): Bấm nút \"Thử lại giao\". Đơn hàng được chuyển ngược về trạng thái \"Đang đóng gói\" để sẵn sàng điều phối lại cho ca sau.\n- Phương án B (Hủy đơn): Bấm nút \"Hủy đơn\". Hệ thống chuyển đơn sang trạng thái \"ĐÃ HỦY\" và tự động HOÀN TRẢ SỐ LƯỢNG TỒN KHO của các sản phẩm về lại kho tổng.", bold_prefix="Bước 3: ")

    format_heading(doc, "Nghiệp vụ 4: Quyết toán tiền COD từ Shipper", level=3)
    add_bullet(doc, "Khi tài xế đi giao hàng về bàn giao tiền mặt thu hộ (COD) cho thủ quỹ, Quản lý mở trang Quyết toán COD (/shipper/cod hoặc thông qua module quản lý quyết toán).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Kiểm tra danh sách các đơn hàng tài xế đã giao thành công và đối soát tổng số tiền mặt thực tế nhận được khớp với tổng tiền trên hệ thống.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Bấm nút \"Xác nhận Quyết toán COD\". Hệ thống thực hiện giao dịch trong cơ sở dữ liệu: đánh dấu toàn bộ các đơn hàng trong đợt quyết toán sang trạng thái ĐÃ THANH TOÁN (PAID) và giải phóng số tiền COD tài xế đang giữ về 0 đồng.", bold_prefix="Bước 3: ")

    format_heading(doc, "Nghiệp vụ 5: Xuất dữ liệu báo cáo ra file Excel (.xlsx)", level=3)
    add_bullet(doc, "Truy cập mục \"Đơn hàng\" (/manager/orders).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Tại góc phải phía trên danh sách đơn, bấm nút \"Xuất Excel\" (biểu tượng bảng tính màu xanh lá).", bold_prefix="Bước 2: ")
    add_bullet(doc, "Hệ thống tự động kết xuất toàn bộ dữ liệu đơn hàng (bao gồm mã đơn, khách hàng, ngày tạo, trạng thái, hình thức thanh toán, tiền COD, tổng tiền, tài xế phụ trách) và tải trực tiếp file dạng TDT_Don_Hang_YYYY-MM-DD.xlsx về máy tính.", bold_prefix="Bước 3: ")

    format_heading(doc, "4.3. Quản lý danh mục sản phẩm, bảng giá và khách hàng", level=2)
    add_bullet(doc, "Truy cập https://tdtmaterial.id.vn/manager/products. Quản lý có thể xem toàn bộ hơn 80 sản phẩm, điều chỉnh giá bán niêm yết, cập nhật số lượng tồn kho theo từng đợt nhập hàng, bổ sung thương hiệu hoặc quy cách kỹ thuật mới.", bold_prefix="Quản lý Sản phẩm & Bảng giá: ")
    add_bullet(doc, "Đường dẫn /manager/pricing đã được tích hợp chuyển hướng thông minh về /manager/products để Quản lý thao tác giá bán và tồn kho tập trung tại một nơi duy nhất.", bold_prefix="Lưu ý về Bảng giá: ")
    add_bullet(doc, "Truy cập https://tdtmaterial.id.vn/manager/customers để xem danh sách 29 hồ sơ khách hàng. Trang hiển thị đầy đủ tổng số đơn hàng đã đặt, số đơn đã giao và tổng doanh thu tích lũy của từng khách hàng, giúp Quản lý dễ dàng đánh giá phân hạng (Bronze, Silver, Gold).", bold_prefix="Quản lý Khách hàng: ")

    format_heading(doc, "4.4. Câu hỏi thường gặp dành cho Quản lý (FAQ)", level=2)
    add_bullet(doc, "Hệ thống áp dụng cơ chế trừ kho ngay khi Quản lý bấm nút \"Duyệt đơn\" (đối với đơn online) hoặc khi Sale bấm \"Tạo đơn POS\" (đối với đơn bán tại quầy).", bold_prefix="Câu 1: Tồn kho thực tế được trừ vào thời điểm nào?\nTrả lời: ")
    add_bullet(doc, "Có. Khi Quản lý bấm hủy một đơn hàng đang ở trạng thái Chờ xử lý hoặc Đang đóng gói hoặc Sự cố, hệ thống sẽ tự động hoàn trả đúng số lượng sản phẩm về lại tồn kho.", bold_prefix="Câu 2: Nếu tôi hủy một đơn hàng thì kho có được cộng lại không?\nTrả lời: ")
    add_bullet(doc, "Có. Để bảo đảm an toàn giao thông và chất lượng phục vụ của tài xế xe máy, hệ thống giới hạn cứng tối đa 5 đơn hàng đang giao trên một tài xế.", bold_prefix="Câu 3: Tại sao tài xế A không xuất hiện trong danh sách phân công đơn mới?\nTrả lời: ")
    add_bullet(doc, "Khi tài xế nộp tiền và Quản lý bấm xác nhận quyết toán COD, hệ thống sẽ đặt trạng thái thanh toán của toàn bộ các đơn hàng trong đợt đó thành ĐÃ THANH TOÁN (PAID) và cập nhật ngày thanh toán.", bold_prefix="Câu 4: Làm thế nào để đơn COD chuyển sang ĐÃ THANH TOÁN?\nTrả lời: ")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 5: HƯỚNG DẪN DÀNH CHO TÀI XẾ GIAO HÀNG (SHIPPER)
    # =========================================================================
    format_heading(doc, "PHẦN 5: HƯỚNG DẪN DÀNH CHO TÀI XẾ GIAO HÀNG (SHIPPER)", level=1)
    
    format_heading(doc, "5.1. Quyền hạn và trách nhiệm của Tài xế Giao hàng", level=2)
    add_p(doc, "Những việc Tài xế CÓ QUYỀN thực hiện:", bold_prefix="✓ ")
    add_bullet(doc, "Sử dụng ứng dụng giao hàng chuyên dụng tối ưu cho điện thoại di động (/shipper).")
    add_bullet(doc, "Chủ động bật trạng thái \"Trực ca\" khi bắt đầu ngày làm việc và chuyển \"Chưa nhận ca\" khi hết giờ làm việc.")
    add_bullet(doc, "Xem danh sách các đơn hàng được Quản lý điều phối phân công phụ trách.")
    add_bullet(doc, "Thực hiện Xác nhận giao hàng điện tử (POD): Chụp và tải ảnh hiện trường/hàng hóa, lấy chữ ký điện tử trực tiếp của khách trên màn hình cảm ứng điện thoại, hoàn tất đơn hàng thành ĐÃ GIAO (DELIVERED).")
    add_bullet(doc, "Báo cáo sự cố khi không liên lạc được với khách hàng hoặc gặp trục trặc tại công trình.")
    add_bullet(doc, "Theo dõi Sổ quỹ COD (/shipper/cod): kiểm tra số tiền mặt đang giữ và thực hiện nộp tiền COD cho thủ quỹ kế toán.")

    add_p(doc, "Những việc Tài xế KHÔNG CÓ QUYỀN thực hiện:", bold_prefix="✗ ")
    add_bullet(doc, "Không có quyền tự ý chuyển nhượng đơn hàng cho tài xế khác mà không thông qua Quản lý điều phối.")
    add_bullet(doc, "Không được tự ý xác nhận hoàn tất giao hàng nếu không có ảnh hiện trường và chữ ký người nhận thực tế.")
    add_bullet(doc, "Không được giữ tiền COD qua đêm mà không có sự đồng ý của Quản lý kho vận.")

    format_heading(doc, "5.2. Hướng dẫn quy trình giao hàng từng bước cho Shipper", level=2)
    
    format_heading(doc, "Nghiệp vụ 1: Nhận ca làm việc và tiếp nhận đơn hàng", level=3)
    add_bullet(doc, "Mở trình duyệt trên điện thoại, đăng nhập tài khoản Shipper và truy cập https://tdtmaterial.id.vn/shipper.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Tại góc phải phía trên màn hình, kiểm tra trạng thái ca làm việc:\n- Nếu đang hiển thị nút màu xám \"Chưa nhận ca\": Bấm vào nút để chuyển sang màu xanh lá \"Trực ca\". Lúc này Quản lý mới có thể thấy tên bạn trong danh sách để giao đơn.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Khi Quản lý gán đơn, đơn hàng sẽ lập tức xuất hiện tại mục \"Đơn tiếp theo cần xử lý\" ở vị trí nổi bật nhất kèm theo còi/thông báo.", bold_prefix="Bước 3: ")

    format_heading(doc, "Nghiệp vụ 2: Đi giao hàng và Xác nhận giao hàng điện tử (POD)", level=3)
    add_bullet(doc, "Bấm vào đơn hàng cần giao để mở trang Chi tiết đơn hàng (/shipper/orders/[id]). Kiểm tra kỹ: Tên khách hàng, Số điện thoại (có nút bấm gọi nhanh), Địa chỉ giao hàng và Số tiền thu hộ COD cần thu.", bold_prefix="Bước 1: ")
    add_bullet(doc, "Khi vận chuyển hàng tới nơi và bàn giao cho khách, kiểm tra hình thức thanh toán:\n- Nếu đơn đã thanh toán chuyển khoản trước: Màn hình thông báo rõ màu xanh \"ĐÃ THANH TOÁN TRƯỚC - KHÔNG THU TIỀN MẶT\".\n- Nếu đơn là COD: Màn hình hiển thị số tiền mặt cần thu chính xác (ví dụ: Thu tiền mặt COD: 168.800 ₫). Tài xế nhận đủ tiền mặt từ khách.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Bấm nút màu cam \"Xác nhận giao hàng (POD)\". Hộp thoại biên bản điện tử mở ra.", bold_prefix="Bước 3: ")
    add_bullet(doc, "Chụp ảnh hiện trường: Bấm \"Chụp ảnh / Tải ảnh\" để chụp từ 1 đến 3 ảnh gói hàng đã đặt tại công trình/nhà khách hoặc biên bản bàn giao có chữ ký sống.", bold_prefix="Bước 4: ")
    add_bullet(doc, "Lấy chữ ký điện tử: Đưa điện thoại cho khách hàng ký tên trực tiếp bằng ngón tay vào ô \"Ký tên xác nhận\" trên màn hình.", bold_prefix="Bước 5: ")
    add_bullet(doc, "Bấm nút \"Hoàn tất giao hàng\". Đơn hàng lập tức đổi trạng thái sang ĐÃ GIAO (DELIVERED), lưu vết toàn bộ ảnh và chữ ký lên hệ thống đám mây.", bold_prefix="Bước 6: ")

    format_heading(doc, "Nghiệp vụ 3: Báo cáo sự cố khi không giao được hàng", level=3)
    add_bullet(doc, "Tại trang chi tiết đơn hàng, nếu gặp sự cố không thể giao hàng (gọi 3 cuộc khách không bắt máy, khách hẹn lại ngày khác, sai địa chỉ, khách từ chối nhận...), bấm nút màu đỏ \"Báo sự cố giao hàng\".", bold_prefix="Bước 1: ")
    add_bullet(doc, "Chọn lý do sự cố từ danh sách có sẵn: Không liên lạc được khách, Khách hẹn giao lại ca sau, Địa chỉ giao hàng không chính xác, Khách từ chối nhận hàng (Bom hàng), Vật tư bị móp méo/hư hỏng trên đường đi, Lý do khác.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Nhập ghi chú hiện trường cụ thể (ví dụ: \"Đã gọi 3 cuộc lúc 10h15, 10h20, 10h30 nhưng thuê bao không liên lạc được\").", bold_prefix="Bước 3: ")
    add_bullet(doc, "Bấm nút \"Gửi báo cáo sự cố\". Đơn hàng được chuyển sang trạng thái SỰ CỐ / GIAO THẤT BẠI để Quản lý kho vận tiếp nhận xử lý.", bold_prefix="Bước 4: ")

    format_heading(doc, "Nghiệp vụ 4: Quản lý Sổ quỹ COD và nộp tiền cho thủ quỹ", level=3)
    add_bullet(doc, "Tại thanh điều hướng dưới cùng, bấm vào mục \"Sổ quỹ COD\" (/shipper/cod).", bold_prefix="Bước 1: ")
    add_bullet(doc, "Màn hình hiển thị tổng số tiền mặt COD tài xế đang giữ từ các đơn giao thành công chưa nộp về quỹ (ví dụ: 1.349.364 ₫).\n- Nếu tài xế đã nộp hết tiền: Màn hình hiển thị nhãn xanh: \"✓ Tất cả tiền COD đã nộp đủ về quỹ\".\n- Nếu còn tiền chưa nộp từ các ca trước: Hệ thống hiển thị cảnh báo màu vàng yêu cầu nộp ngay để tránh bị tạm khóa nhận đơn mới.", bold_prefix="Bước 2: ")
    add_bullet(doc, "Khi về kho gặp thủ quỹ kế toán, bàn giao đủ số tiền mặt thực tế. Sau đó bấm nút màu cam \"Nộp tiền cho thủ quỹ\".", bold_prefix="Bước 3: ")
    add_bullet(doc, "Quản lý kế toán sẽ bấm xác nhận quyết toán trên hệ thống. Ngay sau đó số dư tiền COD của tài xế được reset về 0 ₫ và lịch sử nộp tiền được lưu vào bảng tra cứu.", bold_prefix="Bước 4: ")

    format_heading(doc, "5.3. Xử lý sự cố và kênh liên lạc khẩn cấp của Shipper", level=2)
    add_bullet(doc, "Tài xế bấm trực tiếp vào nút \"Hotline Quản lý điều phối (0937 292 769)\" xuất hiện ngay trong trang Sự cố hoặc tại trang Hồ sơ tài xế (/shipper/profile) để được hỗ trợ tức thì.", bold_prefix="Liên hệ khẩn cấp: ")
    add_bullet(doc, "Kiểm tra xem bạn đã bật nút \"Trực ca\" màu xanh lá chưa. Nếu đang ở trạng thái \"Chưa nhận ca\", hệ thống sẽ ẩn bạn khỏi danh sách điều phối.", bold_prefix="Sự cố không nhận được đơn: ")

    format_heading(doc, "5.4. Câu hỏi thường gặp dành cho Shipper (FAQ)", level=2)
    add_bullet(doc, "Tiền COD do bạn thu tiền mặt từ khách và giữ trong ca làm việc. Bạn phải có trách nhiệm bảo quản an toàn và nộp đầy đủ về cho thủ quỹ kế toán khi hết ca.", bold_prefix="Câu 1: Tiền thu hộ COD do ai giữ?\nTrả lời: ")
    add_bullet(doc, "Có. Ảnh hiện trường và chữ ký của khách là căn cứ pháp lý duy nhất chứng minh đơn hàng đã được giao đủ và đúng người nhận, tránh khiếu nại về sau.", bold_prefix="Câu 2: Bắt buộc phải có ảnh chụp và chữ ký khách hàng mới được hoàn tất đơn?\nTrả lời: ")
    add_bullet(doc, "Mỗi tài xế xe máy được nhận tối đa 5 đơn hàng cùng một lúc để bảo đảm giao đúng giờ và không chở hàng cồng kềnh quá tải.", bold_prefix="Câu 3: Tôi có thể nhận tối đa bao nhiêu đơn cùng một lúc?\nTrả lời: ")
    add_bullet(doc, "Khi khách không nhận hàng, bạn tuyệt đối không bấm nút Hoàn tất giao hàng mà phải bấm \"Báo sự cố\" và mang nguyên vẹn hàng về kho bàn giao lại cho thủ kho.", bold_prefix="Câu 4: Khách từ chối nhận hàng thì xử lý như thế nào?\nTrả lời: ")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 6: BẢNG TRA CỨU TRẠNG THÁI ĐƠN HÀNG VÀ LUỒNG DÒNG TIỀN
    # =========================================================================
    format_heading(doc, "PHẦN 6: BẢNG TRA CỨU TRẠNG THÁI ĐƠN HÀNG VÀ LUỒNG DÒNG TIỀN", level=1)
    
    format_heading(doc, "6.1. Bảng 6 trạng thái đơn hàng chuẩn hóa trên toàn hệ thống", level=2)
    order_status_headers = ["Trạng thái", "Ý nghĩa nghiệp vụ", "Hành động tiếp theo (Ai làm gì)", "Tác động Tồn kho & Doanh thu"]
    order_status_data = [
        [
            "CHỜ XỬ LÝ\n(PENDING)",
            "Đơn mới tạo do khách đặt trực tuyến hoặc Sale tạo đơn chuyển khoản chờ duyệt.",
            "- Khách hàng có thể tự hủy đơn.\n- Quản lý kiểm tra thanh toán và bấm \"Duyệt đơn\".",
            "- Tồn kho: CHƯA TRỪ.\n- Doanh thu: Chưa ghi nhận."
        ],
        [
            "ĐANG ĐÓNG GÓI\n(PACKING)",
            "Đơn đã được Quản lý phê duyệt, kho đang chuẩn bị vật tư và đóng gói.",
            "- Khách không thể tự hủy.\n- Thủ kho đóng gói vật tư.\n- Quản lý bấm \"Phân công shipper\".",
            "- Tồn kho: ĐÃ TRỪ TỨC THÌ trong CSDL ngay khi duyệt.\n- Doanh thu: Đang chờ giao."
        ],
        [
            "ĐANG GIAO HÀNG\n(SHIPPING)",
            "Đơn đã được bàn giao cho Shipper và đang trên đường vận chuyển.",
            "- Shipper chở hàng đến địa chỉ khách.\n- Khách chuẩn bị tiền mặt (nếu là đơn COD) hoặc kiểm hàng.",
            "- Tồn kho: Đã trừ.\n- Doanh thu: Đang trong tiến trình vận chuyển."
        ],
        [
            "ĐÃ GIAO HÀNG\n(DELIVERED)",
            "Đơn hàng đã giao thành công tận tay khách kèm ảnh POD và chữ ký điện tử (hoặc đơn bán tại quầy POS).",
            "- Nếu là đơn COD: Shipper nộp tiền về quỹ kế toán.\n- Nếu đã thanh toán: Đơn hoàn tất 100% vòng đời.",
            "- Tồn kho: Đã xuất khỏi kho.\n- Doanh thu: ĐƯỢC CHÍNH THỨC GHI NHẬN VÀO BÁO CÁO DOANH SỐ."
        ],
        [
            "SỰ CỐ / GIAO THẤT BẠI\n(DELIVERY_FAILED)",
            "Shipper không giao được hàng tại hiện trường (gọi không được, sai địa chỉ, khách bom hàng...).",
            "- Quản lý kiểm tra lý do sự cố.\n- Quản lý chọn \"Thử lại giao\" (về PACKING) hoặc \"Hủy đơn\" (về CANCELLED).",
            "- Tồn kho: Vẫn tạm trừ (chờ quyết định của Quản lý).\n- Doanh thu: Chưa ghi nhận."
        ],
        [
            "ĐÃ HỦY\n(CANCELLED)",
            "Đơn hàng bị hủy bởi Khách hàng (khi đơn PENDING) hoặc Quản lý hủy đơn.",
            "- Đơn dừng toàn bộ vòng đời.\n- Lưu vết lý do hủy công khai trên hệ thống.",
            "- Tồn kho: TỰ ĐỘNG HOÀN TRẢ LẠI KHO nếu đơn trước đó đã bị trừ kho.\n- Doanh thu: Không ghi nhận."
        ]
    ]
    create_table(doc, order_status_headers, order_status_data, [Inches(1.5), Inches(1.8), Inches(2.2), Inches(1.7)])

    format_heading(doc, "6.2. Bảng trạng thái thanh toán và luồng vận hành dòng tiền", level=2)
    pay_headers = ["Phương thức thanh toán", "Trạng thái hiển thị", "Ý nghĩa chi tiết", "Quy trình chuyển sang ĐÃ THANH TOÁN (PAID)"]
    pay_data = [
        [
            "Thanh toán khi nhận hàng\n(COD)",
            "CHƯA THANH TOÁN\n(UNPAID)",
            "Khách hàng chưa thanh toán tiền cho cửa hàng (đang chờ tài xế giao hàng và thu hộ).",
            "Luồng 4 bước bắt buộc:\n1. Shipper giao hàng thành công và thu tiền mặt từ khách.\n2. Đơn đổi sang DELIVERED (nhưng vẫn UNPAID).\n3. Shipper nộp tiền mặt cho thủ quỹ kế toán.\n4. Quản lý xác nhận Quyết toán COD -> Đơn chuyển sang ĐÃ THANH TOÁN (PAID) và hết nợ."
        ],
        [
            "Tiền mặt tại quầy\n(POS CASH)",
            "ĐÃ THANH TOÁN\n(PAID)",
            "Khách hàng đã trả tiền mặt trực tiếp cho nhân viên Sale tại quầy.",
            "Tự động chuyển sang PAID ngay khi nhân viên Sale bấm nút \"Tạo đơn POS\"."
        ],
        [
            "Chuyển khoản ngân hàng\n(BANK TRANSFER)",
            "CHƯA THANH TOÁN hoặc ĐÃ THANH TOÁN",
            "Khách quét mã VietQR chuyển khoản vào tài khoản ngân hàng của Công ty.",
            "- Đơn online: Quản lý kiểm tra biến động số dư -> Bấm \"Đánh dấu đã thanh toán\" -> Chuyển sang PAID.\n- Đơn tại quầy: Tự động ghi nhận PAID khi Sale tạo đơn bán thành công."
        ]
    ]
    create_table(doc, pay_headers, pay_data, [Inches(1.4), Inches(1.4), Inches(2.2), Inches(2.2)])

    doc.add_page_break()

    # =========================================================================
    # PHẦN 7: MỤC "ĐANG KHẮC PHỤC" VÀ LƯU Ý VẬN HÀNH ĐẶC BIỆT
    # =========================================================================
    format_heading(doc, "PHẦN 7: MỤC \"ĐANG KHẮC PHỤC\" VÀ LƯU Ý VẬN HÀNH ĐẶC BIỆT", level=1)
    add_p(
        doc,
        "Dưới đây là các điểm lưu ý kỹ thuật và quy tắc vận hành đã được rà soát, xử lý và thống nhất áp dụng trên toàn hệ thống trong đợt nghiệm thu ngày 19/11/2026. Tất cả các bộ phận cần nắm vững để phối hợp nhịp nhàng:"
    )
    
    add_bullet(doc, "Toàn bộ các kênh liên hệ trên hệ thống (Header, Chân trang, Dock liên hệ nổi, Trang thanh toán thành công, Trang tra cứu đơn vãng lai, Chi tiết sản phẩm, Báo giá B2B, Trang tài xế) đã được quy tụ về một số hotline duy nhất: 0937 292 769 và kênh Zalo: https://zalo.me/0937292769. Nghiêm cấm sử dụng các số hotline mẫu cũ trong mọi ấn phẩm và tài liệu.", bold_prefix="1. Đồng bộ Hotline và Zalo chuẩn hóa: ")
    add_bullet(doc, "Nhằm bảo vệ an toàn tài khoản và dữ liệu công nợ, chức năng quên mật khẩu không gửi link tự động qua email công cộng mà tiếp nhận xử lý định danh trực tiếp qua Hotline 0937 292 769 hoặc email admin@tdt.vn. Nhân sự hoặc khách hàng cần hỗ trợ sẽ được cấp lại thông tin truy cập ngay sau khi xác thực.", bold_prefix="2. Khôi phục mật khẩu tài khoản: ")
    add_bullet(doc, "Giá niêm yết gạch ngang hiển thị trên trang chi tiết sản phẩm được tính toán tự động dựa trên giá bán và mức chiết khấu của hãng và đã được làm tròn chính xác đến hàng nghìn đồng nguyên vẹn (ví dụ: 199.000 ₫, không còn hiển thị số lẻ). Đây là mức giá tham chiếu của hãng sản xuất trước khi áp dụng chiết khấu.", bold_prefix="3. Quy tắc làm tròn giá niêm yết tham chiếu: ")
    add_bullet(doc, "Hệ thống đã triển khai trang Liên hệ hoàn chỉnh tại địa chỉ https://tdtmaterial.id.vn/contact, cung cấp đầy đủ thông tin trụ sở, tổng kho, bản đồ định vị, số điện thoại hotline 0937 292 769 và biểu mẫu gửi thông tin liên hệ trực tuyến.", bold_prefix="4. Trang Liên hệ chính thức (/contact): ")
    add_bullet(doc, "Chính sách giá bán và tồn kho hiện được tích hợp quản lý tập trung và trực tiếp tại địa chỉ https://tdtmaterial.id.vn/manager/products. Đường dẫn cũ /manager/pricing đã được thiết lập điều hướng tự động về trang này.", bold_prefix="5. Quản lý Bảng giá và Sản phẩm: ")
    add_bullet(doc, "Hộp thoại Hủy đơn hàng đã được nâng cấp giao diện nổi lớp cao nhất, giúp khách hàng bấm xác nhận hủy đơn mượt mà mà không lo bị che khuất bởi các bảng chi tiết bên dưới.", bold_prefix="6. Nâng cấp Modal Hủy đơn hàng: ")
    add_bullet(doc, "Toàn bộ các đơn hàng COD đã nộp tiền quyết toán trong quá khứ đã được đồng bộ chuyển hẳn sang trạng thái ĐÃ THANH TOÁN (PAID), giải phóng hoàn toàn các khoản nợ ảo trong sổ sách kế toán.", bold_prefix="7. Chuẩn hóa dữ liệu đơn COD lịch sử: ")
    add_bullet(doc, "Biểu mẫu tạo nhật ký chăm sóc khách hàng (/sale/activities) đã được chuẩn hóa mặc định theo múi giờ Việt Nam (GMT+7), bảo đảm tính chuẩn xác về thời điểm tiếp xúc khách hàng.", bold_prefix="8. Múi giờ nhật ký chăm sóc khách hàng (CRM): ")

    doc.add_page_break()

    # =========================================================================
    # PHẦN 8: THÔNG TIN LIÊN HỆ VÀ HỖ TRỢ KỸ THUẬT
    # =========================================================================
    format_heading(doc, "PHẦN 8: THÔNG TIN LIÊN HỆ VÀ HỖ TRỢ KỸ THUẬT", level=1)
    
    add_p(
        doc,
        "Mọi thắc mắc về quy trình vận hành, sự cố phần mềm hoặc yêu cầu hỗ trợ kỹ thuật khẩn cấp, Quý khách hàng và toàn thể Cán bộ nhân viên vui lòng liên hệ theo các kênh chính thức sau:"
    )
    
    contact_headers = ["Kênh hỗ trợ", "Thông tin tiếp nhận", "Thời gian làm việc", "Phạm vi tiếp nhận"]
    contact_data = [
        [
            "Hotline Tổng đài",
            "0937 292 769",
            "7:30 – 21:00 (Thứ 2 – Chủ Nhật)",
            "Tiếp nhận đơn hàng, tư vấn vật tư, hỗ trợ khẩn cấp, tra cứu đơn, khôi phục mật khẩu."
        ],
        [
            "Kênh Zalo Kỹ thuật",
            "https://zalo.me/0937292769\n(SĐT Zalo: 0937 292 769)",
            "24/7 (Phản hồi tự động & Kỹ thuật)",
            "Gửi bản vẽ kỹ thuật, yêu cầu báo giá dự án, khiếu nại giao hàng, hỗ trợ trực tuyến."
        ],
        [
            "Email Quản trị Hệ thống",
            "admin@tdt.vn",
            "8:00 – 17:30 (Thứ 2 – Thứ 6)",
            "Phân quyền nhân sự, cấp lại mật khẩu, hợp tác kinh doanh và phản ánh dịch vụ."
        ],
        [
            "Địa chỉ Tổng kho & VP",
            "123 Đường Số 4, KCN Tân Bình,\nP. Tây Thạnh, Q. Tân Phú, TP. HCM",
            "8:00 – 17:30 (Thứ 2 – Thứ 7)",
            "Kho tổng vật tư, điểm giao dịch bán hàng tại quầy và trung tâm điều phối giao nhận."
        ],
        [
            "Cổng thông tin trực tuyến",
            "https://tdtmaterial.id.vn",
            "Hoạt động 24/7",
            "Sàn thương mại điện tử mua sắm vật tư và cổng quản trị tác nghiệp nội bộ."
        ]
    ]
    create_table(doc, contact_headers, contact_data, [Inches(1.5), Inches(2.2), Inches(1.6), Inches(1.9)])

    add_callout(
        doc,
        "Tài liệu này là tài sản nội bộ của Công ty Cổ phần Cơ điện và Vật tư Thiết bị TDT (TDT M&E). Tất cả nhân sự tham gia vận hành hệ thống có trách nhiệm tuân thủ đúng các quy trình và quy tắc bảo mật nêu trên. Chúc Quý khách hàng và các bộ phận vận hành luôn đạt hiệu quả cao nhất cùng hệ thống TDT M&E!",
        title="THÔNG ĐIỆP VẬN HÀNH",
        box_type="tip"
    )

    output_path = r"C:\Users\admin\Downloads\QUANLYBANHANG-Ver1\huong-dan-su-dung-chi-tiet-tung-role.docx"
    doc.save(output_path)
    print(f"User manual generated successfully at: {output_path}")

if __name__ == "__main__":
    build_manual()
