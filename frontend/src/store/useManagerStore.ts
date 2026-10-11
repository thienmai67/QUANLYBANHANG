import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Brand,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Shipper,
  StockLog,
  CodSettlement,
  CODSettlement,
  ShipperSummary,
  UpdateOrderStatusPayload,
  ShipperShiftStatus,
} from '@/types/manager';
import {
  mapOrderFromApi,
  mapShipperSummary,
  mapCODSettlement,
  buildUpdateOrderStatusPayload,
} from '@/lib/orderMapper';
import {
  canTransition,
  validateCancellation,
  canAssignShipper,
  checkShipperAssignability,
  createStatusHistoryEntry,
  canActorTransition,
  MAX_SHIPPER_ACTIVE_ORDERS,
  getShipperWorkload,
  canShipperGoOffline,
  calculateShipper2HOnTimeRate,
  Actor,
  TransitionErrorCode,
} from '@/lib/orderRules';
import {
  checkStockAvailability,
  deductStockForOrder,
  restockForOrder,
  calculateDiscountedPrice,
} from '@/lib/stock';
import {
  calculateBrandBreakdown,
  calculateTimeRevenueBuckets,
  BrandMetric,
  TimeBucket,
} from '@/lib/aggregates';
import { createInitialManagerData } from '@/data/managerSeedData';

import { api, ApiError, getFriendlyErrorMessage } from '@/lib/api';

export interface CustomerMetrics {
  customerId: string;
  totalSpent: number;
  orderCount: number;
  deliveredOrderCount: number;
}

export interface ManagerState {
  // State
  products: Product[];
  orders: Order[];
  customers: Customer[];
  shippers: Shipper[];
  stockLogs: StockLog[];
  codSettlements: CodSettlement[];
  initialized: boolean;
  ordersLoading: boolean;
  ordersError: string | null;

  fetchOrders: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  setOrders: (orders: Order[]) => void;
  fetchShippers: () => Promise<void>;
  fetchCodSettlements: (shipperId?: string) => Promise<void>;
  submitCODSettlement: (
    orderIds: string[],
    shipperId?: string
  ) => Promise<{ success: boolean; error?: string; settlement?: CODSettlement }>;

  // Single Shared Action for State Transitions by Actor
  updateOrderStatusWithActor: (
    orderId: string,
    targetStatus: OrderStatus,
    actor: Actor,
    extra?: {
      pod?: { receiverName: string; photos: Array<{ name: string; thumbnail: string }> };
      codConfirmed?: boolean;
      cancelReason?: string;
      incidentCategory?: string;
      shipperId?: string;
      shipperName?: string;
    }
  ) => Promise<{ success: boolean; error?: string; errorCode?: TransitionErrorCode }>;

  // Shipper-specific actions
  updateShipperShift: (
    shipperId: string,
    newStatus: ShipperShiftStatus
  ) => { success: boolean; error?: string };

  settleCod: (
    shipperId: string,
    selectedOrderIds?: string[]
  ) => { success: boolean; error?: string; settlement?: CodSettlement };

  // Atomic Actions (Original Manager actions remain intact and fully compatible)
  approveOrder: (
    orderId: string,
    managerName?: string
  ) => Promise<{ success: boolean; error?: string }>;

  assignShipper: (
    orderId: string,
    shipperId: string,
    managerName?: string
  ) => Promise<{ success: boolean; error?: string }>;

  deliverOrder: (
    orderId: string,
    changedBy?: string
  ) => Promise<{ success: boolean; error?: string }>;

  cancelOrder: (
    orderId: string,
    reason: string,
    managerName?: string
  ) => Promise<{ success: boolean; error?: string }>;

  adjustStock: (
    productId: string,
    newQuantity: number,
    reason: string,
    managerName?: string
  ) => { success: boolean; error?: string };

  addProduct: (
    productData: Omit<Product, 'id'> | Product
  ) => { success: boolean; product?: Product; error?: string };

  resetToSeedData: () => void;

  // Pure Selectors
  getPendingOrders: () => Order[];
  getDiscountedPrice: (product: Product) => number;
  getCustomerMetrics: (customerId: string) => CustomerMetrics;
  getBrandStats: () => Record<Brand, BrandMetric>;
  getRevenueTrend: (
    period?: 'day' | 'month' | 'daily' | 'monthly'
  ) => TimeBucket[];
  getShipperActiveWorkload: (shipperId: string) => number;
  getShipperUnsettledCod: (shipperId: string) => {
    totalAmount: number;
    todayAmount: number;
    count: number;
    orders: Order[];
  };
}

