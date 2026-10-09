import {
  Brand,
  CORE_BRANDS,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Shipper,
  StatusHistoryEntry,
  StockLog,
  CodSettlement,
} from '@/types/manager';
import { calculateDiscountedPrice } from '@/lib/stock';

/**
 * 32 M&E products (exactly 8 per brand: Cadivi, Bình Minh, Schneider, Panasonic)
 * Realistic codes, names, units (m, cuộn, cây, cái, bộ), basePrice in VND, discountPercent, stockQuantity, minStockLevel.
 */
export const SEED_PRODUCTS: Product[] = [
  // Cadivi (8 products)
  {
    id: 'prod-cad-01',
    code: 'CAD-CV-1.5',
    name: 'Dây cáp điện Cadivi CV 1.5 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Cuộn 100m',
    basePrice: 450000,
    discountPercent: 22,
    stockQuantity: 80,
    minStockLevel: 20,
    description: 'Dây cáp điện ruột đồng bọc nhựa PVC 450/750V, cuộn dài 100m tiêu chuẩn TCVN',
  },
  {
    id: 'prod-cad-02',
    code: 'CAD-CV-2.5',
    name: 'Dây cáp điện Cadivi CV 2.5 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Cuộn 100m',
    basePrice: 720000,
    discountPercent: 22,
    stockQuantity: 65,
    minStockLevel: 15,
    description: 'Dây điện đơn ruột đồng cách điện PVC Cadivi 2.5mm² chuyên dụng dân dụng',
  },
  {
    id: 'prod-cad-03',
    code: 'CAD-CV-4.0',
    name: 'Dây cáp điện Cadivi CV 4.0 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Cuộn 100m',
    basePrice: 1150000,
    discountPercent: 20,
    stockQuantity: 40,
    minStockLevel: 10,
    description: 'Dây cáp điện hạ thế CV 4.0 mm² tải điện công suất lớn, chống cháy lan',
  },
  {
    id: 'prod-cad-04',
    code: 'CAD-CV-6.0',
    name: 'Dây cáp điện Cadivi CV 6.0 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Cuộn 100m',
    basePrice: 1750000,
    discountPercent: 20,
    stockQuantity: 35,
    minStockLevel: 10,
    description: 'Dây điện cáp nguồn tổng Cadivi 6.0 mm² cho nhà phố và căn hộ cao cấp',
  },
  {
    id: 'prod-cad-05',
    code: 'CAD-CXV-2X2.5',
    name: 'Cáp đồng hạ thế Cadivi CXV 2x2.5 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Mét',
    basePrice: 22000,
    discountPercent: 18,
    stockQuantity: 1200,
    minStockLevel: 300,
    description: 'Cáp điện lực 2 lõi đồng, cách điện XLPE, vỏ bọc PVC 0.6/1kV',
  },
  {
    id: 'prod-cad-06',
    code: 'CAD-CXV-2X4',
    name: 'Cáp đồng hạ thế Cadivi CXV 2x4 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Mét',
    basePrice: 34000,
    discountPercent: 18,
    stockQuantity: 950,
    minStockLevel: 200,
    description: 'Cáp đồng hạ thế đôi 2x4.0 mm² chống ẩm cách điện cao su tổng hợp XLPE',
  },
  {
    id: 'prod-cad-07',
    code: 'CAD-CXV-4X6',
    name: 'Cáp điện lực hạ thế Cadivi CXV 4x6 mm²',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Mét',
    basePrice: 92000,
    discountPercent: 15,
    stockQuantity: 450,
    minStockLevel: 100,
    description: 'Cáp điện lực 4 lõi 4x6 mm² dẫn nguồn 3 pha cấp cho tủ điện phân phối',
  },
  {
    id: 'prod-cad-08',
    code: 'CAD-VCm-1.5',
    name: 'Dây điện đôi Cadivi VCm 1.5 mm² mềm',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    unit: 'Cuộn 100m',
    basePrice: 480000,
    discountPercent: 20,
    stockQuantity: 55,
    minStockLevel: 15,
    description: 'Dây súp đôi ruột mềm nhiều sợi Cadivi VCm 2x1.5mm² dùng cho thiết bị di động',
  },

  // Bình Minh (8 products)
  {
    id: 'prod-bm-01',
    code: 'BM-UPVC-D21',
    name: 'Ống nhựa uPVC Bình Minh Ø21 dày 1.6mm',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cây 4m',
    basePrice: 32000,
    discountPercent: 25,
    stockQuantity: 250,
    minStockLevel: 50,
    description: 'Ống uPVC cấp thoát nước Ø21 tiêu chuẩn ISO 1452, chịu áp lực nước sạch',
  },
  {
    id: 'prod-bm-02',
    code: 'BM-UPVC-D27',
    name: 'Ống nhựa uPVC Bình Minh Ø27 dày 1.8mm',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cây 4m',
    basePrice: 42000,
    discountPercent: 25,
    stockQuantity: 200,
    minStockLevel: 40,
    description: 'Ống uPVC Ø27 chịu va đập, bề mặt nhẵn bóng chống bám cặn lòng ống',
  },
  {
    id: 'prod-bm-03',
    code: 'BM-UPVC-D34',
    name: 'Ống nhựa uPVC Bình Minh Ø34 dày 2.0mm',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cây 4m',
    basePrice: 58000,
    discountPercent: 25,
    stockQuantity: 180,
    minStockLevel: 30,
    description: 'Ống cấp nước nhánh chính Ø34 uPVC Bình Minh độ bền trên 50 năm',
  },
  {
    id: 'prod-bm-04',
    code: 'BM-UPVC-D60',
    name: 'Ống nhựa uPVC Bình Minh Ø60 dày 2.3mm',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cây 4m',
    basePrice: 115000,
    discountPercent: 22,
    stockQuantity: 120,
    minStockLevel: 25,
    description: 'Ống thoát nước sinh hoạt trục đứng Ø60 cây 4m tiêu chuẩn xây dựng dân dụng',
  },
  {
    id: 'prod-bm-05',
    code: 'BM-UPVC-D90',
    name: 'Ống nhựa uPVC Bình Minh Ø90 dày 3.0mm',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cây 4m',
    basePrice: 210000,
    discountPercent: 20,
    stockQuantity: 85,
    minStockLevel: 20,
    description: 'Ống thoát trục chính Ø90 uPVC Bình Minh dày dặn, kháng ăn mòn hóa chất',
  },
  {
    id: 'prod-bm-06',
    code: 'BM-HDPE-D32',
    name: 'Ống HDPE Bình Minh PE100 Ø32 PN10',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Mét',
    basePrice: 26000,
    discountPercent: 18,
    stockQuantity: 500,
    minStockLevel: 100,
    description: 'Ống nhựa HDPE PE100 Ø32 chịu áp suất PN10 chôn ngầm công trình',
  },
  {
    id: 'prod-bm-07',
    code: 'BM-PPR-D25',
    name: 'Ống hàn nhiệt PPR Bình Minh Ø25 PN10',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cây 4m',
    basePrice: 65000,
    discountPercent: 20,
    stockQuantity: 140,
    minStockLevel: 30,
    description: 'Ống nước nóng lạnh hàn nhiệt PPR chịu nhiệt độ cao tới 95 độ C',
  },
  {
    id: 'prod-bm-08',
    code: 'BM-CO-D27',
    name: 'Co 90 độ uPVC Bình Minh Ø27',
    brand: 'Bình Minh',
    category: 'Ống & Phụ Kiện Nhựa',
    unit: 'Cái',
    basePrice: 4500,
    discountPercent: 15,
    stockQuantity: 600,
    minStockLevel: 100,
    description: 'Co vuông 90 độ uPVC nối góc ống Ø27 ép phun chính xác',
  },

  // Schneider (8 products)
  {
    id: 'prod-sch-01',
    code: 'SCH-MCB-1P16',
    name: 'Aptomat tép Schneider Acti9 MCB 1P 16A 6kA',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 125000,
    discountPercent: 28,
    stockQuantity: 90,
    minStockLevel: 20,
    description: 'Cầu dao tự động MCB 1 cực dòng định mức 16A dòng cắt 6kA Schneider Electric',
  },
  {
    id: 'prod-sch-02',
    code: 'SCH-MCB-1P20',
    name: 'Aptomat tép Schneider Acti9 MCB 1P 20A 6kA',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 125000,
    discountPercent: 28,
    stockQuantity: 85,
    minStockLevel: 20,
    description: 'Cầu dao tép 1 cực 20A bảo vệ quá tải và ngắn mạch mạng điện gia đình',
  },
  {
    id: 'prod-sch-03',
    code: 'SCH-MCB-2P32',
    name: 'Aptomat tép Schneider Acti9 MCB 2P 32A 6kA',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 265000,
    discountPercent: 28,
    stockQuantity: 60,
    minStockLevel: 15,
    description: 'MCB 2 cực 32A ngắt nguồn 2 pha an toàn, gắn thanh ray tiêu chuẩn DIN',
  },
  {
    id: 'prod-sch-04',
    code: 'SCH-MCB-2P40',
    name: 'Aptomat tép Schneider Acti9 MCB 2P 40A 6kA',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 280000,
    discountPercent: 28,
    stockQuantity: 50,
    minStockLevel: 15,
    description: 'Cầu dao tép 2 cực 40A Schneider tải nguồn tầng và bếp từ công suất lớn',
  },
  {
    id: 'prod-sch-05',
    code: 'SCH-MCCB-3P100',
    name: 'Aptomat khối Schneider Easypact CVS 3P 100A 25kA',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 1850000,
    discountPercent: 25,
    stockQuantity: 25,
    minStockLevel: 5,
    description: 'MCCB 3 pha 100A dòng cắt 25kA đóng cắt bảo vệ hệ thống điện công nghiệp',
  },
  {
    id: 'prod-sch-06',
    code: 'SCH-RCBO-2P25',
    name: 'Cầu dao chống giật Schneider Acti9 RCBO 2P 25A 30mA',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 580000,
    discountPercent: 25,
    stockQuantity: 45,
    minStockLevel: 10,
    description: 'RCBO 2 cực kết hợp chống rò dòng 30mA và chống quá tải an toàn tính mạng',
  },
  {
    id: 'prod-sch-07',
    code: 'SCH-CONTACTOR-LC1D',
    name: 'Khởi động từ Schneider TeSys D LC1D18M7 220V',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 460000,
    discountPercent: 22,
    stockQuantity: 30,
    minStockLevel: 8,
    description: 'Contactor 3P 18A cuộn hút 220VAC điều khiển động cơ bơm nước và quạt công nghiệp',
  },
  {
    id: 'prod-sch-08',
    code: 'SCH-ENCLOSURE-8W',
    name: 'Tủ điện âm tường Schneider Mini Pragma 8 đường',
    brand: 'Schneider',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 320000,
    discountPercent: 20,
    stockQuantity: 40,
    minStockLevel: 10,
    description: 'Vỏ tủ điện nhựa chống cháy âm tường 8 module cửa mờ thanh lịch cao cấp',
  },

  // Panasonic (8 products)
  {
    id: 'prod-pan-01',
    code: 'PAN-SW-WIDE',
    name: 'Bộ công tắc đơn 1 chiều Panasonic Wide Series',
    brand: 'Panasonic',
    category: 'Thiết Bị Điện Dân Dụng',
    unit: 'Bộ',
    basePrice: 48000,
    discountPercent: 30,
    stockQuantity: 150,
    minStockLevel: 30,
    description: 'Bộ công tắc 1 phím lớn dòng Wide Series Panasonic chính hãng mạ tiếp điểm bạc',
  },
  {
    id: 'prod-pan-02',
    code: 'PAN-SW-2GANG',
    name: 'Bộ công tắc đôi 1 chiều Panasonic Wide Series',
    brand: 'Panasonic',
    category: 'Thiết Bị Điện Dân Dụng',
    unit: 'Bộ',
    basePrice: 78000,
    discountPercent: 30,
    stockQuantity: 130,
    minStockLevel: 30,
    description: 'Bộ 2 công tắc 1 chiều kèm mặt và đế Panasonic phong cách hiện đại',
  },
  {
    id: 'prod-pan-03',
    code: 'PAN-SK-2P',
    name: 'Bộ ổ cắm đôi 3 chấu có màn che Panasonic Wide',
    brand: 'Panasonic',
    category: 'Thiết Bị Điện Dân Dụng',
    unit: 'Bộ',
    basePrice: 85000,
    discountPercent: 30,
    stockQuantity: 180,
    minStockLevel: 40,
    description: 'Ổ cắm đôi có dây nối đất kèm nắp che an toàn trẻ em 16A 250V',
  },
  {
    id: 'prod-pan-04',
    code: 'PAN-LED-DOWN9W',
    name: 'Đèn LED Downlight âm trần Panasonic 9W tròn',
    brand: 'Panasonic',
    category: 'Thiết Bị Chiếu Sáng',
    unit: 'Cái',
    basePrice: 145000,
    discountPercent: 25,
    stockQuantity: 110,
    minStockLevel: 25,
    description: 'Đèn âm trần LED 9W ánh sáng trung tính 4000K viền bạc sang trọng tuổi thọ 25000h',
  },
  {
    id: 'prod-pan-05',
    code: 'PAN-FAN-CEILING',
    name: 'Quạt trần Panasonic 4 cánh F-56MPG có remote',
    brand: 'Panasonic',
    category: 'Quạt & Thông Gió',
    unit: 'Bộ',
    basePrice: 2450000,
    discountPercent: 20,
    stockQuantity: 20,
    minStockLevel: 5,
    description: 'Quạt trần 4 cánh điều khiển từ xa, 3 cấp độ gió, chế độ hẹn giờ ngủ tự động',
  },
  {
    id: 'prod-pan-06',
    code: 'PAN-EXHAUST-FV20',
    name: 'Quạt hút âm trần Panasonic FV-20CUT1 không ống dẫn',
    brand: 'Panasonic',
    category: 'Quạt & Thông Gió',
    unit: 'Cái',
    basePrice: 720000,
    discountPercent: 22,
    stockQuantity: 35,
    minStockLevel: 8,
    description: 'Quạt hút thông gió âm trần động cơ bạc đạn vận hành êm ái tiết kiệm điện',
  },
  {
    id: 'prod-pan-07',
    code: 'PAN-MCB-2P32',
    name: 'Cầu dao tự động Panasonic MCB 2P 32A 6kA',
    brand: 'Panasonic',
    category: 'Thiết Bị Đóng Cắt',
    unit: 'Cái',
    basePrice: 195000,
    discountPercent: 25,
    stockQuantity: 75,
    minStockLevel: 15,
    description: 'Aptomat 2 cực 32A ngắt dòng chuẩn xác theo tiêu chuẩn an toàn Nhật Bản',
  },
  {
    id: 'prod-pan-08',
    code: 'PAN-WATER-PUMP',
    name: 'Máy bơm nước đẩy cao Panasonic GP-200JXK 200W',
    brand: 'Panasonic',
    category: 'Máy Bơm & Thiết Bị Nước',
    unit: 'Cái',
    basePrice: 1650000,
    discountPercent: 18,
    stockQuantity: 15,
    minStockLevel: 4,
    description: 'Máy bơm đẩy cao 200W lưu lượng 45 lít/phút lực đẩy cao tối đa 30m buồng bơm đồng thau',
  },
];

