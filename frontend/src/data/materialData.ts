export interface MaterialProduct {
  id: string;
  name: string;
  category: "storage" | "filtration" | "pumps" | "measurement" | "safety" | "cleaning";
  categoryName: string;
  sku: string;
  brand: string;
  origin: string;
  price: string;
  rawPrice?: number;
  image: string;
  badge?: "HOT" | "NEW" | "SALE" | "CHÍNH HÃNG";
  specs: string[];
  description: string;
}

export type PetroleumProduct = MaterialProduct;

export interface MaterialCategory {
  id: string;
  name: string;
  slug: string;
  iconSlug: string;
  count: number;
  image: string;
  subcategories: string[];
}

export type PetroleumCategory = MaterialCategory;

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: "storage",
    name: "Thép Xây Dựng & Kim Khí",
    slug: "thep-xay-dung-va-kim-khi",
    iconSlug: "storage",
    count: 120,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Thép thanh vằn D10 - D36", "Thép cuộn trơn phi 6 - phi 8", "Thép hình H, U, I, V", "Ống thép hộp mạ kẽm", "Lưới thép hàn đổ sàn"],
  },
  {
    id: "piping",
    name: "Xi Măng & Bê Tông Thương Phẩm",
    slug: "xi-mang-va-be-tong-thuong-pham",
    iconSlug: "piping",
    count: 85,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Xi măng bao PCB30 / PCB40", "Xi măng rời mác cao", "Bê tông tươi Mac 250 - 350", "Bê tông thương phẩm R7/R14", "Phụ gia đông kết nhanh"],
  },
  {
    id: "pumps",
    name: "Gạch Xây Dựng & Ngói Lợp",
    slug: "gach-xay-dung-va-ngoi-lop",
    iconSlug: "pump",
    count: 94,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Gạch tuynel đặc mác 75", "Gạch ống 2 lỗ, 4 lỗ", "Gạch không nung xi măng cốt liệu", "Gạch bê tông nhẹ khí chưng áp AAC", "Ngói màu tráng men cao cấp"],
  },
  {
    id: "measurement",
    name: "Cát, Đá & Cốt Liệu Xây Dựng",
    slug: "cat-da-va-cot-lieu-xay-dung",
    iconSlug: "gauge",
    count: 65,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Cát vàng hạt lớn đổ bê tông", "Cát đen xây tô trát mịn", "Đá 1x2 xanh sàng tuyển", "Đá mi bụi, đá mi sàng", "Đá hộc 4x6 kè móng"],
  },
  {
    id: "filtration",
    name: "Gạch Ốp Lát & Đá Trang Trí",
    slug: "gach-op-lat-va-da-trang-tri",
    iconSlug: "filter",
    count: 150,
    image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Gạch lát nền Granite 80x80", "Gạch Porcelain 60x60 vân đá", "Gạch ốp tường nhà tắm 30x60", "Đá Granite & Marble tự nhiên", "Gạch thẻ trang trí mặt tiền"],
  },
  {
    id: "cleaning",
    name: "Vật Liệu Chống Thấm & Hóa Chất",
    slug: "vat-lieu-chong-tham-va-hoa-chat",
    iconSlug: "cleaning",
    count: 78,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Màng chống thấm gốc xi măng", "Màng khò nóng Bitum 3mm-4mm", "Sơn chống thấm ngoại thất", "Keo dán gạch & miết mạch", "Vữa tự san phẳng & sửa chữa"],
  },
  {
    id: "safety",
    name: "Ống Nước, Cốp Pha & Thiết Bị Thi Công",
    slug: "ong-nuoc-cop-pha-va-thiet-bi-thi-cong",
    iconSlug: "safety",
    count: 110,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
    subcategories: ["Ống nhựa Tiền Phong PVC / HDPE / PPR", "Phụ kiện tê, co, cút cấp thoát nước", "Ván coppha phủ phim 12mm - 18mm", "Giàn giáo nêm mạ kẽm", "Thép xà gồ C, Z mạ kẽm"],
  },
];

export const PETROLEUM_CATEGORIES = MATERIAL_CATEGORIES;