function mapApiProductToManagerProduct(raw: any): Product {
  const specsObj =
    raw && typeof raw.specifications === 'object' && raw.specifications !== null
      ? raw.specifications
      : {};
  const brandRaw =
    typeof raw.brand === 'object' && raw.brand !== null
      ? raw.brand.name
      : raw.brand;
  const brand: Brand =
    brandRaw === 'Bình Minh' || brandRaw === 'Schneider' || brandRaw === 'Panasonic'
      ? brandRaw
      : 'Cadivi';
  const discountPercent =
    typeof specsObj.discountRate === 'number'
      ? specsObj.discountRate
      : typeof raw?.brand?.discountRate === 'number'
        ? raw.brand.discountRate
        : typeof raw.discountPercent === 'number'
          ? raw.discountPercent
          : 10;
  const catName =
    typeof raw.category === 'object' && raw.category !== null
      ? raw.category.name || raw.category.code || 'Vật tư M&E'
      : String(raw.category || 'Vật tư M&E');
  const stockQuantity =
    typeof specsObj.stock === 'number'
      ? specsObj.stock
      : typeof raw.stockQuantity === 'number'
        ? raw.stockQuantity
        : typeof raw.stock === 'number'
          ? raw.stock
          : 100;
  const unit = String(specsObj.unit || raw.unit || 'cái');
  const sku = String(raw.sku || raw.code || 'SKU-STD');
  return {
    id: String(raw.id),
    code: sku,
    sku,
    name: String(raw.name || ''),
    brand,
    category: catName,
    unit,
    basePrice: Number(raw.basePrice ?? raw.base_price ?? raw.price ?? 0),
    discountPercent,
    stockQuantity,
    minStockLevel: typeof specsObj.minStockLevel === 'number' ? specsObj.minStockLevel : 10,
    imageUrl: specsObj.image || raw.image,
    description: specsObj.description || raw.description,
  };
}

function deriveCustomersFromOrders(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  orders.forEach((o, idx) => {
    const cid = o.customerId || o.customerName || `cust-${idx + 1}`;
    const existing = map.get(cid);
    const amount = o.finalAmount ?? o.totalAmount ?? o.total ?? 0;
    const isDelivered = o.status === 'DELIVERED';
    if (!existing) {
      const code = `KH-${String(map.size + 1).padStart(4, '0')}`;
      const totalSpent = isDelivered ? amount : 0;
      const tier =
        totalSpent >= 50000000
          ? 'Gold'
          : totalSpent >= 15000000
            ? 'Silver'
            : totalSpent > 0
              ? 'Bronze'
              : 'Retail';
      map.set(cid, {
        id: cid,
        code,
        name: o.customerName || 'Khách hàng',
        phone: o.customerPhone || '0900000000',
        email: `${code.toLowerCase().replace('-', '')}@khachhang.vn`,
        address: o.shippingAddress || 'Chưa cập nhật địa chỉ',
        tier,
        createdAt: o.createdAt || new Date().toISOString(),
        totalSpent,
        ordersCount: 1,
      });
    } else {
      const nextSpent = (existing.totalSpent || 0) + (isDelivered ? amount : 0);
      const nextCount = (existing.ordersCount || 0) + 1;
      const tier =
        nextSpent >= 50000000
          ? 'Gold'
          : nextSpent >= 15000000
            ? 'Silver'
            : nextSpent > 0
              ? 'Bronze'
              : existing.tier;
      map.set(cid, {
        ...existing,
        totalSpent: nextSpent,
        ordersCount: nextCount,
        tier,
      });
    }
  });
  return Array.from(map.values());
}

