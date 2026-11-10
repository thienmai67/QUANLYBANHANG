import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidVietnamesePhone,
  sanitizePhone,
  isNonEmptyText,
  clampNumber,
  VIETNAMESE_PHONE_REGEX,
} from '../src/lib/validation';
import { getFriendlyErrorMessage, ApiError } from '../src/lib/api';
import { useCartStore } from '../src/store/useCartStore';

describe('Milestone 1: Validation, Error Formatting, and Cart Store Hardening', () => {
  describe('1. Phone Number Validation & Sanitization (validation.ts)', () => {
    it('validates 10-digit mobile numbers with valid Vietnamese prefixes (03, 05, 07, 08, 09)', () => {
      const validNumbers = [
        '0903123456', // Viettel/Mobi
        '0918234567', // VinaPhone
        '0989567890', // Viettel
        '0321234567', // Viettel 03x
        '0389998888', // Viettel 03x
        '0521234567', // Vietnamobile 05x
        '0561234567', // Vietnamobile 05x
        '0701234567', // MobiFone 07x
        '0778901234', // MobiFone 07x
        '0812345678', // VinaPhone 08x
        '0868123456', // Viettel 08x
        '0888888888', // VinaPhone 08x
      ];

      for (const phone of validNumbers) {
        expect(isValidVietnamesePhone(phone)).toBe(true);
      }
    });

    it('sanitizes and validates phone numbers containing spaces, dots, dashes, and parentheses', () => {
      expect(isValidVietnamesePhone('0903 123 456')).toBe(true);
      expect(isValidVietnamesePhone('0989.456.789')).toBe(true);
      expect(isValidVietnamesePhone('(077) 123-4567')).toBe(true);
      expect(isValidVietnamesePhone('  0868-123-456  ')).toBe(true);
      expect(isValidVietnamesePhone('038.999.8888')).toBe(true);

      expect(sanitizePhone('0903 123 456')).toBe('0903123456');
      expect(sanitizePhone('(028) 38.123-456')).toBe('02838123456');
    });

    it('rejects phone numbers with invalid prefixes (00, 01, 02, 04, 06)', () => {
      const invalidPrefixes = [
        '0012345678', // Prefix 00
        '0123456789', // Old 11-digit prefix 01
        '0243123456', // Landline Hanoi 024
        '0283812345', // Landline HCMC 028
        '0412345678', // Invalid prefix 04
        '0612345678', // Invalid prefix 06
      ];

      for (const phone of invalidPrefixes) {
        expect(isValidVietnamesePhone(phone)).toBe(false);
      }
    });

    it('rejects numbers with wrong length (fewer or more than 10 digits)', () => {
      expect(isValidVietnamesePhone('090123456')).toBe(false); // 9 digits
      expect(isValidVietnamesePhone('09012345678')).toBe(false); // 11 digits
      expect(isValidVietnamesePhone('09')).toBe(false);
      expect(isValidVietnamesePhone('')).toBe(false);
    });

    it('rejects non-digits, letters, and empty/null/undefined inputs', () => {
      expect(isValidVietnamesePhone('090abc1234')).toBe(false);
      expect(isValidVietnamesePhone('abcdefghij')).toBe(false);
      expect(isValidVietnamesePhone('09012345!@')).toBe(false);
      expect(isValidVietnamesePhone(null)).toBe(false);
      expect(isValidVietnamesePhone(undefined)).toBe(false);
      expect(isValidVietnamesePhone(1234567890 as any)).toBe(false);

      expect(sanitizePhone(null)).toBe('');
      expect(sanitizePhone(undefined)).toBe('');
      expect(sanitizePhone('')).toBe('');
    });
  });

  describe('2. Text & Number Sanitizers (validation.ts)', () => {
    it('isNonEmptyText rejects empty strings, whitespace-only, null, and undefined', () => {
      expect(isNonEmptyText('Nguyễn Văn A')).toBe(true);
      expect(isNonEmptyText('  Hóc Môn  ')).toBe(true);
      expect(isNonEmptyText('a')).toBe(true);

      expect(isNonEmptyText('')).toBe(false);
      expect(isNonEmptyText('   ')).toBe(false);
      expect(isNonEmptyText('\t\n\r ')).toBe(false);
      expect(isNonEmptyText(null)).toBe(false);
      expect(isNonEmptyText(undefined)).toBe(false);
      expect(isNonEmptyText(123 as any)).toBe(false);
    });

    it('clampNumber safely bounds values and handles NaN, negative numbers, and non-numbers', () => {
      // Normal range clamp
      expect(clampNumber(5, 1, 10)).toBe(5);
      expect(clampNumber(0, 1, 10)).toBe(1);
      expect(clampNumber(15, 1, 10)).toBe(10);
      expect(clampNumber(10, 1, 10)).toBe(10);
      expect(clampNumber(1, 1, 10)).toBe(1);

      // Without max
      expect(clampNumber(50, 10)).toBe(50);
      expect(clampNumber(5, 10)).toBe(10);

      // NaN and non-numbers fallback
      expect(clampNumber(NaN, 1, 10, 1)).toBe(1);
      expect(clampNumber(NaN, 0, 100)).toBe(0); // fallback defaults to min
      expect(clampNumber('abc', 1, 10, 1)).toBe(1);
      expect(clampNumber(null, 0, 50, 0)).toBe(0);
      expect(clampNumber(undefined, 1, 100, 1)).toBe(1);
      expect(clampNumber('', 1, 10, 1)).toBe(1);

      // Numeric strings
      expect(clampNumber('25', 0, 100)).toBe(25);
      expect(clampNumber('  15  ', 0, 100)).toBe(15);
      expect(clampNumber('-5', 0, 100)).toBe(0);

      // Infinite numbers
      expect(clampNumber(Infinity, 0, 100, 0)).toBe(0);
      expect(clampNumber(-Infinity, 0, 100, 0)).toBe(0);
    });
  });

  describe('3. getFriendlyErrorMessage Defense & Localization (api.ts)', () => {
    it('returns polite fallback and NEVER produces [object Object]', () => {
      const fallback = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';

      expect(getFriendlyErrorMessage(null)).toBe(fallback);
      expect(getFriendlyErrorMessage(undefined)).toBe(fallback);
      expect(getFriendlyErrorMessage({})).toBe(fallback);
      expect(getFriendlyErrorMessage({ foo: 'bar' })).toBe(fallback);
      expect(getFriendlyErrorMessage('[object Object]')).toBe(fallback);
      expect(getFriendlyErrorMessage(new Error('[object Object]'))).toBe(fallback);
      expect(getFriendlyErrorMessage({ message: '[object Object]' })).toBe(fallback);
      expect(getFriendlyErrorMessage('')).toBe(fallback);
      expect(getFriendlyErrorMessage('   ')).toBe(fallback);
    });

    it('extracts messages from raw strings and Error instances', () => {
      expect(getFriendlyErrorMessage('Số lượng sản phẩm không hợp lệ')).toBe(
        'Số lượng sản phẩm không hợp lệ'
      );
      expect(getFriendlyErrorMessage(new Error('Mã giảm giá đã hết lượt'))).toBe(
        'Mã giảm giá đã hết lượt'
      );
    });

    it('handles network errors with polite Vietnamese connectivity message', () => {
      const expectedNetwork = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';

      expect(getFriendlyErrorMessage(new Error('Network Error'))).toBe(expectedNetwork);
      expect(getFriendlyErrorMessage(new TypeError('Failed to fetch'))).toBe(expectedNetwork);
      expect(getFriendlyErrorMessage({ code: 'ERR_NETWORK' })).toBe(expectedNetwork);
      expect(getFriendlyErrorMessage({ message: 'net::ERR_CONNECTION_REFUSED' })).toBe(expectedNetwork);
      expect(getFriendlyErrorMessage('Network error: request timed out')).toBe(expectedNetwork);
    });

    it('defensively handles Axios and plain response objects with message, error, or detail', () => {
      expect(
        getFriendlyErrorMessage({
          response: { status: 400, data: { message: 'Tên khách hàng là bắt buộc' } },
        })
      ).toBe('Tên khách hàng là bắt buộc');

      expect(
        getFriendlyErrorMessage({
          response: { status: 422, data: { error: 'Dữ liệu không đúng định dạng' } },
        })
      ).toBe('Dữ liệu không đúng định dạng');

      expect(
        getFriendlyErrorMessage({
          response: { data: { detail: 'Token xác thực đã hết hạn' } },
        })
      ).toBe('Token xác thực đã hết hạn');

      expect(getFriendlyErrorMessage({ message: 'Lỗi kiểm tra dữ liệu' })).toBe(
        'Lỗi kiểm tra dữ liệu'
      );
      expect(getFriendlyErrorMessage({ error: 'Lỗi truy vấn cơ sở dữ liệu' })).toBe(
        'Lỗi truy vấn cơ sở dữ liệu'
      );
      expect(getFriendlyErrorMessage({ detail: 'Chi tiết lỗi cụ thể' })).toBe('Chi tiết lỗi cụ thể');
    });

    it('handles known HTTP status codes politely when message is generic', () => {
      expect(getFriendlyErrorMessage({ response: { status: 401 } })).toContain(
        'Phiên đăng nhập đã hết hạn'
      );
      expect(getFriendlyErrorMessage({ response: { status: 403 } })).toContain(
        'không có quyền'
      );
      expect(getFriendlyErrorMessage({ response: { status: 404 } })).toContain(
        'Không tìm thấy'
      );
      expect(getFriendlyErrorMessage({ response: { status: 409 } })).toContain(
        'Đơn hàng vừa được cập nhật bởi người khác'
      );
      expect(getFriendlyErrorMessage({ response: { status: 500 } })).toContain(
        'Lỗi hệ thống máy chủ'
      );
      expect(getFriendlyErrorMessage({ response: { status: 503 } })).toContain(
        'Hệ thống máy chủ đang bận'
      );
    });

    it('handles ApiError instances correctly with specific business codes', () => {
      const paymentErr = new ApiError('Not confirmed', 400, 'PAYMENT_NOT_CONFIRMED');
      expect(getFriendlyErrorMessage(paymentErr)).toBe(
        'Đơn hàng chuyển khoản ngân hàng phải được xác nhận thanh toán (PAID) trước khi đóng gói.'
      );

      const conflictErr = new ApiError('Conflict', 409);
      expect(getFriendlyErrorMessage(conflictErr)).toBe(
        'Đơn hàng vừa được cập nhật bởi người khác, đã tải lại dữ liệu mới'
      );

      const skuErr = new ApiError('Mã SKU đã tồn tại', 409, 'DUPLICATE_SKU');
      expect(getFriendlyErrorMessage(skuErr)).toBe('Mã SKU đã tồn tại');
    });
  });

  describe('4. Cart Store NaN and Negative Number Hardening (useCartStore.ts)', () => {
    beforeEach(() => {
      useCartStore.getState().clearCart();
    });

    it('adds items safely and guards against NaN quantity in addItem', () => {
      const testItem = {
        id: 'test-item-1',
        sku: 'TEST-SKU-1',
        name: 'Ống Nhựa Bình Minh',
        price: '50.000 ₫',
        unitPrice: 50000,
        image: '',
      };

      // Add with NaN quantity -> defaults to 1
      useCartStore.getState().addItem({ ...testItem, quantity: NaN as any }, false);
      let items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(1);
      expect(useCartStore.getState().getTotalPrice()).toBe(50000);

      // Add again with valid quantity 2 -> total becomes 3
      useCartStore.getState().addItem({ ...testItem, quantity: 2 }, false);
      items = useCartStore.getState().items;
      expect(items[0].quantity).toBe(3);
      expect(useCartStore.getState().getTotalPrice()).toBe(150000);
      expect(useCartStore.getState().getTotalItems()).toBe(3);
    });

    it('ignores setQuantity when qty is NaN or not a number, keeping cart intact', () => {
      const testItem = {
        id: 'test-item-2',
        sku: 'TEST-SKU-2',
        name: 'Dây Điện Cadivi',
        price: '20.000 ₫',
        unitPrice: 20000,
        image: '',
        quantity: 5,
      };

      useCartStore.getState().addItem(testItem, false);
      expect(useCartStore.getState().items[0].quantity).toBe(5);

      // Try setting NaN
      useCartStore.getState().setQuantity('test-item-2', NaN);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
      expect(useCartStore.getState().getTotalPrice()).toBe(100000);

      // Try setting non-numbers
      useCartStore.getState().setQuantity('test-item-2', undefined as any);
      expect(useCartStore.getState().items[0].quantity).toBe(5);

      useCartStore.getState().setQuantity('test-item-2', '10' as any);
      expect(useCartStore.getState().items[0].quantity).toBe(5);

      useCartStore.getState().setQuantity('test-item-2', Infinity as any);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('removes item when setQuantity is <= 0 without corrupting cart', () => {
      const testItem = {
        id: 'test-item-3',
        sku: 'TEST-SKU-3',
        name: 'Aptomat Panasonic',
        price: '100.000 ₫',
        unitPrice: 100000,
        image: '',
        quantity: 2,
      };

      useCartStore.getState().addItem(testItem, false);
      expect(useCartStore.getState().items).toHaveLength(1);

      // Set to 0 -> removes item cleanly
      useCartStore.getState().setQuantity('test-item-3', 0);
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
      expect(useCartStore.getState().getTotalItems()).toBe(0);

      // Add again and set negative quantity -> removes item cleanly
      useCartStore.getState().addItem(testItem, false);
      useCartStore.getState().setQuantity('test-item-3', -3);
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });

    it('floors fractional quantities in setQuantity', () => {
      const testItem = {
        id: 'test-item-4',
        sku: 'TEST-SKU-4',
        name: 'Co 90 độ Bình Minh',
        price: '15.000 ₫',
        unitPrice: 15000,
        image: '',
        quantity: 1,
      };

      useCartStore.getState().addItem(testItem, false);
      useCartStore.getState().setQuantity('test-item-4', 4.8);
      expect(useCartStore.getState().items[0].quantity).toBe(4);
      expect(useCartStore.getState().getTotalPrice()).toBe(60000);
    });

    it('never produces NaN in getTotalPrice or getTotalItems', () => {
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
      expect(Number.isNaN(useCartStore.getState().getTotalPrice())).toBe(false);
      expect(useCartStore.getState().getTotalItems()).toBe(0);
      expect(Number.isNaN(useCartStore.getState().getTotalItems())).toBe(false);
    });
  });
});
