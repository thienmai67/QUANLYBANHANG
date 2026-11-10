import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidVietnamesePhone,
  sanitizePhone,
  isNonEmptyText,
  clampNumber,
} from '../src/lib/validation';
import { getFriendlyErrorMessage, ApiError } from '../src/lib/api';
import { useCartStore } from '../src/store/useCartStore';

describe('Empirical Adversarial Verification - Milestone 1', () => {
  describe('1. isValidVietnamesePhone - Tricky prefixes & malformed inputs', () => {
    it('rejects tricky prefixes: 0123456789 (deprecated 11-digit prefix in 10-digit form)', () => {
      expect(isValidVietnamesePhone('0123456789')).toBe(false);
    });

    it('rejects landline numbers: 02838123456 (11-digit landline) and 0283812345 (10-digit landline)', () => {
      expect(isValidVietnamesePhone('02838123456')).toBe(false);
      expect(isValidVietnamesePhone('0283812345')).toBe(false);
      expect(isValidVietnamesePhone('0243123456')).toBe(false);
    });

    it('rejects +84 international prefix unless formatted into local 10-digit format 0x', () => {
      // Application contract strictly requires 10-digit format starting with 0
      expect(isValidVietnamesePhone('+84901234567')).toBe(false);
    });

    it('accepts valid 10-digit mobile numbers with whitespace and punctuation', () => {
      expect(isValidVietnamesePhone('090 123 4567')).toBe(true);
      expect(isValidVietnamesePhone('090.123.4567')).toBe(true);
      expect(isValidVietnamesePhone('(090) 123-4567')).toBe(true);
      expect(isValidVietnamesePhone(' 038 999 8888 ')).toBe(true);
    });

    it('rejects strings with alphabetic letters and special characters', () => {
      expect(isValidVietnamesePhone('090123456a')).toBe(false);
      expect(isValidVietnamesePhone('090123456A')).toBe(false);
      expect(isValidVietnamesePhone('phone090123')).toBe(false);
      expect(isValidVietnamesePhone('090-123-456a')).toBe(false);
      expect(isValidVietnamesePhone('090123456!')).toBe(false);
    });

    it('rejects null, undefined, empty string, and whitespace-only', () => {
      expect(isValidVietnamesePhone(null)).toBe(false);
      expect(isValidVietnamesePhone(undefined)).toBe(false);
      expect(isValidVietnamesePhone('')).toBe(false);
      expect(isValidVietnamesePhone('   ')).toBe(false);
      expect(isValidVietnamesePhone('\t\n')).toBe(false);
    });

    it('rejects non-string objects and numbers', () => {
      expect(isValidVietnamesePhone(901234567 as any)).toBe(false);
      expect(isValidVietnamesePhone({ phone: '0901234567' } as any)).toBe(false);
      expect(isValidVietnamesePhone(['0901234567'] as any)).toBe(false);
    });
  });

  describe('2. clampNumber - Extremes, NaN, infinities, types', () => {
    it('handles NaN with fallback or min', () => {
      expect(clampNumber(NaN, 1, 10, 5)).toBe(5);
      expect(clampNumber(NaN, 1, 10)).toBe(1);
      expect(clampNumber(Number('invalid'), 0, 100, 10)).toBe(10);
    });

    it('handles Infinity and -Infinity safely', () => {
      expect(clampNumber(Infinity, 1, 10, 1)).toBe(1);
      expect(clampNumber(-Infinity, 1, 10, 1)).toBe(1);
      expect(clampNumber(Infinity, 0, 50)).toBe(0);
      expect(clampNumber(-Infinity, 0, 50)).toBe(0);
    });

    it('parses valid numeric strings and rejects invalid strings', () => {
      expect(clampNumber('5', 1, 10)).toBe(5);
      expect(clampNumber('  8  ', 1, 10)).toBe(8);
      expect(clampNumber('15', 1, 10)).toBe(10); // clamped to max
      expect(clampNumber('-5', 1, 10)).toBe(1); // clamped to min
      expect(clampNumber('abc', 1, 10, 4)).toBe(4);
      expect(clampNumber('', 1, 10, 7)).toBe(7);
      expect(clampNumber('   ', 1, 10, 7)).toBe(7);
    });

    it('handles non-primitive objects and symbols gracefully', () => {
      expect(clampNumber({ value: 10 }, 1, 10, 3)).toBe(3);
      expect(clampNumber([10], 1, 10, 3)).toBe(3);
      expect(clampNumber(Symbol('sym'), 1, 10, 3)).toBe(3);
      expect(clampNumber(null, 1, 10, 2)).toBe(2);
      expect(clampNumber(undefined, 1, 10, 2)).toBe(2);
    });

    it('handles negative numbers correctly with appropriate ranges', () => {
      // Range [0, 100] -> negative is clamped to 0
      expect(clampNumber(-10, 0, 100)).toBe(0);
      // Range [-50, 50] -> negative within range is preserved
      expect(clampNumber(-25, -50, 50)).toBe(-25);
      // Range [-50, 50] -> value below min is clamped to -50
      expect(clampNumber(-100, -50, 50)).toBe(-50);
    });
  });

  describe('3. getFriendlyErrorMessage - Hostile objects and nested structures', () => {
    const DEFAULT_FALLBACK = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';

    it('handles raw object with custom Symbol.toStringTag without [object Object]', () => {
      const customObj = {
        [Symbol.toStringTag]: 'CustomTag',
      };
      const result = getFriendlyErrorMessage(customObj);
      expect(result).toBe(DEFAULT_FALLBACK);
      expect(result).not.toContain('[object');
    });

    it('handles nested response.data.message being an object { nested: true }', () => {
      const hostileErr = {
        response: {
          data: {
            message: { nested: true },
          },
        },
      };
      const result = getFriendlyErrorMessage(hostileErr);
      expect(result).toBe(DEFAULT_FALLBACK);
      expect(result).not.toContain('[object');
    });

    it('handles empty Error instance: new Error()', () => {
      const emptyErr = new Error();
      const result = getFriendlyErrorMessage(emptyErr);
      expect(result).toBe(DEFAULT_FALLBACK);
      expect(result).not.toContain('[object');
    });

    it('suppresses literal [object Object] and whitespace variations', () => {
      expect(getFriendlyErrorMessage('[object Object]')).toBe(DEFAULT_FALLBACK);
      expect(getFriendlyErrorMessage('  [object Object]  ')).toBe(DEFAULT_FALLBACK);
      expect(getFriendlyErrorMessage({ message: '[object Object]' })).toBe(DEFAULT_FALLBACK);
      expect(getFriendlyErrorMessage({ error: '[object Object]' })).toBe(DEFAULT_FALLBACK);
      expect(getFriendlyErrorMessage({ detail: '[object Object]' })).toBe(DEFAULT_FALLBACK);
      expect(getFriendlyErrorMessage({ response: { data: { message: '[object Object]' } } })).toBe(DEFAULT_FALLBACK);
      expect(getFriendlyErrorMessage(new Error('[object Object]'))).toBe(DEFAULT_FALLBACK);
    });

    it('preserves valid custom error strings and known status codes', () => {
      expect(getFriendlyErrorMessage('Vui lòng chọn phương thức thanh toán')).toBe(
        'Vui lòng chọn phương thức thanh toán'
      );
      expect(getFriendlyErrorMessage({ status: 404 })).toBe('Không tìm thấy dữ liệu yêu cầu');
      expect(getFriendlyErrorMessage({ status: 500 })).toBe('Lỗi hệ thống máy chủ, vui lòng thử lại sau');
    });
  });

  describe('4. useCartStore - Adversarial sequence & getTotalPrice() invariants', () => {
    beforeEach(() => {
      useCartStore.getState().clearCart();
    });

    it('executes exact adversarial sequence: setQuantity NaN, -5, 0, 10 and checks getTotalPrice()', () => {
      const store = useCartStore.getState();

      // Add test item: id='item1', unitPrice=50000, initial qty=2
      store.addItem(
        {
          id: 'item1',
          sku: 'SKU-001',
          name: 'Sắt Phi 10 Hòa Phát',
          price: '50.000 ₫',
          unitPrice: 50000,
          image: '',
          quantity: 2,
        },
        false
      );

      // Verify initial state
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
      expect(useCartStore.getState().getTotalPrice()).toBe(100000);

      // Step A: setQuantity('item1', NaN) -> MUST be ignored, NOT corrupt to NaN
      useCartStore.getState().setQuantity('item1', NaN);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
      expect(useCartStore.getState().getTotalPrice()).toBe(100000);
      expect(Number.isNaN(useCartStore.getState().getTotalPrice())).toBe(false);

      // Step B: setQuantity('item1', -5) -> MUST remove item or clamp, NEVER set negative qty or negative total
      useCartStore.getState().setQuantity('item1', -5);
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
      expect(Number.isNaN(useCartStore.getState().getTotalPrice())).toBe(false);

      // Add item back with qty=3
      useCartStore.getState().addItem(
        {
          id: 'item1',
          sku: 'SKU-001',
          name: 'Sắt Phi 10 Hòa Phát',
          price: '50.000 ₫',
          unitPrice: 50000,
          image: '',
          quantity: 3,
        },
        false
      );
      expect(useCartStore.getState().items[0].quantity).toBe(3);
      expect(useCartStore.getState().getTotalPrice()).toBe(150000);

      // Step C: setQuantity('item1', 0) -> MUST remove item cleanly
      useCartStore.getState().setQuantity('item1', 0);
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().getTotalPrice()).toBe(0);

      // Add item back with qty=1
      useCartStore.getState().addItem(
        {
          id: 'item1',
          sku: 'SKU-001',
          name: 'Sắt Phi 10 Hòa Phát',
          price: '50.000 ₫',
          unitPrice: 50000,
          image: '',
          quantity: 1,
        },
        false
      );
      expect(useCartStore.getState().items[0].quantity).toBe(1);

      // Step D: setQuantity('item1', 10) -> sets quantity to 10
      useCartStore.getState().setQuantity('item1', 10);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(10);
      expect(useCartStore.getState().getTotalPrice()).toBe(500000);
      expect(useCartStore.getState().getTotalItems()).toBe(10);
    });

    it('survives state with corrupted items without throwing or producing NaN', () => {
      // Direct state corruption simulation
      useCartStore.setState({
        items: [
          {
            id: 'corrupt-1',
            sku: 'C1',
            name: 'Corrupt',
            price: '0',
            unitPrice: NaN as any,
            quantity: NaN as any,
            image: '',
          },
          {
            id: 'corrupt-2',
            sku: 'C2',
            name: 'Corrupt 2',
            price: '0',
            unitPrice: -1000 as any,
            quantity: -5 as any,
            image: '',
          },
        ],
      });

      // Defensive getters
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
      expect(useCartStore.getState().getTotalItems()).toBe(0);
      expect(Number.isNaN(useCartStore.getState().getTotalPrice())).toBe(false);
    });
  });
});
