import { describe, it, expect, beforeEach } from 'vitest';
import { useManagerStore } from '../src/store/useManagerStore';
import { CORE_BRANDS } from '../src/types/manager';

describe('useManagerStore - State Management & Business Operations', () => {
  beforeEach(() => {
    // Reset to clean deterministic seed data before each test
    useManagerStore.getState().resetToSeedData();
  });

  describe('1. Initial State & Seed Data Loading', () => {
    it('loads 32 products, exactly 8 per brand across 4 core brands', () => {
      const { products } = useManagerStore.getState();
      expect(products).toHaveLength(32);

      for (const brand of CORE_BRANDS) {
        const brandProducts = products.filter((p) => p.brand === brand);
        expect(brandProducts).toHaveLength(8);
      }
    });

    it('loads 40 retail customers with valid contact details and tiers', () => {
      const { customers } = useManagerStore.getState();
      expect(customers).toHaveLength(40);

      const validTiers = ['Retail', 'Bronze', 'Silver', 'Gold'];
      for (const customer of customers) {
        expect(customer.id).toBeTruthy();
        expect(customer.phone).toBeTruthy();
        expect(validTiers).toContain(customer.tier);
      }
    });

    it('loads 5 shippers with initial workload < 5', () => {
      const { shippers } = useManagerStore.getState();
      expect(shippers).toHaveLength(5);

      for (const shipper of shippers) {
        expect(shipper.activeOrders).toBeLessThanOrEqual(5);
        expect(['available', 'busy', 'offline']).toContain(shipper.status);
      }
    });

    it('loads orders spanning seed dataset and initializes stock logs', () => {
      const { orders, stockLogs } = useManagerStore.getState();
      expect(orders.length).toBeGreaterThan(100);
      expect(stockLogs.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('2. Atomic Order Approval and Stock Deduction', () => {
    it('approves a PENDING order, transitions to PACKING, and deducts stock atomically', () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING');
      expect(pendingOrder).toBeDefined();

      if (!pendingOrder) return;

      const firstItem = pendingOrder.items[0];
      const productBefore = store.products.find((p) => p.id === firstItem.productId);
      expect(productBefore).toBeDefined();
      const initialStock = productBefore!.stockQuantity;

      // Ensure stock is sufficient
      if (initialStock < firstItem.quantity) {
        useManagerStore.getState().adjustStock(firstItem.productId, 500, 'Tăng tồn để test');
      }

      const preApprovalStock = useManagerStore.getState().products.find(
        (p) => p.id === firstItem.productId
      )!.stockQuantity;

      const result = useManagerStore.getState().approveOrder(pendingOrder.id, 'Manager Hải Đăng');
      expect(result.success).toBe(true);

      const updatedStore = useManagerStore.getState();
      const approvedOrder = updatedStore.orders.find((o) => o.id === pendingOrder.id);
      expect(approvedOrder?.status).toBe('PACKING');
      expect(approvedOrder?.approvedAt).toBeDefined();

      // Check status history recorded
      const latestHistory = approvedOrder?.statusHistory[approvedOrder.statusHistory.length - 1];
      expect(latestHistory?.status).toBe('PACKING');
      expect(latestHistory?.changedBy).toBe('Manager Hải Đăng');

      // Check stock deduction
      const productAfter = updatedStore.products.find((p) => p.id === firstItem.productId);
      expect(productAfter?.stockQuantity).toBe(preApprovalStock - firstItem.quantity);

      // Check stock log was emitted
      const approvalLog = updatedStore.stockLogs.find(
        (l) => l.referenceId === pendingOrder.id && l.type === 'ORDER_APPROVED'
      );
      expect(approvalLog).toBeDefined();
      expect(approvalLog?.changeAmount).toBe(-firstItem.quantity);
      expect(approvalLog?.newStock).toBe(productAfter?.stockQuantity);
    });
  });

  describe('3. Blocking Order Approval When Stock Is Insufficient', () => {
    it('blocks order approval when any product in the order is out of stock', () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING');
      expect(pendingOrder).toBeDefined();

      if (!pendingOrder) return;

      const firstItem = pendingOrder.items[0];

      // Force product stock to 0
      useManagerStore.getState().adjustStock(firstItem.productId, 0, 'Giảm về 0 để test hết hàng');

      const result = useManagerStore.getState().approveOrder(pendingOrder.id, 'Manager Hải Đăng');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Không đủ tồn kho');

      // Verify order status unchanged
      const freshOrder = useManagerStore.getState().orders.find((o) => o.id === pendingOrder.id);
      expect(freshOrder?.status).toBe('PENDING');

      // Verify stock did not drop below zero
      const prod = useManagerStore.getState().products.find((p) => p.id === firstItem.productId);
      expect(prod?.stockQuantity).toBe(0);
    });
  });

  describe('4. Shipper Assignment Workload Enforcement (< 5)', () => {
    it('assigns shipper when activeOrders < 5 and transitions order to SHIPPING', () => {
      // Find or approve an order to PACKING
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      useManagerStore.getState().approveOrder(pendingOrder.id);

      const availableShipper = store.shippers.find(
        (s) => s.status !== 'offline' && s.activeOrders < 5
      )!;
      const initialWorkload = availableShipper.activeOrders;

      const result = useManagerStore.getState().assignShipper(
        pendingOrder.id,
        availableShipper.id,
        'Điều phối viên'
      );

      expect(result.success).toBe(true);

      const updatedOrder = useManagerStore.getState().orders.find((o) => o.id === pendingOrder.id);
      expect(updatedOrder?.status).toBe('SHIPPING');
      expect(updatedOrder?.shipperId).toBe(availableShipper.id);

      const updatedShipper = useManagerStore.getState().shippers.find(
        (s) => s.id === availableShipper.id
      );
      expect(updatedShipper?.activeOrders).toBe(initialWorkload + 1);
    });

    it('rejects shipper assignment when shipper has already reached max 5 active orders', () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      useManagerStore.getState().approveOrder(pendingOrder.id);

      // Manually set a shipper to 5 active orders (busy)
      const targetShipper = store.shippers[0];
      targetShipper.activeOrders = 5;
      targetShipper.status = 'busy';

      const result = useManagerStore.getState().assignShipper(pendingOrder.id, targetShipper.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain('5 đơn');

      // Order should remain PACKING
      const freshOrder = useManagerStore.getState().orders.find((o) => o.id === pendingOrder.id);
      expect(freshOrder?.status).toBe('PACKING');
    });

    it('rejects shipper assignment if shipper is offline', () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      useManagerStore.getState().approveOrder(pendingOrder.id);

      const offlineShipper = store.shippers.find((s) => s.status === 'offline') || {
        ...store.shippers[1],
        status: 'offline' as const,
      };

      // Ensure shipper in store is offline
      useManagerStore.setState((prev) => ({
        shippers: prev.shippers.map((s) =>
          s.id === offlineShipper.id ? { ...s, status: 'offline' as const } : s
        ),
      }));

      const result = useManagerStore.getState().assignShipper(pendingOrder.id, offlineShipper.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ngoại tuyến');
    });
  });

  describe('5. Order Cancellation with Restock (and no restock when cancelled from PENDING)', () => {
    it('does NOT restock when order is cancelled directly from PENDING', () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      const firstItem = pendingOrder.items[0];
      const stockBefore = store.products.find((p) => p.id === firstItem.productId)!.stockQuantity;
      const initialLogsCount = store.stockLogs.length;

      const result = useManagerStore.getState().cancelOrder(
        pendingOrder.id,
        'Khách hàng thay đổi kế hoạch thi công công trình'
      );

      expect(result.success).toBe(true);

      const updatedStore = useManagerStore.getState();
      const cancelledOrder = updatedStore.orders.find((o) => o.id === pendingOrder.id);
      expect(cancelledOrder?.status).toBe('CANCELLED');
      expect(cancelledOrder?.cancellationReason).toBe(
        'Khách hàng thay đổi kế hoạch thi công công trình'
      );

      // Invariant: Stock must remain identical (was not deducted at pending)
      const stockAfter = updatedStore.products.find(
        (p) => p.id === firstItem.productId
      )!.stockQuantity;
      expect(stockAfter).toBe(stockBefore);

      // No new stock logs emitted
      expect(updatedStore.stockLogs.length).toBe(initialLogsCount);
    });

    it('restocks items when order is cancelled from PACKING', () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      const firstItem = pendingOrder.items[0];
      const initialStock = store.products.find((p) => p.id === firstItem.productId)!.stockQuantity;

      // 1. Approve order -> stock deducted
      useManagerStore.getState().approveOrder(pendingOrder.id);
      const stockAfterApproval = useManagerStore.getState().products.find(
        (p) => p.id === firstItem.productId
      )!.stockQuantity;
      expect(stockAfterApproval).toBe(initialStock - firstItem.quantity);

      // 2. Cancel order from PACKING -> stock must be refunded
      const cancelResult = useManagerStore.getState().cancelOrder(
        pendingOrder.id,
        'Công trình tạm dừng thi công đột xuất'
      );
      expect(cancelResult.success).toBe(true);

      const updatedStore = useManagerStore.getState();
      const restoredStock = updatedStore.products.find(
        (p) => p.id === firstItem.productId
      )!.stockQuantity;
      expect(restoredStock).toBe(initialStock);

      // Check ORDER_CANCELLED log was emitted
      const cancelLog = updatedStore.stockLogs.find(
        (l) => l.referenceId === pendingOrder.id && l.type === 'ORDER_CANCELLED'
      );
      expect(cancelLog).toBeDefined();
      expect(cancelLog?.changeAmount).toBe(firstItem.quantity);
    });

    it('rejects cancellation when reason is shorter than 5 characters', () => {
      const store = useManagerStore.getState();
      const order = store.orders[0];

      const result = useManagerStore.getState().cancelOrder(order.id, 'Huy ');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ít nhất 5 ký tự');
    });
  });

  describe('6. Customer Metrics Computation via Selector', () => {
    it('computes totalSpent, orderCount, and deliveredOrderCount accurately', () => {
      const store = useManagerStore.getState();
      const targetCustomer = store.customers[0];

      const metrics = store.getCustomerMetrics(targetCustomer.id);

      expect(metrics.customerId).toBe(targetCustomer.id);
      expect(metrics.orderCount).toBeGreaterThanOrEqual(0);
      expect(metrics.deliveredOrderCount).toBeLessThanOrEqual(metrics.orderCount);

      // Verify calculation directly against customer orders
      const customerOrders = store.orders.filter((o) => o.customerId === targetCustomer.id);
      const deliveredOrders = customerOrders.filter((o) => o.status === 'DELIVERED');
      const expectedSpent = deliveredOrders.reduce(
        (sum, o) => sum + (o.finalAmount ?? o.totalAmount ?? 0),
        0
      );

      expect(metrics.orderCount).toBe(customerOrders.length);
      expect(metrics.deliveredOrderCount).toBe(deliveredOrders.length);
      expect(metrics.totalSpent).toBe(expectedSpent);
    });
  });

  describe('7. Pure Selectors & Helper Computations', () => {
    it('calculates integer discounted price correctly via selector', () => {
      const store = useManagerStore.getState();
      const sampleProduct = store.products[0]; // e.g. basePrice 450,000, 22% discount
      const discounted = store.getDiscountedPrice(sampleProduct);

      const expected = Math.round(
        sampleProduct.basePrice * (1 - sampleProduct.discountPercent / 100)
      );
      expect(discounted).toBe(expected);
    });

    it('returns pending orders via selector', () => {
      const store = useManagerStore.getState();
      const pendingList = store.getPendingOrders();

      expect(pendingList.every((o) => o.status === 'PENDING')).toBe(true);
    });

    it('returns brand stats covering all 4 core brands', () => {
      const store = useManagerStore.getState();
      const brandStats = store.getBrandStats();

      for (const brand of CORE_BRANDS) {
        expect(brandStats[brand]).toBeDefined();
        expect(brandStats[brand].revenue).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
