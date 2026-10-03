import axios from 'axios';
import {
  Product,
  Category,
  Order,
  BomRequest,
  Customer,
  DashboardStats,
} from '../types/admin';
import {
  mockDashboardStats,
  mockProducts,
  mockCategories,
  mockOrders,
  mockBomRequests,
  mockCustomers,
} from '../data/adminMockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const adminApi = {
  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const res = await apiClient.get('/admin/stats');
      return res.data;
    } catch {
      return mockDashboardStats;
    }
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await apiClient.get('/products');
      return res.data;
    } catch {
      return mockProducts;
    }
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    try {
      const res = await apiClient.post('/admin/products', product);
      return res.data;
    } catch {
      return {
        ...product,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
    }
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await apiClient.get('/categories');
      return res.data;
    } catch {
      return mockCategories;
    }
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await apiClient.get('/admin/orders');
      return res.data;
    } catch {
      return mockOrders;
    }
  },

  // BOM Requests
  getBomRequests: async (): Promise<BomRequest[]> => {
    try {
      const res = await apiClient.get('/admin/bom-requests');
      return res.data;
    } catch {
      return mockBomRequests;
    }
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const res = await apiClient.get('/admin/customers');
      return res.data;
    } catch {
      return mockCustomers;
    }
  },
};
