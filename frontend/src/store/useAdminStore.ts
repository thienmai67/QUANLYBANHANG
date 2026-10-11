import { create } from 'zustand';
import {
  Product,
  ProductBrand,
  ProductCategoryType,
  ProductUnit,
  Category,
  Order,
  OrderItem,
  Customer,
  OrderStatus,
} from '../types/admin';
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
      ? '/images/products/ong-binh-minh-1.jpg'
      : catCode === 'CABLE'
        ? '/images/products/day-cap-don-1.jpg'
        : '/images/products/schneider-mcb-1.jpg';

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

function mapApiOrderStatusToAdminStatus(rawStatus?: string): OrderStatus {
  const s = (rawStatus || '').toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 'Completed';
  if (s === 'SHIPPING' || s === 'SHIPPING2H') return 'Shipping2H';
  if (s === 'PACKING' || s === 'PREPARING') return 'Preparing';
  if (s === 'CANCELLED') return 'Cancelled';
  return 'Pending';
}

function mapApiOrderToAdminOrder(raw: any): Order {
  const rawItems: any[] = Array.isArray(raw.items) ? raw.items : [];
  const items: OrderItem[] = rawItems.map((it) => ({
    productId: String(it.productId || it.product_id || ''),
    productName: String(it.productName || it.product_name || 'Vật tư M&E'),
    sku: String(it.sku || 'SKU-STD'),
    quantity: Number(it.quantity ?? 1),
    unit: (it.unit || 'Cái') as ProductUnit,
    unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
    discountRate: Number(it.discountRate ?? 0),
  }));

  const finalAmount = Number(raw.finalAmount ?? raw.totalAmount ?? raw.total_amount ?? 0);
  const discountAmount = Number(raw.discountAmount ?? raw.discount_amount ?? 0);
  const totalAmount = Number(raw.totalAmount ?? raw.total_amount ?? finalAmount + discountAmount);

  const createdRaw = raw.createdAt || raw.created_at || new Date().toISOString();
  const createdAt = String(createdRaw).slice(0, 10);

  return {
    id: String(raw.id),
    code: String(raw.orderNumber || raw.order_number || raw.code || `DH-${String(raw.id).slice(0, 6)}`),
    contractorName: String(raw.customerName || raw.customer_name || raw.contractorName || 'Khách mua lẻ'),
    contractorTier: 'Khách mua lẻ',
    totalAmount,
    discountAmount,
    finalAmount,
    status: mapApiOrderStatusToAdminStatus(raw.status),
    createdAt,
    deliveryAddress: String(raw.shippingAddress || raw.shipping_address || raw.deliveryAddress || 'Chưa cập nhật địa chỉ'),
    items,
    assignedShipperId: raw.shipperId || raw.shipper_id,
    assignedShipperName: raw.shipperName || raw.shipper_name,
  };
}

function deriveAdminCustomersFromOrders(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  orders.forEach((o, idx) => {
    const key = o.contractorName || `Khách hàng #${idx + 1}`;
    const existing = map.get(key);
    const isCompleted = o.status === 'Completed';
    const spent = isCompleted ? o.finalAmount : 0;
    if (!existing) {
      map.set(key, {
        id: `cust-${map.size + 1}`,
        name: key,
        taxId: 'Chưa cập nhật',
        phone: 'Chưa cập nhật',
        email: 'Chưa cập nhật',
        tier: o.contractorTier || 'Khách mua lẻ',
        creditLimit: 0,
        currentDebt: 0,
        totalSpent: spent,
        ordersCount: 1,
        status: 'Active',
        address: o.deliveryAddress || 'Chưa cập nhật',
      });
    } else {
      map.set(key, {
        ...existing,
        totalSpent: existing.totalSpent + spent,
        ordersCount: existing.ordersCount + 1,
      });
    }
  });
  return Array.from(map.values());
}