export const MATERIAL_PRODUCTS: MaterialProduct[] = [
  // 1. THÉP XÂY DỰNG & KIM KHÍ (category: "storage")
  {
    id: "prod-thep-1",
    name: "Thép thanh vằn Hòa Phát D16 CB400V tiêu chuẩn xây dựng",
    category: "storage",
    categoryName: "Thép Xây Dựng & Kim Khí",
    sku: "HP-D16-CB400",
    brand: "Hòa Phát",
    origin: "Việt Nam",
    price: "14.850 đ/kg",
    rawPrice: 14850,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Mác thép CB400V", "Đường kính D16 (16mm)", "Tiêu chuẩn TCVN 1651-2:2018"],
    description: "Thép cốt bê tông Hòa Phát chất lượng cao, độ dẻo và giới hạn chảy vượt trội, đầy đủ tem mác dập nổi logo 3 cánh và chứng chỉ xuất xưởng.",
  },
  {
    id: "prod-thep-2",
    name: "Thép cuộn mạ kẽm phi 6, phi 8 Hòa Phát kéo rút buộc sàn",
    category: "storage",
    categoryName: "Thép Xây Dựng & Kim Khí",
    sku: "HP-PHI8-TRON",
    brand: "Hòa Phát",
    origin: "Việt Nam",
    price: "14.650 đ/kg",
    rawPrice: 14650,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    badge: "CHÍNH HÃNG",
    specs: ["Đường kính phi 6 / phi 8", "Bề mặt sáng bóng, bám dính tốt", "Cuộn trọng lượng ~1.000kg"],
    description: "Thép cuộn trơn tròn chuyên dùng làm đai cọc, đai dầm cột hoặc kéo rút gia công cơ khí trong các kết cấu xây dựng dân dụng.",
  },
  {
    id: "prod-thep-3",
    name: "Ống thép hộp mạ kẽm nhúng nóng Hoa Sen 50x100x2.0mm",
    category: "storage",
    categoryName: "Thép Xây Dựng & Kim Khí",
    sku: "HS-HOP-50x100",
    brand: "Hoa Sen Group",
    origin: "Việt Nam",
    price: "485.000 đ/cây",
    rawPrice: 485000,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&auto=format&fit=crop",
    badge: "NEW",
    specs: ["Kích thước 50x100mm", "Độ dày 2.0mm, dài 6m", "Lớp mạ kẽm Z275 chống rỉ"],
    description: "Ống hộp chữ nhật mạ kẽm siêu bền, chịu lực uốn nén cao, dùng cho hệ giàn mái, nhà xưởng tiền chế và khung kết cấu thép.",
  },
  {
    id: "prod-thep-4",
    name: "Thép hình chữ I 200x100x5.5x8mm kết cấu chịu lực Posco",
    category: "storage",
    categoryName: "Thép Xây Dựng & Kim Khí",
    sku: "PSC-I200-100",
    brand: "Posco Yamato",
    origin: "Việt Nam / Hàn Quốc",
    price: "Liên hệ",
    rawPrice: 17200,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Kích thước I 200x100mm", "Mác thép SS400 / JIS G3101", "Chiều dài 6m - 12m"],
    description: "Thép dầm hình I chuyên dụng làm đòn tay, dầm sàn vượt nhịp lớn, cột chống và khung nhà xưởng công nghiệp nặng.",
  },
  {
    id: "prod-thep-5",
    name: "Lưới thép hàn D6 ô vuông 150x150 đổ bê tông mặt sàn",
    category: "storage",
    categoryName: "Thép Xây Dựng & Kim Khí",
    sku: "LTH-D6-150",
    brand: "Vinasteel",
    origin: "Việt Nam",
    price: "Liên hệ",
    rawPrice: 16500,
    image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&auto=format&fit=crop",
    badge: "CHÍNH HÃNG",
    specs: ["Dây thép hàn D6", "Mắt lưới 150x150mm", "Tấm khổ 2.4m x 6m"],
    description: "Lưới thép hàn cường độ cao thay thế buộc tay truyền thống, tiết kiệm 30% nhân công và đảm bảo phân bổ ứng suất đều.",
  },

  // 2. GẠCH XÂY DỰNG & NGÓI LỢP (category: "pumps")
  {
    id: "prod-gach-1",
    name: "Gạch tuynel đỏ đặc tiêu chuẩn A1 nhà máy Viglacera",
    category: "pumps",
    categoryName: "Gạch Xây Dựng & Ngói Lợp",
    sku: "VGC-GAC-A1",
    brand: "Viglacera",
    origin: "Việt Nam",
    price: "1.350 đ/viên",
    rawPrice: 1350,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Kích thước 210x100x60mm", "Cường độ nén > 100 kg/cm2", "Đất sét nung chuẩn tuynel"],
    description: "Gạch đặc nung già lửa, chịu lực cao, chống thấm tuyệt hảo, chuyên dùng cho móng, tường chịu lực, bể phốt và hộp kỹ thuật.",
  },
  {
    id: "prod-gach-2",
    name: "Gạch ống tuynel 2 lỗ kích thước 220x105x60mm xây tường",
    category: "pumps",
    categoryName: "Gạch Xây Dựng & Ngói Lợp",
    sku: "GTN-2L-220",
    brand: "Hạ Long / Đồng Nai",
    origin: "Việt Nam",
    price: "1.150 đ/viên",
    rawPrice: 1150,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Kích thước 220x105x60mm", "Độ rỗng cách âm nhiệt tốt", "Mác gạch M75"],
    description: "Gạch tuynel 2 lỗ thông dụng nhất cho xây tường ngăn phòng, giảm tải trọng cho móng công trình và cách âm hiệu quả.",
  },
  {
    id: "prod-gach-3",
    name: "Gạch bê tông nhẹ khí chưng áp AAC Viglacera siêu cách nhiệt",
    category: "pumps",
    categoryName: "Gạch Xây Dựng & Ngói Lợp",
    sku: "AAC-VGC-600",
    brand: "Viglacera AAC",
    origin: "Việt Nam",
    price: "Liên hệ",
    rawPrice: 1450000,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&auto=format&fit=crop",
    badge: "NEW",
    specs: ["Kích thước 600x200x100mm", "Trọng lượng nhẹ bằng 1/3 gạch đỏ", "Chống cháy EI 240 phút"],
    description: "Vật liệu xanh cách nhiệt, chống nóng hoàn hảo cho tường ngoài nhà cao tầng, giảm tải trọng kết cấu móng và tiết kiệm điều hòa.",
  },
  {
    id: "prod-gach-4",
    name: "Ngói sóng màu tráng men cao cấp Viglacera Thăng Long",
    category: "pumps",
    categoryName: "Gạch Xây Dựng & Ngói Lợp",
    sku: "NGOI-VGC-TL",
    brand: "Viglacera",
    origin: "Việt Nam",
    price: "18.500 đ/viên",
    rawPrice: 18500,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
    badge: "SALE",
    specs: ["Quy cách 10 viên/m2", "Men phủ nano chống rêu mốc", "Bền màu trên 30 năm"],
    description: "Ngói lợp mái biệt thự, nhà phố hiện đại, gờ chắn nước sâu chống hắt mưa bão, chịu lực uốn va đập tối ưu.",
  },

  // 3. GẠCH ỐP LÁT & ĐÁ TRANG TRÍ (category: "filtration")
  {
    id: "prod-gachop-1",
    name: "Gạch lát nền Granite Prime 80x80 vân đá Calacatta bóng kính",
    category: "filtration",
    categoryName: "Gạch Ốp Lát & Đá Trang Trí",
    sku: "PRM-GR80-CALA",
    brand: "Prime Group",
    origin: "Việt Nam",
    price: "245.000 đ/m2",
    rawPrice: 245000,
    image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Kích thước 800x800mm", "Xương gạch Porcelain bột đá", "Bề mặt mài bóng nano"],
    description: "Gạch lát phòng khách sang trọng, hoa văn đá cẩm thạch trắng mây, độ hút nước dưới 0.1%, chống xước và chống ố bẩn tối đa.",
  },
  {
    id: "prod-gachop-2",
    name: "Gạch ốp tường men mờ Đồng Tâm 30x60 vân xi măng hiện đại",
    category: "filtration",
    categoryName: "Gạch Ốp Lát & Đá Trang Trí",
    sku: "DT-3060-ROOC",
    brand: "Đồng Tâm",
    origin: "Việt Nam",
    price: "195.000 đ/m2",
    rawPrice: 195000,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    badge: "CHÍNH HÃNG",
    specs: ["Kích thước 300x600mm", "Bề mặt men Matt chống trơn", "Tông xám xi măng Minimalist"],
    description: "Mẫu gạch ốp tường phòng tắm, bếp và mặt tiền phong cách tối giản Bắc Âu, chống ẩm mốc và dễ lau chùi dầu mỡ.",
  },
  {
    id: "prod-gachop-3",
    name: "Đá hoa cương Granite Kim Sa Trung tự nhiên ốp cầu thang",
    category: "filtration",
    categoryName: "Gạch Ốp Lát & Đá Trang Trí",
    sku: "DA-KIMSA-TRUNG",
    brand: "Granite India",
    origin: "Ấn Độ (Nhập khẩu)",
    price: "850.000 đ/m2",
    rawPrice: 850000,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Độ dày 18mm - 20mm", "Hạt ánh đồng lấp lánh", "Độ cứng Mohs 7/10"],
    description: "Đá tự nhiên cao cấp cho bậc tam cấp, cầu thang và mặt bàn bếp, chịu nhiệt, không trầy xước và bóng đẹp vĩnh viễn.",
  },
  {
    id: "prod-gachop-4",
    name: "Keo dán gạch đá nội ngoại thất Weber.tai fix bám dính siêu cấp",
    category: "filtration",
    categoryName: "Gạch Ốp Lát & Đá Trang Trí",
    sku: "WB-TAI-FIX-25",
    brand: "Weber (Saint-Gobain)",
    origin: "Pháp / Lắp ráp VN",
    price: "280.000 đ/bao",
    rawPrice: 280000,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&auto=format&fit=crop",
    badge: "SALE",
    specs: ["Bao 25kg tiện dụng", "Độ bám dính > 1.0 N/mm2", "Dán trực tiếp lên tường cũ"],
    description: "Keo gốc xi măng polymer cao cấp thay thế hồ dầu, chống bong tróc gạch khổ lớn và gạch ít hút nước Porcelain.",
  },

  // 4. CÁT, ĐÁ & BÊ TÔNG (category: "measurement")
  {
    id: "prod-catda-1",
    name: "Cát vàng hạt lớn sông Lô tuyển rửa đổ bê tông tươi",
    category: "measurement",
    categoryName: "Cát, Đá & Cốt Liệu Xây Dựng",
    sku: "CAT-VANG-SL",
    brand: "Mỏ Sông Lô",
    origin: "Việt Nam",
    price: "360.000 đ/m3",
    rawPrice: 360000,
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Mô đun độ lớn 2.5 - 3.2", "Đã rửa sạch bùn sét hữu cơ", "Chuẩn TCVN 7570:2006"],
    description: "Cát vàng chuẩn hạt to, không lẫn tạp chất, tối ưu mác bê tông dầm sàn, cột vách chịu lực cho công trình lớn.",
  },
  {
    id: "prod-catda-2",
    name: "Đá dăm 1x2 xanh sàng tuyển rải đường & đổ sàn bê tông",
    category: "measurement",
    categoryName: "Cát, Đá & Cốt Liệu Xây Dựng",
    sku: "DA-1x2-XANH",
    brand: "Mỏ Đá Phủ Lý",
    origin: "Việt Nam",
    price: "320.000 đ/m3",
    rawPrice: 320000,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
    badge: "CHÍNH HÃNG",
    specs: ["Kích cỡ hạt 10mm - 25mm", "Cường độ nén đá gốc > 1200kg/cm2", "Đá xanh hạt đều"],
    description: "Đá xây dựng sàng tuyển máy lọc rửa sạch bụi mi, đảm bảo độ bám dính xi măng và độ đặc chắc của kết cấu bê tông cốt thép.",
  },

  // 5. XI MĂNG & CHỐNG THẤM (category: "safety")
  {
    id: "prod-ximang-1",
    name: "Xi măng bao Vicem Hoàng Thạch PCB40 mác cao chính hãng",
    category: "safety",
    categoryName: "Xi Măng & Bê Tông Thương Phẩm",
    sku: "VICEM-HT-PCB40",
    brand: "Vicem Hoàng Thạch",
    origin: "Việt Nam",
    price: "88.000 đ/bao",
    rawPrice: 88000,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    badge: "HOT",
    specs: ["Bao 50kg chuẩn hãng", "Cường độ 28 ngày > 40 N/mm2", "Đạt chuẩn TCVN 6260:2020"],
    description: "Xi măng thương hiệu số 1 miền Bắc, độ dẻo cao khi trát vữa, thời gian đông kết hợp lý, mác thực tế vượt chuẩn cam kết.",
  },
  {
    id: "prod-ximang-2",
    name: "Màng chống thấm gốc xi măng Sikatop Seal 107 bộ 25kg",
    category: "safety",
    categoryName: "Vật Liệu Chống Thấm & Hóa Chất",
    sku: "SIKA-TS107",
    brand: "Sika",
    origin: "Thụy Sĩ / Việt Nam",
    price: "850.000 đ/bộ",
    rawPrice: 850000,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    badge: "NEW",
    specs: ["Bộ 2 thành phần (A lỏng + B bột)", "Chống thấm bể nước & ban công", "Độ đàn hồi che phủ vết nứt"],
    description: "Vật liệu chống thấm đàn hồi hàng đầu cho nhà vệ sinh, tầng hầm, bể nước sinh hoạt và ban công sân thượng lộ thiên.",
  },
];

