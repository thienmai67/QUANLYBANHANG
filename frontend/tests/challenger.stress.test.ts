import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useManagerStore } from '../src/store/useManagerStore';
import { api } from '../src/lib/api';
import {
  checkStockAvailability,
  deductStockForOrder,
  restockForOrder,
  calculateDiscountedPrice,
} from '../src/lib/stock';
import {
  canTransition,
  validateCancellation,
  canAssignShipper,
  checkShipperAssignability,
  isOrderOverdue2H,
  getRemaining2HMinutes,
  get2HDeadline,
} from '../src/lib/orderRules';
import {
  calculateDeliveredRevenue,
  countPendingOrders,
  calculateBrandRevenue,
  calculateTimeRevenueBuckets,
} from '../src/lib/aggregates';
import { formatCountdownMinutes } from '../src/lib/formatters';
import { Order, OrderItem, Product, Shipper } from '../src/types/manager';

describe('Adversarial Challenger Stress Suite — Logic, Stock & Edge Cases', () => {
  beforeEach(() => {
    useManagerStore.getState().resetToSeedData();
    vi.spyOn(api, 'patch').mockImplementation(async (url: string, body?: any) => {
      return {
        id: url.split('/')[2],
        status: body?.status,
        version: (body?.version || 1) + 1,
        deliveredAt: body?.status === 'DELIVERED' ? new Date().toISOString() : undefined,
      } as any;
    });
  });

  // =========================================================================
  // 1. ATOMIC ORDER APPROVAL & STOCK MECHANICS
  // =========================================================================
  describe('1. Atomic Order Approval & Stock Mechanics', () => {
    const mockProducts: Product[] = [
      {
        id: 'stress-p1',
        code: 'CAD-01',
        name: 'Dây Cáp Điện Cadivi CV 2.5',
        brand: 'Cadivi',
        category: 'Dây Cáp Điện',
        unit: 'Cuộn',
        basePrice: 500000,
        discountPercent: 10,
        stockQuantity: 10,
        minStockLevel: 2,
      },
      {
        id: 'stress-p2',
        code: 'BM-01',
        name: 'Ống PVC Bình Minh D90',
        brand: 'Bình Minh',
        category: 'Ống Nhựa',
        unit: 'Cây',
        basePrice: 120000,
        discountPercent: 15,
        stockQuantity: 3,
        minStockLevel: 1,
      },
    ];

    it('blocks approval and throws when single item quantity exceeds available stock', () => {
      const items: OrderItem[] = [
        {
          productId: 'stress-p1',
          productName: 'Dây Cáp Điện Cadivi CV 2.5',
          brand: 'Cadivi',
          unitPrice: 450000,
          quantity: 15, // Stock is 10
          unit: 'Cuộn',
          total: 6750000,
        },
      ];

      // 1. checkStockAvailability returns available: false
      const avail = checkStockAvailability(items, mockProducts);
      expect(avail.available).toBe(false);
      expect(avail.missingItems).toHaveLength(1);
      expect(avail.missingItems[0].currentStock).toBe(10);
      expect(avail.missingItems[0].requested).toBe(15);

      // 2. deductStockForOrder throws error
      expect(() => {
        deductStockForOrder(items, mockProducts, 'ORD-STRESS-01', 'Tester');
      }).toThrow(/Không đủ tồn kho/);

      // 3. Products array unchanged
      expect(mockProducts[0].stockQuantity).toBe(10);
    });

    it('enforces all-or-nothing atomicity: multi-item order where 1 item fails must NOT deduct any item', () => {
      const items: OrderItem[] = [
        {
          productId: 'stress-p1',
          productName: 'Dây Cáp Điện Cadivi CV 2.5',
          brand: 'Cadivi',
          unitPrice: 450000,
          quantity: 5, // Available is 10 (sufficient)
          unit: 'Cuộn',
          total: 2250000,
        },
        {
          productId: 'stress-p2',
          productName: 'Ống PVC Bình Minh D90',
          brand: 'Bình Minh',
          unitPrice: 102000,
          quantity: 10, // Available is 3 (INSUFFICIENT)
          unit: 'Cây',
          total: 1020000,
        },
      ];

      // Pure check
      const avail = checkStockAvailability(items, mockProducts);
      expect(avail.available).toBe(false);
      expect(avail.missingItems).toHaveLength(1);
      expect(avail.missingItems[0].productId).toBe('stress-p2');

      // Attempt deduction
      expect(() => {
        deductStockForOrder(items, mockProducts, 'ORD-MULTI-FAIL', 'Tester');
      }).toThrow();

      // Invariant: p1 must NOT be partially deducted
      expect(mockProducts[0].stockQuantity).toBe(10);
      expect(mockProducts[1].stockQuantity).toBe(3);
    });

    it('store.approveOrder atomically blocks order and leaves all stocks untouched when stock is insufficient', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      expect(pendingOrder).toBeDefined();

      const firstItem = pendingOrder.items[0];

      // Reduce product stock to strictly less than order quantity
      const insufficientStock = Math.max(0, firstItem.quantity - 1);
      store.adjustStock(firstItem.productId, insufficientStock, 'Giảm tồn để stress test');

      const productsBefore = useManagerStore.getState().products;
      const stockBefore = productsBefore.find((p) => p.id === firstItem.productId)!.stockQuantity;
      expect(stockBefore).toBe(insufficientStock);

      const logsCountBefore = useManagerStore.getState().stockLogs.length;

      // Execute approval
      const approvalResult = await useManagerStore.getState().approveOrder(pendingOrder.id, 'Tester');
      expect(approvalResult.success).toBe(false);
      expect(approvalResult.error).toContain('Không đủ tồn kho');

      // Verify store state integrity
      const freshOrder = useManagerStore.getState().orders.find((o) => o.id === pendingOrder.id)!;
      expect(freshOrder.status).toBe('PENDING'); // Not approved!
      expect(freshOrder.approvedAt).toBeUndefined();

      const freshProduct = useManagerStore.getState().products.find((p) => p.id === firstItem.productId)!;
      expect(freshProduct.stockQuantity).toBe(insufficientStock); // Zero deduction!

      // Zero new stock logs added
      expect(useManagerStore.getState().stockLogs.length).toBe(logsCountBefore);
    });

    it('boundary condition: order approved when stock exactly matches requested quantity (stock -> 0)', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      const firstItem = pendingOrder.items[0];

      // Set stock to EXACT item quantity
      store.adjustStock(firstItem.productId, firstItem.quantity, 'Thiết lập tồn đúng bằng số lượng đặt');

      // If order has multiple items, ensure others also have plenty of stock
      for (let i = 1; i < pendingOrder.items.length; i++) {
        store.adjustStock(pendingOrder.items[i].productId, 9999, 'Đảm bảo item phụ đủ hàng');
      }

      const res = await useManagerStore.getState().approveOrder(pendingOrder.id, 'Tester');
      expect(res.success).toBe(true);

      const updatedProduct = useManagerStore.getState().products.find((p) => p.id === firstItem.productId)!;
      expect(updatedProduct.stockQuantity).toBe(0);
      expect(updatedProduct.stockQuantity).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // 2. CANCELLATION RESTOCK INVARIANT & REASON VALIDATION
  // =========================================================================
  describe('2. Cancellation Restock Invariant & Reason Validation', () => {
    it('invariant 1: order cancelled directly from PENDING must NEVER restock or log ORDER_CANCELLED', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      const item = pendingOrder.items[0];

      const initialProductStock = store.products.find((p) => p.id === item.productId)!.stockQuantity;
      const initialLogs = store.stockLogs.length;

      const res = await store.cancelOrder(pendingOrder.id, 'Khách hàng thay đổi phương án thiết kế');
      expect(res.success).toBe(true);

      const stateAfter = useManagerStore.getState();
      const cancelledOrder = stateAfter.orders.find((o) => o.id === pendingOrder.id)!;
      expect(cancelledOrder.status).toBe('CANCELLED');

      // Crucial: stock remains unchanged
      const stockAfter = stateAfter.products.find((p) => p.id === item.productId)!.stockQuantity;
      expect(stockAfter).toBe(initialProductStock);

      // Crucial: no restock log emitted
      expect(stateAfter.stockLogs.length).toBe(initialLogs);
    });

    it('invariant 2: order cancelled from PACKING accurately refunds stock and logs ORDER_CANCELLED', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      const item = pendingOrder.items[0];

      // Make sure stock is sufficient for approval
      store.adjustStock(item.productId, item.quantity + 20, 'Đảm bảo đủ kho');
      const baselineStock = useManagerStore.getState().products.find((p) => p.id === item.productId)!.stockQuantity;

      // 1. Approve (PENDING -> PACKING)
      await store.approveOrder(pendingOrder.id);
      const stockAfterApproval = useManagerStore.getState().products.find((p) => p.id === item.productId)!.stockQuantity;
      expect(stockAfterApproval).toBe(baselineStock - item.quantity);

      // 2. Cancel from PACKING
      const cancelRes = await useManagerStore.getState().cancelOrder(pendingOrder.id, 'Dự án tạm ngừng cấp vốn giải ngân');
      expect(cancelRes.success).toBe(true);

      const stateAfter = useManagerStore.getState();
      const finalStock = stateAfter.products.find((p) => p.id === item.productId)!.stockQuantity;
      expect(finalStock).toBe(baselineStock); // Exactly refunded!

      // Log verified
      const cancelLog = stateAfter.stockLogs.find(
        (l) => l.referenceId === pendingOrder.id && l.type === 'ORDER_CANCELLED'
      );
      expect(cancelLog).toBeDefined();
      expect(cancelLog?.changeAmount).toBe(item.quantity);
      expect(cancelLog?.previousStock).toBe(stockAfterApproval);
      expect(cancelLog?.newStock).toBe(baselineStock);
    });

    it('invariant 3: order cancelled from SHIPPING refunds stock and decrements shipper workload', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      const item = pendingOrder.items[0];

      store.adjustStock(item.productId, item.quantity + 20, 'Đảm bảo đủ kho');
      const baselineStock = useManagerStore.getState().products.find((p) => p.id === item.productId)!.stockQuantity;

      // 1. Approve -> PACKING
      await store.approveOrder(pendingOrder.id);

      // 2. Assign shipper -> SHIPPING
      const shipper = store.shippers.find((s) => s.status !== 'offline' && s.activeOrders < 5)!;
      const initialShipperOrders = shipper.activeOrders;
      await store.assignShipper(pendingOrder.id, shipper.id);

      const stateShipping = useManagerStore.getState();
      const assignedShipper = stateShipping.shippers.find((s) => s.id === shipper.id)!;
      expect(assignedShipper.activeOrders).toBe(initialShipperOrders + 1);

      // 3. Cancel from SHIPPING
      const cancelRes = await useManagerStore.getState().cancelOrder(pendingOrder.id, 'Khách hàng từ chối nhận hàng tại công trình');
      expect(cancelRes.success).toBe(true);

      const stateAfter = useManagerStore.getState();
      const restoredStock = stateAfter.products.find((p) => p.id === item.productId)!.stockQuantity;
      expect(restoredStock).toBe(baselineStock); // Refunded!

      // Shipper workload must be decremented back
      const finalShipper = stateAfter.shippers.find((s) => s.id === shipper.id)!;
      expect(finalShipper.activeOrders).toBe(initialShipperOrders);
    });

    it('rejects cancellation reason shorter than 5 characters or whitespace padding', async () => {
      const store = useManagerStore.getState();
      const order = store.orders.find((o) => o.status === 'PENDING')!;

      // Edge cases
      expect((await store.cancelOrder(order.id, '')).success).toBe(false);
      expect((await store.cancelOrder(order.id, '   ')).success).toBe(false);
      expect((await store.cancelOrder(order.id, 'Huy')).success).toBe(false);
      expect((await store.cancelOrder(order.id, '1234')).success).toBe(false);
      expect((await store.cancelOrder(order.id, '  1234  ')).success).toBe(false); // trimmed length 4

      // Exactly 5 chars -> allowed
      expect(validateCancellation('12345').valid).toBe(true);
      expect(validateCancellation('ABCDE').valid).toBe(true);
    });
  });

  // =========================================================================
  // 3. SHIPPER ASSIGNMENT WORKLOAD & AVAILABILITY
  // =========================================================================
  describe('3. Shipper Assignment Workload & Availability Guards', () => {
    it('rejects shipper assignment when activeOrders >= 5', async () => {
      expect(canAssignShipper({ activeOrders: 5 })).toBe(false);
      expect(canAssignShipper({ activeOrders: 6 })).toBe(false);

      const check5 = checkShipperAssignability({ activeOrders: 5 });
      expect(check5.allowed).toBe(false);
      expect(check5.reason).toContain('tối đa 5 đơn');

      // Test via store
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      await store.approveOrder(pendingOrder.id);

      const busyShipper = store.shippers[0];
      busyShipper.activeOrders = 5;

      const assignRes = await store.assignShipper(pendingOrder.id, busyShipper.id);
      expect(assignRes.success).toBe(false);
      expect(assignRes.error).toContain('5 đơn');
    });

    it('rejects shipper assignment when shipper status is offline (regardless of activeOrders)', async () => {
      expect(canAssignShipper({ activeOrders: 0, status: 'offline' })).toBe(false);
      expect(canAssignShipper({ activeOrders: 0, status: 'Offline' })).toBe(false);

      const checkOffline = checkShipperAssignability({ activeOrders: 0, status: 'offline' });
      expect(checkOffline.allowed).toBe(false);
      expect(checkOffline.reason).toContain('ngoại tuyến');

      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      await store.approveOrder(pendingOrder.id);

      // ship-05 is seeded with activeOrders: 0, status: 'offline'
      const offlineShipper = store.shippers.find((s) => s.id === 'ship-05')!;
      expect(offlineShipper.status).toBe('offline');
      expect(offlineShipper.activeOrders).toBe(0);

      const res = await store.assignShipper(pendingOrder.id, offlineShipper.id);
      expect(res.success).toBe(false);
      expect(res.error).toContain('ngoại tuyến');
    });

    it('marks shipper status as busy when activeOrders reaches exactly 5', async () => {
      const store = useManagerStore.getState();
      const shipper = store.shippers.find((s) => s.status !== 'offline')!;

      // Set activeOrders to 4
      useManagerStore.setState((prev) => ({
        shippers: prev.shippers.map((s) => (s.id === shipper.id ? { ...s, activeOrders: 4, status: 'available' } : s)),
      }));

      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      await store.approveOrder(pendingOrder.id);

      const assignRes = await useManagerStore.getState().assignShipper(pendingOrder.id, shipper.id);
      expect(assignRes.success).toBe(true);

      const updatedShipper = useManagerStore.getState().shippers.find((s) => s.id === shipper.id)!;
      expect(updatedShipper.activeOrders).toBe(5);
      expect(updatedShipper.status).toBe('busy');
    });

    it('handles shipper reassignment: decrements old shipper and increments new shipper', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      await store.approveOrder(pendingOrder.id);

      // Shipper 1 (ship-02, activeOrders=2)
      // Shipper 2 (ship-03, activeOrders=1)
      const s1 = store.shippers.find((s) => s.id === 'ship-02')!;
      const s2 = store.shippers.find((s) => s.id === 'ship-03')!;

      // Initial assignment to s1
      await store.assignShipper(pendingOrder.id, s1.id);
      expect(useManagerStore.getState().shippers.find((s) => s.id === s1.id)!.activeOrders).toBe(s1.activeOrders + 1);

      // Reassignment to s2
      const reassignRes = await useManagerStore.getState().assignShipper(pendingOrder.id, s2.id);
      expect(reassignRes.success).toBe(true);

      const stateAfter = useManagerStore.getState();
      const s1After = stateAfter.shippers.find((s) => s.id === s1.id)!;
      const s2After = stateAfter.shippers.find((s) => s.id === s2.id)!;
      const orderAfter = stateAfter.orders.find((o) => o.id === pendingOrder.id)!;

      // s1 workload reverted back to original
      expect(s1After.activeOrders).toBe(s1.activeOrders);
      // s2 workload incremented
      expect(s2After.activeOrders).toBe(s2.activeOrders + 1);
      // Order now assigned to s2
      expect(orderAfter.shipperId).toBe(s2.id);
    });

    it('deliverOrder completes the lifecycle: decrements shipper workload and unmarks busy', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      await store.approveOrder(pendingOrder.id);

      const shipper = store.shippers.find((s) => s.id === 'ship-02')!;
      // Artificially set shipper to 4 active orders
      useManagerStore.setState((prev) => ({
        shippers: prev.shippers.map((s) => (s.id === shipper.id ? { ...s, activeOrders: 4, status: 'available' } : s)),
      }));

      // Assign -> reaches 5 (busy)
      await store.assignShipper(pendingOrder.id, shipper.id);
      expect(useManagerStore.getState().shippers.find((s) => s.id === shipper.id)!.status).toBe('busy');

      // Deliver order
      const deliverRes = await useManagerStore.getState().deliverOrder(pendingOrder.id, 'Shipper Toan');
      expect(deliverRes.success).toBe(true);

      const stateDelivered = useManagerStore.getState();
      const finalShipper = stateDelivered.shippers.find((s) => s.id === shipper.id)!;
      const finalOrder = stateDelivered.orders.find((o) => o.id === pendingOrder.id)!;

      expect(finalOrder.status).toBe('DELIVERED');
      expect(finalOrder.deliveredAt).toBeDefined();
      expect(finalShipper.activeOrders).toBe(4);
      expect(finalShipper.status).toBe('available'); // un-busied!
    });
  });

  // =========================================================================
  // 4. 2H COUNTDOWN & DEADLINE LOGIC
  // =========================================================================
  describe('4. 2H Countdown & Deadline Rules', () => {
    const baseCreatedAt = '2026-10-08T08:00:00.000Z';

    it('accurately identifies non-overdue 2H orders and positive remaining minutes', () => {
      const order: Partial<Order> = {
        is2H: true,
        createdAt: baseCreatedAt,
      };

      // Exactly 30 minutes after creation -> 90 minutes remaining
      const now1 = new Date('2026-10-08T08:30:00.000Z');
      expect(isOrderOverdue2H(order as any, now1)).toBe(false);
      expect(getRemaining2HMinutes(order as any, now1)).toBe(90);
      expect(formatCountdownMinutes(90)).toBe('Còn 1h 30p');
    });

    it('handles exact boundary condition at deadline (0 minutes)', () => {
      const order: Partial<Order> = {
        is2H: true,
        createdAt: baseCreatedAt,
      };

      // Exactly at deadline (10:00:00)
      const exactDeadline = new Date('2026-10-08T10:00:00.000Z');
      expect(isOrderOverdue2H(order as any, exactDeadline)).toBe(false);
      expect(getRemaining2HMinutes(order as any, exactDeadline)).toBe(0);
      expect(formatCountdownMinutes(0)).toBe('Còn 0p');

      // 1 millisecond past deadline -> overdue
      const justPast = new Date('2026-10-08T10:00:00.001Z');
      expect(isOrderOverdue2H(order as any, justPast)).toBe(true);
      expect(getRemaining2HMinutes(order as any, justPast)).toBe(-1);
      expect(formatCountdownMinutes(-1)).toBe('Quá hạn 1p');
    });

    it('accurately identifies overdue 2H orders and negative remaining minutes', () => {
      const order: Partial<Order> = {
        is2H: true,
        createdAt: baseCreatedAt,
      };

      // 2 hours and 15 minutes after creation -> 15 minutes overdue
      const nowOverdue = new Date('2026-10-08T10:15:00.000Z');
      expect(isOrderOverdue2H(order as any, nowOverdue)).toBe(true);
      expect(getRemaining2HMinutes(order as any, nowOverdue)).toBe(-15);
      expect(formatCountdownMinutes(-15)).toBe('Quá hạn 15p');

      // 3 hours and 30 minutes after creation -> 1h 30p overdue (-90 mins)
      const nowLongOverdue = new Date('2026-10-08T11:30:00.000Z');
      expect(isOrderOverdue2H(order as any, nowLongOverdue)).toBe(true);
      expect(getRemaining2HMinutes(order as any, nowLongOverdue)).toBe(-90);
      expect(formatCountdownMinutes(-90)).toBe('Quá hạn 1h 30p');
    });

    it('returns false and null for non-2H standard orders', () => {
      const standardOrder: Partial<Order> = {
        is2H: false,
        createdAt: baseCreatedAt,
      };

      const now = new Date('2026-10-08T15:00:00.000Z');
      expect(isOrderOverdue2H(standardOrder as any, now)).toBe(false);
      expect(getRemaining2HMinutes(standardOrder as any, now)).toBeNull();
      expect(formatCountdownMinutes(null)).toBe('');
    });
  });

  // =========================================================================
  // 5. AGGREGATES & REVENUE RECOGNITION
  // =========================================================================
  describe('5. Aggregates & Revenue Recognition', () => {
    it('recognizes revenue exclusively from DELIVERED orders (0 leakage from PENDING, PACKING, SHIPPING, CANCELLED)', () => {
      const testOrders: Order[] = [
        {
          id: 'o-del-1',
          code: 'DEL-1',
          orderNumber: 'DEL-1',
          customerId: 'c1',
          customerName: 'A',
          customerPhone: '090',
          shippingAddress: 'HCM',
          items: [],
          totalAmount: 10000000,
          finalAmount: 10000000,
          status: 'DELIVERED',
          version: 1,
          createdAt: '2026-10-01T00:00:00Z',
          statusHistory: [],
          is2H: false,
        },
        {
          id: 'o-pen-1',
          code: 'PEN-1',
          orderNumber: 'PEN-1',
          customerId: 'c2',
          customerName: 'B',
          customerPhone: '091',
          shippingAddress: 'HN',
          items: [],
          totalAmount: 50000000,
          finalAmount: 50000000,
          status: 'PENDING',
          version: 1,
          createdAt: '2026-10-01T00:00:00Z',
          statusHistory: [],
          is2H: false,
        },
        {
          id: 'o-pack-1',
          code: 'PAC-1',
          orderNumber: 'PAC-1',
          customerId: 'c3',
          customerName: 'C',
          customerPhone: '092',
          shippingAddress: 'DN',
          items: [],
          totalAmount: 30000000,
          finalAmount: 30000000,
          status: 'PACKING',
          version: 1,
          createdAt: '2026-10-01T00:00:00Z',
          statusHistory: [],
          is2H: false,
        },
        {
          id: 'o-ship-1',
          code: 'SHI-1',
          orderNumber: 'SHI-1',
          customerId: 'c4',
          customerName: 'D',
          customerPhone: '093',
          shippingAddress: 'CT',
          items: [],
          totalAmount: 25000000,
          finalAmount: 25000000,
          status: 'SHIPPING',
          version: 1,
          createdAt: '2026-10-01T00:00:00Z',
          statusHistory: [],
          is2H: false,
        },
        {
          id: 'o-can-1',
          code: 'CAN-1',
          orderNumber: 'CAN-1',
          customerId: 'c5',
          customerName: 'E',
          customerPhone: '094',
          shippingAddress: 'BD',
          items: [],
          totalAmount: 90000000,
          finalAmount: 90000000,
          status: 'CANCELLED',
          version: 1,
          createdAt: '2026-10-01T00:00:00Z',
          statusHistory: [],
          is2H: false,
        },
      ];

      // Delivered revenue must strictly equal 10,000,000
      const revenue = calculateDeliveredRevenue(testOrders);
      expect(revenue).toBe(10000000);

      // Pending count must strictly equal 1
      expect(countPendingOrders(testOrders)).toBe(1);
    });

    it('zero-fill generates complete consecutive monthly series (exactly 12 months)', () => {
      const emptyBuckets = calculateTimeRevenueBuckets([], 'month', 2026);
      expect(emptyBuckets).toHaveLength(12);

      const expectedLabels = [
        '01/2026', '02/2026', '03/2026', '04/2026', '05/2026', '06/2026',
        '07/2026', '08/2026', '09/2026', '10/2026', '11/2026', '12/2026',
      ];

      expect(emptyBuckets.map((b) => b.label)).toEqual(expectedLabels);
      expect(emptyBuckets.every((b) => b.revenue === 0 && b.orderCount === 0)).toBe(true);
    });

    it('zero-fill generates unbroken consecutive daily series across custom range', () => {
      const startDate = new Date(2026, 9, 1); // 01/10/2026
      const endDate = new Date(2026, 9, 10); // 10/10/2026

      const dailyBuckets = calculateTimeRevenueBuckets([], 'day', { startDate, endDate });

      // Exactly 10 days
      expect(dailyBuckets).toHaveLength(10);
      expect(dailyBuckets[0].label).toBe('01/10/2026');
      expect(dailyBuckets[9].label).toBe('10/10/2026');

      // All zero filled
      for (const bucket of dailyBuckets) {
        expect(bucket.revenue).toBe(0);
        expect(bucket.orderCount).toBe(0);
      }
    });
  });
});
