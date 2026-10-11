import { create } from 'zustand';
import {
  Product,
  ProductBrand,
  ProductCategoryType,
  ProductUnit,
  Category,
  Order,
  BomRequest,
  Customer,
  OrderStatus,
  BomStatus,
} from '../types/admin';
import {
  mockCategories,
  mockOrders,
  mockBomRequests,
  mockCustomers,
} from '../data/adminMockData';
import { api } from '../lib/api';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

function mapApiProductToAdminProduct(raw: any): Product {
  const specsObj =
    raw && typeof raw.specifications === 'object' && raw.specifications !== null
      ? raw.specifications
      : {};

  const brandName: ProductBrand =
    (typeof raw.brand === 'object' && raw.brand !== null
      ? raw.brand.name
      : raw.brand) || 'Cadivi';

  const discountRate: number =
    typeof raw.brand === 'object' &&
    raw.brand !== null &&
    typeof raw.brand.discountRate === 'number'
      ? raw.brand.discountRate
      : typeof raw.discountRate === 'number'
        ? raw.discountRate
        : 15;

  const catCode =
    typeof raw.category === 'object' && raw.category !== null
      ? raw.category.code || raw.category.type || ''
      : '';
  const catNameRaw =
    typeof raw.category === 'object' && raw.category !== null
      ? raw.category.name || ''
      : typeof raw.category === 'string'
        ? raw.category
        : '';

  let category: ProductCategoryType = 'Dây & Cáp Điện';
  if (catCode === 'WATER_PIPE' || catCode === 'PIPE' || catNameRaw.includes('Ống')) {
    category = 'Ống & Phụ Kiện Nhựa';
  } else if (catCode === 'DEVICE' || catNameRaw.includes('Thiết bị') || catNameRaw.includes('Tủ')) {
    category = 'Tủ & Thiết Bị Đóng Cắt';
  } else if (catCode === 'CABLE' || catNameRaw.includes('Cáp') || catNameRaw.includes('Dây')) {
    category = 'Dây & Cáp Điện';
  }

  const basePrice = Number(raw.basePrice ?? raw.base_price ?? raw.price ?? 0);

  let unit: ProductUnit = 'Cái';
  if (specsObj.unit) {
    unit = specsObj.unit as ProductUnit;
  } else if (raw.unit) {
    unit = raw.unit as ProductUnit;
  } else if (specsObj.length_per_cay) {
    unit = 'Cây';
  } else if (specsObj.length_per_cuon) {
    unit = 'Mét';
  }

  const defaultImage =
    catCode === 'WATER_PIPE' || catCode === 'PIPE'
      ? '/images/products/pvc-pipes.png'
      : catCode === 'CABLE'
        ? '/images/products/copper-cables.png'
        : '/images/products/mcb-breakers.png';

  const image: string = specsObj.image || raw.image || defaultImage;

  const specsList: string[] = [];
  if (specsObj.material) specsList.push(`Chất liệu: ${specsObj.material}`);
  if (raw.diameterMm) specsList.push(`Đường kính: Ø${raw.diameterMm}mm`);
  if (specsObj.pressure_class || raw.pressureClass) {
    specsList.push(`Cấp áp lực: ${specsObj.pressure_class || raw.pressureClass}`);
  }
  if (specsObj.type) specsList.push(`Quy cách: ${specsObj.type}`);
  if (raw.crossSectionMm2) specsList.push(`Tiết diện: ${raw.crossSectionMm2}mm²`);
  if (specsObj.voltage) specsList.push(`Điện áp: ${specsObj.voltage}`);
  if (specsObj.poles) specsList.push(`Số cực: ${specsObj.poles}P`);
  if (raw.ampRating || specsObj.current_rating) {
    specsList.push(`Dòng định mức: ${raw.ampRating ?? specsObj.current_rating}A`);
  }
  if (specsObj.breaking_capacity) specsList.push(`Dòng cắt: ${specsObj.breaking_capacity}`);
  if (specsList.length === 0) {
    specsList.push(`Thương hiệu: ${brandName}`, `Đơn vị: ${unit}`);
  }

  const description: string =
    specsObj.description || raw.description || specsList.join(' • ') || raw.name;

  return {
    id: String(raw.id),
    sku: String(raw.sku || 'SKU-STD'),
    name: String(raw.name || ''),
    brand: brandName,
    category,
    basePrice,
    discountRate,
    unit,
    stock: typeof raw.stock === 'number' ? raw.stock : 100,
    status: 'InStock',
    image,
    description,
    specs: specsList,
    createdAt: raw.createdAt
      ? String(raw.createdAt).slice(0, 10)
      : new Date().toISOString().split('T')[0],
  };
}

