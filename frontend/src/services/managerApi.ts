import axios from 'axios';
import {
  Brand,
  Customer,
  Order,
  OrderStatus,
  Product,
  Shipper,
  StockLog,
} from '@/types/manager';
import {
  useManagerStore,
  CustomerMetrics,
} from '@/store/useManagerStore';
import { BrandMetric, TimeBucket, calculateDeliveredRevenue } from '@/lib/aggregates';
import { getAccessToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Check whether mock mode is explicitly disabled. Defaults to true (mock mode active).
const isMockMode = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
};

const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000,
  });

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

export interface DashboardSummary {
  totalRevenue: number;
  pendingCount: number;
  totalOrdersCount: number;
  totalProductsCount: number;
  totalCustomersCount: number;
  brandStats: Record<Brand, BrandMetric>;
  revenueTrend: TimeBucket[];
}

export interface OrderFilterParams {
  status?: OrderStatus | 'ALL';
  search?: string;
  is2H?: boolean;
}

export interface ProductFilterParams {
  brand?: Brand | 'ALL';
  category?: string;
  search?: string;
  lowStock?: boolean;
}

export interface CustomerFilterParams {
  search?: string;
  tier?: string;
}

export const managerApi = {
  // Check if mock mode is active
  isMockEnabled: (): boolean => isMockMode(),

  // ===================== DASHBOARD =====================
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<DashboardSummary>('/manager/dashboard-summary');
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const state = useManagerStore.getState();
    const orders = state.orders;
    const deliveredRevenue = calculateDeliveredRevenue(orders);
    const pendingOrders = state.getPendingOrders();

    return {
      totalRevenue: deliveredRevenue,
      pendingCount: pendingOrders.length,
      totalOrdersCount: orders.length,
      totalProductsCount: state.products.length,
      totalCustomersCount: state.customers.length,
      brandStats: state.getBrandStats(),
      revenueTrend: state.getRevenueTrend('month'),
    };
  },

  // ===================== ORDERS =====================
  getOrders: async (params?: OrderFilterParams): Promise<Order[]> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Order[]>('/manager/orders', { params });
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const state = useManagerStore.getState();
    let result = [...state.orders];

    if (params?.status && params.status !== 'ALL') {
      result = result.filter((o) => o.status === params.status);
    }

    if (params?.is2H !== undefined) {
      result = result.filter((o) => o.is2H === params.is2H);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.shippingAddress.toLowerCase().includes(q)
      );
    }

    // Sort descending by createdAt
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Order>(`/manager/orders/${orderId}`);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const order = useManagerStore.getState().orders.find((o) => o.id === orderId);
    return order || null;
  },

  approveOrder: async (
    orderId: string,
    managerName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.post<{ success: boolean; error?: string }>(
          `/manager/orders/${orderId}/approve`,
          { managerName }
        );
        return res.data;
      } catch (err: any) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().approveOrder(orderId, managerName);
  },

  assignShipper: async (
    orderId: string,
    shipperId: string,
    managerName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.post<{ success: boolean; error?: string }>(
          `/manager/orders/${orderId}/assign-shipper`,
          { shipperId, managerName }
        );
        return res.data;
      } catch (err: any) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().assignShipper(orderId, shipperId, managerName);
  },

  deliverOrder: async (
    orderId: string,
    changedBy?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.post<{ success: boolean; error?: string }>(
          `/manager/orders/${orderId}/deliver`,
          { changedBy }
        );
        return res.data;
      } catch (err: any) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().deliverOrder(orderId, changedBy);
  },

  cancelOrder: async (
    orderId: string,
    reason: string,
    managerName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.post<{ success: boolean; error?: string }>(
          `/manager/orders/${orderId}/cancel`,
          { reason, managerName }
        );
        return res.data;
      } catch (err: any) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().cancelOrder(orderId, reason, managerName);
  },

  // ===================== PRODUCTS =====================
  getProducts: async (params?: ProductFilterParams): Promise<Product[]> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Product[]>('/manager/products', { params });
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const state = useManagerStore.getState();
    let result = [...state.products];

    if (params?.brand && params.brand !== 'ALL') {
      result = result.filter((p) => p.brand === params.brand);
    }

    if (params?.category) {
      result = result.filter((p) => p.category === params.category);
    }

    if (params?.lowStock) {
      result = result.filter((p) => p.stockQuantity <= p.minStockLevel);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  },

  getProductById: async (productId: string): Promise<Product | null> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Product>(`/manager/products/${productId}`);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const prod = useManagerStore.getState().products.find((p) => p.id === productId);
    return prod || null;
  },

  adjustStock: async (
    productId: string,
    newQuantity: number,
    reason: string,
    managerName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.post<{ success: boolean; error?: string }>(
          `/manager/products/${productId}/adjust-stock`,
          { newQuantity, reason, managerName }
        );
        return res.data;
      } catch (err: any) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().adjustStock(productId, newQuantity, reason, managerName);
  },

  addProduct: async (
    productData: Omit<Product, 'id'> | Product
  ): Promise<{ success: boolean; product?: Product; error?: string }> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.post<{ success: boolean; product?: Product; error?: string }>(
          '/manager/products',
          productData
        );
        return res.data;
      } catch (err: any) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().addProduct(productData);
  },

  // ===================== CUSTOMERS =====================
  getCustomers: async (params?: CustomerFilterParams): Promise<Customer[]> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Customer[]>('/manager/customers', { params });
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const state = useManagerStore.getState();
    let result = [...state.customers];

    if (params?.tier && params.tier !== 'ALL') {
      result = result.filter((c) => c.tier === params.tier);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    return result;
  },

  getCustomerById: async (customerId: string): Promise<Customer | null> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Customer>(`/manager/customers/${customerId}`);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    const cust = useManagerStore.getState().customers.find((c) => c.id === customerId);
    return cust || null;
  },

  getCustomerMetrics: async (customerId: string): Promise<CustomerMetrics> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<CustomerMetrics>(`/manager/customers/${customerId}/metrics`);
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().getCustomerMetrics(customerId);
  },

  // ===================== SHIPPERS =====================
  getShippers: async (): Promise<Shipper[]> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<Shipper[]>('/manager/shippers');
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().shippers;
  },

  // ===================== STOCK LOGS =====================
  getStockLogs: async (): Promise<StockLog[]> => {
    if (!isMockMode()) {
      try {
        const client = createApiClient();
        const res = await client.get<StockLog[]>('/manager/stock-logs');
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to manager store:', err);
      }
    }

    return useManagerStore.getState().stockLogs;
  },

  // ===================== RESET =====================
  resetSeedData: (): void => {
    useManagerStore.getState().resetToSeedData();
  },
};