export const PETROLEUM_PRODUCTS = MATERIAL_PRODUCTS;

export const MATERIAL_SERVICES = [
  {
    id: "srv-1",
    title: "Cung Ứng Vật Liệu Xây Dựng Dự Án Trọn Gói",
    desc: "Cung cấp toàn diện thép Hòa Phát, xi măng Vicem, gạch tuynel, cát đá tận chân công trình với hợp đồng nguyên tắc và bảo lãnh ngân hàng.",
    badge: "Dự Án Trọng Điểm",
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "srv-2",
    title: "Cung Cấp & Bơm Bê Tông Tươi Thương Phẩm",
    desc: "Cấp phối bê tông thương phẩm Mac 200 - Mac 450 từ trạm trộn tự động, phục vụ xe bồn và xe bơm cần vươn xa 37m đến 52m 24/7.",
    badge: "Cấp Phối Chuẩn LAS-XD",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "srv-3",
    title: "Gia Công Cắt Uốn Thép Theo Bản Vẽ Kết Cấu",
    desc: "Xưởng gia công cắt uốn tự động thép thanh vằn theo bảng thống kê thép, bó kiện đánh số chi tiết giúp tiết kiệm tối đa hao hụt tại hiện trường.",
    badge: "Tiết Kiệm 5-8% Hao Hụt",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "srv-4",
    title: "Thi Công Chống Thấm Chuyên Sâu Tầng Hầm & Mái",
    desc: "Quy trình xử lý chống thấm ngược hố pít thang máy, màng khò nóng Bitum mặt sàn mái và phun màng Polyurea chống thấm tuổi thọ 20 năm.",
    badge: "Bảo Hành 10 Năm",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
  },
];