/**
 * 40 retail customers (code, name, phone, address, tier: Retail, Bronze, Silver, Gold).
 */
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    code: 'KH-001',
    name: 'Nguyễn Văn Hùng',
    phone: '0903123456',
    email: 'hung.nguyen@gmail.com',
    address: '124 Trần Não, P. An Khánh, TP. Thủ Đức, TP. HCM',
    tier: 'Gold',
    createdAt: '2024-03-15T08:30:00.000Z',
  },
  {
    id: 'cust-02',
    code: 'KH-002',
    name: 'Trần Thị Mai',
    phone: '0918234567',
    email: 'mai.tran@gmail.com',
    address: '45 Nguyễn Oanh, P. 10, Q. Gò Vấp, TP. HCM',
    tier: 'Silver',
    createdAt: '2024-04-10T09:15:00.000Z',
  },
  {
    id: 'cust-03',
    code: 'KH-003',
    name: 'Lê Hoàng Long',
    phone: '0937345678',
    email: 'long.le@gmail.com',
    address: '88 Hoàng Hoa Thám, P. 12, Q. Tân Bình, TP. HCM',
    tier: 'Gold',
    createdAt: '2024-05-02T10:00:00.000Z',
  },
  {
    id: 'cust-04',
    code: 'KH-004',
    name: 'Phạm Quốc Bảo',
    phone: '0978456789',
    email: 'bao.pham@gmail.com',
    address: '232 Lê Văn Sỹ, P. 14, Q. 3, TP. HCM',
    tier: 'Bronze',
    createdAt: '2024-06-18T14:20:00.000Z',
  },
  {
    id: 'cust-05',
    code: 'KH-005',
    name: 'Đặng Thị Thảo',
    phone: '0989567890',
    email: 'thao.dang@gmail.com',
    address: '56 Đường số 7, P. An Phú, TP. Thủ Đức, TP. HCM',
    tier: 'Retail',
    createdAt: '2024-07-25T11:45:00.000Z',
  },
  {
    id: 'cust-06',
    code: 'KH-006',
    name: 'Hoàng Văn Tuấn',
    phone: '0908678901',
    email: 'tuan.hoang@gmail.com',
    address: '15 Nguyễn Thị Minh Khai, P. Bến Nghé, Q. 1, TP. HCM',
    tier: 'Gold',
    createdAt: '2024-08-05T13:10:00.000Z',
  },
  {
    id: 'cust-07',
    code: 'KH-007',
    name: 'Vũ Minh Quân',
    phone: '0919789012',
    email: 'quan.vu@gmail.com',
    address: '302 Phan Văn Trị, P. 11, Q. Bình Thạnh, TP. HCM',
    tier: 'Silver',
    createdAt: '2024-09-12T16:30:00.000Z',
  },
  {
    id: 'cust-08',
    code: 'KH-008',
    name: 'Bùi Thị Lan',
    phone: '0938890123',
    email: 'lan.bui@gmail.com',
    address: '77 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP. HCM',
    tier: 'Bronze',
    createdAt: '2024-10-01T08:50:00.000Z',
  },
  {
    id: 'cust-09',
    code: 'KH-009',
    name: 'Đỗ Hải Đăng',
    phone: '0945901234',
    email: 'dang.do@gmail.com',
    address: '19 Lý Thường Kiệt, P. 7, Q. Tân Bình, TP. HCM',
    tier: 'Gold',
    createdAt: '2024-10-18T10:15:00.000Z',
  },
  {
    id: 'cust-10',
    code: 'KH-010',
    name: 'Hồ Công Thành',
    phone: '0966012345',
    email: 'thanh.ho@gmail.com',
    address: '410 Cách Mạng Tháng 8, P. 11, Q. 3, TP. HCM',
    tier: 'Silver',
    createdAt: '2024-11-05T15:40:00.000Z',
  },
  {
    id: 'cust-11',
    code: 'KH-011',
    name: 'Ngô Thanh Tùng',
    phone: '0977123456',
    email: 'tung.ngo@gmail.com',
    address: '95 Huỳnh Tấn Phát, P. Tân Thuận Đông, Q. 7, TP. HCM',
    tier: 'Bronze',
    createdAt: '2024-11-20T09:20:00.000Z',
  },
  {
    id: 'cust-12',
    code: 'KH-012',
    name: 'Dương Thị Thu',
    phone: '0988234567',
    email: 'thu.duong@gmail.com',
    address: '14 Đinh Bộ Lĩnh, P. 24, Q. Bình Thạnh, TP. HCM',
    tier: 'Retail',
    createdAt: '2024-12-01T14:00:00.000Z',
  },
  {
    id: 'cust-13',
    code: 'KH-013',
    name: 'Lý Quốc Huy',
    phone: '0901345678',
    email: 'huy.ly@gmail.com',
    address: '68 Trường Chinh, P. Tây Thạnh, Q. Tân Phú, TP. HCM',
    tier: 'Gold',
    createdAt: '2024-12-15T11:30:00.000Z',
  },
  {
    id: 'cust-14',
    code: 'KH-014',
    name: 'Mai Văn Nam',
    phone: '0912456789',
    email: 'nam.mai@gmail.com',
    address: '152 Kinh Dương Vương, P. 13, Q. 6, TP. HCM',
    tier: 'Silver',
    createdAt: '2025-01-05T08:45:00.000Z',
  },
  {
    id: 'cust-15',
    code: 'KH-015',
    name: 'Trịnh Thị Nga',
    phone: '0923567890',
    email: 'nga.trinh@gmail.com',
    address: '280 Nguyễn Đình Chiểu, P. Võ Thị Sáu, Q. 3, TP. HCM',
    tier: 'Bronze',
    createdAt: '2025-01-18T10:10:00.000Z',
  },
  {
    id: 'cust-16',
    code: 'KH-016',
    name: 'Lương Thế Hào',
    phone: '0934678901',
    email: 'hao.luong@gmail.com',
    address: '11 Tô Hiến Thành, P. 13, Q. 10, TP. HCM',
    tier: 'Retail',
    createdAt: '2025-02-02T13:25:00.000Z',
  },
  {
    id: 'cust-17',
    code: 'KH-017',
    name: 'Chu Minh Hiếu',
    phone: '0945789012',
    email: 'hieu.chu@gmail.com',
    address: '50 Bạch Đằng, P. 2, Q. Tân Bình, TP. HCM',
    tier: 'Gold',
    createdAt: '2025-02-20T16:00:00.000Z',
  },
  {
    id: 'cust-18',
    code: 'KH-018',
    name: 'Tạ Thị Bích',
    phone: '0956890123',
    email: 'bich.ta@gmail.com',
    address: '33 Xô Viết Nghệ Tĩnh, P. 17, Q. Bình Thạnh, TP. HCM',
    tier: 'Silver',
    createdAt: '2025-03-08T09:00:00.000Z',
  },
  {
    id: 'cust-19',
    code: 'KH-019',
    name: 'Đinh Tiến Đạt',
    phone: '0967901234',
    email: 'dat.dinh@gmail.com',
    address: '215 Nguyễn Kiệm, P. 3, Q. Gò Vấp, TP. HCM',
    tier: 'Bronze',
    createdAt: '2025-03-22T14:50:00.000Z',
  },
  {
    id: 'cust-20',
    code: 'KH-020',
    name: 'Lâm Bích Ngọc',
    phone: '0978012345',
    email: 'ngoc.lam@gmail.com',
    address: '90 Hai Bà Trưng, P. Bến Nghé, Q. 1, TP. HCM',
    tier: 'Retail',
    createdAt: '2025-04-05T11:15:00.000Z',
  },
  {
    id: 'cust-21',
    code: 'KH-021',
    name: 'Hà Xuân Hùng',
    phone: '0989123456',
    email: 'hung.ha@gmail.com',
    address: '168 Nguyễn Văn Đậu, P. 11, Q. Bình Thạnh, TP. HCM',
    tier: 'Gold',
    createdAt: '2025-04-18T15:30:00.000Z',
  },
  {
    id: 'cust-22',
    code: 'KH-022',
    name: 'Cao Thị Yến',
    phone: '0902234567',
    email: 'yen.cao@gmail.com',
    address: '47 Lạc Long Quân, P. 5, Q. 11, TP. HCM',
    tier: 'Silver',
    createdAt: '2025-05-03T08:20:00.000Z',
  },
  {
    id: 'cust-23',
    code: 'KH-023',
    name: 'Võ Thành Đạt',
    phone: '0913345678',
    email: 'dat.vo@gmail.com',
    address: '382 Hậu Giang, P. 12, Q. 6, TP. HCM',
    tier: 'Bronze',
    createdAt: '2025-05-19T10:40:00.000Z',
  },
  {
    id: 'cust-24',
    code: 'KH-024',
    name: 'Châu Minh Trí',
    phone: '0924456789',
    email: 'tri.chau@gmail.com',
    address: '105 Âu Cơ, P. 14, Q. 11, TP. HCM',
    tier: 'Retail',
    createdAt: '2025-06-02T13:00:00.000Z',
  },
  {
    id: 'cust-25',
    code: 'KH-025',
    name: 'Thân Thị Hồng',
    phone: '0935567890',
    email: 'hong.than@gmail.com',
    address: '73 Nguyễn Tri Phương, P. 7, Q. 5, TP. HCM',
    tier: 'Gold',
    createdAt: '2025-06-15T16:15:00.000Z',
  },
  {
    id: 'cust-26',
    code: 'KH-026',
    name: 'Phan Văn Phước',
    phone: '0946678901',
    email: 'phuoc.phan@gmail.com',
    address: '290 Cộng Hòa, P. 13, Q. Tân Bình, TP. HCM',
    tier: 'Silver',
    createdAt: '2025-07-01T09:30:00.000Z',
  },
  {
    id: 'cust-27',
    code: 'KH-027',
    name: 'Nghiêm Đức Duy',
    phone: '0957789012',
    email: 'duy.nghiem@gmail.com',
    address: '18 Vạn Kiếp, P. 3, Q. Bình Thạnh, TP. HCM',
    tier: 'Bronze',
    createdAt: '2025-07-16T14:10:00.000Z',
  },
  {
    id: 'cust-28',
    code: 'KH-028',
    name: 'Đoàn Thị Trúc',
    phone: '0968890123',
    email: 'truc.doan@gmail.com',
    address: '52 Nguyễn Thông, P. 9, Q. 3, TP. HCM',
    tier: 'Retail',
    createdAt: '2025-08-04T11:00:00.000Z',
  },
  {
    id: 'cust-29',
    code: 'KH-029',
    name: 'Bạch Đình Khôi',
    phone: '0979901234',
    email: 'khoi.bach@gmail.com',
    address: '81 Lê Lai, P. Bến Thành, Q. 1, TP. HCM',
    tier: 'Gold',
    createdAt: '2025-08-20T15:45:00.000Z',
  },
  {
    id: 'cust-30',
    code: 'KH-030',
    name: 'Quách Thị Thảo',
    phone: '0980012345',
    email: 'thao.quach@gmail.com',
    address: '127 Lý Chính Thắng, P. Võ Thị Sáu, Q. 3, TP. HCM',
    tier: 'Silver',
    createdAt: '2025-09-02T08:50:00.000Z',
  },
  {
    id: 'cust-31',
    code: 'KH-031',
    name: 'Kim Văn Long',
    phone: '0904123456',
    email: 'long.kim@gmail.com',
    address: '64 Nam Kỳ Khởi Nghĩa, P. Bến Nghé, Q. 1, TP. HCM',
    tier: 'Bronze',
    createdAt: '2025-09-17T13:40:00.000Z',
  },
  {
    id: 'cust-32',
    code: 'KH-032',
    name: 'La Thị Huệ',
    phone: '0915234567',
    email: 'hue.la@gmail.com',
    address: '228 Điện Biên Phủ, P. 15, Q. Bình Thạnh, TP. HCM',
    tier: 'Retail',
    createdAt: '2025-10-01T10:15:00.000Z',
  },
  {
    id: 'cust-33',
    code: 'KH-033',
    name: 'Tôn Thất Minh',
    phone: '0926345678',
    email: 'minh.ton@gmail.com',
    address: '99 Ba Tháng Hai, P. 11, Q. 10, TP. HCM',
    tier: 'Gold',
    createdAt: '2025-10-15T14:30:00.000Z',
  },
  {
    id: 'cust-34',
    code: 'KH-034',
    name: 'Tiêu Thị Hạnh',
    phone: '0937456789',
    email: 'hanh.tieu@gmail.com',
    address: '184 Sư Vạn Hạnh, P. 9, Q. 10, TP. HCM',
    tier: 'Silver',
    createdAt: '2025-11-03T09:20:00.000Z',
  },
  {
    id: 'cust-35',
    code: 'KH-035',
    name: 'Khổng Văn Nam',
    phone: '0948567890',
    email: 'nam.khong@gmail.com',
    address: '42 Phan Xích Long, P. 2, Q. Phú Nhuận, TP. HCM',
    tier: 'Bronze',
    createdAt: '2025-11-20T16:00:00.000Z',
  },
  {
    id: 'cust-36',
    code: 'KH-036',
    name: 'Hứa Thị Diệp',
    phone: '0959678901',
    email: 'diep.hua@gmail.com',
    address: '315 Hoàng Văn Thụ, P. 2, Q. Tân Bình, TP. HCM',
    tier: 'Retail',
    createdAt: '2025-12-05T11:10:00.000Z',
  },
  {
    id: 'cust-37',
    code: 'KH-037',
    name: 'Dư Quốc Thắng',
    phone: '0960789012',
    email: 'thang.du@gmail.com',
    address: '76 Nguyễn Trãi, P. Bến Thành, Q. 1, TP. HCM',
    tier: 'Gold',
    createdAt: '2025-12-18T15:25:00.000Z',
  },
  {
    id: 'cust-38',
    code: 'KH-038',
    name: 'Cung Thị Nhung',
    phone: '0971890123',
    email: 'nhung.cung@gmail.com',
    address: '112 Trần Hưng Đạo, P. Phạm Ngũ Lão, Q. 1, TP. HCM',
    tier: 'Silver',
    createdAt: '2026-01-08T08:45:00.000Z',
  },
  {
    id: 'cust-39',
    code: 'KH-039',
    name: 'Ân Văn Thịnh',
    phone: '0982901234',
    email: 'thinh.an@gmail.com',
    address: '205 Lê Hồng Phong, P. 4, Q. 5, TP. HCM',
    tier: 'Bronze',
    createdAt: '2026-01-22T13:50:00.000Z',
  },
  {
    id: 'cust-40',
    code: 'KH-040',
    name: 'Liễu Thị Thư',
    phone: '0905012345',
    email: 'thu.lieu@gmail.com',
    address: '58 An Dương Vương, P. 9, Q. 5, TP. HCM',
    tier: 'Retail',
    createdAt: '2026-02-10T10:05:00.000Z',
  },
];

