import { create } from 'zustand';
import { api, ApiError, getFriendlyErrorMessage } from '@/lib/api';
import { mapOrderFromApi } from '@/lib/orderMapper';
import { Order, Product, Brand } from '@/types/manager';
import {
  SaleCustomerSummary,
  SaleQuote,
  CustomerActivity,
  SalePaymentItem,
  SaleDashboardData,
  SaleReportData,
  SaleStaffSummary,
} from '@/types/sale';

interface SaleStoreState {
  dashboard: SaleDashboardData | null;
  orders: Order[];
  ordersTotal: number;
  customers: SaleCustomerSummary[];
  customersTotal: number;
  quotes: SaleQuote[];
  quotesTotal: number;
  activities: CustomerActivity[];
  activitiesTotal: number;
  payments: SalePaymentItem[];
  paymentsTotal: number;
  reports: SaleReportData | null;
  products: Product[];
  salesStaff: SaleStaffSummary[];

  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  fetchOrders: (params?: { status?: string; paymentStatus?: string; customerId?: string; q?: string }) => Promise<void>;
  createOrder: (payload: { customerId?: string; customerName: string; paymentMethod: string; is2h?: boolean; items: Array<{ productId: string; quantity: number; unitPrice: number; unit?: string }> }) => Promise<Order>;
  markPaid: (orderId: string) => Promise<void>;
  fetchCustomers: (query?: string) => Promise<void>;
  createCustomer: (payload: { fullName: string; email: string; phone?: string; companyName?: string; siteAddress?: string; tier?: string; creditLimit?: number; notes?: string }) => Promise<SaleCustomerSummary>;
  updateCustomer: (id: string, payload: { fullName: string; phone?: string; companyName?: string; siteAddress?: string; tier?: string; creditLimit?: number; notes?: string }) => Promise<void>;
  assignCustomer: (customerId: string, saleId: string) => Promise<boolean>;
  assignOrder: (orderId: string, saleId: string) => Promise<boolean>;
  fetchQuotes: (params?: { status?: string; customerId?: string; q?: string }) => Promise<void>;
  createQuote: (payload: { customerId: string; validUntil: string; notes?: string; items: Array<{ productId: string; quantity: number; unit: string; unitPrice: number; discountRate: number }> }) => Promise<SaleQuote>;
  updateQuote: (id: string, payload: { validUntil: string; notes?: string; items: Array<{ productId: string; quantity: number; unit: string; unitPrice: number; discountRate: number }> }) => Promise<SaleQuote>;
  sendQuote: (id: string) => Promise<SaleQuote>;
  convertQuote: (id: string) => Promise<Order>;
  approveQuote: (id: string) => Promise<boolean>;
  rejectQuote: (id: string, reason: string) => Promise<boolean>;
  fetchActivities: (params?: { customerId?: string; isDone?: boolean; dueToday?: boolean; overdue?: boolean }) => Promise<void>;
  createActivity: (payload: { customerId: string; type: string; content: string; contactedAt: string; nextFollowupAt?: string; isDone: boolean }) => Promise<CustomerActivity>;
  updateActivity: (id: string, payload: { type: string; content: string; contactedAt: string; nextFollowupAt?: string; isDone: boolean }) => Promise<CustomerActivity>;
  fetchPayments: (params?: { unpaidOnly?: boolean; overdueOnly?: boolean; customerId?: string }) => Promise<void>;
  addPaymentNote: (orderId: string, payload: { amount: number; method: string; note?: string }) => Promise<void>;
  fetchReports: (from?: string, to?: string) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchSalesStaff: () => Promise<void>;
}

