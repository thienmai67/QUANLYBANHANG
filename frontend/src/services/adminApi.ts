import axios from 'axios';
import {
  Product,
  Category,
  Order,
  BomRequest,
  Customer,
  DashboardStats,
} from '../types/admin';

import { getAccessToken } from '../lib/auth';
import { API_BASE_URL } from '../lib/api';

const API_BASE = API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const res = await apiClient.get('/admin/stats');
      return res.data;
    } catch {
      return {
        totalRevenue: 0,
        revenueGrowth: 0,
        newOrders: 0,
        ordersGrowth: 0,
        pendingBom: 0,
        activeContractors: 0,
      };
    }
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await apiClient.get('/products');
      return res.data;
    } catch {
      return [];
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
      return [];
    }
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await apiClient.get('/orders');
      return res.data;
    } catch {
      return [];
    }
  },

  // BOM Requests
  getBomRequests: async (): Promise<BomRequest[]> => {
    try {
      const res = await apiClient.get('/admin/bom-requests');
      return res.data;
    } catch {
      return [];
    }
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const res = await apiClient.get('/admin/customers');
      return res.data;
    } catch {
      return [];
    }
  },
};