export const useManagerStore = create<ManagerState>()(
  persist(
    (set, get) => ({
      products: [],
      orders: [],
      ordersLoading: false,
      ordersError: null,
      customers: [],
      shippers: [],
      stockLogs: [],
      codSettlements: [],
      initialized: true,

      setOrders: (orders: Order[]) => set({ orders }),

      fetchOrders: async () => {
        set({ ordersLoading: true, ordersError: null });
        try {
          const data = await api.get<any[]>('/orders');
          const mapped = (Array.isArray(data) ? data : []).map(mapOrderFromApi);
          const derivedCustomers = deriveCustomersFromOrders(mapped);
          set({
            orders: mapped,
            customers: derivedCustomers,
            ordersLoading: false,
            ordersError: null,
          });
        } catch (err: any) {
          set({
            ordersLoading: false,
            ordersError: getFriendlyErrorMessage(err),
          });
        }
      },

      fetchProducts: async () => {
        try {
          const data = await api.get<any[]>('/products');
          if (Array.isArray(data)) {
            set({ products: data.map(mapApiProductToManagerProduct) });
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'test') {
            console.warn('[useManagerStore] Không thể tải danh sách sản phẩm (/api/v1/products):', err);
          }
        }
      },

      fetchCustomers: async () => {
        await get().fetchOrders();
      },

      fetchShippers: async () => {
        try {
          const res = await api.get<{ data: any[]; total: number }>('/shippers');
          const rawList = res?.data || (Array.isArray(res) ? res : []);
          const mappedSummaries = rawList.map(mapShipperSummary);
          const mappedShippers: Shipper[] = mappedSummaries.map((s) => ({
            id: s.id,
            name: s.fullName,
            phone: s.phone || '0901234567',
            vehicle: 'Xe máy',
            activeOrders: s.activeOrderCount,
            status: s.activeOrderCount >= 5 ? 'busy' : 'available',
            shiftStatus: s.activeOrderCount >= 5 ? 'busy' : 'available',
          }));
          if (mappedShippers.length > 0) {
            set({ shippers: mappedShippers });
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'test') {
            console.warn('[useManagerStore] Không thể tải danh sách shipper từ backend (/api/v1/shippers), sử dụng fallback local:', err);
          }
        }
      },

      fetchCodSettlements: async (shipperId?: string) => {
        try {
          const url = shipperId ? `/cod-settlements?shipper_id=${shipperId}` : '/cod-settlements';
          const res = await api.get<{ data: any[]; total: number }>(url);
          const rawList = res?.data || (Array.isArray(res) ? res : []);
          const mapped = rawList.map(mapCODSettlement).map((s) => ({
            id: s.id,
            shipperId: s.shipperId,
            orderIds: [],
            totalAmount: s.totalAmount,
            settledAt: s.createdAt,
            createdAt: s.createdAt,
            orderCount: s.orderCount,
          }));
          set({ codSettlements: mapped });
        } catch (err) {
          if (process.env.NODE_ENV !== 'test') {
            console.warn('[useManagerStore] Không thể tải danh sách quyết toán COD từ backend (/api/v1/cod-settlements), sử dụng fallback local:', err);
          }
        }
      },

      submitCODSettlement: async (orderIds: string[], shipperId?: string) => {
        try {
          const body: { order_ids: string[]; shipper_id?: string } = {
            order_ids: orderIds,
          };
          if (shipperId) {
            body.shipper_id = shipperId;
          }
          const resRaw = await api.post<any>('/cod-settlements', body);
          const settlement = mapCODSettlement(resRaw);

          const codSettlementRecord: CodSettlement = {
            id: settlement.id,
            shipperId: settlement.shipperId,
            orderIds,
            totalAmount: settlement.totalAmount,
            settledAt: settlement.createdAt,
            createdAt: settlement.createdAt,
            orderCount: settlement.orderCount,
          };

          set((prev) => ({
            codSettlements: [codSettlementRecord, ...(prev.codSettlements || [])],
          }));

          // Refetch orders so codRemitted is synchronized from server
          await get().fetchOrders();

          return { success: true, settlement };
        } catch (err: any) {
          return { success: false, error: getFriendlyErrorMessage(err) };
        }
      },

      /**
       * updateOrderStatusWithActor: Unified action for order transitions
       * enforcing pre-checks via orderRules, optimistic updates, server sync via PATCH /orders/{id}/status,
       * and rollback on error / refetch on 409 Conflict.
       */
      updateOrderStatusWithActor: async (
        orderId: string,
        targetStatus: OrderStatus,
        actor: Actor,
        extra?: {
          pod?: { receiverName: string; photos: Array<{ name: string; thumbnail: string }> };
          codConfirmed?: boolean;
          cancelReason?: string;
          incidentCategory?: string;
          shipperId?: string;
          shipperName?: string;
        }
      ) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);

        if (!order) {
          return {
            success: false,
            errorCode: 'INVALID_STATUS',
            error: `Đơn hàng ${orderId} không tồn tại`,
          };
        }

        // 1. Client Fail-fast pre-checks
        const check = canActorTransition(order, targetStatus, actor, extra);
        if (!check.allowed) {
          return {
            success: false,
            errorCode: check.errorCode,
            error: check.error || 'Thao tác chuyển trạng thái không hợp lệ',
          };
        }

        const now = new Date().toISOString();
        const actorName =
          actor.name ||
          (actor.role === 'SHIPPER'
            ? state.shippers.find((s) => s.id === actor.shipperId)?.name || 'Shipper'
            : 'Manager Hải Đăng');

        // Snapshot previous state for rollback
        const prevOrders = state.orders;
        const prevProducts = state.products;
        const prevLogs = state.stockLogs;
        const prevShippers = state.shippers;

        // Check stock availability if approving
        if (targetStatus === 'PACKING') {
          const availability = checkStockAvailability(order.items, state.products);
          if (!availability.available) {
            const firstMissing = availability.missingItems[0];
            return {
              success: false,
              errorCode: 'INVALID_STATUS',
              error: `Không đủ tồn kho cho sản phẩm ${firstMissing.productName} (Yêu cầu: ${firstMissing.requested}, Hiện có: ${firstMissing.currentStock})`,
            };
          }
        }

        // Calculate optimistic stock & logs
        let nextProducts = state.products;
        let nextLogs = state.stockLogs;

        if (targetStatus === 'PACKING') {
          const { updatedProducts, logs } = deductStockForOrder(
            order.items,
            state.products,
            order.id,
            actorName
          );
          nextProducts = updatedProducts;
          nextLogs = [...logs, ...state.stockLogs];
        } else if (targetStatus === 'CANCELLED') {
          const { updatedProducts, logs } = restockForOrder(
            order.items,
            state.products,
            order.id,
            actorName,
            order.status
          );
          nextProducts = updatedProducts;
          nextLogs = logs.length > 0 ? [...logs, ...state.stockLogs] : state.stockLogs;
        }

        const historyEntry = createStatusHistoryEntry(
          targetStatus,
          actorName,
          extra?.cancelReason || (targetStatus === 'PACKING' ? 'Quản lý duyệt đơn hàng, chuyển sang đóng gói' : `Cập nhật sang ${targetStatus}`),
          now
        );

        // Apply optimistic local update
        set((prev) => ({
          products: nextProducts,
          stockLogs: nextLogs,
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: targetStatus,
                  version: o.version + 1,
                  shipperId: extra?.shipperId || o.shipperId,
                  shipperName: extra?.shipperName || (extra?.shipperId ? prev.shippers.find((s) => s.id === extra.shipperId)?.name : o.shipperName),
                  approvedAt: targetStatus === 'PACKING' ? now : o.approvedAt,
                  shippingStartedAt: targetStatus === 'SHIPPING' ? (o.shippingStartedAt || now) : o.shippingStartedAt,
                  deliveredAt: targetStatus === 'DELIVERED' ? now : o.deliveredAt,
                  cancelledAt: targetStatus === 'CANCELLED' ? now : o.cancelledAt,
                  cancellationReason: extra?.cancelReason || o.cancellationReason,
                  incident: extra?.incidentCategory
                    ? {
                        category: extra.incidentCategory,
                        detail: extra?.cancelReason || '',
                        at: now,
                        shipperId: actor.shipperId || o.shipperId || '',
                      }
                    : o.incident,
                  pod: extra?.pod
                    ? {
                        receiverName: extra.pod.receiverName.trim(),
                        photos: extra.pod.photos || [],
                        capturedAt: now,
                      }
                    : o.pod,
                  cod:
                    targetStatus === 'DELIVERED' && o.paymentMethod === 'COD'
                      ? {
                          amount: o.total ?? o.totalAmount ?? 0,
                          collectedAt: now,
                          settlementId: null,
                        }
                      : o.cod,
                  statusHistory: [...(o.statusHistory || []), historyEntry],
                }
              : o
          ),
          shippers: prev.shippers.map((s) => {
            if (targetStatus === 'DELIVERED' && order.shipperId && s.id === order.shipperId) {
              const newCount = Math.max(0, s.activeOrders - 1);
              return {
                ...s,
                activeOrders: newCount,
                status: newCount < 5 && s.status === 'busy' ? 'available' : s.status,
              };
            }
            if (
              targetStatus === 'CANCELLED' &&
              order.status === 'SHIPPING' &&
              order.shipperId &&
              s.id === order.shipperId
            ) {
              const newCount = Math.max(0, s.activeOrders - 1);
              return {
                ...s,
                activeOrders: newCount,
                status: newCount < 5 && s.status === 'busy' ? 'available' : s.status,
              };
            }
            return s;
          }),
        }));

        // 2. Call Server API with current order version and lifecycle metadata
        try {
          const payload = buildUpdateOrderStatusPayload({
            status: targetStatus,
            version: order.version,
            shipperId: extra?.shipperId,
            cancellationReason: extra?.cancelReason,
            incidentDetail: extra?.incidentCategory
              ? `[${extra.incidentCategory}] ${extra.cancelReason || ''}`.trim()
              : extra?.cancelReason,
            podPhotoUrl: extra?.pod?.photos?.[0]?.thumbnail,
            podRecipientName: extra?.pod?.receiverName?.trim(),
          });

          const resRaw = await api.patch<any>(`/orders/${orderId}/status`, payload);
          const updatedOrder = mapOrderFromApi(resRaw);

          // Server is single source of truth: synchronize parsed server response while preserving non-persisted client properties
          set((prev) => ({
            orders: prev.orders.map((o) => {
              if (o.id !== orderId) return o;
              return {
                ...o,
                ...updatedOrder,
                items: updatedOrder.items && updatedOrder.items.length > 0 ? updatedOrder.items : o.items,
                statusHistory: Array.isArray(resRaw?.statusHistory) && resRaw.statusHistory.length > 0 ? updatedOrder.statusHistory : o.statusHistory,
                customerName: updatedOrder.customerName || o.customerName,
                customerPhone: updatedOrder.customerPhone || o.customerPhone,
                shippingAddress: updatedOrder.shippingAddress || o.shippingAddress,
                approvedAt: updatedOrder.approvedAt || o.approvedAt,
                shippingStartedAt: updatedOrder.shippingStartedAt || o.shippingStartedAt,
                deliveredAt: updatedOrder.deliveredAt || o.deliveredAt,
                cancelledAt: updatedOrder.cancelledAt || o.cancelledAt,
                cancellationReason: updatedOrder.cancellationReason ?? o.cancellationReason,
                incident: o.incident,
                pod: o.pod,
                cod: o.cod,
                shipperName: o.shipperName || (updatedOrder.shipperId ? prev.shippers.find((s) => s.id === updatedOrder.shipperId)?.name : undefined),
              };
            }),
          }));

          // Trigger live workload refresh for shippers
          if (targetStatus === 'SHIPPING' || targetStatus === 'DELIVERED' || targetStatus === 'CANCELLED') {
            get().fetchShippers().catch(() => {});
          }

          return { success: true };
        } catch (err: any) {
          // Rollback optimistic update
          set({
            orders: prevOrders,
            products: prevProducts,
            stockLogs: prevLogs,
            shippers: prevShippers,
          });

          if (err instanceof ApiError && err.status === 409) {
            // Version conflict: refetch from server and report toast message
            await get().fetchOrders();
            return {
              success: false,
              errorCode: 'INVALID_STATUS',
              error: 'Đơn hàng vừa được cập nhật bởi người khác, đã tải lại dữ liệu mới',
            };
          }

          return {
            success: false,
            error: getFriendlyErrorMessage(err),
          };
        }
      },

      /**
       * updateShipperShift: Updates shipper shift status ('available', 'busy', 'offline').
       * Rejects 'offline' if shipper still has PACKING or SHIPPING orders assigned.
       */
      updateShipperShift: (
        shipperId: string,
        newStatus: ShipperShiftStatus
      ) => {
        const state = get();
        const shipper = state.shippers.find((s) => s.id === shipperId);
        if (!shipper) {
          return { success: false, error: `Shipper ${shipperId} không tồn tại` };
        }

        if (newStatus === 'offline') {
          const check = canShipperGoOffline(state.orders, shipperId);
          if (!check.allowed) {
            return { success: false, error: check.reason };
          }
        }

        set((prev) => ({
          shippers: prev.shippers.map((s) =>
            s.id === shipperId
              ? {
                  ...s,
                  status: newStatus,
                  shiftStatus: newStatus,
                }
              : s
          ),
        }));

        return { success: true };
      },

      /**
       * settleCod: Settles collected COD amounts for a shipper.
       * Atomic and idempotent: returns error if no unsettled orders exist.
       */
      settleCod: (shipperId: string, selectedOrderIds?: string[]) => {
        const state = get();
        const candidateOrders = state.orders.filter(
          (o) =>
            o.shipperId === shipperId &&
            o.status === 'DELIVERED' &&
            o.cod &&
            !o.cod.settlementId &&
            (!selectedOrderIds || selectedOrderIds.includes(o.id))
        );

        if (candidateOrders.length === 0) {
          return {
            success: false,
            error: 'Không có khoản COD nào chưa nộp cần kết chuyển',
          };
        }

        const totalAmount = candidateOrders.reduce(
          (sum, o) => sum + (o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
          0
        );

        const now = new Date().toISOString();
        const settlementId = `SETTLE-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`;

        const newSettlement: CodSettlement = {
          id: settlementId,
          shipperId,
          orderIds: candidateOrders.map((o) => o.id),
          totalAmount,
          settledAt: now,
        };

        const targetIds = new Set(candidateOrders.map((o) => o.id));

        set((prev) => ({
          orders: prev.orders.map((o) =>
            targetIds.has(o.id) && o.cod
              ? {
                  ...o,
                  cod: {
                    ...o.cod,
                    settlementId,
                  },
                }
              : o
          ),
          codSettlements: [newSettlement, ...(prev.codSettlements || [])],
        }));

        return { success: true, settlement: newSettlement };
      },

      /**
       * approveOrder: Checks stock availability via checkStockAvailability,
       * blocks if insufficient, deducts stock via deductStockForOrder,
       * transitions to PACKING, adds statusHistory and stock logs atomically.
       */
      approveOrder: (orderId: string, managerName: string = 'Manager Hải Đăng') => {
        return get().updateOrderStatusWithActor(orderId, 'PACKING', {
          role: 'MANAGER',
          name: managerName,
        });
      },

      /**
       * assignShipper: Checks shipper workload (activeOrders < 5),
       * transitions order PACKING -> SHIPPING via API, updates shipper's activeOrders.
       */
      assignShipper: async (
        orderId: string,
        shipperId: string,
        managerName: string = 'Manager Hải Đăng'
      ) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);

        if (!order) {
          return { success: false, error: `Đơn hàng ${orderId} không tồn tại` };
        }

        if (order.status !== 'PACKING' && order.status !== 'SHIPPING') {
          return {
            success: false,
            error: `Chỉ đơn hàng đang đóng gói hoặc đang giao mới có thể phân công shipper (hiện tại: ${order.status})`,
          };
        }

        const shipper = state.shippers.find((s) => s.id === shipperId);
        if (!shipper) {
          return { success: false, error: `Shipper ${shipperId} không tồn tại` };
        }

        // Workload & status enforcement
        const check = checkShipperAssignability(shipper);
        if (!check.allowed) {
          return {
            success: false,
            error: check.reason || 'Shipper đã đạt giới hạn 5 đơn hoặc ngoại tuyến',
          };
        }

        // Transition PACKING -> SHIPPING via updateOrderStatusWithActor
        if (order.status === 'PACKING') {
          const res = await get().updateOrderStatusWithActor(
            orderId,
            'SHIPPING',
            {
              role: 'MANAGER',
              name: managerName,
            },
            {
              shipperId: shipper.id,
              shipperName: shipper.name,
            }
          );
          if (!res.success) {
            return res;
          }
        }

        const now = new Date().toISOString();
        const historyEntry = createStatusHistoryEntry(
          'SHIPPING',
          managerName,
          `Phân công cho shipper: ${shipper.name} (${shipper.phone})`,
          now
        );

        const previousShipperId = order.status === 'SHIPPING' ? order.shipperId : undefined;

        set((prev) => ({
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'SHIPPING' as OrderStatus,
                  shipperId: shipper.id,
                  shipperName: shipper.name,
                  shippingStartedAt: o.shippingStartedAt || now,
                  statusHistory: [...(o.statusHistory || []), historyEntry],
                }
              : o
          ),
          shippers: prev.shippers.map((s) => {
            if (previousShipperId && s.id === previousShipperId && s.id !== shipperId) {
              const newCount = Math.max(0, s.activeOrders - 1);
              return {
                ...s,
                activeOrders: newCount,
                status: newCount < 5 && s.status === 'busy' ? 'available' : s.status,
              };
            }
            if (s.id === shipperId) {
              const newCount = s.activeOrders + 1;
              return {
                ...s,
                activeOrders: newCount,
                status: newCount >= 5 ? 'busy' : s.status,
              };
            }
            return s;
          }),
        }));

        return { success: true };
      },

      /**
       * deliverOrder: Transitions SHIPPING -> DELIVERED via updateOrderStatusWithActor
       */
      deliverOrder: async (orderId: string, changedBy: string = 'Shipper') => {
        return await get().updateOrderStatusWithActor(orderId, 'DELIVERED', {
          role: 'MANAGER',
          name: changedBy,
        });
      },

      /**
       * cancelOrder: Validates reason and transitions to CANCELLED via updateOrderStatusWithActor
       */
      cancelOrder: async (
        orderId: string,
        reason: string,
        managerName: string = 'Manager Hải Đăng'
      ) => {
        return await get().updateOrderStatusWithActor(
          orderId,
          'CANCELLED',
          {
            role: 'MANAGER',
            name: managerName,
          },
          {
            cancelReason: reason,
          }
        );
      },

      /**
       * adjustStock: Manual stock adjustment emitting StockLog.
       */
      adjustStock: (
        productId: string,
        newQuantity: number,
        reason: string,
        managerName: string = 'Manager Hải Đăng'
      ) => {
        if (typeof newQuantity !== 'number' || isNaN(newQuantity) || newQuantity < 0) {
          return { success: false, error: 'Số lượng tồn kho mới phải là số không âm' };
        }

        const state = get();
        const prod = state.products.find((p) => p.id === productId);
        if (!prod) {
          return { success: false, error: `Sản phẩm ${productId} không tồn tại` };
        }

        const previousStock = prod.stockQuantity;
        const changeAmount = newQuantity - previousStock;
        const now = new Date().toISOString();

        const log: StockLog = {
          id: `log-adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: prod.id,
          productName: prod.name,
          changeAmount,
          previousStock,
          newStock: newQuantity,
          type: 'MANUAL_ADJUST',
          referenceId: reason.trim() || 'Điều chỉnh thủ công',
          createdAt: now,
          createdByName: managerName,
        };

        set((prev) => ({
          products: prev.products.map((p) =>
            p.id === productId
              ? { ...p, stockQuantity: newQuantity, stock: newQuantity }
              : p
          ),
          stockLogs: [log, ...prev.stockLogs],
        }));

        return { success: true };
      },

      /**
       * addProduct: Add new material (Manager cannot delete per RBAC, but can add/adjust).
       */
      addProduct: (productData: Omit<Product, 'id'> | Product) => {
        if (!productData.name || !productData.code || !productData.brand) {
          return { success: false, error: 'Vui lòng điền đầy đủ tên, mã và thương hiệu' };
        }

        const id =
          'id' in productData && productData.id
            ? productData.id
            : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const newProd: Product = {
          ...productData,
          id,
          stockQuantity: productData.stockQuantity || 0,
          minStockLevel: productData.minStockLevel || 5,
        };

        const now = new Date().toISOString();
        const logs: StockLog[] = [];
        if (newProd.stockQuantity > 0) {
          logs.push({
            id: `log-init-${Date.now()}`,
            productId: newProd.id,
            productName: newProd.name,
            changeAmount: newProd.stockQuantity,
            previousStock: 0,
            newStock: newProd.stockQuantity,
            type: 'INITIAL_IMPORT',
            referenceId: 'Thêm vật tư mới vào hệ thống',
            createdAt: now,
            createdByName: 'Manager',
          });
        }

        set((prev) => ({
          products: [newProd, ...prev.products],
          stockLogs: [...logs, ...prev.stockLogs],
        }));

        return { success: true, product: newProd };
      },

      /**
       * resetToSeedData: Resets store back to initial seed data.
       */
      resetToSeedData: () => {
        const fresh = createInitialManagerData();
        set({
          products: fresh.products,
          orders: fresh.orders,
          customers: fresh.customers,
          shippers: fresh.shippers,
          stockLogs: fresh.stockLogs,
          initialized: true,
        });
      },

      // Pure Selectors
      getPendingOrders: () => {
        return get().orders.filter((o) => o.status === 'PENDING');
      },

      getDiscountedPrice: (product: Product) => {
        return calculateDiscountedPrice(product.basePrice, product.discountPercent);
      },

      getCustomerMetrics: (customerId: string) => {
        const customerOrders = get().orders.filter((o) => o.customerId === customerId);
        const deliveredOrders = customerOrders.filter((o) => o.status === 'DELIVERED');
        const totalSpent = deliveredOrders.reduce(
          (sum, o) => sum + (o.finalAmount ?? o.totalAmount ?? 0),
          0
        );

        return {
          customerId,
          totalSpent,
          orderCount: customerOrders.length,
          deliveredOrderCount: deliveredOrders.length,
        };
      },

      getBrandStats: () => {
        return calculateBrandBreakdown(get().orders);
      },

      getRevenueTrend: (period: 'day' | 'month' | 'daily' | 'monthly' = 'month') => {
        const normalized = period === 'day' || period === 'daily' ? 'day' : 'month';
        return calculateTimeRevenueBuckets(get().orders, normalized);
      },

      getShipperActiveWorkload: (shipperId: string) => {
        return getShipperWorkload(get().orders, shipperId);
      },

      getShipperUnsettledCod: (shipperId: string) => {
        const orders = get().orders;
        const now = new Date();
        const isToday = (dStr?: string) => {
          if (!dStr) return false;
          const d = new Date(dStr);
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          );
        };

        const unsettled = orders.filter(
          (o) =>
            o.shipperId === shipperId &&
            o.status === 'DELIVERED' &&
            o.cod &&
            !o.cod.settlementId
        );

        const totalAmount = unsettled.reduce(
          (sum, o) => sum + (o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
          0
        );

        const todayAmount = unsettled
          .filter((o) => isToday(o.cod?.collectedAt || o.deliveredAt))
          .reduce(
            (sum, o) => sum + (o.cod?.amount ?? o.total ?? o.totalAmount ?? 0),
            0
          );

        return {
          totalAmount,
          todayAmount,
          count: unsettled.length,
          orders: unsettled,
        };
      },
    }),
    {
      name: 'tdt-manager-storage',
      version: 3,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || typeof persistedState !== 'object' || version < 3) {
          return {
            products: [],
            orders: [],
            customers: [],
            shippers: [],
            stockLogs: [],
            codSettlements: [],
            initialized: true,
          };
        }

        if (!Array.isArray(persistedState.codSettlements)) {
          persistedState.codSettlements = [];
        }

        if (Array.isArray(persistedState.shippers)) {
          persistedState.shippers = persistedState.shippers.map((s: any) => ({
            ...s,
            shiftStatus:
              s.shiftStatus ||
              (s.status?.toLowerCase() === 'offline'
                ? 'offline'
                : s.status?.toLowerCase() === 'busy'
                ? 'busy'
                : 'available'),
          }));
        }

        if (Array.isArray(persistedState.orders)) {
          persistedState.orders = persistedState.orders.map((o: any) => ({
            ...o,
            deliveryType: o.deliveryType || (o.is2H ? '2H' : 'STANDARD'),
            total: o.total ?? o.totalAmount ?? 0,
          }));
        }

        return persistedState;
      },
    }
  )
);

// Standalone selector helpers
export const selectPendingOrders = (state: ManagerState) => state.getPendingOrders();
export const selectDiscountedPrice = (product: Product) =>
  calculateDiscountedPrice(product.basePrice, product.discountPercent);
export const selectCustomerMetrics = (customerId: string) => (state: ManagerState) =>
  state.getCustomerMetrics(customerId);
export const selectBrandStats = (state: ManagerState) => state.getBrandStats();
export const selectRevenueTrend =
  (period: 'day' | 'month' | 'daily' | 'monthly' = 'month') =>
  (state: ManagerState) =>
    state.getRevenueTrend(period);
export const selectShipperWorkload = (shipperId: string) => (state: ManagerState) =>
  state.getShipperActiveWorkload(shipperId);
export const selectShipperUnsettledCod = (shipperId: string) => (state: ManagerState) =>
  state.getShipperUnsettledCod(shipperId);