interface AdminState {
  // Theme & Layout
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Time period filter
  selectedPeriod: '7days' | '30days' | '3months' | '12months';
  setSelectedPeriod: (period: '7days' | '30days' | '3months' | '12months') => void;

  // Data
  products: Product[];
  productsLoading: boolean;
  productsError: boolean;
  fetchProducts: () => Promise<void>;
  categories: Category[];
  orders: Order[];
  bomRequests: BomRequest[];
  customers: Customer[];

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Category CRUD
  addCategory: (category: Omit<Category, 'id' | 'skuCount'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Order actions
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'code'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  assignShipper: (orderId: string, shipperId: string, shipperName: string) => void;

  // BOM Request actions
  addBomRequest: (bom: Omit<BomRequest, 'id' | 'createdAt' | 'code'>) => void;
  updateBomStatus: (id: string, status: BomStatus) => void;

  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'ordersCount' | 'totalSpent' | 'currentDebt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedPeriod: '7days',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  products: [],
  productsLoading: false,
  productsError: false,
  fetchProducts: async () => {
    set({ productsLoading: true, productsError: false });
    try {
      const data = await api.get<any[]>('/products');
      if (Array.isArray(data)) {
        const mapped = data.map(mapApiProductToAdminProduct);
        set({ products: mapped, productsLoading: false, productsError: false });
      } else {
        set({ products: [], productsLoading: false, productsError: true });
      }
    } catch {
      set({ productsLoading: false, productsError: true });
    }
  },
  categories: mockCategories,
  orders: mockOrders,
  bomRequests: mockBomRequests,
  customers: mockCustomers,

  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // Product actions
  addProduct: (newProd) => {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      ...newProd,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ products: [product, ...state.products] }));
  },
  updateProduct: (id, updated) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },
  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  // Category actions
  addCategory: (newCat) => {
    const id = `cat-${Date.now()}`;
    const category: Category = {
      ...newCat,
      id,
      skuCount: 0,
    };
    set((state) => ({ categories: [...state.categories, category] }));
  },
  updateCategory: (id, updated) => {
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
  },
  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  // Order actions
  addOrder: (newOrder) => {
    const id = `order-${Date.now()}`;
    const code = `DH-${Math.floor(1000 + Math.random() * 9000)}`;
    const order: Order = {
      ...newOrder,
      id,
      code,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ orders: [order, ...state.orders] }));
  },
  updateOrderStatus: (id, status) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  },
  assignShipper: (orderId, shipperId, shipperName) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedShipperId: shipperId,
              assignedShipperName: shipperName,
              status: o.status === 'Pending' ? 'Preparing' : o.status,
            }
          : o
      ),
    }));
  },

  // BOM actions
  addBomRequest: (newBom) => {
    const id = `bom-${Date.now()}`;
    const code = `BOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const bom: BomRequest = {
      ...newBom,
      id,
      code,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ bomRequests: [bom, ...state.bomRequests] }));
  },
  updateBomStatus: (id, status) => {
    set((state) => ({
      bomRequests: state.bomRequests.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  },

  // Customer actions
  addCustomer: (newCust) => {
    const id = `cust-${Date.now()}`;
    const customer: Customer = {
      ...newCust,
      id,
      ordersCount: 0,
      totalSpent: 0,
      currentDebt: 0,
    };
    set((state) => ({ customers: [customer, ...state.customers] }));
  },
  updateCustomer: (id, updated) => {
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
  },
}));
