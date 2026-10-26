import { Order, OrderStatus, Shipper, StatusHistoryEntry } from '@/types/manager';

/**
 * Valid state transitions mapping for order lifecycle:
 * PENDING -> PACKING | CANCELLED
 * PACKING -> SHIPPING | CANCELLED
 * SHIPPING -> DELIVERED | CANCELLED
 * DELIVERED -> none (terminal)
 * CANCELLED -> none (terminal)
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Determines whether transition from current status to target status is valid.
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (!from || !to) return false;
  if (from === to) return false;
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Validates cancellation reason.
 * Rule: must be non-empty and at least 5 characters after trimming.
 */
export function validateCancellation(reason?: string | null): { valid: boolean; error?: string } {
  if (!reason || typeof reason !== 'string') {
    return { valid: false, error: 'Lý do hủy đơn phải có ít nhất 5 ký tự' };
  }
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return { valid: false, error: 'Lý do hủy đơn phải có ít nhất 5 ký tự' };
  }
  return { valid: true };
}

// Alias for survey/tests compatibility
export const validateCancellationReason = validateCancellation;

/**
 * Checks whether an order can transition from PACKING to SHIPPING.
 * Guard: Must have an assigned shipper (shipperId or assignedShipperId).
 */
export function guardShippingTransition(order: {
  status: OrderStatus;
  shipperId?: string | null;
  assignedShipperId?: string | null;
}): { allowed: boolean; reason?: string } {
  if (order.status !== 'PACKING') {
    return { allowed: false, reason: 'Chỉ đơn hàng đang đóng gói mới có thể chuyển sang giao hàng' };
  }
  const assigned = order.shipperId?.trim() || order.assignedShipperId?.trim();
  if (!assigned) {
    return { allowed: false, reason: 'Chưa phân công shipper cho đơn hàng' };
  }
  return { allowed: true };
}

/**
 * Checks whether a shipper can take on new orders.
 * Workload rule: max 5 active orders (activeOrders < 5 or activeDeliveriesCount < 5).
 * Shipper must not be offline.
 */
export function canAssignShipper(shipper: {
  activeOrders?: number;
  activeDeliveriesCount?: number;
  status?: string;
}): boolean {
  if (!shipper) return false;

  const currentCount =
    typeof shipper.activeOrders === 'number'
      ? shipper.activeOrders
      : typeof shipper.activeDeliveriesCount === 'number'
      ? shipper.activeDeliveriesCount
      : 0;

  if (currentCount >= 5) {
    return false;
  }

  if (shipper.status) {
    const statusLower = shipper.status.toLowerCase();
    if (statusLower === 'offline') {
      return false;
    }
  }

  return true;
}

/**
 * Detailed shipper assignability check returning reason if blocked.
 */
export function checkShipperAssignability(shipper: {
  activeOrders?: number;
  activeDeliveriesCount?: number;
  status?: string;
}): { allowed: boolean; reason?: string } {
  if (!shipper) {
    return { allowed: false, reason: 'Thông tin shipper không hợp lệ' };
  }

  const currentCount =
    typeof shipper.activeOrders === 'number'
      ? shipper.activeOrders
      : typeof shipper.activeDeliveriesCount === 'number'
      ? shipper.activeDeliveriesCount
      : 0;

  if (currentCount >= 5) {
    return { allowed: false, reason: 'Shipper đã đạt giới hạn tối đa 5 đơn đang giao' };
  }

  if (shipper.status && shipper.status.toLowerCase() === 'offline') {
    return { allowed: false, reason: 'Shipper hiện đang ngoại tuyến' };
  }

  return { allowed: true };
}

/**
 * Resolves the 2H deadline Date for an order.
 */
export function get2HDeadline(order: { is2H: boolean; deadline2H?: string; createdAt?: string }): Date | null {
  if (!order.is2H) return null;
  if (order.deadline2H) {
    const d = new Date(order.deadline2H);
    if (!isNaN(d.getTime())) return d;
  }
  if (order.createdAt) {
    const created = new Date(order.createdAt);
    if (!isNaN(created.getTime())) {
      return new Date(created.getTime() + 2 * 60 * 60 * 1000);
    }
  }
  return null;
}

/**
 * Checks whether a 2H order is overdue relative to the given reference time.
 */
export function isOrderOverdue2H(
  order: { is2H: boolean; deadline2H?: string; createdAt?: string },
  now: Date = new Date()
): boolean {
  const deadline = get2HDeadline(order);
  if (!deadline) return false;
  return now.getTime() > deadline.getTime();
}

/**
 * Calculates remaining minutes until 2H deadline (negative if overdue).
 * Returns null if not a 2H order.
 */
export function getRemaining2HMinutes(
  order: { is2H: boolean; deadline2H?: string; createdAt?: string },
  now: Date = new Date()
): number | null {
  const deadline = get2HDeadline(order);
  if (!deadline) return null;
  const diffMs = deadline.getTime() - now.getTime();
  return Math.floor(diffMs / (60 * 1000));
}

