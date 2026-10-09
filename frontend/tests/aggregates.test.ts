import { describe, it, expect } from 'vitest';
import {
  calculateDeliveredRevenue,
  calculateDeliveredStats,
  countPendingOrders,
  getPendingOrdersCount,
  calculateBrandRevenue,
  calculateBrandBreakdown,
  calculateTimeRevenueBuckets,
  bucketRevenueByPeriod,
} from '@/lib/aggregates';
import { Order } from '@/types/manager';

describe('aggregates - Metrics, Brand Breakdown & Zero-fill Bucketing', () => {
  const sampleOrders: Order[] = [
    {
      id: 'ord-01',
      code: 'DH-001',
      orderNumber: 'DH-001',
      customerId: 'c1',
      customerName: 'Nguyen Van A',
      customerPhone: '0901234567',
      shippingAddress: '123 Le Loi, Q1',
      totalAmount: 1000000,
      finalAmount: 1000000,
      status: 'DELIVERED',
      version: 1,
      createdAt: '2026-10-02T08:00:00Z',
      deliveredAt: '2026-10-02T10:30:00Z',
      is2H: false,
      items: [
        {
          productId: 'p1',
          productName: 'Day Cadivi',
          brand: 'Cadivi',
          unitPrice: 500000,
          quantity: 2,
          unit: 'Cuộn',
          total: 1000000,
        },
      ],
      statusHistory: [],
    },
    {
      id: 'ord-02',
      code: 'DH-002',
      orderNumber: 'DH-002',
      customerId: 'c2',
      customerName: 'Tran Thi B',
      customerPhone: '0902345678',
      shippingAddress: '456 Hai Ba Trung, Q3',
      totalAmount: 2000000,
      finalAmount: 2000000,
      status: 'DELIVERED',
      version: 1,
      createdAt: '2026-10-05T09:00:00Z',
      deliveredAt: '2026-10-05T11:00:00Z',
      is2H: true,
      items: [
        {
          productId: 'p2',
          productName: 'Ong Binh Minh',
          brand: 'Bình Minh',
          unitPrice: 500000,
          quantity: 2,
          unit: 'Cây',
          total: 1000000,
        },
        {
          productId: 'p3',
          productName: 'Aptomat Schneider',
          brand: 'Schneider',
          unitPrice: 1000000,
          quantity: 1,
          unit: 'Cái',
          total: 1000000,
        },
      ],
      statusHistory: [],
    },
    {
      id: 'ord-03',
      code: 'DH-003',
      orderNumber: 'DH-003',
      customerId: 'c3',
      customerName: 'Le Van C',
      customerPhone: '0903456789',
      shippingAddress: '789 Dien Bien Phu, Binh Thanh',
      totalAmount: 5000000,
      finalAmount: 5000000,
      status: 'PENDING',
      version: 1,
      createdAt: '2026-10-07T14:00:00Z',
      is2H: false,
      items: [
        {
          productId: 'p4',
          productName: 'Cong tac Panasonic',
          brand: 'Panasonic',
          unitPrice: 5000000,
          quantity: 1,
          unit: 'Bộ',
          total: 5000000,
        },
      ],
      statusHistory: [],
    },
    {
      id: 'ord-04',
      code: 'DH-004',
      orderNumber: 'DH-004',
      customerId: 'c4',
      customerName: 'Pham Van D',
      customerPhone: '0904567890',
      shippingAddress: '101 Nguyen Trai, Q5',
      totalAmount: 3000000,
      finalAmount: 3000000,
      status: 'CANCELLED',
      version: 1,
      createdAt: '2026-10-03T10:00:00Z',
      is2H: false,
      items: [
        {
          productId: 'p1',
          productName: 'Day Cadivi',
          brand: 'Cadivi',
          unitPrice: 3000000,
          quantity: 1,
          unit: 'Cuộn',
          total: 3000000,
        },
      ],
      statusHistory: [],
    },
  ];

  describe('Delivered Revenue Recognition', () => {
    it('recognizes revenue ONLY from orders with status DELIVERED', () => {
      // Delivered: ord-01 (1,000,000) + ord-02 (2,000,000) = 3,000,000
      // PENDING (5,000,000) and CANCELLED (3,000,000) must be excluded
      const revenue = calculateDeliveredRevenue(sampleOrders);
      expect(revenue).toBe(3000000);

      const stats = calculateDeliveredStats(sampleOrders);
      expect(stats.totalRevenue).toBe(3000000);
      expect(stats.completedOrdersCount).toBe(2);
    });

    it('returns 0 for empty or unfulfilled order sets', () => {
      expect(calculateDeliveredRevenue([])).toBe(0);
      expect(calculateDeliveredStats([]).totalRevenue).toBe(0);
      expect(calculateDeliveredStats([]).completedOrdersCount).toBe(0);
    });
  });

  describe('Pending Orders Counter', () => {
    it('accurately counts pending orders awaiting approval', () => {
      expect(countPendingOrders(sampleOrders)).toBe(1);
      expect(getPendingOrdersCount(sampleOrders)).toBe(1);

      expect(countPendingOrders([])).toBe(0);
    });
  });

  describe('4-Brand Breakdown Calculation', () => {
    it('tallies revenue exclusively for the 4 core brands from DELIVERED orders', () => {
      const brandRev = calculateBrandRevenue(sampleOrders);

      expect(brandRev['Cadivi']).toBe(1000000); // from ord-01 (DELIVERED)
      expect(brandRev['Bình Minh']).toBe(1000000); // from ord-02 (DELIVERED)
      expect(brandRev['Schneider']).toBe(1000000); // from ord-02 (DELIVERED)
      expect(brandRev['Panasonic']).toBe(0); // ord-03 is PENDING, so not recognized yet
    });

    it('computes brand percentage share correctly', () => {
      const breakdown = calculateBrandBreakdown(sampleOrders);

      expect(breakdown['Cadivi'].percentage).toBeCloseTo(33.3, 1);
      expect(breakdown['Bình Minh'].percentage).toBeCloseTo(33.3, 1);
      expect(breakdown['Schneider'].percentage).toBeCloseTo(33.3, 1);
      expect(breakdown['Panasonic'].percentage).toBe(0);

      // Order counts
      expect(breakdown['Cadivi'].orderCount).toBe(1);
      expect(breakdown['Bình Minh'].orderCount).toBe(1);
      expect(breakdown['Schneider'].orderCount).toBe(1);
      expect(breakdown['Panasonic'].orderCount).toBe(0);
    });
  });

  describe('Time Revenue Bucketing with Zero-Fill', () => {
    it('generates continuous zero-filled daily buckets across a date interval', () => {
      // Interval spanning 7 days: Oct 1, 2026 to Oct 7, 2026
      const startDate = new Date(2026, 9, 1); // 01/10/2026
      const endDate = new Date(2026, 9, 7); // 07/10/2026

      const buckets = calculateTimeRevenueBuckets(sampleOrders, 'day', {
        startDate,
        endDate,
      });

      // Exactly 7 items
      expect(buckets).toHaveLength(7);

      // Check dates in sequence
      expect(buckets[0].label).toBe('01/10/2026');
      expect(buckets[0].revenue).toBe(0);
      expect(buckets[0].orderCount).toBe(0);

      // Day 2 (02/10/2026) has ord-01 delivered
      expect(buckets[1].label).toBe('02/10/2026');
      expect(buckets[1].revenue).toBe(1000000);
      expect(buckets[1].orderCount).toBe(1);

      // Day 3 (03/10/2026) zero-filled
      expect(buckets[2].label).toBe('03/10/2026');
      expect(buckets[2].revenue).toBe(0);

      // Day 4 (04/10/2026) zero-filled
      expect(buckets[3].label).toBe('04/10/2026');
      expect(buckets[3].revenue).toBe(0);

      // Day 5 (05/10/2026) has ord-02 delivered
      expect(buckets[4].label).toBe('05/10/2026');
      expect(buckets[4].revenue).toBe(2000000);
      expect(buckets[4].orderCount).toBe(1);

      // Day 6 & 7 zero-filled
      expect(buckets[5].label).toBe('06/10/2026');
      expect(buckets[5].revenue).toBe(0);
      expect(buckets[6].label).toBe('07/10/2026');
      expect(buckets[6].revenue).toBe(0);
    });

    it('generates all 12 zero-filled months for annual view', () => {
      const buckets = calculateTimeRevenueBuckets(sampleOrders, 'month', 2026);

      expect(buckets).toHaveLength(12);
      expect(buckets[0].label).toBe('01/2026');
      expect(buckets[9].label).toBe('10/2026'); // Month 10 (October)
      expect(buckets[9].revenue).toBe(3000000);
      expect(buckets[9].orderCount).toBe(2);

      // Other months zero-filled
      expect(buckets[0].revenue).toBe(0);
      expect(buckets[11].label).toBe('12/2026');
      expect(buckets[11].revenue).toBe(0);
    });

    it('supports bucketRevenueByPeriod helper', () => {
      const startDate = new Date(2026, 9, 1);
      const endDate = new Date(2026, 9, 7);

      const daily = bucketRevenueByPeriod(sampleOrders, 'daily', startDate, endDate);
      expect(daily).toHaveLength(7);
      expect(daily[1].date).toBe('02/10/2026');
      expect(daily[1].revenue).toBe(1000000);

      const monthly = bucketRevenueByPeriod(sampleOrders, 'monthly', new Date(2026, 0, 1));
      expect(monthly).toHaveLength(12);
    });
  });

  describe('formatters - Currency, Date, and Countdown Text', () => {
    it('formats VND currency with Intl vi-VN locale', async () => {
      const { formatCurrencyVND, formatNumberVND } = await import('@/lib/formatters');
      expect(formatCurrencyVND(1250000)).toMatch(/1\.250\.000/);
      expect(formatCurrencyVND(0)).toMatch(/0/);
      expect(formatCurrencyVND(null)).toMatch(/0/);
      expect(formatNumberVND(1250000)).toBe('1.250.000');
    });

    it('formats date and datetime in local Vietnamese format dd/MM/yyyy HH:mm', async () => {
      const { formatDateTime, formatDate, formatMonthYear } = await import('@/lib/formatters');
      const testDate = new Date(2026, 9, 8, 14, 30); // 8th Oct 2026, 14:30
      expect(formatDate(testDate)).toBe('08/10/2026');
      expect(formatDateTime(testDate)).toBe('08/10/2026 14:30');
      expect(formatMonthYear(testDate)).toBe('10/2026');
    });

    it('formats 2H countdown durations accurately', async () => {
      const { formatCountdownMinutes } = await import('@/lib/formatters');
      expect(formatCountdownMinutes(72)).toBe('Còn 1h 12p');
      expect(formatCountdownMinutes(45)).toBe('Còn 45p');
      expect(formatCountdownMinutes(120)).toBe('Còn 2h');
      expect(formatCountdownMinutes(-15)).toBe('Quá hạn 15p');
      expect(formatCountdownMinutes(-75)).toBe('Quá hạn 1h 15p');
      expect(formatCountdownMinutes(null)).toBe('');
    });
  });

  describe('excel - Multi-sheet Workbook Generation', () => {
    it('generates 2 sheets with headers and formatted cells', async () => {
      const { buildOrdersWorkbook, exportOrdersToExcel } = await import('@/lib/excel');
      const XLSX = await import('xlsx');

      const wb = buildOrdersWorkbook(sampleOrders, XLSX);
      expect(wb.SheetNames).toEqual(['Đơn hàng', 'Chi tiết sản phẩm']);

      const wsOrders = wb.Sheets['Đơn hàng'];
      const wsItems = wb.Sheets['Chi tiết sản phẩm'];

      expect(wsOrders['A1'].v).toBe('Mã đơn hàng');
      expect(wsOrders['B1'].v).toBe('Khách hàng');
      expect(wsItems['A1'].v).toBe('Mã đơn hàng');
      expect(wsItems['C1'].v).toBe('Tên vật tư M&E');

      // Check exportOrdersToExcel returns the workbook in Node environment
      const exportedWb = await exportOrdersToExcel(sampleOrders);
      expect(exportedWb.SheetNames).toContain('Đơn hàng');
      expect(exportedWb.SheetNames).toContain('Chi tiết sản phẩm');
    });
  });
});

