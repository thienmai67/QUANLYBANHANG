export interface MaterialProduct {
  id: string;
  name: string;
  category: "plumbing_upvc" | "plumbing_ppr" | "cable_cadivi" | "breaker_pana" | "conduit_wiring" | "valve_sanitary" | "lighting_led";
  categoryName: string;
  sku: string;
  brand: string;
  origin: string;
  price: string;
  rawPrice?: number;
  image: string;
  images?: string[];
  badge?: "HOT" | "NEW" | "SALE" | "CHÍNH HÃNG";
  specs: string[];
  description: string;
  unit: string;
  conversion: string;
  discount: number;
}

export type MAndEProduct = MaterialProduct;

export interface MaterialCategory {
  id: string;
  name: string;
  slug: string;
  iconSlug: string;
  count: number;
  image: string;
  subcategories: string[];
  color: string;
}

export type MAndECategory = MaterialCategory;

// 7 DANH MUC VAT TU CO DIEN (M&E - Dien Nuoc)
export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: "plumbing_upvc",
    name: "Ống uPVC",
    slug: "ong-phu-kien-upvc",
    iconSlug: "plumbing_upvc",
    count: 32,
    image: "https://images.unsplash.com/photo-1581091228480-9337af036f3b?q=80&w=600&h=600",
    subcategories: ["Ống uPVC Bình Minh Φ21 - 114mm", "Co, Tê, Nối uPVC", "Keo dán ống Bình Minh"],
    color: "blue",
  },
  {
    id: "plumbing_ppr",
    name: "Ống PPR Nước Nóng",
    slug: "ong-nuoc-nong-ppr",
    iconSlug: "plumbing_ppr",
    count: 24,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&h=600",
    subcategories: ["Ống PPR Tiền Phong PN10 / PN20", "Phụ kiện hàn nhiệt PPR", "Van xoay PPR"],
    color: "teal",
  },
  {
    id: "cable_cadivi",
    name: "Dây Cáp Điện Cadivi",
    slug: "day-cap-dien-dong",
    iconSlug: "cable_cadivi",
    count: 45,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&h=600",
    subcategories: ["Dây đơn Cadivi CV 1.5 - 10mm²", "Cáp ngầm CXV 2x2.5 - 4x16mm²", "Dây dẹt vặn xoắn VCmo"],
    color: "yellow",
  },
  {
    id: "breaker_pana",
    name: "Aptomat MCB/RCBO",
    slug: "thiet-bi-dong-cat-mcb-rcbo",
    iconSlug: "breaker_pana",
    count: 28,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&h=600",
    subcategories: ["RCBO chống giật Panasonic 16A-32A", "MCB 2P/3P Schneider", "Cầu dao tự động MCCB"],
    color: "orange",
  },
  {
    id: "conduit_wiring",
    name: "Ống Luồn Dây",
    slug: "ong-luon-day-phu-kien",
    iconSlug: "conduit_wiring",
    count: 20,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&h=600",
    subcategories: ["Ống luồn tròn Sino/Nano Φ16-25mm", "Ống ruột gà lõi thép G.I", "Hộp chia ngã & Khớp nối"],
    color: "purple",
  },
  {
    id: "valve_sanitary",
    name: "Van Đồng & Thiết Bị Vệ Sinh",
    slug: "van-dong-thiet-bi-ve-sinh",
    iconSlug: "valve_sanitary",
    count: 30,
    image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&h=600",
    subcategories: ["Van cửa đồng Minh Hòa DN15-DN50", "Van 1 chiều lò xo", "Vòi rửa & Phụ kiện inox 304"],
    color: "cyan",
  },
  {
    id: "lighting_led",
    name: "Đèn LED & Tủ Điện",
    slug: "thiet-bi-chieu-sang-tu-dien",
    iconSlug: "lighting_led",
    count: 36,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&h=600",
    subcategories: ["Đèn LED Downlight Rạng Đông 9W/12W", "Đèn tuýp LED bán nguyệt 1.2m", "Tủ điện âm tường 4-12 đường"],
    color: "red",
  },
];