export const useSaleStore = create<SaleStoreState>((set, get) => ({
  dashboard: null,
  orders: [],
  ordersTotal: 0,
  customers: [],
  customersTotal: 0,
  quotes: [],
  quotesTotal: 0,
  activities: [],
  activitiesTotal: 0,
  payments: [],
  paymentsTotal: 0,
  reports: null,
  products: [],
  salesStaff: [],
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.get<SaleDashboardData>('/sale/dashboard');
      set({ dashboard: data });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrders: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.paymentStatus) query.set('payment_status', params.paymentStatus);
      if (params?.customerId) query.set('customer_id', params.customerId);
      if (params?.q) query.set('q', params.q);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const rawOrders = await api.get<any[]>(`/orders${qs}`);
      const mapped = Array.isArray(rawOrders) ? rawOrders.map(mapOrderFromApi) : [];
      set({ orders: mapped, ordersTotal: mapped.length });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  createOrder: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const raw = await api.post<any>('/orders', payload);
      const mapped = mapOrderFromApi(raw);
      set((state) => ({ orders: [mapped, ...state.orders] }));
      return mapped;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  markPaid: async (orderId: string) => {
    try {
      set({ isLoading: true, error: null });
      const raw = await api.post<any>(`/orders/${orderId}/mark-paid`);
      const mapped = mapOrderFromApi(raw);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? mapped : o)),
      }));
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCustomers: async (query) => {
    try {
      set({ isLoading: true, error: null });
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await api.get<{ data: SaleCustomerSummary[]; total: number }>(`/sale/customers${qs}`);
      set({ customers: res.data || [], customersTotal: res.total || 0 });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  createCustomer: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<SaleCustomerSummary>('/sale/customers', payload);
      set((state) => ({
        customers: [res, ...state.customers],
        customersTotal: state.customersTotal + 1,
      }));
      return res;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCustomer: async (id, payload) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await api.put<SaleCustomerSummary>(`/sale/customers/${id}`, payload);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchQuotes: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.customerId) query.set('customer_id', params.customerId);
      if (params?.q) query.set('q', params.q);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await api.get<{ data: SaleQuote[]; total: number }>(`/sale/quotes${qs}`);
      set({ quotes: res.data || [], quotesTotal: res.total || 0 });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  createQuote: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<SaleQuote>('/sale/quotes', payload);
      set((state) => ({
        quotes: [res, ...state.quotes],
        quotesTotal: state.quotesTotal + 1,
      }));
      return res;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuote: async (id, payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.put<SaleQuote>(`/sale/quotes/${id}`, payload);
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? res : q)),
      }));
      return res;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  sendQuote: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<SaleQuote>(`/sale/quotes/${id}/send`);
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? res : q)),
      }));
      return res;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  convertQuote: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const raw = await api.post<any>(`/sale/quotes/${id}/convert`);
      const mapped = mapOrderFromApi(raw);
      set((state) => ({
        orders: [mapped, ...state.orders],
        quotes: state.quotes.map((q) =>
          q.id === id ? { ...q, status: 'CONVERTED', convertedOrderId: mapped.id } : q
        ),
      }));
      return mapped;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActivities: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const query = new URLSearchParams();
      if (params?.customerId) query.set('customer_id', params.customerId);
      if (typeof params?.isDone === 'boolean') query.set('is_done', String(params.isDone));
      if (params?.dueToday) query.set('due_today', 'true');
      if (params?.overdue) query.set('overdue', 'true');

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await api.get<{ data: CustomerActivity[]; total: number }>(`/sale/activities${qs}`);
      set({ activities: res.data || [], activitiesTotal: res.total || 0 });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  createActivity: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<CustomerActivity>('/sale/activities', payload);
      set((state) => ({
        activities: [res, ...state.activities],
        activitiesTotal: state.activitiesTotal + 1,
      }));
      return res;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateActivity: async (id, payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.put<CustomerActivity>(`/sale/activities/${id}`, payload);
      set((state) => ({
        activities: state.activities.map((a) => (a.id === id ? res : a)),
      }));
      return res;
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPayments: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const query = new URLSearchParams();
      if (params?.unpaidOnly) query.set('unpaid_only', 'true');
      if (params?.overdueOnly) query.set('overdue_only', 'true');
      if (params?.customerId) query.set('customer_id', params.customerId);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await api.get<{ data: any[]; total: number }>(`/sale/payments${qs}`);
      const mapped: SalePaymentItem[] = (res.data || []).map((item) => ({
        order: mapOrderFromApi(item.order),
        daysDelivered: item.daysDelivered,
        isOverdue: item.isOverdue,
        notes: item.notes,
      }));
      set({ payments: mapped, paymentsTotal: res.total || 0 });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  addPaymentNote: async (orderId, payload) => {
    try {
      set({ isLoading: true, error: null });
      await api.post(`/sale/payments/${orderId}/notes`, payload);
      // Refresh payments
      await get().fetchPayments();
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReports: async (from, to) => {
    try {
      set({ isLoading: true, error: null });
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      const qs = query.toString() ? `?${query.toString()}` : '';
      const data = await api.get<SaleReportData>(`/sale/reports/summary${qs}`);
      set({ reports: data });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<any[]>('/products?limit=100');
      const products: Product[] = (res || []).map((p) => {
        const brandName =
          typeof p.brand === 'object' && p.brand !== null
            ? String(p.brand.name || p.brand.code || 'Chưa cập nhật')
            : String(p.brand_name || p.brand || 'Chưa cập nhật');

        const categoryName =
          typeof p.category === 'object' && p.category !== null
            ? String(p.category.name || p.category.code || 'Chưa cập nhật')
            : String(p.category_name || p.category || 'Chưa cập nhật');

        const brandDiscount =
          typeof p.brand === 'object' && typeof p.brand?.discountRate === 'number'
            ? p.brand.discountRate
            : typeof p.discount_rate === 'number'
              ? p.discount_rate
              : typeof p.discountRate === 'number'
                ? p.discountRate
                : typeof p.discountPercent === 'number'
                  ? p.discountPercent
                  : 0;

        const specs =
          typeof p.specifications === 'object' && p.specifications !== null
            ? p.specifications
            : {};

        const unitName = String(
          (typeof p.baseUnit === 'object' && p.baseUnit !== null ? p.baseUnit.name : null) ||
          p.base_unit_name ||
          (typeof p.unit === 'object' && p.unit !== null ? p.unit.name : null) ||
          p.unit ||
          specs.unit ||
          'Chưa cập nhật'
        );

        return {
          id: String(p.id),
          code: String(p.sku || p.code || ''),
          sku: String(p.sku || p.code || ''),
          name: String(p.name || ''),
          brand: brandName as Brand,
          category: categoryName,
          unit: unitName,
          basePrice: Number(p.basePrice ?? p.base_price ?? p.price ?? 0),
          discountPercent: brandDiscount,
          discountRate: brandDiscount,
          stockQuantity: Number(p.stock_quantity ?? p.stockQuantity ?? specs.stock ?? 0),
          minStockLevel: Number(p.min_stock_level ?? p.minStockLevel ?? specs.minStockLevel ?? 0),
          stock: Number(p.stock_quantity ?? p.stockQuantity ?? specs.stock ?? 0),
          specifications: specs,
          diameterMm: p.diameterMm ?? p.diameter_mm ?? specs.diameter_mm,
          pressureClass: p.pressureClass ?? p.pressure_class ?? specs.pressure_class,
          crossSectionMm2: p.crossSectionMm2 ?? p.cross_section_mm2 ?? specs.cross_section_mm2,
          ampRating: p.ampRating ?? p.amp_rating ?? specs.amp_rating,
          conversions: (p.conversions || []).map((c: any) => ({
            unit: String(c.unit || c.to_unit_name || ''),
            factor: Number(c.factor || c.conversion_factor || 1),
          })),
          createdAt: String(p.createdAt || p.created_at || new Date().toISOString()),
        };
      });
      set({ products });
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
    } finally {
      set({ isLoading: false });
    }
  },

  assignCustomer: async (customerId: string, saleId: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.post(`/sale/customers/${customerId}/assign`, { saleId });
      await get().fetchCustomers();
      return true;
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  assignOrder: async (orderId: string, saleId: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.post(`/sale/orders/${orderId}/assign`, { saleId });
      await get().fetchOrders();
      return true;
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  approveQuote: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/sale/quotes/${id}/approve`);
      await get().fetchQuotes();
      return true;
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  rejectQuote: async (id: string, reason: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.patch(`/sale/quotes/${id}/reject`, { reason });
      await get().fetchQuotes();
      return true;
    } catch (err) {
      set({ error: getFriendlyErrorMessage(err) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSalesStaff: async () => {
    try {
      const res = await api.get<{ data: SaleStaffSummary[] }>('/sale/staff');
      set({ salesStaff: res?.data || [] });
    } catch (err) {
      console.error('Failed to fetch sales staff:', err);
    }
  },
}));