function mapApiCategoryToAdminCategory(raw: any, products: Product[]): Category {
  const rawName = String(raw.name || '');
  const rawCode = String(raw.code || raw.type || '').toUpperCase();
  let name: ProductCategoryType = 'Dây & Cáp Điện';
  if (rawCode.includes('PIPE') || rawName.includes('Ống')) {
    name = 'Ống & Phụ Kiện Nhựa';
  } else if (rawCode === 'DEVICE' || rawName.includes('Thiết bị') || rawName.includes('Tủ')) {
    name = 'Tủ & Thiết Bị Đóng Cắt';
  } else if (rawName.includes('Van')) {
    name = 'Van & Phụ Kiện Đường Ống';
  } else if (rawCode === 'CABLE' || rawName.includes('Cáp') || rawName.includes('Dây')) {
    name = 'Dây & Cáp Điện';
  }
  const slug = String(raw.code || raw.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const skuCount = products.filter((p) => p.category === name).length;
  return {
    id: String(raw.id),
    name,
    slug: slug || 'danh-muc',
    skuCount,
    status: 'Active',
    description: String(raw.description || raw.name || `Danh mục vật tư ${name}`),
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
  fetchCategories: () => Promise<void>;
  orders: Order[];
  fetchOrders: () => Promise<void>;
  customers: Customer[];
  shippers: Array<{ id: string; fullName: string; phone?: string; activeOrderCount: number }>;
  fetchShippers: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Category CRUD
  addCategory: (category: Omit<Category, 'id' | 'skuCount'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Order actions
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'code'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  assignShipper: (orderId: string, shipperId: string, shipperName: string) => Promise<void>;

  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'ordersCount' | 'totalSpent' | 'currentDebt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
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
        set((state) => ({
          products: mapped,
          productsLoading: false,
          productsError: false,
          categories: state.categories.map((c) => ({
            ...c,
            skuCount: mapped.filter((p) => p.category === c.name).length,
          })),
        }));
      } else {
        set({ products: [], productsLoading: false, productsError: true });
      }
    } catch {
      set({ productsLoading: false, productsError: true });
    }
  },
  categories: [],
  fetchCategories: async () => {
    try {
      const data = await api.get<any[]>('/categories');
      if (Array.isArray(data)) {
        const currentProducts = get().products;
        const mapped = data.map((raw) => mapApiCategoryToAdminCategory(raw, currentProducts));
        set({ categories: mapped });
      }
    } catch {
      // keep empty array if fetch fails
    }
  },
  orders: [],
  fetchOrders: async () => {
    try {
      const data = await api.get<any[]>('/orders');
      if (Array.isArray(data)) {
        const enriched = await Promise.all(
          data.map(async (rawOrder) => {
            if (Array.isArray(rawOrder.items) && rawOrder.items.length > 0) {
              return mapApiOrderToAdminOrder(rawOrder);
            }
            try {
              const detail = await api.get<any>(`/orders/${rawOrder.id}`);
              return mapApiOrderToAdminOrder({ ...rawOrder, ...detail });
            } catch {
              return mapApiOrderToAdminOrder(rawOrder);
            }
          })
        );
        const derivedCustomers = deriveAdminCustomersFromOrders(enriched);
        set({ orders: enriched, customers: derivedCustomers });
      }
    } catch {
      // keep existing or empty on error
    }
  },
  customers: [],
  shippers: [],
  fetchShippers: async () => {
    try {
      const res = await api.get<any>('/shippers');
      const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const mapped = rawList.map((s: any) => ({
        id: String(s.id),
        fullName: String(s.fullName || s.full_name || s.name || 'Shipper'),
        phone: s.phone ? String(s.phone) : undefined,
        activeOrderCount: Number(s.activeOrderCount ?? s.active_order_count ?? 0),
      }));
      set({ shippers: mapped });
    } catch {
      // keep existing or empty on error
    }
  },

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

  // Product actions (Real API)
  addProduct: async (newProd) => {
    await api.post('/products', {
      sku: newProd.sku,
      name: newProd.name,
      brand: newProd.brand,
      category: newProd.category,
      basePrice: newProd.basePrice,
      unit: newProd.unit,
      image: newProd.image,
      description: newProd.description,
      specifications: {
        unit: newProd.unit,
        image: newProd.image,
        description: newProd.description,
        discountRate: newProd.discountRate,
        stock: newProd.stock,
      },
    });
    await get().fetchProducts();
  },
  updateProduct: async (id, updated) => {
    const existing = get().products.find((p) => p.id === id);
    const merged = { ...existing, ...updated };
    await api.put(`/products/${id}`, {
      sku: merged.sku,
      name: merged.name,
      brand: merged.brand,
      category: merged.category,
      basePrice: merged.basePrice,
      unit: merged.unit,
      image: merged.image,
      description: merged.description,
      specifications: {
        unit: merged.unit,
        image: merged.image,
        description: merged.description,
        discountRate: merged.discountRate,
        stock: merged.stock,
      },
    });
    await get().fetchProducts();
  },
  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
    await get().fetchProducts();
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
  updateOrderStatus: async (id, status) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
    try {
      const detail = await api.get<any>(`/orders/${id}`);
      const currentVersion = Number(detail?.version ?? 1);
      const apiStatusMap: Record<string, string> = {
        Pending: 'PENDING',
        Preparing: 'PACKING',
        Shipping2H: 'SHIPPING',
        Completed: 'DELIVERED',
        Cancelled: 'CANCELLED',
      };
      const targetApiStatus = apiStatusMap[status] || 'PACKING';
      await api.patch(`/orders/${id}/status`, {
        status: targetApiStatus,
        version: currentVersion,
        ...(targetApiStatus === 'SHIPPING' && detail?.shipperId ? { shipper_id: detail.shipperId } : {}),
      });
      await get().fetchOrders();
    } catch {
      // keep optimistic state if transition requires intermediate step
    }
  },
  assignShipper: async (orderId, shipperId, shipperName) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedShipperId: shipperId,
              assignedShipperName: shipperName,
              status: o.status === 'Pending' || o.status === 'Preparing' ? 'Shipping2H' : o.status,
            }
          : o
      ),
    }));
    try {
      let detail = await api.get<any>(`/orders/${orderId}`);
      let version = Number(detail?.version ?? 1);
      const rawStatus = String(detail?.status || 'PENDING').toUpperCase();
      if (rawStatus === 'PENDING') {
        const approved = await api.patch<any>(`/orders/${orderId}/status`, {
          status: 'PACKING',
          version,
        });
        version = Number(approved?.version ?? version + 1);
      }
      await api.patch(`/orders/${orderId}/status`, {
        status: 'SHIPPING',
        version,
        shipper_id: shipperId,
      });
      await get().fetchOrders();
      await get().fetchShippers();
    } catch {
      // keep optimistic state if already shipping
    }
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