/**
 * 5 shippers:
 * Calibrate at least 1 shipper with activeOrders=5 (to test maximum capacity limit) and others with 0-3.
 */
export const SEED_SHIPPERS: Shipper[] = [
  {
    id: 'ship-01',
    name: 'Nguyễn Văn Tuấn',
    phone: '0909112233',
    vehicle: 'Xe máy Honda Wave - Biển số 59P1-123.45',
    activeOrders: 5, // At max workload limit
    status: 'busy',
    shiftStatus: 'busy',
  },
  {
    id: 'ship-02',
    name: 'Trần Quốc Toản',
    phone: '0909223344',
    vehicle: 'Xe ba gác chở hàng - Biển số 59B1-678.90',
    activeOrders: 4, // 2 PACKING + 2 SHIPPING assigned
    status: 'available',
    shiftStatus: 'available',
  },
  {
    id: 'ship-03',
    name: 'Lê Văn Hùng',
    phone: '0909334455',
    vehicle: 'Xe tải 1.25T Hyundai - Biển số 51C-456.78',
    activeOrders: 1,
    status: 'available',
    shiftStatus: 'available',
  },
  {
    id: 'ship-04',
    name: 'Phạm Minh Tâm',
    phone: '0909445566',
    vehicle: 'Xe máy Yamaha Sirius - Biển số 59V2-987.65',
    activeOrders: 0,
    status: 'available',
    shiftStatus: 'available',
  },
  {
    id: 'ship-05',
    name: 'Đặng Đức Huy',
    phone: '0909556677',
    vehicle: 'Xe tải 2.5T Isuzu - Biển số 51D-890.12',
    activeOrders: 0,
    status: 'offline', // Offline shipper for testing assignment guards
    shiftStatus: 'offline',
  },
];

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function createDeterministicRandom(seed: number) {
  let s = seed;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds 150 deterministic orders spanning 12 months (Nov 2025 -> Oct 2026)
 * across all 5 statuses (PENDING, PACKING, SHIPPING, DELIVERED, CANCELLED).
 */
export function generateSeedOrders(): Order[] {
  const prng = createDeterministicRandom(4294967);
  const orders: any[] = [];

  // Helper to pick random item from array
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(prng() * arr.length)];
  const randInt = (min: number, max: number): number => min + Math.floor(prng() * (max - min + 1));

  // 12 month buckets (Nov 2025 to Oct 2026)
  const monthConfigs: Array<{ year: number; month: number; days: number }> = [
    { year: 2025, month: 11, days: 30 },
    { year: 2025, month: 12, days: 31 },
    { year: 2026, month: 1, days: 31 },
    { year: 2026, month: 2, days: 28 },
    { year: 2026, month: 3, days: 31 },
    { year: 2026, month: 4, days: 30 },
    { year: 2026, month: 5, days: 31 },
    { year: 2026, month: 6, days: 30 },
    { year: 2026, month: 7, days: 31 },
    { year: 2026, month: 8, days: 31 },
    { year: 2026, month: 9, days: 30 },
    { year: 2026, month: 10, days: 7 }, // Current month up to Oct 7, 2026
  ];

  // Distribution targets:
  // DELIVERED: 105
  // CANCELLED: 18 (10 from PENDING, 8 from PACKING/SHIPPING)
  // SHIPPING: 8 (5 for ship-01, 2 for ship-02, 1 for ship-03)
  // PACKING: 9
  // PENDING: 10
  // Total: 150

  let orderIndex = 1;

  // Helper to build order items
  const buildItems = (count: number): OrderItem[] => {
    const selectedProds: Product[] = [];
    while (selectedProds.length < count) {
      const p = pick(SEED_PRODUCTS);
      if (!selectedProds.some((x) => x.id === p.id)) {
        selectedProds.push(p);
      }
    }

    return selectedProds.map((prod) => {
      const unitPrice = calculateDiscountedPrice(prod.basePrice, prod.discountPercent);
      const quantity = randInt(1, 5);
      return {
        productId: prod.id,
        productName: prod.name,
        brand: prod.brand,
        unitPrice,
        quantity,
        unit: prod.unit,
        total: unitPrice * quantity,
      };
    });
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // 1. DELIVERED orders (105 total, distributed ~8-9 per month across all 12 months)
  const deliveredPerMonth = [9, 9, 9, 8, 9, 9, 9, 9, 9, 9, 9, 7]; // sum = 105
  monthConfigs.forEach((mConf, mIdx) => {
    const count = deliveredPerMonth[mIdx];
    for (let i = 0; i < count; i++) {
      const cust = pick(SEED_CUSTOMERS);
      const day = randInt(1, mConf.days);
      const hour = randInt(8, 16);
      const min = randInt(0, 59);

      const createdDate = new Date(Date.UTC(mConf.year, mConf.month - 1, day, hour, min, 0));
      const approvedDate = new Date(createdDate.getTime() + randInt(15, 45) * 60 * 1000);
      const shippingDate = new Date(approvedDate.getTime() + randInt(30, 90) * 60 * 1000);
      const deliveredDate = new Date(shippingDate.getTime() + randInt(40, 180) * 60 * 1000);

      const items = buildItems(randInt(1, 4));
      const totalAmount = items.reduce((s, it) => s + it.total, 0);

      const is2H = i % 5 === 0; // some express orders
      const deadline2H = is2H
        ? new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toISOString()
        : undefined;

      const shipper = pick(SEED_SHIPPERS.slice(0, 3)); // ship-01, ship-02, ship-03

      const history: StatusHistoryEntry[] = [
        {
          status: 'PENDING',
          timestamp: createdDate.toISOString(),
          changedBy: cust.name,
          note: is2H ? 'Đặt hàng hỏa tốc Express 2H trực tuyến' : 'Đặt hàng trực tuyến qua website',
        },
        {
          status: 'PACKING',
          timestamp: approvedDate.toISOString(),
          changedBy: 'Manager Hải Đăng',
          note: 'Duyệt đơn và chuyển phòng đóng gói',
        },
        {
          status: 'SHIPPING',
          timestamp: shippingDate.toISOString(),
          changedBy: 'Manager Hải Đăng',
          note: `Bàn giao cho shipper ${shipper.name}`,
        },
        {
          status: 'DELIVERED',
          timestamp: deliveredDate.toISOString(),
          changedBy: shipper.name,
          note: 'Đã giao hàng thành công và thu tiền',
        },
      ];

      orders.push({
        id: `ord-${pad(orderIndex)}`,
        code: `DH-${mConf.year}${pad(mConf.month)}-${pad(orderIndex)}`,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        shippingAddress: cust.address,
        items,
        totalAmount,
        finalAmount: totalAmount,
        status: 'DELIVERED',
        version: 1,
        createdAt: createdDate.toISOString(),
        approvedAt: approvedDate.toISOString(),
        shippingStartedAt: shippingDate.toISOString(),
        deliveredAt: deliveredDate.toISOString(),
        is2H,
        deadline2H,
        shipperId: shipper.id,
        shipperName: shipper.name,
        statusHistory: history,
      });

      orderIndex++;
    }
  });

  // 2. CANCELLED orders (18 total)
  // 10 cancelled from PENDING (never deducted)
  // 8 cancelled from PACKING or SHIPPING (restocked)
  const cancellationReasons = [
    'Khách hàng thay đổi kế hoạch thi công, tạm hoãn công trình',
    'Khách đặt nhầm thông số quy cách ống, yêu cầu hủy để đặt lại',
    'Chưa thống nhất được bản vẽ kỹ thuật điện với chủ nhà',
    'Khách tìm được nguồn vật tư khác có sẵn tại công trình',
    'Địa chỉ giao hàng nằm ngoài bán kính phục vụ trong ngày',
    'Trùng đơn hàng đã đặt trước đó vài phút',
  ];

  for (let i = 0; i < 10; i++) {
    const cust = pick(SEED_CUSTOMERS);
    const mConf = pick(monthConfigs.slice(0, 11));
    const day = randInt(1, mConf.days);
    const createdDate = new Date(Date.UTC(mConf.year, mConf.month - 1, day, 9, randInt(0, 50), 0));
    const cancelledDate = new Date(createdDate.getTime() + randInt(20, 120) * 60 * 1000);
    const reason = cancellationReasons[i % cancellationReasons.length];

    const items = buildItems(randInt(1, 3));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);

    const history: StatusHistoryEntry[] = [
      {
        status: 'PENDING',
        timestamp: createdDate.toISOString(),
        changedBy: cust.name,
        note: 'Khách đặt đơn hàng',
      },
      {
        status: 'CANCELLED',
        timestamp: cancelledDate.toISOString(),
        changedBy: 'Manager Hải Đăng',
        note: reason,
      },
    ];

    orders.push({
      id: `ord-${pad(orderIndex)}`,
      code: `DH-${mConf.year}${pad(mConf.month)}-${pad(orderIndex)}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      shippingAddress: cust.address,
      items,
      totalAmount,
      finalAmount: totalAmount,
      status: 'CANCELLED',
      version: 1,
      createdAt: createdDate.toISOString(),
      cancelledAt: cancelledDate.toISOString(),
      cancellationReason: reason,
      is2H: false,
      statusHistory: history,
    });
    orderIndex++;
  }

  // 8 cancelled from PACKING or SHIPPING
  for (let i = 0; i < 8; i++) {
    const cust = pick(SEED_CUSTOMERS);
    const mConf = pick(monthConfigs.slice(0, 11));
    const day = randInt(1, mConf.days);
    const createdDate = new Date(Date.UTC(mConf.year, mConf.month - 1, day, 10, randInt(0, 50), 0));
    const approvedDate = new Date(createdDate.getTime() + randInt(20, 40) * 60 * 1000);
    const cancelledDate = new Date(approvedDate.getTime() + randInt(30, 90) * 60 * 1000);
    const reason = cancellationReasons[(i + 2) % cancellationReasons.length];

    const items = buildItems(randInt(1, 3));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);

    const history: StatusHistoryEntry[] = [
      {
        status: 'PENDING',
        timestamp: createdDate.toISOString(),
        changedBy: cust.name,
        note: 'Khách đặt đơn hàng',
      },
      {
        status: 'PACKING',
        timestamp: approvedDate.toISOString(),
        changedBy: 'Manager Hải Đăng',
        note: 'Đã duyệt kho và chuẩn bị đóng gói',
      },
      {
        status: 'CANCELLED',
        timestamp: cancelledDate.toISOString(),
        changedBy: 'Manager Hải Đăng',
        note: reason,
      },
    ];

    orders.push({
      id: `ord-${pad(orderIndex)}`,
      code: `DH-${mConf.year}${pad(mConf.month)}-${pad(orderIndex)}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      shippingAddress: cust.address,
      items,
      totalAmount,
      finalAmount: totalAmount,
      status: 'CANCELLED',
      version: 1,
      createdAt: createdDate.toISOString(),
      approvedAt: approvedDate.toISOString(),
      cancelledAt: cancelledDate.toISOString(),
      cancellationReason: reason,
      is2H: i % 2 === 0,
      statusHistory: history,
    });
    orderIndex++;
  }

  // 3. SHIPPING orders (8 total: 5 assigned to ship-01, 2 to ship-02, 1 to ship-03)
  const shippingAssignments: Array<{ shipperId: string; shipperName: string }> = [
    { shipperId: 'ship-01', shipperName: 'Nguyễn Văn Tuấn' },
    { shipperId: 'ship-01', shipperName: 'Nguyễn Văn Tuấn' },
    { shipperId: 'ship-01', shipperName: 'Nguyễn Văn Tuấn' },
    { shipperId: 'ship-01', shipperName: 'Nguyễn Văn Tuấn' },
    { shipperId: 'ship-01', shipperName: 'Nguyễn Văn Tuấn' },
    { shipperId: 'ship-02', shipperName: 'Trần Quốc Toản' },
    { shipperId: 'ship-02', shipperName: 'Trần Quốc Toản' },
    { shipperId: 'ship-03', shipperName: 'Lê Văn Hùng' },
  ];

  shippingAssignments.forEach((assign, idx) => {
    const cust = pick(SEED_CUSTOMERS);
    // Recent dates around Oct 6-7, 2026
    const createdDate = new Date(Date.UTC(2026, 9, 6 + (idx % 2), 8 + idx, randInt(0, 30), 0));
    const approvedDate = new Date(createdDate.getTime() + 20 * 60 * 1000);
    const shippingDate = new Date(approvedDate.getTime() + 30 * 60 * 1000);

    const is2H = idx < 3; // First 3 are 2H
    // If is2H: set one overdue and others with deadline in future relative to Oct 7, 2026 18:00
    let deadline2H: string | undefined;
    if (is2H) {
      if (idx === 0) {
        // Overdue 2H order: deadline was in past
        deadline2H = new Date(Date.UTC(2026, 9, 7, 14, 0, 0)).toISOString();
      } else {
        // Active 2H order: deadline in future
        deadline2H = new Date(Date.UTC(2026, 9, 7, 19, 30, 0)).toISOString();
      }
    }

    const items = buildItems(randInt(1, 3));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);

    const history: StatusHistoryEntry[] = [
      {
        status: 'PENDING',
        timestamp: createdDate.toISOString(),
        changedBy: cust.name,
        note: is2H ? 'Đặt hàng hỏa tốc Express 2H' : 'Đặt hàng trực tuyến',
      },
      {
        status: 'PACKING',
        timestamp: approvedDate.toISOString(),
        changedBy: 'Manager Hải Đăng',
        note: 'Quản lý duyệt đơn và xuất kho đóng gói',
      },
      {
        status: 'SHIPPING',
        timestamp: shippingDate.toISOString(),
        changedBy: 'Manager Hải Đăng',
        note: `Đã giao hàng cho shipper ${assign.shipperName}`,
      },
    ];

    orders.push({
      id: `ord-${pad(orderIndex)}`,
      code: `DH-202610-${pad(orderIndex)}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      shippingAddress: cust.address,
      items,
      totalAmount,
      finalAmount: totalAmount,
      status: 'SHIPPING',
      version: 1,
      createdAt: createdDate.toISOString(),
      approvedAt: approvedDate.toISOString(),
      shippingStartedAt: shippingDate.toISOString(),
      is2H,
      deadline2H,
      shipperId: assign.shipperId,
      shipperName: assign.shipperName,
      statusHistory: history,
    });
    orderIndex++;
  });

  // 4. PACKING orders (9 total)
  for (let i = 0; i < 9; i++) {
    const cust = pick(SEED_CUSTOMERS);
    const createdDate = new Date(Date.UTC(2026, 9, 7, 10 + i, randInt(0, 40), 0));
    const approvedDate = new Date(createdDate.getTime() + 15 * 60 * 1000);

    const is2H = i % 3 === 0;
    let deadline2H: string | undefined;
    if (is2H) {
      if (i === 0) {
        deadline2H = new Date(Date.UTC(2026, 9, 7, 14, 0, 0)).toISOString(); // overdue
      } else {
        deadline2H = new Date(Date.UTC(2026, 9, 7, 20, 0, 0)).toISOString(); // active
      }
    }

    const items = buildItems(randInt(1, 4));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);

    const history: StatusHistoryEntry[] = [
      {
        status: 'PENDING',
        timestamp: createdDate.toISOString(),
        changedBy: cust.name,
        note: is2H ? 'Đơn đặt hỏa tốc 2H' : 'Đơn đặt hàng trực tuyến',
      },
      {
        status: 'PACKING',
        timestamp: approvedDate.toISOString(),
        changedBy: 'Manager Hải Đăng',
        note: 'Đã kiểm tra kho đủ hàng và xác nhận duyệt đơn',
      },
    ];

    orders.push({
      id: `ord-${pad(orderIndex)}`,
      code: `DH-202610-${pad(orderIndex)}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      shippingAddress: cust.address,
      items,
      totalAmount,
      finalAmount: totalAmount,
      status: 'PACKING',
      version: 1,
      createdAt: createdDate.toISOString(),
      approvedAt: approvedDate.toISOString(),
      is2H,
      deadline2H,
      statusHistory: history,
    });
    orderIndex++;
  }

  // 5. PENDING orders (10 total - awaiting Manager approval)
  for (let i = 0; i < 10; i++) {
    const cust = pick(SEED_CUSTOMERS);
    const createdDate = new Date(Date.UTC(2026, 9, 7, 14 + Math.floor(i / 2), (i * 12) % 60, 0));

    const is2H = i < 3; // 3 pending 2H orders
    let deadline2H: string | undefined;
    if (is2H) {
      if (i === 0) {
        // Overdue 2H pending order for test coverage
        deadline2H = new Date(Date.UTC(2026, 9, 7, 16, 0, 0)).toISOString();
      } else {
        // Active 2H pending order
        deadline2H = new Date(Date.UTC(2026, 9, 7, 19, 30, 0)).toISOString();
      }
    }

    const items = buildItems(randInt(1, 3));
    const totalAmount = items.reduce((s, it) => s + it.total, 0);

    const history: StatusHistoryEntry[] = [
      {
        status: 'PENDING',
        timestamp: createdDate.toISOString(),
        changedBy: cust.name,
        note: is2H ? 'Khách hàng tạo đơn hỏa tốc 2H chờ duyệt' : 'Khách hàng tạo đơn chờ duyệt',
      },
    ];

    orders.push({
      id: `ord-${pad(orderIndex)}`,
      code: `DH-202610-${pad(orderIndex)}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      shippingAddress: cust.address,
      items,
      totalAmount,
      finalAmount: totalAmount,
      status: 'PENDING',
      version: 1,
      createdAt: createdDate.toISOString(),
      is2H,
      deadline2H,
      statusHistory: history,
    });
    orderIndex++;
  }

  return orders.map((o) => ({ orderNumber: o.code, ...o }));
}

export const SEED_ORDERS: Order[] = generateSeedOrders();

/**
 * Deterministic seed orders specifically for Shipper testing (ship-02: Trần Quốc Toản)
 * Covers:
 * - 2 PACKING (1 2H, 1 Standard)
 * - 2 SHIPPING (1 2H nearing deadline, 1 2H overdue)
 * - 4 DELIVERED (3 COD [1 settled, 2 unsettled with 1 from yesterday], 1 Bank Transfer, on-time & late)
 * - 1 CANCELLED (Failed delivery with incident report)
 * - 1 Order for another shipper (ship-03) for testing isolation
 * Total active workload for ship-02 = 2 PACKING + 2 SHIPPING = 4 <= 5.
 */
export const SEED_SHIPPER_ORDERS: Order[] = ([
  // 1. PACKING 2H
  {
    id: 'ord-ship02-pack-01',
    code: 'DH-2026-100801',
    customerId: 'cust-ret-01',
    customerName: 'Nguyễn Hoàng Nam',
    customerPhone: '0912345678',
    shippingAddress: 'Công trình Diamond Crown, 120 Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
    siteContact: {
      name: 'Anh Nam - Chỉ huy',
      roleLabel: 'Chỉ huy trưởng',
      phone: '0912345678',
    },
    deliveryCoords: {
      lat: 10.7769,
      lng: 106.6908,
    },
    items: [
      {
        productId: 'prod-cad-04',
        productName: 'Dây cáp điện Cadivi CV 6.0 mm²',
        brand: 'Cadivi',
        unitPrice: 1400000,
        quantity: 1,
        unit: 'Cuộn 100m',
        total: 1400000,
      },
      {
        productId: 'prod-sch-01',
        productName: 'Aptomat MCB Schneider Acti9 2P 32A',
        brand: 'Schneider',
        unitPrice: 380000,
        quantity: 2,
        unit: 'Cái',
        total: 760000,
      },
    ],
    totalAmount: 2160000,
    total: 2160000,
    paymentMethod: 'COD',
    status: 'PACKING',
    is2H: true,
    deliveryType: '2H',
    createdAt: '2026-10-08T17:30:00.000Z',
    approvedAt: '2026-10-08T17:40:00.000Z',
    deadline2H: '2026-10-08T19:40:00.000Z',
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T17:30:00.000Z',
        changedBy: 'Khách hàng',
        note: 'Đặt hàng hỏa tốc 2H qua ứng dụng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T17:40:00.000Z',
        changedBy: 'Manager Hải Đăng',
        note: 'Duyệt đơn và gán đóng gói cho đội xe ba gác',
      },
    ],
  },

  // 2. PACKING Standard
  {
    id: 'ord-ship02-pack-02',
    code: 'DH-2026-100802',
    customerId: 'cust-ret-02',
    customerName: 'Lê Thành Long',
    customerPhone: '0933445566',
    shippingAddress: 'Khu đô thị Sala, 10 Mai Chí Thọ, Phường An Lợi Đông, TP. Thủ Đức, TP.HCM',
    siteContact: {
      name: 'Anh Long - Giám sát',
      roleLabel: 'Giám sát công trình',
      phone: '0933445566',
    },
    deliveryCoords: {
      lat: 10.7681,
      lng: 106.7214,
    },
    items: [
      {
        productId: 'prod-bm-01',
        productName: 'Ống nhựa uPVC Bình Minh D90 x 3.0mm',
        brand: 'Bình Minh',
        unitPrice: 125000,
        quantity: 20,
        unit: 'Cây 4m',
        total: 2500000,
      },
      {
        productId: 'prod-pan-01',
        productName: 'Công tắc đôi Panasonic Wide Series',
        brand: 'Panasonic',
        unitPrice: 65000,
        quantity: 15,
        unit: 'Bộ',
        total: 975000,
      },
    ],
    totalAmount: 3475000,
    total: 3475000,
    paymentMethod: 'BANK_TRANSFER',
    status: 'PACKING',
    is2H: false,
    deliveryType: 'STANDARD',
    createdAt: '2026-10-08T14:00:00.000Z',
    approvedAt: '2026-10-08T14:30:00.000Z',
    shipperId: 'ship-01',
    shipperName: 'Lê Hoàng Nam',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T14:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T14:30:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
    ],
  },

  // 3. SHIPPING 2H (Sắp hết hạn - deadline 19:15)
  {
    id: 'ord-ship02-ship-01',
    code: 'DH-2026-100803',
    customerId: 'cust-ret-03',
    customerName: 'Phạm Quốc Hùng',
    customerPhone: '0908889900',
    shippingAddress: 'Tòa nhà Opal Tower, 92 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM',
    siteContact: {
      name: 'Anh Hùng',
      roleLabel: 'Thủ kho công trình',
      phone: '0908889900',
    },
    deliveryCoords: {
      lat: 10.7932,
      lng: 106.7198,
    },
    items: [
      {
        productId: 'prod-cad-05',
        productName: 'Cáp đồng hạ thế Cadivi CXV 2x2.5 mm²',
        brand: 'Cadivi',
        unitPrice: 18000,
        quantity: 100,
        unit: 'Mét',
        total: 1800000,
      },
    ],
    totalAmount: 1800000,
    total: 1800000,
    paymentMethod: 'COD',
    status: 'SHIPPING',
    is2H: true,
    deliveryType: '2H',
    createdAt: '2026-10-08T17:05:00.000Z',
    approvedAt: '2026-10-08T17:15:00.000Z',
    shippingStartedAt: '2026-10-08T17:45:00.000Z',
    deadline2H: '2026-10-08T19:15:00.000Z',
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T17:05:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T17:15:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T17:45:00.000Z',
        changedBy: 'Trần Quốc Toản',
        note: 'Shipper nhận hàng tại kho và xuất bến',
      },
    ],
  },

  // 4. SHIPPING 2H (Đã quá hạn - deadline 18:00)
  {
    id: 'ord-ship02-ship-02',
    code: 'DH-2026-100804',
    customerId: 'cust-ret-04',
    customerName: 'Vũ Thị Thúy',
    customerPhone: '0987112233',
    shippingAddress: 'Biệt thự Thảo Điền, 215 Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
    siteContact: {
      name: 'Chị Thúy',
      roleLabel: 'Chủ nhà',
      phone: '0987112233',
    },
    deliveryCoords: {
      lat: 10.8123,
      lng: 106.7345,
    },
    items: [
      {
        productId: 'prod-pan-02',
        productName: 'Quạt hút âm trần Panasonic FV-20CUT1',
        brand: 'Panasonic',
        unitPrice: 890000,
        quantity: 2,
        unit: 'Cái',
        total: 1780000,
      },
    ],
    totalAmount: 1780000,
    total: 1780000,
    paymentMethod: 'COD',
    status: 'SHIPPING',
    is2H: true,
    deliveryType: '2H',
    createdAt: '2026-10-08T15:50:00.000Z',
    approvedAt: '2026-10-08T16:00:00.000Z',
    shippingStartedAt: '2026-10-08T16:30:00.000Z',
    deadline2H: '2026-10-08T18:00:00.000Z',
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T15:50:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T16:00:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T16:30:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
    ],
  },

  // 5. DELIVERED 2H Đúng Giờ (COD đã nộp về quỹ)
  {
    id: 'ord-ship02-del-01',
    code: 'DH-2026-100805',
    customerId: 'cust-ret-01',
    customerName: 'Nguyễn Hoàng Nam',
    customerPhone: '0912345678',
    shippingAddress: 'Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM',
    siteContact: {
      name: 'Anh Nam',
      phone: '0912345678',
    },
    deliveryCoords: {
      lat: 10.7716,
      lng: 106.7044,
    },
    items: [
      {
        productId: 'prod-sch-02',
        productName: 'Khởi động từ Contactor Schneider LC1D25M7 220V',
        brand: 'Schneider',
        unitPrice: 650000,
        quantity: 4,
        unit: 'Cái',
        total: 2600000,
      },
    ],
    totalAmount: 2600000,
    total: 2600000,
    paymentMethod: 'COD',
    status: 'DELIVERED',
    is2H: true,
    deliveryType: '2H',
    createdAt: '2026-10-08T08:00:00.000Z',
    approvedAt: '2026-10-08T08:15:00.000Z',
    shippingStartedAt: '2026-10-08T08:45:00.000Z',
    deliveredAt: '2026-10-08T09:40:00.000Z',
    deadline2H: '2026-10-08T10:15:00.000Z',
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    pod: {
      receiverName: 'Anh Nam - Kế toán CT',
      photos: [
        {
          name: 'pod_bitexco_01.jpg',
          thumbnail: 'data:image/jpeg;base64,mockpodthumb01',
        },
      ],
      capturedAt: '2026-10-08T09:40:00.000Z',
    },
    cod: {
      amount: 2600000,
      collectedAt: '2026-10-08T09:40:00.000Z',
      settlementId: 'SETTLE-INIT-01',
    },
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T08:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T08:15:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T08:45:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
      {
        status: 'DELIVERED',
        timestamp: '2026-10-08T09:40:00.000Z',
        changedBy: 'Trần Quốc Toản',
        note: 'Giao thành công cho: Anh Nam - Kế toán CT',
      },
    ],
  },

  // 6. DELIVERED 2H Trễ Hạn (COD CHƯA NỘP - từ ngày hôm trước 2026-10-07)
  {
    id: 'ord-ship02-del-02',
    code: 'DH-2026-100701',
    customerId: 'cust-ret-05',
    customerName: 'Hoàng Minh Tuấn',
    customerPhone: '0977223344',
    shippingAddress: 'Công trình Chung cư Richmond City, 207 Nguyễn Xí, Bình Thạnh, TP.HCM',
    siteContact: {
      name: 'Anh Tuấn',
      phone: '0977223344',
    },
    deliveryCoords: {
      lat: 10.8167,
      lng: 106.7083,
    },
    items: [
      {
        productId: 'prod-bm-02',
        productName: 'Co 90 độ uPVC Bình Minh D90',
        brand: 'Bình Minh',
        unitPrice: 28000,
        quantity: 50,
        unit: 'Cái',
        total: 1400000,
      },
    ],
    totalAmount: 1400000,
    total: 1400000,
    paymentMethod: 'COD',
    status: 'DELIVERED',
    is2H: true,
    deliveryType: '2H',
    createdAt: '2026-10-07T14:00:00.000Z',
    approvedAt: '2026-10-07T14:10:00.000Z',
    shippingStartedAt: '2026-10-07T14:40:00.000Z',
    deliveredAt: '2026-10-07T16:45:00.000Z',
    deadline2H: '2026-10-07T16:10:00.000Z', // Giao 16:45 > 16:10 -> Trễ hạn
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    pod: {
      receiverName: 'Anh Tài - Đội thi công',
      photos: [
        {
          name: 'pod_richmond.jpg',
          thumbnail: 'data:image/jpeg;base64,mockpodthumb02',
        },
      ],
      capturedAt: '2026-10-07T16:45:00.000Z',
    },
    cod: {
      amount: 1400000,
      collectedAt: '2026-10-07T16:45:00.000Z',
      settlementId: null, // CHƯA NỘP QUỸ (KHOẢN NGÀY CŨ)
    },
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-07T14:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-07T14:10:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-07T14:40:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
      {
        status: 'DELIVERED',
        timestamp: '2026-10-07T16:45:00.000Z',
        changedBy: 'Trần Quốc Toản',
        note: 'Giao hàng thành công (kẹt xe đường Nguyễn Xí)',
      },
    ],
  },

  // 7. DELIVERED Standard (COD CHƯA NỘP - HÔM NAY 2026-10-08)
  {
    id: 'ord-ship02-del-03',
    code: 'DH-2026-100806',
    customerId: 'cust-ret-06',
    customerName: 'Trịnh Đình Quang',
    customerPhone: '0901234567',
    shippingAddress: 'Xưởng cơ khí Tân Bình, 45 Cộng Hòa, Phường 4, Tân Bình, TP.HCM',
    siteContact: {
      name: 'Anh Quang',
      phone: '0901234567',
    },
    deliveryCoords: {
      lat: 10.8012,
      lng: 106.6543,
    },
    items: [
      {
        productId: 'prod-cad-07',
        productName: 'Cáp điện lực hạ thế Cadivi CVV 3x4 mm²',
        brand: 'Cadivi',
        unitPrice: 42000,
        quantity: 50,
        unit: 'Mét',
        total: 2100000,
      },
    ],
    totalAmount: 2100000,
    total: 2100000,
    paymentMethod: 'COD',
    status: 'DELIVERED',
    is2H: false,
    deliveryType: 'STANDARD',
    createdAt: '2026-10-08T09:00:00.000Z',
    approvedAt: '2026-10-08T09:30:00.000Z',
    shippingStartedAt: '2026-10-08T10:15:00.000Z',
    deliveredAt: '2026-10-08T11:50:00.000Z',
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    pod: {
      receiverName: 'Anh Quang - Chủ xưởng',
      photos: [
        {
          name: 'pod_tanbinh.jpg',
          thumbnail: 'data:image/jpeg;base64,mockpodthumb03',
        },
      ],
      capturedAt: '2026-10-08T11:50:00.000Z',
    },
    cod: {
      amount: 2100000,
      collectedAt: '2026-10-08T11:50:00.000Z',
      settlementId: null, // CHƯA NỘP QUỸ (HÔM NAY)
    },
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T09:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T09:30:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T10:15:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
      {
        status: 'DELIVERED',
        timestamp: '2026-10-08T11:50:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
    ],
  },

  // 8. DELIVERED Bank Transfer 2H Đúng Giờ
  {
    id: 'ord-ship02-del-04',
    code: 'DH-2026-100807',
    customerId: 'cust-ret-07',
    customerName: 'Bùi Anh Đức',
    customerPhone: '0966554433',
    shippingAddress: 'Khu biệt thự Chateau, Nguyễn Lương Bằng, Tân Phú, Quận 7, TP.HCM',
    siteContact: {
      name: 'Anh Đức',
      phone: '0966554433',
    },
    deliveryCoords: {
      lat: 10.7234,
      lng: 106.7189,
    },
    items: [
      {
        productId: 'prod-pan-03',
        productName: 'Đèn LED Downlight Panasonic 9W NNP72278',
        brand: 'Panasonic',
        unitPrice: 155000,
        quantity: 20,
        unit: 'Cái',
        total: 3100000,
      },
    ],
    totalAmount: 3100000,
    total: 3100000,
    paymentMethod: 'BANK_TRANSFER',
    status: 'DELIVERED',
    is2H: true,
    deliveryType: '2H',
    createdAt: '2026-10-08T11:00:00.000Z',
    approvedAt: '2026-10-08T11:15:00.000Z',
    shippingStartedAt: '2026-10-08T11:45:00.000Z',
    deliveredAt: '2026-10-08T12:30:00.000Z',
    deadline2H: '2026-10-08T13:15:00.000Z', // 12:30 < 13:15 -> Đúng giờ
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    pod: {
      receiverName: 'Anh Đức',
      photos: [
        {
          name: 'pod_chateau.jpg',
          thumbnail: 'data:image/jpeg;base64,mockpodthumb04',
        },
      ],
      capturedAt: '2026-10-08T12:30:00.000Z',
    },
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T11:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T11:15:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T11:45:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
      {
        status: 'DELIVERED',
        timestamp: '2026-10-08T12:30:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
    ],
  },

  // 9. CANCELLED (Báo sự cố giao thất bại, đã hoàn kho)
  {
    id: 'ord-ship02-can-01',
    code: 'DH-2026-100808',
    customerId: 'cust-ret-08',
    customerName: 'Phan Văn Đạt',
    customerPhone: '0944556677',
    shippingAddress: 'Hẻm 482 Lê Quang Định, Phường 11, Bình Thạnh, TP.HCM',
    siteContact: {
      name: 'Anh Đạt',
      phone: '0944556677',
    },
    deliveryCoords: {
      lat: 10.8198,
      lng: 106.6945,
    },
    items: [
      {
        productId: 'prod-bm-03',
        productName: 'Tê đều uPVC Bình Minh D90',
        brand: 'Bình Minh',
        unitPrice: 45000,
        quantity: 10,
        unit: 'Cái',
        total: 450000,
      },
    ],
    totalAmount: 450000,
    total: 450000,
    paymentMethod: 'COD',
    status: 'CANCELLED',
    is2H: false,
    deliveryType: 'STANDARD',
    createdAt: '2026-10-08T09:00:00.000Z',
    approvedAt: '2026-10-08T09:20:00.000Z',
    shippingStartedAt: '2026-10-08T10:00:00.000Z',
    cancelledAt: '2026-10-08T11:15:00.000Z',
    cancellationReason: 'Khách không nghe máy, hẻm cấm xe ba gác vào công trình',
    incident: {
      category: 'Khách không nghe máy',
      detail: 'Khách không nghe máy, hẻm cấm xe ba gác vào công trình',
      at: '2026-10-08T11:15:00.000Z',
      shipperId: 'ship-02',
    },
    shipperId: 'ship-02',
    shipperName: 'Trần Quốc Toản',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T09:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T09:20:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T10:00:00.000Z',
        changedBy: 'Trần Quốc Toản',
      },
      {
        status: 'CANCELLED',
        timestamp: '2026-10-08T11:15:00.000Z',
        changedBy: 'Trần Quốc Toản',
        note: '[Sự cố: Khách không nghe máy] Khách không nghe máy, hẻm cấm xe ba gác vào công trình',
      },
    ],
  },

  // 10. Order belonging to ANOTHER shipper (ship-03) for data isolation check
  {
    id: 'ord-ship03-other-01',
    code: 'DH-2026-100809',
    customerId: 'cust-ret-09',
    customerName: 'Nguyễn Văn Minh',
    customerPhone: '0918112233',
    shippingAddress: 'Khu công nghệ cao, TP. Thủ Đức, TP.HCM',
    siteContact: {
      name: 'Anh Minh',
      phone: '0918112233',
    },
    deliveryCoords: {
      lat: 10.8542,
      lng: 106.7865,
    },
    items: [
      {
        productId: 'prod-cad-06',
        productName: 'Cáp đồng hạ thế Cadivi CXV 2x4 mm²',
        brand: 'Cadivi',
        unitPrice: 28000,
        quantity: 50,
        unit: 'Mét',
        total: 1400000,
      },
    ],
    totalAmount: 1400000,
    total: 1400000,
    paymentMethod: 'COD',
    status: 'SHIPPING',
    is2H: false,
    deliveryType: 'STANDARD',
    createdAt: '2026-10-08T13:00:00.000Z',
    approvedAt: '2026-10-08T13:30:00.000Z',
    shippingStartedAt: '2026-10-08T14:00:00.000Z',
    shipperId: 'ship-03',
    shipperName: 'Lê Văn Hùng',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: '2026-10-08T13:00:00.000Z',
        changedBy: 'Khách hàng',
      },
      {
        status: 'PACKING',
        timestamp: '2026-10-08T13:30:00.000Z',
        changedBy: 'Manager Hải Đăng',
      },
      {
        status: 'SHIPPING',
        timestamp: '2026-10-08T14:00:00.000Z',
        changedBy: 'Lê Văn Hùng',
      },
    ],
  },
] as any[]).map((o) => ({ version: 1, orderNumber: o.code, ...o })) as Order[];

export const SEED_COD_SETTLEMENTS: CodSettlement[] = [
  {
    id: 'SETTLE-INIT-01',
    shipperId: 'ship-02',
    orderIds: ['ord-ship02-del-01'],
    totalAmount: 2600000,
    settledAt: '2026-10-08T10:00:00.000Z',
  },
];

/**
 * Initial stock logs matching the catalog (32 products initialized)
 */
export const SEED_STOCK_LOGS: StockLog[] = SEED_PRODUCTS.map((prod, idx) => ({
  id: `log-init-${(idx + 1).toString().padStart(2, '0')}`,
  productId: prod.id,
  productName: prod.name,
  changeAmount: prod.stockQuantity,
  previousStock: 0,
  newStock: prod.stockQuantity,
  type: 'INITIAL_IMPORT',
  referenceId: 'PO-INIT-2025',
  createdAt: '2025-10-15T08:00:00.000Z',
  createdByName: 'Admin Kho',
}));

/**
 * Returns a complete, fresh deep clone of seed data for store initialization and resets.
 */
export function createInitialManagerData() {
  return {
    products: JSON.parse(JSON.stringify(SEED_PRODUCTS)) as Product[],
    customers: JSON.parse(JSON.stringify(SEED_CUSTOMERS)) as Customer[],
    shippers: JSON.parse(JSON.stringify(SEED_SHIPPERS)) as Shipper[],
    orders: JSON.parse(
      JSON.stringify([...SEED_ORDERS, ...SEED_SHIPPER_ORDERS])
    ) as Order[],
    stockLogs: JSON.parse(JSON.stringify(SEED_STOCK_LOGS)) as StockLog[],
    codSettlements: JSON.parse(
      JSON.stringify(SEED_COD_SETTLEMENTS)
    ) as CodSettlement[],
  };
}