export const PETROLEUM_SERVICES = MATERIAL_SERVICES;

export const MATERIAL_PARTNERS = [
  { name: "Hòa Phát", country: "Việt Nam", highlight: "Thép Xây Dựng Số 1" },
  { name: "Vicem", country: "Việt Nam", highlight: "Xi Măng Quốc Gia" },
  { name: "Viglacera", country: "Việt Nam", highlight: "Gạch Ốp Lát & AAC" },
  { name: "Hoa Sen", country: "Việt Nam", highlight: "Tôn & Ống Thép Mạ Kẽm" },
  { name: "Tiền Phong", country: "Việt Nam", highlight: "Ống Nhựa Cấp Thoát Nước" },
  { name: "Prime Group", country: "Việt Nam", highlight: "Gạch Men Cao Cấp" },
  { name: "Đồng Tâm", country: "Việt Nam", highlight: "Gạch Ốp Lát Kiến Trúc" },
  { name: "Sika", country: "Thụy Sĩ", highlight: "Hóa Chất & Chống Thấm" },
];

export const PETROLEUM_PARTNERS = MATERIAL_PARTNERS;

export const MATERIAL_NEWS = [
  {
    id: "n-1",
    title: "Bảng Giá Thép Xây Dựng Hòa Phát & Xi Măng Mới Nhất Tháng 09/2026",
    date: "25/09/2026",
    category: "Báo Giá Thị Trường",
    desc: "Tổng hợp biểu giá thép cây vằn CB300/CB400, thép cuộn rút, xi măng PCB40 Hoàng Thạch và biến động giá cát đá xây dựng tại thị trường Hà Nội.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "n-2",
    title: "Tiêu Chuẩn TCVN 1651:2018 Về Cơ Tính Thép Cốt Bê Tông Nhà Thầu Cần Biết",
    date: "21/09/2026",
    category: "Tiêu Chuẩn Kỹ Thuật",
    desc: "Phân tích giới hạn chảy, độ giãn dài tương đối và phương pháp kiểm tra kéo uốn thép cốt bê tông nghiệm thu công trình theo quy định hiện hành.",
    image: "https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "n-3",
    title: "Biện Pháp Thi Công Chống Thấm Tầng Hầm Bằng Màng Khò Bitum Kết Hợp Sika",
    date: "16/09/2026",
    category: "Cẩm Nang Xây Dựng",
    desc: "Quy trình xử lý bề mặt bê tông, quét lót Primer, dán màng khò nóng và xử lý mạch ngừng bê tông bằng băng cản nước PVC triệt để chống thấm ngầm.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
  },
];

export const PETROLEUM_NEWS = MATERIAL_NEWS;
