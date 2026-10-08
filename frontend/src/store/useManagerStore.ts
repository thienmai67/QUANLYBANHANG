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
  ShipperShiftStatus,
} from '@/types/manager';
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
    }
  ) => { success: boolean; error?: string; errorCode?: TransitionErrorCode };

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
  ) => { success: boolean; error?: string };

  assignShipper: (
    orderId: string,
    shipperId: string,
    managerName?: string
  ) => { success: boolean; error?: string };

  deliverOrder: (
    orderId: string,
    changedBy?: string
  ) => { success: boolean; error?: string };

  cancelOrder: (
    orderId: string,
    reason: string,
    managerName?: string
  ) => { success: boolean; error?: string };

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

const initialSeed = createInitialManagerData();

export const useManagerStore = create<ManagerState>()(
  persist(
    (set, get) => ({
      products: initialSeed.products,
      orders: initialSeed.orders,
      customers: initialSeed.customers,
      shippers: initialSeed.shippers,
      stockLogs: initialSeed.stockLogs,
      codSettlements: (initialSeed as any).codSettlements || [],
      initialized: true,

      /**
       * updateOrderStatusWithActor: Unified single action for order transitions
       * enforcing actor permissions, ownership, state machine, stock integrity,
       * POD, and COD confirmation.
       */
      updateOrderStatusWithActor: (
        orderId: string,
        targetStatus: OrderStatus,
        actor: Actor,
        extra?: {
          pod?: { receiverName: string; photos: Array<{ name: string; thumbnail: string }> };
          codConfirmed?: boolean;
          cancelReason?: string;
          incidentCategory?: string;
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

        // Validate actor transition
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

        // Transition: PENDING -> PACKING (Approve)
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

          const { updatedProducts, logs } = deductStockForOrder(
            order.items,
            state.products,
            order.id,
            actorName
          );

          const historyEntry = createStatusHistoryEntry(
            'PACKING',
            actorName,
            'Quản lý duyệt đơn hàng, chuyển sang đóng gói',
            now
          );

          set((prev) => ({
            products: updatedProducts,
            stockLogs: [...logs, ...prev.stockLogs],
            orders: prev.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'PACKING' as OrderStatus,
                    approvedAt: now,
                    statusHistory: [...o.statusHistory, historyEntry],
                  }
                : o
            ),
          }));

          return { success: true };
        }

        // Transition: PACKING -> SHIPPING (Shipper pickup at warehouse)
        if (targetStatus === 'SHIPPING') {
          const historyEntry = createStatusHistoryEntry(
            'SHIPPING',
            actorName,
            actor.role === 'SHIPPER'
              ? `Shipper nhận hàng tại kho và bắt đầu giao`
              : `Bắt đầu giao hàng`,
            now
          );

          set((prev) => ({
            orders: prev.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'SHIPPING' as OrderStatus,
                    shippingStartedAt: o.shippingStartedAt || now,
                    statusHistory: [...o.statusHistory, historyEntry],
                  }
                : o
            ),
          }));

          return { success: true };
        }

        // Transition: SHIPPING -> DELIVERED (Shipper delivers with POD)
        if (targetStatus === 'DELIVERED') {
          const historyEntry = createStatusHistoryEntry(
            'DELIVERED',
            actorName,
            actor.role === 'SHIPPER' && extra?.pod?.receiverName
              ? `Giao thành công cho: ${extra.pod.receiverName}`
              : 'Giao hàng thành công đến khách hàng',
            now
          );

          const orderAmount = order.total ?? order.totalAmount ?? 0;
          const isCod = order.paymentMethod === 'COD';

          set((prev) => ({
            orders: prev.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'DELIVERED' as OrderStatus,
                    deliveredAt: now,
                    pod: extra?.pod
                      ? {
                          receiverName: extra.pod.receiverName.trim(),
                          photos: extra.pod.photos || [],
                          capturedAt: now,
                        }
                      : o.pod,
                    cod: isCod
                      ? {
                          amount: orderAmount,
                          collectedAt: now,
                          settlementId: null,
                        }
                      : o.cod,
                    statusHistory: [...o.statusHistory, historyEntry],
                  }
                : o
            ),
            shippers: prev.shippers.map((s) => {
              if (order.shipperId && s.id === order.shipperId) {
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

          return { success: true };
        }

        // Transition: -> CANCELLED
        if (targetStatus === 'CANCELLED') {
          const prevStatus = order.status;
          const trimmedReason = (
            extra?.cancelReason ||
            order.cancellationReason ||
            'Hủy đơn hàng'
          ).trim();

          const { updatedProducts, logs } = restockForOrder(
            order.items,
            state.products,
            order.id,
            actorName,
            prevStatus
          );

          const historyEntry = createStatusHistoryEntry(
            'CANCELLED',
            actorName,
            extra?.incidentCategory
              ? `[Sự cố: ${extra.incidentCategory}] ${trimmedReason}`
              : trimmedReason,
            now
          );

          set((prev) => ({
            products: updatedProducts,
            stockLogs: logs.length > 0 ? [...logs, ...prev.stockLogs] : prev.stockLogs,
            orders: prev.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'CANCELLED' as OrderStatus,
                    cancelledAt: now,
                    cancellationReason: trimmedReason,
                    incident: extra?.incidentCategory
                      ? {
                          category: extra.incidentCategory,
                          detail: trimmedReason,
                          at: now,
                          shipperId: actor.shipperId || order.shipperId || '',
                        }
                      : o.incident,
                    statusHistory: [...o.statusHistory, historyEntry],
                  }
                : o
            ),
            shippers: prev.shippers.map((s) => {
              if (
                prevStatus === 'SHIPPING' &&
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

          return { success: true };
        }

        return {
          success: false,
          errorCode: 'INVALID_STATUS',
          error: 'Trạng thái đích không được hỗ trợ',
        };
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
       * updates order to SHIPPING, updates shipper's activeOrders, records statusHistory.
       */
      assignShipper: (
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
                  statusHistory: [...o.statusHistory, historyEntry],
                }
              : o
          ),
          shippers: prev.shippers.map((s) => {
            // If reassigning from another shipper, decrement old shipper
            if (previousShipperId && s.id === previousShipperId && s.id !== shipperId) {
              const newCount = Math.max(0, s.activeOrders - 1);
              return {
                ...s,
                activeOrders: newCount,
                status: newCount < 5 && s.status === 'busy' ? 'available' : s.status,
              };
            }
            // Increment assigned shipper
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
      deliverOrder: (orderId: string, changedBy: string = 'Shipper') => {
        return get().updateOrderStatusWithActor(orderId, 'DELIVERED', {
          role: 'MANAGER',
          name: changedBy,
        });
      },

      /**
       * cancelOrder: Validates reason and transitions to CANCELLED via updateOrderStatusWithActor
       */
      cancelOrder: (
        orderId: string,
        reason: string,
        managerName: string = 'Manager Hải Đăng'
      ) => {
        return get().updateOrderStatusWithActor(
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
      version: 2,
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
        if (!persistedState || typeof persistedState !== 'object') {
          return createInitialManagerData();
        }

        // Migrate to version 2: ensure codSettlements and shiftStatus are populated
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

        // Ensure orders have fallback defaults
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
