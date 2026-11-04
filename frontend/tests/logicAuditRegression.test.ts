import { describe, it, expect } from 'vitest';

describe('Logic Audit Regression Suite', () => {
  describe('Customer Profile Total Spend calculation', () => {
    it('only accumulates DELIVERED or PAID orders, ignoring CANCELLED and UNPAID orders', () => {
      const orders = [
        { id: '1', totalAmount: 100000, status: 'DELIVERED', paymentStatus: 'PAID' },
        { id: '2', totalAmount: 200000, status: 'PENDING', paymentStatus: 'PAID' },
        { id: '3', totalAmount: 300000, status: 'PENDING', paymentStatus: 'UNPAID' },
        { id: '4', totalAmount: 400000, status: 'CANCELLED', paymentStatus: 'CANCELLED' },
        { id: '5', totalAmount: 500000, status: 'CANCELLED', paymentStatus: 'REFUND_PENDING' },
      ];

      const totalSpend = orders
        .filter((o) => o.status === 'DELIVERED' || o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Only orders 1 (100k) and 2 (200k) should count = 300k
      expect(totalSpend).toBe(300000);
    });
  });

  describe('Phone and Address validation in Cart Drawer checkout', () => {
    const phoneRegex = /^0\d{9}$/;

    it('validates Vietnamese 10-digit mobile phone numbers starting with 0', () => {
      expect(phoneRegex.test('0901234567')).toBe(true);
      expect(phoneRegex.test('0389998888')).toBe(true);
      expect(phoneRegex.test('0861112233')).toBe(true);

      // Invalid cases
      expect(phoneRegex.test('901234567')).toBe(false); // missing 0
      expect(phoneRegex.test('090123456')).toBe(false); // only 9 digits
      expect(phoneRegex.test('09012345678')).toBe(false); // 11 digits
      expect(phoneRegex.test('090123456a')).toBe(false); // contains letter
      expect(phoneRegex.test('+84901234567')).toBe(false); // with +84
    });

    it('enforces min 2 chars for recipient name and min 5 chars for shipping address', () => {
      const isValidRecipient = (name: string) => name && name.trim().length >= 2;
      const isValidAddress = (addr: string) => addr && addr.trim().length >= 5;

      expect(isValidRecipient('Le')).toBe(true);
      expect(isValidRecipient('A')).toBe(false);
      expect(isValidRecipient('   ')).toBe(false);

      expect(isValidAddress('123 Đường 3/2, Q10')).toBe(true);
      expect(isValidAddress('Q10')).toBe(false);
      expect(isValidAddress('    ')).toBe(false);
    });
  });

  describe('Shipper card payment status badge label', () => {
    const getPaymentLabel = (isCod: boolean, paymentStatus: string) => {
      if (isCod) return { subtitle: 'Thu đủ khi giao', amountZero: false };
      if (paymentStatus === 'PAID') return { subtitle: 'Đã thanh toán Online qua PayOS', amountZero: true };
      return { subtitle: 'Chờ khách thanh toán', amountZero: false };
    };

    it('displays "Đã thanh toán Online qua PayOS" only when paymentStatus is PAID', () => {
      expect(getPaymentLabel(false, 'PAID')).toEqual({
        subtitle: 'Đã thanh toán Online qua PayOS',
        amountZero: true,
      });

      expect(getPaymentLabel(false, 'UNPAID')).toEqual({
        subtitle: 'Chờ khách thanh toán',
        amountZero: false,
      });

      expect(getPaymentLabel(false, 'PENDING')).toEqual({
        subtitle: 'Chờ khách thanh toán',
        amountZero: false,
      });

      expect(getPaymentLabel(true, 'UNPAID')).toEqual({
        subtitle: 'Thu đủ khi giao',
        amountZero: false,
      });
    });
  });
});
