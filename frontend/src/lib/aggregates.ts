import { Brand, CORE_BRANDS, Order } from '@/types/manager';
import { formatDate, formatMonthYear } from './formatters';

export interface TimeBucket {
  label: string;
  revenue: number;
  orderCount: number;
}

export interface PeriodBucketItem {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface BrandMetric {
  brand: Brand;
  revenue: number;
  orderCount: number;
  percentage: number;
}

/**
 * Calculates total revenue recognized exclusively from orders with status DELIVERED.
 */
export function calculateDeliveredRevenue(orders: Order[]): number {
  if (!Array.isArray(orders)) return 0;
  return orders
    .filter((order) => order && order.status === 'DELIVERED')
    .reduce((sum, order) => sum + (order.finalAmount ?? order.totalAmount ?? 0), 0);
}

/**
 * Counts the live number of PENDING orders awaiting Manager approval.
 */
export function countPendingOrders(orders: Order[]): number {
  if (!Array.isArray(orders)) return 0;
  return orders.filter((order) => order && order.status === 'PENDING').length;
}

export const getPendingOrdersCount = countPendingOrders;

/**
 * Returns summary stats for delivered orders.
 */
export function calculateDeliveredStats(orders: Order[]): {
  totalRevenue: number;
  completedOrdersCount: number;
} {
  if (!Array.isArray(orders)) return { totalRevenue: 0, completedOrdersCount: 0 };
  const delivered = orders.filter((order) => order && order.status === 'DELIVERED');
  const totalRevenue = delivered.reduce(
    (sum, order) => sum + (order.finalAmount ?? order.totalAmount ?? 0),
    0
  );
  return {
    totalRevenue,
    completedOrdersCount: delivered.length,
  };
}

/**
 * Calculates revenue breakdown for the 4 core M&E brands
 * (Cadivi, Bình Minh, Schneider, Panasonic) from DELIVERED orders.
 */
export function calculateBrandRevenue(orders: Order[]): Record<Brand, number> {
  const result: Record<Brand, number> = {
    Cadivi: 0,
    'Bình Minh': 0,
    Schneider: 0,
    Panasonic: 0,
  };

  if (!Array.isArray(orders)) return result;

  const delivered = orders.filter((order) => order && order.status === 'DELIVERED');
  for (const order of delivered) {
    if (!order.items) continue;
    for (const item of order.items) {
      if (item && item.brand && item.brand in result) {
        const itemAmount = typeof item.total === 'number' ? item.total : item.quantity * item.unitPrice;
        result[item.brand] += Math.round(itemAmount || 0);
      }
    }
  }

  return result;
}

/**
 * Comprehensive brand distribution breakdown with revenue, order count, and % share.
 */
export function calculateBrandBreakdown(orders: Order[]): Record<Brand, BrandMetric> {
  const brandRevenue = calculateBrandRevenue(orders);
  const totalBrandRevenue = Object.values(brandRevenue).reduce((sum, v) => sum + v, 0);

  const delivered = Array.isArray(orders)
    ? orders.filter((order) => order && order.status === 'DELIVERED')
    : [];

  const breakdown: Partial<Record<Brand, BrandMetric>> = {};

  for (const brand of CORE_BRANDS) {
    const rev = brandRevenue[brand] || 0;
    const orderCount = delivered.filter(
      (o) => o.items && o.items.some((i) => i.brand === brand)
    ).length;

    const percentage =
      totalBrandRevenue > 0
        ? Math.round((rev / totalBrandRevenue) * 1000) / 10
        : 0;

    breakdown[brand] = {
      brand,
      revenue: rev,
      orderCount,
      percentage,
    };
  }

  return breakdown as Record<Brand, BrandMetric>;
}

/**
 * Helper to safely obtain an order's delivery reference date
 */
function getOrderDate(order: Order): Date | null {
  const dateStr = order.deliveredAt || order.createdAt;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Buckets delivered revenue by day or month with ZERO-FILL for gaps.
 */
export function calculateTimeRevenueBuckets(
  orders: Order[],
  period: 'day' | 'month',
  targetYearOrOptions?:
    | number
    | { startDate?: Date; endDate?: Date; targetYear?: number; targetMonth?: number },
  targetMonthParam?: number
): TimeBucket[] {
  const delivered = Array.isArray(orders)
    ? orders.filter((order) => order && order.status === 'DELIVERED')
    : [];

  if (period === 'month') {
    const year =
      typeof targetYearOrOptions === 'number'
        ? targetYearOrOptions
        : targetYearOrOptions && typeof targetYearOrOptions.targetYear === 'number'
        ? targetYearOrOptions.targetYear
        : new Date().getFullYear();

    const buckets: TimeBucket[] = [];
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    // Pre-fill all 12 months with 0
    for (let m = 1; m <= 12; m++) {
      buckets.push({
        label: `${pad(m)}/${year}`,
        revenue: 0,
        orderCount: 0,
      });
    }

    for (const order of delivered) {
      const d = getOrderDate(order);
      if (!d || d.getFullYear() !== year) continue;

      const mIdx = d.getMonth(); // 0-based
      if (mIdx >= 0 && mIdx < 12) {
        buckets[mIdx].revenue += order.finalAmount ?? order.totalAmount ?? 0;
        buckets[mIdx].orderCount += 1;
      }
    }

    return buckets;
  }

  // Daily bucketing
  let startDate: Date;
  let endDate: Date;

  if (
    typeof targetYearOrOptions === 'object' &&
    targetYearOrOptions !== null &&
    targetYearOrOptions.startDate &&
    targetYearOrOptions.endDate
  ) {
    startDate = new Date(targetYearOrOptions.startDate);
    endDate = new Date(targetYearOrOptions.endDate);
  } else if (typeof targetYearOrOptions === 'number' && typeof targetMonthParam === 'number') {
    const year = targetYearOrOptions;
    const month = targetMonthParam; // 1-12
    startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const lastDay = new Date(year, month, 0).getDate();
    endDate = new Date(year, month - 1, lastDay, 23, 59, 59);
  } else {
    // If dates are not explicitly specified, find bounds from delivered orders or default to 7 days
    if (delivered.length > 0) {
      const dates = delivered.map(getOrderDate).filter((d): d is Date => d !== null);
      if (dates.length > 0) {
        const minTime = Math.min(...dates.map((d) => d.getTime()));
        const maxTime = Math.max(...dates.map((d) => d.getTime()));
        startDate = new Date(minTime);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(maxTime);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const now = new Date();
        startDate = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      startDate = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }
  }

  // Generate zero-filled continuous date sequence
  const bucketMap = new Map<string, TimeBucket>();
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);

  const endLimit = new Date(endDate);
  endLimit.setHours(23, 59, 59, 999);

  while (cur.getTime() <= endLimit.getTime()) {
    const label = formatDate(cur);
    if (!bucketMap.has(label)) {
      bucketMap.set(label, {
        label,
        revenue: 0,
        orderCount: 0,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Populate data
  for (const order of delivered) {
    const d = getOrderDate(order);
    if (!d) continue;
    const label = formatDate(d);
    const bucket = bucketMap.get(label);
    if (bucket) {
      bucket.revenue += order.finalAmount ?? order.totalAmount ?? 0;
      bucket.orderCount += 1;
    }
  }

  return Array.from(bucketMap.values());
}

/**
 * Period bucketing conforming to Survey 3 interface:
 * bucketRevenueByPeriod(orders, period: 'daily' | 'monthly', startDate, endDate)
 */
export function bucketRevenueByPeriod(
  orders: Order[],
  period: 'daily' | 'monthly',
  startDate?: Date,
  endDate?: Date
): PeriodBucketItem[] {
  if (period === 'monthly') {
    const buckets = calculateTimeRevenueBuckets(
      orders,
      'month',
      startDate ? startDate.getFullYear() : undefined
    );
    return buckets.map((b) => ({
      date: b.label,
      revenue: b.revenue,
      orderCount: b.orderCount,
    }));
  }

  const buckets = calculateTimeRevenueBuckets(orders, 'day', {
    startDate,
    endDate,
  });

  return buckets.map((b) => ({
    date: b.label,
    revenue: b.revenue,
    orderCount: b.orderCount,
  }));
}
