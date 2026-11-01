import { Order } from './manager';

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'
  | 'PENDING_APPROVAL';

export type ActivityType = 'CALL' | 'ZALO' | 'VISIT' | 'NOTE' | 'FOLLOWUP';

export type CustomerTier = 'Retail' | 'Bronze' | 'Silver' | 'Gold';

export interface SaleCustomerProfile {
  customerId: string;
  companyName?: string;
  siteAddress?: string;
  tier: CustomerTier;
  creditLimit: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleCustomerSummary {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  profile?: SaleCustomerProfile;
  totalSpent: number;
  orderCount: number;
  currentDebt: number;
  saleId?: string;
  saleName?: string;
  createdAt: string;
}

export interface SaleQuoteItem {
  id?: string;
  quoteId?: string;
  productId: string;
  productSku?: string;
  productName?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number; // percentage (e.g. 5 for 5%)
  lineTotal: number;
  createdAt?: string;
}

export interface SaleQuote {
  id: string;
  quoteNumber: string;
  saleId: string;
  saleName?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  status: QuoteStatus;
  validUntil: string;
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  notes?: string;
  rejectionReason?: string;
  convertedOrderId?: string;
  items?: SaleQuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerActivity {
  id: string;
  saleId: string;
  saleName?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  type: ActivityType;
  content: string;
  contactedAt: string;
  nextFollowupAt?: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentNote {
  id: string;
  orderId: string;
  orderNumber?: string;
  saleId: string;
  saleName?: string;
  amount: number;
  method: string;
  note?: string;
  collectedAt: string;
  createdAt: string;
}

export interface SalePaymentItem {
  order: Order;
  daysDelivered: number;
  isOverdue: boolean;
  notes?: PaymentNote[];
}

export interface SaleDashboardData {
  pendingOrdersCount: number;
  expiring2hOrdersCount: number;
  monthDeliveredRevenue: number;
  overdueDebt: number;
  dueFollowupsCount: number;
  expiringQuotesCount: number;
  unpaidOrdersCount: number;
  topCustomers: SaleCustomerSummary[];
}

export interface SaleRevenueByDate {
  date: string;
  amount: number;
  orders: number;
}

export interface SaleRevenueByCustomer {
  customerId: string;
  customerName: string;
  amount: number;
}

export interface SaleRevenueByBrand {
  brandName: string;
  amount: number;
}

export interface SaleReportData {
  totalDeliveredRevenue: number;
  totalOrdersCount: number;
  quotesSent: number;
  quotesAccepted: number;
  quotesConverted: number;
  conversionRate: number;
  outstandingDebt: number;
  revenueByDate: SaleRevenueByDate[];
  revenueByCustomer: SaleRevenueByCustomer[];
  revenueByBrand: SaleRevenueByBrand[];
}

export interface SaleStaffSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export const SALE_MAX_ADDITIONAL_DISCOUNT = 10.0;
export const OVERDUE_DEBT_DAYS = 30;

