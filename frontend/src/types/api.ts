export interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
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

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand_name: string;
  discount_rate: number;
  category_id: string;
  category_name: string;
  base_unit_id: string;
  base_unit_name: string;
  base_price: number;
  stock_quantity: number;
  diameter_mm?: number;
  cross_section_mm2?: number;
  amp_rating?: number;
  conversions?: UnitConversion[];
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
