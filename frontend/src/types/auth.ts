export type Role = "ADMIN" | "MANAGER" | "SALE" | "CUSTOMER" | "SHIPPER";

export interface UserSession {
  id: string;
  name: string;
  phone: string;
  role: Role;
  company?: string;
}

export interface BomItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  discountRate: number;
  basePrice: number;
  unit: string;
  quantity: number;
  conversionFactor: number;
}