export const PETROLEUM_CATEGORIES = MATERIAL_CATEGORIES;

export const MATERIAL_PRODUCTS: MaterialProduct[] = [
  {
    id: "product_upvc_42",
    name: "Ống uPVC Bình Minh Phi 42mm C1 (Cây 4m)",
    category: "plumbing_upvc",
    categoryName: "Ống & Phụ Kiện uPVC",
    sku: "BM-UPVC-D42-C1",
    brand: "Bình Minh",
    origin: "Việt Nam",
    price: "85.000đ",
    rawPrice: 85000,
    image: "https://images.unsplash.com/photo-1581091228480-9337af036f3b?q=80&w=400&h=400",
    images: [
      "https://images.unsplash.com/photo-1581091228480-9337af036f3b?q=80&w=600&h=600",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&h=600",
      "https://images.unsplash.com/photo-1594958137357-1bfcc540878e?q=80&w=600&h=600"
    ],
    badge: "HOT",
    specs: ["Đường kính: Φ42mm", "Cấp áp lực: C1 (PN10)", "Quy cách: Cây 4 mét tiêu chuẩn"],
    description: "Ống uPVC Bình Minh Phi 42mm C1 chất lượng cao dùng cho hệ thống cấp thoát nước công trình dân dụng & công nghiệp.",
    unit: "Cây (4m)",
    conversion: "1 Cây = 4 Mét tiêu chuẩn",
    discount: 18,
  },
  {
    id: "product_cadivi_25",
    name: "Dây điện đơn ruột đồng Cadivi CV 2.5mm² (Cuộn 100m)",
    category: "cable_cadivi",
    categoryName: "Dây & Cáp Điện Đồng",
    sku: "CADIVI-CV-2.5",
    brand: "Cadivi",
    origin: "Việt Nam",
    price: "890.000đ",
    rawPrice: 890000,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&h=400",
    images: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&h=600",
      "https://images.unsplash.com/photo-1520694478166-daaaaaec74b4?q=80&w=600&h=600"
    ],
    badge: "CHÍNH HÃNG",
    specs: ["Tiết diện: 2.5mm²", "Lõi: Đồng tinh chất 99.99%", "Điện áp: 0.6/1kV TCVN 6610"],
    description: "Dây điện đơn Cadivi CV 2.5mm² lõi đồng ruột dẫn cấp 2, vỏ PVC chống cháy an toàn cho hệ thống điện âm tường.",
    unit: "Cuộn (100m)",
    conversion: "1 Cuộn = 100 Mét",
    discount: 22,
  },
  {
    id: "product_pana_rcbo_32a",
    name: "Aptomat chống giật Panasonic RCBO 2P 32A 30mA",
    category: "breaker_pana",
    categoryName: "Thiết Bị Đóng Cắt MCB/RCBO",
    sku: "PA-RCBO-2P32",
    brand: "Panasonic",
    origin: "Nhật Bản / VN",
    price: "345.000đ",
    rawPrice: 345000,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&h=400",
    images: ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&h=600", "https://plus.unsplash.com/premium_photo-1661963836374-219eeea142ee?q=80&w=600&h=600"],
    badge: "CHÍNH HÃNG",
    specs: ["Dòng định mức: 32A", "Dòng rò ngắt: 30mA", "Dòng cắt ngắn mạch: 6kA"],
    description: "Aptomat chống rò điện RCBO Panasonic 2P 32A bảo vệ tối đa cho mạng điện dân dụng khỏi sự cố quá tải và giật điện.",
    unit: "Cái",
    conversion: "1 Hộp = 6 Cái",
    discount: 15,
  },
  {
    id: "product_ppr_32",
    name: "Ống Nước Nóng PPR Tiền Phong PN20 Phi 32mm",
    category: "plumbing_ppr",
    categoryName: "Ống Nước Nóng PPR",
    sku: "TP-PPR-PN20-D32",
    brand: "Tiền Phong",
    origin: "Việt Nam",
    price: "165.000đ",
    rawPrice: 165000,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=400&h=400",
    images: ["https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&h=600", "https://images.unsplash.com/photo-1585860715367-15d9095642e5?q=80&w=600&h=600"],
    badge: "NEW",
    specs: ["Đường kính: Φ32mm", "Áp lực: PN20 (Chịu nhiệt 95°C)", "Chất liệu: Nhựa PPR nguyên sinh"],
    description: "Ống PPR Tiền Phong PN20 dùng dẫn nước nóng năng lượng mặt trời và hệ thống cấp nước nóng trung tâm.",
    unit: "Cây (4m)",
    conversion: "1 Cây = 4 Mét",
    discount: 20,
  },
  {
    id: "product_conduit_20",
    name: "Ống luồn dây điện tròn Nano Phi 20mm chống cháy",
    category: "conduit_wiring",
    categoryName: "Ống Luồn Dây & Phụ Kiện",
    sku: "NANO-CON-D20",
    brand: "Nano / Sino",
    origin: "Việt Nam",
    price: "28.000đ",
    rawPrice: 28000,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=400&h=400",
    images: ["https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&h=600", "https://images.unsplash.com/photo-1601614741362-e1966a4bc2ed?q=80&w=600&h=600"],
    badge: "SALE",
    specs: ["Đường kính: Φ20mm", "Khả năng chịu lực: 750N", "Tính năng: Tự tắt khi cháy"],
    description: "Ống luồn dây điện Nano chống cháy cao cấp bảo vệ dây cáp điện âm sàn, âm tường an toàn tuyệt đối.",
    unit: "Cây (2.9m)",
    conversion: "1 Bó = 10 Cây",
    discount: 15,
  },
  {
    id: "product_valve_dn20",
    name: "Van cửa đồng thau tay quay Minh Hòa DN20 (Phi 27)",
    category: "valve_sanitary",
    categoryName: "Van Đồng & Thiết Bị Vệ Sinh",
    sku: "MH-VALVE-DN20",
    brand: "Minh Hòa",
    origin: "Việt Nam",
    price: "145.000đ",
    rawPrice: 145000,
    image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=400&h=400",
    images: ["https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&h=600", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&h=600"],
    badge: "HOT",
    specs: ["Kích thước: DN20 (3/4 inch)", "Chất liệu: Đồng thau đúc mạ crom", "Áp lực làm việc: 16 bar"],
    description: "Van cửa đồng Minh Hòa chất lượng cao chuyên dùng cho hệ thống khóa cấp nước đầu vào căn hộ, nhà phố.",
    unit: "Cái",
    conversion: "1 Hộp = 10 Cái",
    discount: 12,
  },
  {
    id: "product_led_12w",
    name: "Đèn LED Downlight âm tường Rạng Đông 12W Đổi Màu",
    category: "lighting_led",
    categoryName: "Thiết Bị Chiếu Sáng & Tủ Điện",
    sku: "RD-LED-DL-12W",
    brand: "Rạng Đông",
    origin: "Việt Nam",
    price: "125.000đ",
    rawPrice: 125000,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&h=400",
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&h=600", "https://images.unsplash.com/photo-1510006851064-e6056cd0e3a8?q=80&w=600&h=600"],
    badge: "CHÍNH HÃNG",
    specs: ["Công suất: 12W", "Lỗ khoét: Φ110mm", "Ánh sáng: 3 Màu (Trắng/Vàng/Trung tính)"],
    description: "Đèn LED âm trần Rạng Đông tiết kiệm điện 85%, chíp LED Hàn Quốc siêu bền bảo hành 2 năm.",
    unit: "Cái",
    conversion: "1 Thùng = 20 Cái",
    discount: 18,
  },
];

