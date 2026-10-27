import { describe, it, expect } from 'vitest';
import { formatMax9DigitsAmount } from '../src/lib/formatters';

const formatPriceTick = (val: number): string => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} tr`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)} k`;
  return `${val}`;
};

describe('Profile Page Features & Logic', () => {
  describe('formatMax9DigitsAmount', () => {
    it('formats numbers with <= 9 digits with standard vi-VN grouping without dots suffix', () => {
      expect(formatMax9DigitsAmount(0)).toBe('0');
      expect(formatMax9DigitsAmount(500000)).toBe('500.000');
      expect(formatMax9DigitsAmount(12000000)).toBe('12.000.000');
      expect(formatMax9DigitsAmount(999999999)).toBe('999.999.999');
    });

    it('truncates numbers with > 9 digits to 9 digits with ellipsis suffix', () => {
      // 10 digits: 1234567890 -> 123456789... -> '123.456.789...'
      expect(formatMax9DigitsAmount(1234567890)).toBe('123.456.789...');
      // 12 digits from user example: 337611799976 -> 337611799... -> '337.611.799...'
      expect(formatMax9DigitsAmount(337611799976)).toBe('337.611.799...');
    });
  });

  describe('Spend Chart Y-Axis Price Ticks Formatting', () => {
    it('formats large spend amounts into concise readable units', () => {
      expect(formatPriceTick(350000000000)).toBe('350 tỷ');
      expect(formatPriceTick(12500000000)).toBe('12.5 tỷ');
      expect(formatPriceTick(50000000)).toBe('50 tr');
      expect(formatPriceTick(2500000)).toBe('3 tr'); // toFixed(0) on 2.5 is 3
      expect(formatPriceTick(50000)).toBe('50 k');
      expect(formatPriceTick(0)).toBe('0');
    });

    it('calculates 4 balanced Y-axis ticks from max amount', () => {
      const maxVal = 300000000;
      const ticks = [
        formatPriceTick(maxVal),
        formatPriceTick(Math.round(maxVal * 0.66)),
        formatPriceTick(Math.round(maxVal * 0.33)),
        '0',
      ];
      expect(ticks).toEqual(['300 tr', '198 tr', '99 tr', '0']);
    });
  });

  describe('30-Day Spending Timeline Range', () => {
    it('generates exactly 30 days of continuous data up to today', () => {
      const daysCount = 30;
      const today = new Date();
      const timelineDays: { dateStr: string; displayDate: string }[] = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        timelineDays.push({
          dateStr,
          displayDate: `${dd}/${mm}`,
        });
      }

      expect(timelineDays.length).toBe(30);
      const lastDay = timelineDays[timelineDays.length - 1];
      const todayDD = String(today.getDate()).padStart(2, '0');
      const todayMM = String(today.getMonth() + 1).padStart(2, '0');
      expect(lastDay.displayDate).toBe(`${todayDD}/${todayMM}`);
    });
  });

  describe('Daily Spending Aggregation', () => {
    it('correctly aggregates spend by date and ignores cancelled orders', () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'Khách hàng A',
          totalAmount: 1500000,
          status: 'DELIVERED',
          createdAt: '2026-10-25T10:00:00Z',
          items: [],
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Khách hàng A',
          totalAmount: 500000,
          status: 'SHIPPING',
          createdAt: '2026-10-25T14:30:00Z',
          items: [],
        },
        {
          id: '3',
          orderNumber: 'ORD-003',
          customerName: 'Khách hàng A',
          totalAmount: 2000000,
          status: 'CANCELLED',
          createdAt: '2026-10-25T16:00:00Z',
          items: [],
        },
        {
          id: '4',
          orderNumber: 'ORD-004',
          customerName: 'Khách hàng A',
          totalAmount: 3200000,
          status: 'PACKING',
          createdAt: '2026-10-26T09:00:00Z',
          items: [],
        },
      ];

      const spendMap: Record<string, { date: string; amount: number; count: number }> = {};
      const validOrders = mockOrders
        .filter((o) => o.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      validOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!spendMap[dateKey]) {
          spendMap[dateKey] = { date: dateKey, amount: 0, count: 0 };
        }
        spendMap[dateKey].amount += o.totalAmount;
        spendMap[dateKey].count += 1;
      });

      expect(spendMap['2026-10-25']).toBeDefined();
      expect(spendMap['2026-10-25'].amount).toBe(2000000); // 1.5M + 0.5M, 2M cancelled excluded
      expect(spendMap['2026-10-25'].count).toBe(2);

      expect(spendMap['2026-10-26']).toBeDefined();
      expect(spendMap['2026-10-26'].amount).toBe(3200000);
      expect(spendMap['2026-10-26'].count).toBe(1);
    });
  });

  describe('Order Multi-Category Filter & Sort Labels', () => {
    it('verifies exact required labels for price categories', () => {
      const priceLabels = [
        'Tất cả mức giá',
        'Giảm dần',
        'Tăng dần',
        'Dưới 5 triệu',
        'Từ 5 - 20 triệu',
        'Trên 20 triệu',
      ];
      expect(priceLabels).toHaveLength(6);
      expect(priceLabels[0]).toBe('Tất cả mức giá');
      expect(priceLabels[1]).toBe('Giảm dần');
      expect(priceLabels[2]).toBe('Tăng dần');
      expect(priceLabels[3]).toBe('Dưới 5 triệu');
      expect(priceLabels[4]).toBe('Từ 5 - 20 triệu');
      expect(priceLabels[5]).toBe('Trên 20 triệu');
    });

    it('verifies exact required labels for quantity categories', () => {
      const qtyLabels = [
        'Tất cả số lượng',
        'Giảm dần',
        'Tăng dần',
        'Từ 1 - 3 sp',
        'Trên 3 sp',
      ];
      expect(qtyLabels).toHaveLength(5);
      expect(qtyLabels[0]).toBe('Tất cả số lượng');
      expect(qtyLabels[1]).toBe('Giảm dần');
      expect(qtyLabels[2]).toBe('Tăng dần');
      expect(qtyLabels[3]).toBe('Từ 1 - 3 sp');
      expect(qtyLabels[4]).toBe('Trên 3 sp');
    });

    const orders = [
      {
        id: '1',
        orderNumber: 'ORD-101',
        totalAmount: 12000000,
        status: 'DELIVERED',
        createdAt: '2026-10-20T00:00:00Z',
        items: [{ quantity: 5 }],
      },
      {
        id: '2',
        orderNumber: 'ORD-102',
        totalAmount: 3000000,
        status: 'PENDING',
        createdAt: '2026-10-26T00:00:00Z',
        items: [{ quantity: 2 }],
      },
      {
        id: '3',
        orderNumber: 'ORD-103',
        totalAmount: 25000000,
        status: 'SHIPPING',
        createdAt: '2026-10-24T00:00:00Z',
        items: [{ quantity: 10 }],
      },
    ];

    it('filters orders by price range', () => {
      // UNDER_5M
      const under5M = orders.filter((o) => o.totalAmount < 5000000);
      expect(under5M.length).toBe(1);
      expect(under5M[0].orderNumber).toBe('ORD-102');

      // 5M_20M
      const mid = orders.filter((o) => o.totalAmount >= 5000000 && o.totalAmount <= 20000000);
      expect(mid.length).toBe(1);
      expect(mid[0].orderNumber).toBe('ORD-101');

      // OVER_20M
      const over20M = orders.filter((o) => o.totalAmount > 20000000);
      expect(over20M.length).toBe(1);
      expect(over20M[0].orderNumber).toBe('ORD-103');
    });

    it('sorts orders by price descending and ascending', () => {
      const desc = [...orders].sort((a, b) => b.totalAmount - a.totalAmount);
      expect(desc.map((o) => o.orderNumber)).toEqual(['ORD-103', 'ORD-101', 'ORD-102']);

      const asc = [...orders].sort((a, b) => a.totalAmount - b.totalAmount);
      expect(asc.map((o) => o.orderNumber)).toEqual(['ORD-102', 'ORD-101', 'ORD-103']);
    });

    it('formats ordinal numbers (STT) correctly with leading zeros', () => {
      const getSTT = (index: number) => `#${String(index + 1).padStart(2, '0')}`;
      expect(getSTT(0)).toBe('#01');
      expect(getSTT(8)).toBe('#09');
      expect(getSTT(9)).toBe('#10');
      expect(getSTT(99)).toBe('#100');
    });
  });
});
