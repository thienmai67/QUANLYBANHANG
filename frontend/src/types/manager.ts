export type OrderStatus = 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type Brand = 'Cadivi' | 'Bình Minh' | 'Schneider' | 'Panasonic';

export const CORE_BRANDS: readonly Brand[] = ['Cadivi', 'Bình Minh', 'Schneider', 'Panasonic'] as const;

export interface OrderItem {
  productId: string;
  productName: string;
  name?: string;
  brand: Brand;
  unitPrice: number; // Snapshot at order time in VND
  quantity: number;
  unit: string;
  total: number;
  sku?: string;
  discountRate?: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string; // ISO string or formatted local string
  changedBy: string;
  note?: string;
}

export interface Order {
  id: string;
  code: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  status: OrderStatus;
  version: number;
  createdAt: string; // ISO string
  updatedAt?: string;
  approvedAt?: string;
  shippingStartedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  is2H: boolean;
  is2h?: boolean;
  deliveryType?: '2H' | 'STANDARD';
  paymentMethod?: 'COD' | 'BANK_TRANSFER' | string;
  paymentStatus?: PaymentStatus;
  payosOrderCode?: number;
  paidAt?: string;
  paymentReceiptUrl?: string;
  refundTxCode?: string;
  refundedAt?: string;
  total?: number; // integer VND alias for totalAmount
  shippingFee?: number;
  deadline2H?: string; // ISO string (createdAt + 2 hours if is2H)
  deadline2h?: string;
  shipperId?: string;
  shipperName?: string;
  siteContact?: {
    name: string;
    roleLabel?: string;
    phone: string;
  };
  deliveryCoords?: {
    lat: number;
    lng: number;
  };
  pod?: {
    receiverName: string;
    photos: Array<{
      name: string;
      thumbnail: string;
    }>;
    capturedAt: string;
  };
  cod?: {
    amount: number;
    collectedAt: string;
    settlementId?: string | null;
  };
  incident?: {
    category: string;
    detail: string;
    at: string;
    shipperId: string;
  };
  statusHistory: StatusHistoryEntry[];

  // Server metadata persistence fields
  podPhotoUrl?: string;
  podRecipientName?: string;
  podConfirmedAt?: string;
  codCollected?: number;
  codRemitted?: boolean;
  codRemittedAt?: string;
  incidentDetail?: string;
  incidentReportedBy?: string;
  incidentReportedAt?: string;
}

export interface ShipperSummary {
  id: string;
  fullName: string;
  phone?: string;
  activeOrderCount: number;
}

export interface CODSettlement {
  id: string;
  shipperId: string;
  totalAmount: number;
  orderCount: number;
  createdAt: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  version: number;
  shipper_id?: string;
  cancellation_reason?: string;
  incident_detail?: string;
  pod_photo_url?: string;
  pod_recipient_name?: string;
}

export interface CodSettlement {
  id: string;
  shipperId: string;
  orderIds: string[];
  totalAmount: number; // integer VND
  settledAt: string;
  createdAt?: string;
  orderCount?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: Brand;
  category: string;
  unit: string;
  basePrice: number; // VND
  discountPercent: number; // e.g. 10 for 10%
  stockQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  description?: string;
  sku?: string;
}

export type CustomerTier =
  | 'Retail'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Khách mua lẻ'
  | 'Thợ điện nước'
  | 'Hộ gia đình'
  | 'Khách công trình';

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  tier: CustomerTier;
  createdAt: string;
  creditLimit?: number;
  currentDebt?: number;
  totalSpent?: number;
  ordersCount?: number;
}

export type ShipperShiftStatus = 'available' | 'busy' | 'offline';

export interface Shipper {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  activeOrders: number; // Guard: max 5 active orders (SHIPPING)
  status: 'available' | 'busy' | 'offline' | 'Active' | 'Busy' | 'Offline';
  shiftStatus?: ShipperShiftStatus;
}

export type StockLogType =
  | 'ORDER_APPROVED'
  | 'ORDER_CANCELLED'
  | 'MANUAL_ADJUST'
  | 'INITIAL_IMPORT'
  | 'OUT'
  | 'RESTOCK';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  changeAmount: number; // positive for addition/restock, negative for deduction
  previousStock: number;
  newStock: number;
  type: StockLogType;
  referenceId?: string; // orderId or adjustment note
  createdAt: string;
  createdByName: string;
}
