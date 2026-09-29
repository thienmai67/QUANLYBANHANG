export interface Product {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  price?: number | null;
  unit?: string;
  description?: string;
  image?: string;
  brand?: string;
  specifications?: Record<string, string>;
  inStock?: boolean;
  featured?: boolean;
  sku?: string;
  brand_name?: string;
  discount_rate?: number;
  category_id?: string;
  category_name?: string;
  base_unit_id?: string;
  base_unit_name?: string;
  base_price?: number;
  stock_quantity?: number;
  diameter_mm?: number;
  cross_section_mm2?: number;
  amp_rating?: number;
  conversions?: UnitConversion[];
  created_at?: string;
  updated_at?: string;
  images?: string[];
  badge?: string;
  rawPrice?: number;
  origin?: string;
  company?: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  specs?: string[];
  conversion?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
  code?: string;
  type?: string;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
  discount_rate: number;
  highlight?: string;
  country?: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  unit_type: string;
  to_meter_factor: number;
}

export interface UnitConversion {
  id: string;
  product_id: string;
  from_unit_id: string;
  from_unit_name: string;
  to_unit_id: string;
  to_unit_name: string;
  conversion_factor: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  error?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface QuoteItem {
  productId: string;
  quantity: number;
  specifications?: Record<string, string>;
}

export interface Quote {
  id: string;
  items: QuoteItem[];
  status: "pending" | "processing" | "completed";
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