/**
 * Helper to create an immutable StatusHistoryEntry
 */
export function createStatusHistoryEntry(
  status: OrderStatus,
  changedBy: string,
  note?: string,
  timestamp?: string
): StatusHistoryEntry {
  return {
    status,
    timestamp: timestamp || new Date().toISOString(),
    changedBy,
    note,
  };
}

export type ActorRole = 'MANAGER' | 'SHIPPER' | 'CUSTOMER';

export interface Actor {
  role: ActorRole;
  shipperId?: string;
  name?: string;
}

export type TransitionErrorCode =
  | 'INVALID_STATUS'
  | 'UNAUTHORIZED_ROLE'
  | 'NOT_ASSIGNED_SHIPPER'
  | 'MISSING_SHIPPER'
  | 'POD_REQUIRED'
  | 'COD_CONFIRMATION_REQUIRED'
  | 'INVALID_CANCEL_REASON';

export interface ActorTransitionCheckResult {
  allowed: boolean;
  errorCode?: TransitionErrorCode;
  error?: string;
}

export const MAX_SHIPPER_ACTIVE_ORDERS = 5;

/**
 * Validates order status transition against current order state, actor role,
 * and actor ownership (Shipper can only modify their own assigned orders).
 */
export function canActorTransition(
  order: Order,
  to: OrderStatus,
  actor: Actor,
  extra?: {
    pod?: { receiverName?: string; photos?: Array<{ name: string; thumbnail: string }> };
    codConfirmed?: boolean;
    cancelReason?: string;
    incidentCategory?: string;
    shipperId?: string;
  }
): ActorTransitionCheckResult {
  if (!order || !to || !actor) {
    return {
      allowed: false,
      errorCode: 'INVALID_STATUS',
      error: 'Thông tin chuyển trạng thái không hợp lệ',
    };
  }

  // Validate cancellation reason early when cancelling
  if (to === 'CANCELLED') {
    const reasonVal = validateCancellation(extra?.cancelReason || order.cancellationReason);
    if (!reasonVal.valid) {
      return {
        allowed: false,
        errorCode: 'INVALID_CANCEL_REASON',
        error: reasonVal.error || 'Lý do hủy đơn phải có ít nhất 5 ký tự',
      };
    }
  }

  // 1. Base State Machine Check
  if (!canTransition(order.status, to)) {
    return {
      allowed: false,
      errorCode: 'INVALID_STATUS',
      error: `Đơn đã thay đổi trạng thái (${order.status} -> ${to})`,
    };
  }

  // 2. MANAGER Actor logic
  if (actor.role === 'MANAGER') {
    if (order.status === 'PACKING' && to === 'SHIPPING') {
      const targetOrder = extra?.shipperId ? { ...order, shipperId: extra.shipperId } : order;
      const guard = guardShippingTransition(targetOrder);
      if (!guard.allowed) {
        return {
          allowed: false,
          errorCode: 'MISSING_SHIPPER',
          error: guard.reason || 'Chưa phân công shipper cho đơn hàng',
        };
      }
    }

    return { allowed: true };
  }

  // 3. SHIPPER Actor logic
  if (actor.role === 'SHIPPER') {
    // Shipper cannot approve PENDING orders
    if (order.status === 'PENDING') {
      return {
        allowed: false,
        errorCode: 'UNAUTHORIZED_ROLE',
        error: 'Shipper không có quyền duyệt đơn hàng',
      };
    }

    // Shipper cannot cancel PENDING or PACKING orders
    if (to === 'CANCELLED' && order.status !== 'SHIPPING') {
      return {
        allowed: false,
        errorCode: 'UNAUTHORIZED_ROLE',
        error: 'Shipper chỉ được báo sự cố hủy đơn khi đang vận chuyển',
      };
    }

    // Shipper ownership verification
    if (!actor.shipperId || order.shipperId !== actor.shipperId) {
      return {
        allowed: false,
        errorCode: 'NOT_ASSIGNED_SHIPPER',
        error: 'Đơn hàng không thuộc quyền phụ trách của bạn',
      };
    }

    // PACKING -> SHIPPING (Shipper pickup at warehouse)
    if (order.status === 'PACKING' && to === 'SHIPPING') {
      return { allowed: true };
    }

    // SHIPPING -> DELIVERED (Requires valid POD and COD confirmation if COD order)
    if (order.status === 'SHIPPING' && to === 'DELIVERED') {
      const podReceiver = extra?.pod?.receiverName?.trim();
      const podPhotos = extra?.pod?.photos;

      if (!podReceiver || podReceiver.length < 2) {
        return {
          allowed: false,
          errorCode: 'POD_REQUIRED',
          error: 'Vui lòng nhập tên người ký nhận thực tế (tối thiểu 2 ký tự)',
        };
      }

      if (!podPhotos || podPhotos.length < 1) {
        return {
          allowed: false,
          errorCode: 'POD_REQUIRED',
          error: 'Bắt buộc chụp hoặc tải lên từ 1 đến 3 ảnh bằng chứng giao hàng (POD)',
        };
      }

      // Check COD confirmation if paymentMethod is COD
      const isCodOrder = order.paymentMethod === 'COD';
      if (isCodOrder && !extra?.codConfirmed) {
        return {
          allowed: false,
          errorCode: 'COD_CONFIRMATION_REQUIRED',
          error: 'Bắt buộc xác nhận đã thu đủ số tiền COD trước khi hoàn tất',
        };
      }

      return { allowed: true };
    }

    // SHIPPING -> CANCELLED (Incident report)
    if (order.status === 'SHIPPING' && to === 'CANCELLED') {
      const reasonVal = validateCancellation(extra?.cancelReason);
      if (!reasonVal.valid) {
        return {
          allowed: false,
          errorCode: 'INVALID_CANCEL_REASON',
          error: reasonVal.error || 'Chi tiết sự cố giao hàng phải có ít nhất 5 ký tự',
        };
      }
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    errorCode: 'UNAUTHORIZED_ROLE',
    error: 'Vai trò người dùng không có quyền thực hiện hành động này',
  };
}

/**
 * Calculates current active workload for a shipper (PACKING + SHIPPING orders assigned).
 */
export function getShipperWorkload(orders: Order[], shipperId: string): number {
  if (!shipperId || !Array.isArray(orders)) return 0;
  return orders.filter(
    (o) => o.shipperId === shipperId && (o.status === 'PACKING' || o.status === 'SHIPPING')
  ).length;
}

/**
 * Validates whether a shipper can switch shiftStatus to 'offline'.
 * Rule: Cannot go offline if shipper still has PACKING or SHIPPING orders assigned.
 */
export function canShipperGoOffline(
  orders: Order[],
  shipperId: string
): { allowed: boolean; reason?: string; activeOrdersCount: number } {
  const currentCount = getShipperWorkload(orders, shipperId);
  if (currentCount > 0) {
    return {
      allowed: false,
      activeOrdersCount: currentCount,
      reason: `Bạn vẫn còn ${currentCount} đơn đang phụ trách (chờ lấy/đang giao). Vui lòng hoàn thành hoặc báo Manager điều phối trước khi nghỉ ca!`,
    };
  }
  return { allowed: true, activeOrdersCount: 0 };
}

export interface OnTimeRateResult {
  total2H: number;
  onTime2H: number;
  ratePercent: number | null; // null when denominator is 0
  rateFormatted: string; // e.g. "100%", "85%", or "—"
}

/**
 * Calculates on-time delivery rate for 2H orders delivered by a specific shipper.
 * Rate = (2H orders with deliveredAt <= deadline) / (total 2H orders delivered).
 * Returns '—' when total is 0.
 */
export function calculateShipper2HOnTimeRate(
  orders: Order[],
  shipperId: string,
  filterRange: 'today' | '7days' = 'today',
  referenceNow: Date = new Date()
): OnTimeRateResult {
  if (!shipperId || !Array.isArray(orders)) {
    return { total2H: 0, onTime2H: 0, ratePercent: null, rateFormatted: '—' };
  }

  const startOfToday = new Date(
    referenceNow.getFullYear(),
    referenceNow.getMonth(),
    referenceNow.getDate()
  );

  const startOf7DaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const relevantOrders = orders.filter((o) => {
    if (o.shipperId !== shipperId) return false;
    if (o.status !== 'DELIVERED' || !o.deliveredAt) return false;
    if (!o.is2H && o.deliveryType !== '2H') return false;

    const deliveredDate = new Date(o.deliveredAt);
    if (isNaN(deliveredDate.getTime())) return false;

    if (filterRange === 'today') {
      return (
        deliveredDate.getFullYear() === referenceNow.getFullYear() &&
        deliveredDate.getMonth() === referenceNow.getMonth() &&
        deliveredDate.getDate() === referenceNow.getDate()
      );
    } else {
      return deliveredDate.getTime() >= startOf7DaysAgo.getTime();
    }
  });

  const total2H = relevantOrders.length;
  if (total2H === 0) {
    return { total2H: 0, onTime2H: 0, ratePercent: null, rateFormatted: '—' };
  }

  let onTimeCount = 0;
  for (const o of relevantOrders) {
    const deliveredTime = new Date(o.deliveredAt!).getTime();
    const deadline = get2HDeadline(o);
    if (deadline && deliveredTime <= deadline.getTime()) {
      onTimeCount++;
    }
  }

  const rate = Math.round((onTimeCount / total2H) * 100);
  return {
    total2H,
    onTime2H: onTimeCount,
    ratePercent: rate,
    rateFormatted: `${rate}%`,
  };
}
