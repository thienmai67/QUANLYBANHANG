import { describe, it, expect } from 'vitest';
import {
  canTransition,
  validateCancellation,
  validateCancellationReason,
  guardShippingTransition,
  canAssignShipper,
  checkShipperAssignability,
  isOrderOverdue2H,
  getRemaining2HMinutes,
  get2HDeadline,
  createStatusHistoryEntry,
} from '@/lib/orderRules';
import { Order, OrderStatus } from '@/types/manager';

describe('orderRules - State Machine & Business Guards', () => {
  describe('canTransition', () => {
    it('allows valid lifecycle transitions', () => {
      expect(canTransition('PENDING', 'PACKING')).toBe(true);
      expect(canTransition('PENDING', 'CANCELLED')).toBe(true);

      expect(canTransition('PACKING', 'SHIPPING')).toBe(true);
      expect(canTransition('PACKING', 'CANCELLED')).toBe(true);

      expect(canTransition('SHIPPING', 'DELIVERED')).toBe(true);
      expect(canTransition('SHIPPING', 'CANCELLED')).toBe(true);
    });

    it('blocks illegal transition skips', () => {
      expect(canTransition('PENDING', 'SHIPPING')).toBe(false);
      expect(canTransition('PENDING', 'DELIVERED')).toBe(false);
      expect(canTransition('PACKING', 'DELIVERED')).toBe(false);
    });

    it('blocks backward transitions', () => {
      expect(canTransition('PACKING', 'PENDING')).toBe(false);
      expect(canTransition('SHIPPING', 'PACKING')).toBe(false);
      expect(canTransition('SHIPPING', 'PENDING')).toBe(false);
    });

    it('blocks transitions from terminal states', () => {
      const allStatuses: OrderStatus[] = ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
      for (const st of allStatuses) {
        expect(canTransition('DELIVERED', st)).toBe(false);
        expect(canTransition('CANCELLED', st)).toBe(false);
      }
    });

    it('blocks self-transitions', () => {
      expect(canTransition('PENDING', 'PENDING')).toBe(false);
      expect(canTransition('PACKING', 'PACKING')).toBe(false);
      expect(canTransition('SHIPPING', 'SHIPPING')).toBe(false);
      expect(canTransition('DELIVERED', 'DELIVERED')).toBe(false);
      expect(canTransition('CANCELLED', 'CANCELLED')).toBe(false);
    });
  });

  describe('validateCancellation / validateCancellationReason', () => {
    it('approves reasons with >= 5 non-whitespace characters', () => {
      expect(validateCancellation('Khách hủy đổi vật tư').valid).toBe(true);
      expect(validateCancellation('12345').valid).toBe(true);
      expect(validateCancellationReason('Hết hàng trong kho').valid).toBe(true);
    });

    it('rejects short reasons (< 5 chars)', () => {
      const res = validateCancellation('Hủy');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ít nhất 5 ký tự');
    });

    it('rejects empty, whitespace-only, or missing reasons', () => {
      expect(validateCancellation('').valid).toBe(false);
      expect(validateCancellation('    ').valid).toBe(false);
      expect(validateCancellation(null).valid).toBe(false);
      expect(validateCancellation(undefined).valid).toBe(false);
    });
  });

  describe('guardShippingTransition', () => {
    it('allows transition when order is PACKING and has a shipper assigned', () => {
      expect(guardShippingTransition({ status: 'PACKING', shipperId: 'ship-001' }).allowed).toBe(true);
      expect(
        guardShippingTransition({ status: 'PACKING', assignedShipperId: 'ship-002' }).allowed
      ).toBe(true);
    });

    it('blocks transition when order is PACKING but has no shipper assigned', () => {
      const res = guardShippingTransition({ status: 'PACKING', shipperId: '' });
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Chưa phân công shipper');

      const res2 = guardShippingTransition({ status: 'PACKING' });
      expect(res2.allowed).toBe(false);
    });

    it('blocks transition if status is not PACKING even with shipper', () => {
      expect(guardShippingTransition({ status: 'PENDING', shipperId: 'ship-001' }).allowed).toBe(false);
      expect(guardShippingTransition({ status: 'DELIVERED', shipperId: 'ship-001' }).allowed).toBe(false);
    });
  });

  describe('canAssignShipper & checkShipperAssignability', () => {
    it('allows assignment for shippers with active orders < 5', () => {
      expect(canAssignShipper({ activeOrders: 0, status: 'Active' })).toBe(true);
      expect(canAssignShipper({ activeOrders: 4, status: 'available' })).toBe(true);
      expect(canAssignShipper({ activeDeliveriesCount: 3 })).toBe(true);
      expect(checkShipperAssignability({ activeOrders: 2 }).allowed).toBe(true);
    });

    it('blocks assignment when shipper workload reaches maximum 5 active deliveries', () => {
      expect(canAssignShipper({ activeOrders: 5 })).toBe(false);
      expect(canAssignShipper({ activeDeliveriesCount: 5 })).toBe(false);
      expect(canAssignShipper({ activeOrders: 6 })).toBe(false);

      const check = checkShipperAssignability({ activeOrders: 5 });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('tối đa 5 đơn');
    });

    it('blocks assignment when shipper is offline regardless of active order count', () => {
      expect(canAssignShipper({ activeOrders: 0, status: 'offline' })).toBe(false);
      expect(canAssignShipper({ activeOrders: 1, status: 'Offline' })).toBe(false);

      const check = checkShipperAssignability({ activeOrders: 1, status: 'offline' });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('ngoại tuyến');
    });
  });

  describe('2H Express Orders & Countdown Logic', () => {
    const baseTime = new Date('2026-10-08T10:00:00Z');

    it('returns null / false for standard non-2H orders', () => {
      const order = { is2H: false, createdAt: baseTime.toISOString() };
      expect(get2HDeadline(order)).toBeNull();
      expect(isOrderOverdue2H(order, baseTime)).toBe(false);
      expect(getRemaining2HMinutes(order, baseTime)).toBeNull();
    });

    it('calculates 2-hour deadline based on createdAt', () => {
      const order = { is2H: true, createdAt: baseTime.toISOString() };
      const deadline = get2HDeadline(order);
      expect(deadline).not.toBeNull();
      expect(deadline?.getTime()).toBe(baseTime.getTime() + 2 * 3600 * 1000);
    });

    it('correctly calculates remaining minutes and overdue flag before deadline', () => {
      const order = { is2H: true, createdAt: baseTime.toISOString() };
      // 45 minutes after creation -> 75 minutes remaining
      const checkTime = new Date(baseTime.getTime() + 45 * 60 * 1000);

      expect(isOrderOverdue2H(order, checkTime)).toBe(false);
      expect(getRemaining2HMinutes(order, checkTime)).toBe(75);
    });

    it('detects overdue when time exceeds 2-hour deadline', () => {
      const order = { is2H: true, createdAt: baseTime.toISOString() };
      // 140 minutes after creation -> 20 minutes overdue (-20 mins)
      const overdueTime = new Date(baseTime.getTime() + 140 * 60 * 1000);

      expect(isOrderOverdue2H(order, overdueTime)).toBe(true);
      expect(getRemaining2HMinutes(order, overdueTime)).toBe(-20);
    });

    it('respects explicitly provided deadline2H', () => {
      const explicitDeadline = new Date('2026-10-08T15:00:00Z');
      const order = {
        is2H: true,
        deadline2H: explicitDeadline.toISOString(),
        createdAt: baseTime.toISOString(),
      };

      const nowBefore = new Date('2026-10-08T14:30:00Z');
      expect(isOrderOverdue2H(order, nowBefore)).toBe(false);
      expect(getRemaining2HMinutes(order, nowBefore)).toBe(30);

      const nowAfter = new Date('2026-10-08T15:15:00Z');
      expect(isOrderOverdue2H(order, nowAfter)).toBe(true);
      expect(getRemaining2HMinutes(order, nowAfter)).toBe(-15);
    });
  });

  describe('createStatusHistoryEntry', () => {
    it('creates an immutable history log with default timestamp', () => {
      const entry = createStatusHistoryEntry('PACKING', 'Manager Nguyen', 'Đã duyệt đơn');
      expect(entry.status).toBe('PACKING');
      expect(entry.changedBy).toBe('Manager Nguyen');
      expect(entry.note).toBe('Đã duyệt đơn');
      expect(typeof entry.timestamp).toBe('string');
      expect(entry.timestamp.length).toBeGreaterThan(0);
    });
  });
});
