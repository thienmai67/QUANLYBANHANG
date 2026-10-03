export type ProductUnit = 'Cuộn' | 'Mét' | 'Cây' | 'Bộ' | 'Cái' | 'Cuộn 100m' | 'Thùng';

export type ProductBrand = 'Cadivi' | 'Bình Minh' | 'Schneider' | 'Minh Hòa' | 'Panasonic' | 'Legrand';

export type ProductCategoryType = 'Dây & Cáp Điện' | 'Ống & Phụ Kiện Nhựa' | 'Tủ & Thiết Bị Đóng Cắt' | 'Van & Phụ Kiện Đường Ống';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: ProductBrand;
  category: ProductCategoryType;
  basePrice: number;       // Giá niêm yết (VND)
  discountRate: number;    // % Chiết khấu nhà thầu (e.g. 25 = 25%)
  unit: ProductUnit;
  stock: number;
  status: 'InStock' | 'LowStock' | 'OutOfStock';
  description?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: ProductCategoryType;
  slug: string;
  skuCount: number;
  status: 'Active' | 'Inactive';
  description: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Shipping2H' | 'Completed' | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  discountRate: number;
}

export interface Order {
  id: string;
  code: string;
  contractorName: string;
  contractorTier: 'Đại lý Cấp 1' | 'Đại lý Cấp 2' | 'Nhà thầu M&E' | 'Khách công trình';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress: string;
  items: OrderItem[];
}

export interface BomItem {
  id: string;
  materialName: string;
  suggestedSku?: string;
  quantity: number;
  unit: ProductUnit;
  estimatedPrice: number;
}

export type BomStatus = 'PendingReview' | 'Quoted' | 'ConvertedToOrder' | 'Rejected';

export interface BomRequest {
  id: string;
  code: string;
  contractorName: string;
  projectName: string;
  phone: string;
  email: string;
  itemsCount: number;
  estimatedTotal: number;
  status: BomStatus;
  createdAt: string;
  items: BomItem[];
}

export type CustomerTier = 'Đại lý Cấp 1' | 'Đại lý Cấp 2' | 'Nhà thầu M&E' | 'Khách công trình';

export interface Customer {
  id: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  tier: CustomerTier;
  creditLimit: number; // Hạn mức công nợ (VND)
  currentDebt: number; // Công nợ hiện tại (VND)
  totalSpent: number;
  ordersCount: number;
  status: 'Active' | 'Locked';
  address: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number; // %
  newOrders: number;
  ordersGrowth: number; // %
  pendingBom: number;
  activeContractors: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface BrandShareData {
  brand: string;
  value: number;
  color: string;
}