export const MAndE_PRODUCTS: MaterialProduct[] = MATERIAL_PRODUCTS;

export interface MaterialPartner {
  id: string;
  name: string;
  country: string;
  highlight: string;
  logo?: string;
}

export const MATERIAL_PARTNERS: MaterialPartner[] = [
  { id: "binhminh", name: "BÌNH MINH", country: "VN", highlight: "Ống & Phụ kiện uPVC/HDPE chính hãng" },
  { id: "cadivi", name: "CADIVI", country: "VN", highlight: "Dây & Cáp điện hạ thế, trung thế" },
  { id: "panasonic", name: "PANASONIC", country: "JP", highlight: "Thiết bị đóng cắt MCB/RCBO, Công tắc" },
  { id: "tienphong", name: "TIỀN PHONG", country: "VN", highlight: "Ống nước nóng PPR, ống uPVC chịu áp" },
  { id: "schneider", name: "SCHNEIDER", country: "FR", highlight: "Thiết bị điện & Tủ điện công nghiệp" },
  { id: "rangdong", name: "RẠNG ĐÔNG", country: "VN", highlight: "Đèn LED chiếu sáng & Thiết bị thông minh" },
  { id: "daphaco", name: "DAPHACO", country: "VN", highlight: "Dây điện dân dụng & Cáp lực đồng" },
  { id: "minhhoa", name: "MINH HÒA", country: "VN", highlight: "Van nước đồng thau & Đồng hồ nước" },
];

