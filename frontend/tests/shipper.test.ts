import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useManagerStore } from '../src/store/useManagerStore';
import { api } from '../src/lib/api';
import {
  canActorTransition,
  getShipperWorkload,
  canShipperGoOffline,
  calculateShipper2HOnTimeRate,
  Actor,
} from '../src/lib/orderRules';
import {
  normalizePhone,
  getTelUrl,
  getGoogleMapsUrl,
  calculateContrastRatio,
} from '../src/lib/shipperHelpers';
import { hasPermission, can, canAccessShipperPortal } from '../src/lib/permissions';
import { Order, OrderStatus } from '../src/types/manager';

describe('Role SHIPPER - Comprehensive Functional & Business Logic Suite', () => {
  beforeEach(() => {
    // Reset to clean deterministic seed data
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

  describe('1. Actor-based Status Transitions & Permissions (canActorTransition)', () => {
    it('prevents SHIPPER from approving PENDING orders', () => {
      const order = useManagerStore.getState().orders.find((o) => o.status === 'PENDING')!;
      expect(order).toBeDefined();

      const shipperActor: Actor = {
        role: 'SHIPPER',
        shipperId: 'ship-02',
        name: 'Trần Quốc Toản',
      };

      const result = canActorTransition(order, 'PACKING', shipperActor);
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('UNAUTHORIZED_ROLE');
      expect(result.error).toContain('không có quyền duyệt đơn');
    });

    it('prevents SHIPPER from modifying orders belonging to another shipper', () => {
      const otherOrder = useManagerStore.getState().orders.find(
        (o) => o.shipperId && o.shipperId !== 'ship-02' && o.status === 'SHIPPING'
      ) || {
        ...useManagerStore.getState().orders[0],
        id: 'ord-foreign-01',
        shipperId: 'ship-03',
        status: 'SHIPPING' as OrderStatus,
      };

      const currentShipperActor: Actor = {
        role: 'SHIPPER',
        shipperId: 'ship-02',
        name: 'Trần Quốc Toản',
      };

      const result = canActorTransition(otherOrder, 'DELIVERED', currentShipperActor, {
        pod: {
          receiverName: 'Anh Hùng',
          photos: [{ name: 'pod.jpg', thumbnail: 'data:image/jpeg;base64,abc' }],
        },
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('NOT_ASSIGNED_SHIPPER');
      expect(result.error).toContain('không thuộc quyền phụ trách');
    });

    it('enforces POD requirements when transitioning SHIPPING -> DELIVERED', () => {
      const shippingOrder = useManagerStore.getState().orders.find(
        (o) => o.shipperId === 'ship-02' && o.status === 'SHIPPING'
      )!;
      expect(shippingOrder).toBeDefined();

      const shipperActor: Actor = {
        role: 'SHIPPER',
        shipperId: 'ship-02',
        name: 'Trần Quốc Toản',
      };

      // Missing receiver name
      const missingName = canActorTransition(shippingOrder, 'DELIVERED', shipperActor, {
        pod: {
          receiverName: '',
          photos: [{ name: 'pod.jpg', thumbnail: 'data:image/jpeg;base64,abc' }],
        },
      });
      expect(missingName.allowed).toBe(false);
      expect(missingName.errorCode).toBe('POD_REQUIRED');
      expect(missingName.error).toContain('người ký nhận');

      // Receiver name too short (< 2 chars)
      const shortName = canActorTransition(shippingOrder, 'DELIVERED', shipperActor, {
        pod: {
          receiverName: 'A',
          photos: [{ name: 'pod.jpg', thumbnail: 'data:image/jpeg;base64,abc' }],
        },
      });
      expect(shortName.allowed).toBe(false);
      expect(shortName.errorCode).toBe('POD_REQUIRED');

      // Missing photos
      const noPhotos = canActorTransition(shippingOrder, 'DELIVERED', shipperActor, {
        pod: {
          receiverName: 'Nguyễn Văn A',
          photos: [],
        },
      });
      expect(noPhotos.allowed).toBe(false);
      expect(noPhotos.errorCode).toBe('POD_REQUIRED');
      expect(noPhotos.error).toContain('ảnh bằng chứng');
    });

    it('enforces COD collection confirmation for COD orders before delivery', () => {
      const codShippingOrder = useManagerStore.getState().orders.find(
        (o) => o.shipperId === 'ship-02' && o.status === 'SHIPPING' && o.paymentMethod === 'COD'
      )!;
      expect(codShippingOrder).toBeDefined();

      const shipperActor: Actor = {
        role: 'SHIPPER',
        shipperId: 'ship-02',
        name: 'Trần Quốc Toản',
      };

      // COD order without codConfirmed flag
      const result = canActorTransition(codShippingOrder, 'DELIVERED', shipperActor, {
        pod: {
          receiverName: 'Anh Hùng',
          photos: [{ name: 'pod.jpg', thumbnail: 'data:image/jpeg;base64,abc' }],
        },
        codConfirmed: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('COD_CONFIRMATION_REQUIRED');
      expect(result.error).toContain('thu đủ');
    });

    it('requires at least 5 characters for incident/cancellation reason', () => {
      const shippingOrder = useManagerStore.getState().orders.find(
        (o) => o.shipperId === 'ship-02' && o.status === 'SHIPPING'
      )!;

      const shipperActor: Actor = {
        role: 'SHIPPER',
        shipperId: 'ship-02',
        name: 'Trần Quốc Toản',
      };

      const result = canActorTransition(shippingOrder, 'CANCELLED', shipperActor, {
        cancelReason: 'Huy',
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('INVALID_CANCEL_REASON');
      expect(result.error).toContain('ít nhất 5 ký tự');
    });
  });

  describe('2. Workload & Shift Management (canShipperGoOffline & updateShipperShift)', () => {
    it('calculates active workload accurately (PACKING + SHIPPING orders)', () => {
      const { orders } = useManagerStore.getState();
      const workload = getShipperWorkload(orders, 'ship-02');

      const expectedCount = orders.filter(
        (o) => o.shipperId === 'ship-02' && (o.status === 'PACKING' || o.status === 'SHIPPING')
      ).length;

      expect(workload).toBe(expectedCount);
      expect(workload).toBeLessThanOrEqual(5);
    });

    it('blocks shipper from going offline when active orders are still assigned', () => {
      const { orders } = useManagerStore.getState();
      const check = canShipperGoOffline(orders, 'ship-02');

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('đang phụ trách');
      expect(check.activeOrdersCount).toBeGreaterThan(0);

      const updateResult = useManagerStore.getState().updateShipperShift('ship-02', 'offline');
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('đang phụ trách');

      const shipper = useManagerStore.getState().shippers.find((s) => s.id === 'ship-02');
      expect(shipper?.status).not.toBe('offline');
    });

    it('allows shipper to go offline when all orders are completed or none assigned', () => {
      const emptyShipperId = 'ship-empty-01';
      useManagerStore.setState((prev) => ({
        shippers: [
          ...prev.shippers,
          {
            id: emptyShipperId,
            name: 'Tài xế Rảnh Rỗi',
            phone: '0988776655',
            vehicle: 'Xe ba gác chở hàng',
            activeOrders: 0,
            status: 'available' as const,
            shiftStatus: 'available' as const,
          },
        ],
      }));

      const check = canShipperGoOffline(useManagerStore.getState().orders, emptyShipperId);
      expect(check.allowed).toBe(true);
      expect(check.activeOrdersCount).toBe(0);

      const res = useManagerStore.getState().updateShipperShift(emptyShipperId, 'offline');
      expect(res.success).toBe(true);

      const updated = useManagerStore.getState().shippers.find((s) => s.id === emptyShipperId);
      expect(updated?.status).toBe('offline');
      expect(updated?.shiftStatus).toBe('offline');
    });
  });

  describe('3. 2H SLA & On-Time Delivery Rate Metrics', () => {
    it('calculates on-time delivery rate correctly for 2H delivered orders', () => {
      const { orders } = useManagerStore.getState();
      const now = new Date('2026-10-08T10:00:00.000Z');

      const stats = calculateShipper2HOnTimeRate(orders, 'ship-02', 'today', now);
      expect(stats.total2H).toBeGreaterThan(0);
      expect(typeof stats.ratePercent).toBe('number');
      expect(stats.rateFormatted).toContain('%');
    });

    it('returns "—" when denominator is 0 (no delivered 2H orders in timeframe)', () => {
      const nonExistentShipperId = 'ship-none-00';
      const stats = calculateShipper2HOnTimeRate(
        useManagerStore.getState().orders,
        nonExistentShipperId,
        'today'
      );

      expect(stats.total2H).toBe(0);
      expect(stats.onTime2H).toBe(0);
      expect(stats.ratePercent).toBeNull();
      expect(stats.rateFormatted).toBe('—');
    });
  });

  describe('4. COD Ledger Tracking & Idempotent Settlement (settleCod)', () => {
    it('accurately calculates unsettled COD amount from delivered orders', () => {
      const store = useManagerStore.getState();
      const unsettled = store.getShipperUnsettledCod('ship-02');

      const manualSum = store.orders
        .filter(
          (o) =>
            o.shipperId === 'ship-02' &&
            o.status === 'DELIVERED' &&
            o.cod &&
            !o.cod.settlementId
        )
        .reduce((sum, o) => sum + (o.cod?.amount ?? 0), 0);

      expect(unsettled.totalAmount).toBe(manualSum);
      expect(unsettled.count).toBeGreaterThan(0);
    });

    it('settles COD atomically and is idempotent against double settlement', () => {
      const store = useManagerStore.getState();
      const beforeUnsettled = store.getShipperUnsettledCod('ship-02');
      expect(beforeUnsettled.count).toBeGreaterThan(0);
      const totalToSettle = beforeUnsettled.totalAmount;

      // 1. Settle COD
      const firstResult = store.settleCod('ship-02');
      expect(firstResult.success).toBe(true);
      expect(firstResult.settlement).toBeDefined();
      expect(firstResult.settlement?.totalAmount).toBe(totalToSettle);
      expect(firstResult.settlement?.orderIds.length).toBe(beforeUnsettled.count);

      // Verify orders in store are stamped with settlementId
      const afterStore = useManagerStore.getState();
      const afterUnsettled = afterStore.getShipperUnsettledCod('ship-02');
      expect(afterUnsettled.totalAmount).toBe(0);
      expect(afterUnsettled.count).toBe(0);

      // Verify settlement recorded in codSettlements
      const recorded = afterStore.codSettlements.find(
        (s) => s.id === firstResult.settlement?.id
      );
      expect(recorded).toBeDefined();

      // 2. Idempotency Check: Calling settleCod a second time must safely fail without duplicating records
      const initialSettlementsCount = afterStore.codSettlements.length;
      const secondResult = afterStore.settleCod('ship-02');
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('Không có khoản COD nào');

      // Settlements list count unchanged
      expect(useManagerStore.getState().codSettlements.length).toBe(initialSettlementsCount);
    });
  });

  describe('5. Delivery Incident Reporting & Automatic Stock Restitution', () => {
    it('restocks inventory and logs incident when shipper reports delivery failure', async () => {
      const store = useManagerStore.getState();
      const shippingOrder = store.orders.find(
        (o) => o.shipperId === 'ship-02' && o.status === 'SHIPPING'
      )!;
      expect(shippingOrder).toBeDefined();

      const item = shippingOrder.items[0];
      const initialStock = store.products.find((p) => p.id === item.productId)!.stockQuantity;

      const actor: Actor = {
        role: 'SHIPPER',
        shipperId: 'ship-02',
        name: 'Trần Quốc Toản',
      };

      const result = await store.updateOrderStatusWithActor(
        shippingOrder.id,
        'CANCELLED',
        actor,
        {
          cancelReason: 'Hẻm cấm tải, công trình không có xe tăng bo ra lấy',
          incidentCategory: 'Hẻm cấm tải',
        }
      );

      expect(result.success).toBe(true);

      const updatedStore = useManagerStore.getState();
      const cancelledOrder = updatedStore.orders.find((o) => o.id === shippingOrder.id)!;
      expect(cancelledOrder.status).toBe('CANCELLED');
      expect(cancelledOrder.incident?.category).toBe('Hẻm cấm tải');
      expect(cancelledOrder.incident?.shipperId).toBe('ship-02');

      // Stock restitution: Stock must be refunded
      const refundedStock = updatedStore.products.find((p) => p.id === item.productId)!.stockQuantity;
      expect(refundedStock).toBe(initialStock + item.quantity);

      // StockLog emitted for ORDER_CANCELLED
      const cancelLog = updatedStore.stockLogs.find(
        (l) => l.referenceId === shippingOrder.id && l.type === 'ORDER_CANCELLED'
      );
      expect(cancelLog).toBeDefined();
    });
  });

  describe('6. Helper Utilities (Phone, Maps, and WCAG Contrast Ratio)', () => {
    it('normalizes various phone number formats into clean dialable strings', () => {
      expect(normalizePhone('0912 345 678')).toBe('0912345678');
      expect(normalizePhone('+84 912-345-678')).toBe('+84912345678');
      expect(normalizePhone(' (028) 38.123.456 ')).toBe('02838123456');
      expect(normalizePhone('')).toBe('');
      expect(normalizePhone(null)).toBe('');
    });

    it('generates correct tel: links for 1-tap dialer', () => {
      expect(getTelUrl({ customerPhone: '0912345678' })).toBe('tel:0912345678');
      expect(
        getTelUrl({
          siteContact: { phone: '0987654321' },
          customerPhone: '0912345678',
        })
      ).toBe('tel:0987654321');
    });

    it('generates Google Maps driving navigation URLs with coordinates or address', () => {
      const withCoords = getGoogleMapsUrl({
        deliveryCoords: { lat: 10.7769, lng: 106.6908 },
      });
      expect(withCoords).toContain('destination=10.7769,106.6908');
      expect(withCoords).toContain('travelmode=driving');

      const withAddress = getGoogleMapsUrl({
        shippingAddress: '120 Võ Văn Tần, Quận 3, TP.HCM',
      });
      expect(withAddress).toContain('destination=120%20V%C3%B5%20V%C4%83n%20T%E1%BA%A7n');
    });

    it('mathematically verifies outdoor high contrast mode achieves >= 7:1 ratio (WCAG AAA)', () => {
      const blackToYellow = calculateContrastRatio('#000000', '#FACC15');
      expect(blackToYellow).toBeGreaterThanOrEqual(7.0);

      const whiteToBlack = calculateContrastRatio('#FFFFFF', '#000000');
      expect(whiteToBlack).toBe(21.0);
      expect(whiteToBlack).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe('7. RBAC Abilities for SHIPPER (permissions.ts)', () => {
    it('allows SHIPPER access to own orders, POD, incident reporting, and COD actions', () => {
      expect(hasPermission('SHIPPER', 'view-own-orders')).toBe(true);
      expect(hasPermission('SHIPPER', 'order:pickup')).toBe(true);
      expect(hasPermission('SHIPPER', 'order:deliver')).toBe(true);
      expect(hasPermission('SHIPPER', 'order:report-incident')).toBe(true);
      expect(hasPermission('SHIPPER', 'shift:update')).toBe(true);
      expect(hasPermission('SHIPPER', 'cod:view')).toBe(true);
      expect(hasPermission('SHIPPER', 'cod:settle')).toBe(true);
      expect(canAccessShipperPortal('SHIPPER')).toBe(true);
    });

    it('denies SHIPPER access to warehouse, pricing, product creation, customer edits, and order approval', () => {
      expect(hasPermission('SHIPPER', 'order:approve')).toBe(false);
      expect(hasPermission('SHIPPER', 'order:delete')).toBe(false);
      expect(hasPermission('SHIPPER', 'product:create')).toBe(false);
      expect(hasPermission('SHIPPER', 'product:adjust_stock')).toBe(false);
      expect(hasPermission('SHIPPER', 'customer:view')).toBe(false);
      expect(hasPermission('SHIPPER', 'customer:edit')).toBe(false);
      expect(hasPermission('SHIPPER', 'dashboard:view')).toBe(false);
    });

    it('denies MANAGER from acting as driver for POD or COD settlement directly', () => {
      expect(hasPermission('MANAGER', 'view-own-orders')).toBe(false);
      expect(hasPermission('MANAGER', 'order:pickup')).toBe(false);
      expect(hasPermission('MANAGER', 'order:report-incident')).toBe(false);
      expect(hasPermission('MANAGER', 'cod:settle')).toBe(false);
    });
  });
});