export interface MaterialNewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  desc: string;
}

export const MATERIAL_NEWS: MaterialNewsItem[] = [
  {
    id: "news_1",
    title: "Cập nhật Biểu phí Chiết khấu Vật tư Điện Nước Tháng 9/2026",
    category: "BÁO GIÁ ĐẠI LÝ",
    date: "25/09/2026",
    image: "https://images.unsplash.com/photo-1581091228480-9337af036f3b?q=80&w=600&h=400",
    desc: "TDT Platform áp dụng bảng chiết khấu đại lý Cấp 1 mới nhất: Cadivi -22%, Nhựa Bình Minh -18%, Panasonic -15% cho nhà thầu.",
  },
  {
    id: "news_2",
    title: "Hướng dẫn chọn Tiết diện Dây Cáp Điện Cadivi chuẩn TCVN cho Nhà Phố",
    category: "KỸ THUẬT M&E",
    date: "20/09/2026",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&h=400",
    desc: "Cách tính toán công suất tải điện P(kW) để chọn dây Cadivi CV 2.5mm², 4.0mm² hay 6.0mm² tránh quá tải gây cháy nổ.",
  },
  {
    id: "news_3",
    title: "Phân biệt Ống uPVC C1, C2, C3 Bình Minh & Cách thử áp lực nghiệm thu",
    category: "CẨM NANG VẬT TƯ",
    date: "15/09/2026",
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&h=400",
    desc: "Phân biệt các cấp độ dày và áp lực làm việc PN10, PN16 của ống nước uPVC Bình Minh giúp tối ưu chi phí dự toán.",
  },
];

export interface MaterialService {
  id: string;
  title: string;
  desc: string;
  image: string;
  badge?: string;
}

export const MATERIAL_SERVICES: MaterialService[] = [
  {
    id: "svc_1",
    title: "BÓC TÁCH DỰ TOÁN BOM M&E",
    desc: "Tự động quy đổi khối lượng từ bản vẽ kỹ thuật sang quy cách cây 4m/cuộn 100m kèm chiết khấu nhà máy.",
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1581091228480-9337af036f3b?q=80&w=600&h=400",
  },
  {
    id: "svc_2",
    title: "BỘ CÔNG CỤ TÍNH CÁP & ỐNG",
    desc: "Máy tính kỹ thuật tra cứu tiết diện cáp điện Cadivi và cỡ ống nước uPVC/PPR theo TCVN 1-click.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&h=400",
  },
  {
    id: "svc_3",
    title: "HỒ SƠ NGHIỆM THU CO/CQ",
    desc: "Cung cấp đầy đủ chứng chỉ xuất xưởng, hóa đơn VAT và phiếu kiểm định chất lượng cho công trình.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&h=400",
  },
  {
    id: "svc_4",
    title: "GIAO HÀNG TẬN CÔNG TRÌNH 2H",
    desc: "Đội xe tải cẩu giao nhanh vật tư ống nước, dây cáp điện tới tận chân công trình tại TP.HCM & các tỉnh lân cận.",
    badge: "2H SLA",
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&h=400",
  },
];
