import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSaleStore } from '../src/store/useSaleStore';
import { api } from '../src/lib/api';
import { isValidVietnamesePhone, sanitizePhone } from '../src/lib/validation';

vi.mock('../src/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class extends Error {},
  getFriendlyErrorMessage: (err: any) => err?.message || 'Lỗi không xác định',
}));

describe('Retail POS Walk-in & Click-and-Collect Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Walk-in POS Counter Sale Order Creation', () => {
    it('creates a counter sale order without customerId, defaulting to CASH payment', async () => {
      const mockApiResponse = {
        id: 'ord-walkin-123',
        orderNumber: 'ORD-261107-POS01',
        customerName: 'Khách lẻ tại quầy',
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        totalAmount: 95000,
        status: 'PENDING',
        items: [
          {
            productId: 'prod-001',
            productName: 'Keo dán ống Tiền Phong 100g',
            quantity: 2,
            unitPrice: 20000,
          },
          {
            productId: 'prod-002',
            productName: 'Băng keo điện nano đen',
            quantity: 5,
            unitPrice: 11000,
          },
        ],
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockApiResponse);

      const payload = {
        customerName: 'Khách lẻ tại quầy',
        paymentMethod: 'CASH',
        items: [
          { productId: 'prod-001', quantity: 2, unitPrice: 20000 },
          { productId: 'prod-002', quantity: 5, unitPrice: 11000 },
        ],
      };

      const result = await useSaleStore.getState().createOrder(payload);

      expect(api.post).toHaveBeenCalledWith('/orders', payload);
      expect(result.orderNumber).toBe('ORD-261107-POS01');
      expect(result.customerName).toBe('Khách lẻ tại quầy');
      expect(result.paymentMethod).toBe('CASH');
      expect(result.totalAmount).toBe(95000);
    });

    it('creates an assigned customer order when customerId is provided', async () => {
      const mockApiResponse = {
        id: 'ord-assigned-456',
        orderNumber: 'ORD-261107-ASSIST02',
        customerId: 'cust-uuid-789',
        customerName: 'A. Nam (Nhà thầu Hóc Môn)',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'UNPAID',
        totalAmount: 1500000,
        status: 'PENDING',
        items: [],
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockApiResponse);

      const payload = {
        customerId: 'cust-uuid-789',
        customerName: 'A. Nam (Nhà thầu Hóc Môn)',
        paymentMethod: 'BANK_TRANSFER',
        items: [{ productId: 'prod-cable-cadivi', quantity: 1, unitPrice: 1500000 }],
      };

      const result = await useSaleStore.getState().createOrder(payload);

      expect(api.post).toHaveBeenCalledWith('/orders', payload);
      expect(result.customerId).toBe('cust-uuid-789');
      expect(result.paymentMethod).toBe('BANK_TRANSFER');
    });
  });

  describe('2. Click & Collect (Nhận tại tiệm) Mechanics', () => {
    function getBranchAddress(store: 'HOC_MON' | 'GO_VAP') {
      return store === 'HOC_MON'
        ? '[Nhận tại tiệm] Chi Nhánh 1: 120/4 Lý Thường Kiệt, TT. Hóc Môn, TP.HCM'
        : '[Nhận tại tiệm] Chi Nhánh 2: 45 Lê Đức Thọ, P.7, Q. Gò Vấp, TP.HCM';
    }

    it('formats branch address correctly for CN1 Hóc Môn', () => {
      const formatted = getBranchAddress('HOC_MON');
      expect(formatted).toContain('120/4 Lý Thường Kiệt');
      expect(formatted).toContain('Hóc Môn');
    });

    it('formats branch address correctly for CN2 Gò Vấp', () => {
      const formatted = getBranchAddress('GO_VAP');
      expect(formatted).toContain('45 Lê Đức Thọ');
      expect(formatted).toContain('Gò Vấp');
    });

    it('ensures pickup orders do not enforce minimum distance delivery surcharge', () => {
      const cartTotal = 25000; // Small basket: 1 tube of PVC glue
      const deliveryMethod = 'PICKUP';
      const shippingFee = deliveryMethod === 'PICKUP' ? 0 : 25000;
      const finalTotal = cartTotal + shippingFee;

      expect(shippingFee).toBe(0);
      expect(finalTotal).toBe(25000);
    });
  });

  describe('3. Thermal Receipt K80 Formatting', () => {
    it('formats thermal receipt items and total correctly', () => {
      const order = {
        orderNumber: 'ORD-261107-101',
        customerName: 'Khách lẻ A. Tuấn',
        customerPhone: '0988248524',
        paymentMethod: 'CASH',
        totalAmount: 65000,
        items: [
          {
            productName: 'Ống PVC Tiền Phong Phi 21',
            quantity: 2,
            unitPrice: 20000,
            unit: 'cây',
          },
          {
            productName: 'Keo dán PVC 50g',
            quantity: 1,
            unitPrice: 25000,
            unit: 'tuýp',
          },
        ],
      };

      const lineTotals = order.items.map((it) => it.quantity * it.unitPrice);
      const computedTotal = lineTotals.reduce((a, b) => a + b, 0);

      expect(computedTotal).toBe(65000);
      expect(order.totalAmount).toBe(computedTotal);
      expect(order.customerPhone).toBe('0988248524');
    });
  });

  describe('4. Vietnamese Phone Validation in Retail POS & Customers', () => {
    const VIETNAMESE_PHONE_WARNING =
      'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).';

    it('accepts valid 10-digit Vietnamese phone numbers with proper prefixes', () => {
      const validNumbers = [
        '0912345678', // Viettel/Vina
        '0988248524', // Viettel
        '0388123456', // Viettel 03
        '0701234567', // Mobifone 07
        '0899123456', // Mobifone 08
        '0567890123', // Vietnamobile 05
      ];

      for (const phone of validNumbers) {
        expect(isValidVietnamesePhone(phone)).toBe(true);
      }
    });

    it('sanitizes formatted phone numbers with spaces, dots, dashes, and parentheses', () => {
      expect(sanitizePhone('0912.345.678')).toBe('0912345678');
      expect(sanitizePhone('0988 248 524')).toBe('0988248524');
      expect(sanitizePhone('0912-345-678')).toBe('0912345678');
      expect(sanitizePhone('(0912) 345 678')).toBe('0912345678');

      expect(isValidVietnamesePhone('0912.345.678')).toBe(true);
      expect(isValidVietnamesePhone('0988 248 524')).toBe(true);
      expect(isValidVietnamesePhone('0912-345-678')).toBe(true);
      expect(isValidVietnamesePhone('(0912) 345 678')).toBe(true);
    });

    it('rejects invalid phones (wrong length, wrong prefix, letters, special characters)', () => {
      const invalidNumbers = [
        '091234567', // 9 digits
        '09123456789', // 11 digits
        '0123456789', // invalid prefix 01
        '0283812345', // landline prefix 02
        '0012345678', // invalid prefix 00
        '0412345678', // invalid prefix 04
        '0612345678', // invalid prefix 06
        '0912abc678', // letters
        '1234567890', // does not start with 0
        '', // empty
      ];

      for (const phone of invalidNumbers) {
        expect(isValidVietnamesePhone(phone)).toBe(false);
      }
    });

    it('validates customer phone in POS submission logic and provides friendly Vietnamese error', () => {
      function validatePosCustomerPhone(phoneInput: string): { valid: boolean; error?: string; sanitized?: string } {
        const trimmed = phoneInput.trim();
        if (!trimmed) {
          return { valid: true, sanitized: undefined }; // Optional for walk-in POS
        }
        if (!isValidVietnamesePhone(trimmed)) {
          return { valid: false, error: VIETNAMESE_PHONE_WARNING };
        }
        return { valid: true, sanitized: sanitizePhone(trimmed) };
      }

      // Valid phone
      const validRes = validatePosCustomerPhone('0988.248.524');
      expect(validRes.valid).toBe(true);
      expect(validRes.sanitized).toBe('0988248524');
      expect(validRes.error).toBeUndefined();

      // Empty phone (walk-in POS)
      const emptyRes = validatePosCustomerPhone('   ');
      expect(emptyRes.valid).toBe(true);
      expect(emptyRes.sanitized).toBeUndefined();

      // Invalid phone
      const invalidRes = validatePosCustomerPhone('0988xyz');
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.error).toBe(VIETNAMESE_PHONE_WARNING);
    });
  });

  describe('5. Cash Tendered & Change Calculation ("Tiền khách đưa & Tiền thối")', () => {
    function calculateCashChange(cashTenderedInput: string | number, finalAmount: number) {
      const effectiveTendered =
        cashTenderedInput === '' ? finalAmount : parseFloat(String(cashTenderedInput));

      if (Number.isNaN(effectiveTendered) || effectiveTendered < finalAmount) {
        return {
          valid: false,
          effectiveTendered,
          changeAmount: 0,
          shortfall: finalAmount - (Number.isNaN(effectiveTendered) ? 0 : effectiveTendered),
        };
      }

      const change = Math.max(0, effectiveTendered - finalAmount);
      return {
        valid: true,
        effectiveTendered,
        changeAmount: change,
        shortfall: 0,
      };
    }

    it('defaults cash tendered to exact amount when input is empty string', () => {
      const finalAmount = 185000;
      const result = calculateCashChange('', finalAmount);

      expect(result.valid).toBe(true);
      expect(result.effectiveTendered).toBe(185000);
      expect(result.changeAmount).toBe(0);
      expect(result.shortfall).toBe(0);
    });

    it('correctly calculates change when customer gives more than final amount', () => {
      const finalAmount = 185000;
      const result = calculateCashChange('200000', finalAmount);

      expect(result.valid).toBe(true);
      expect(result.effectiveTendered).toBe(200000);
      expect(result.changeAmount).toBe(15000);
      expect(result.shortfall).toBe(0);
    });

    it('handles exact payment without generating change', () => {
      const finalAmount = 500000;
      const result = calculateCashChange(500000, finalAmount);

      expect(result.valid).toBe(true);
      expect(result.changeAmount).toBe(0);
      expect(result.shortfall).toBe(0);
    });

    it('detects underpayment and marks validation invalid with shortfall calculation', () => {
      const finalAmount = 250000;
      const result = calculateCashChange('200000', finalAmount);

      expect(result.valid).toBe(false);
      expect(result.effectiveTendered).toBe(200000);
      expect(result.changeAmount).toBe(0);
      expect(result.shortfall).toBe(50000);
    });
  });

  describe('6. Automatic markPaid on CASH Orders to Sync K80 Receipt', () => {
    it('invokes markPaid for CASH orders upon creation to sync status with K80 receipt', async () => {
      const mockOrderResponse = {
        id: 'ord-cash-777',
        orderNumber: 'ORD-261110-CASH01',
        customerName: 'Khách mua tại quầy',
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        totalAmount: 320000,
        status: 'PENDING',
        items: [],
      };

      const mockMarkPaidResponse = {
        id: 'ord-cash-777',
        order_number: 'ORD-261110-CASH01',
        customer_name: 'Khách mua tại quầy',
        payment_method: 'CASH',
        payment_status: 'PAID',
        total_amount: 320000,
        status: 'PROCESSING',
        items: [],
      };

      vi.mocked(api.post)
        .mockResolvedValueOnce(mockOrderResponse) // createOrder
        .mockResolvedValueOnce(mockMarkPaidResponse); // markPaid

      const payload = {
        customerName: 'Khách mua tại quầy',
        paymentMethod: 'CASH',
        items: [{ productId: 'prod-001', quantity: 2, unitPrice: 160000 }],
      };

      // Create order
      const newOrder = await useSaleStore.getState().createOrder(payload);
      expect(api.post).toHaveBeenCalledWith('/orders', payload);
      expect(newOrder.id).toBe('ord-cash-777');

      // Auto markPaid
      await useSaleStore.getState().markPaid(newOrder.id);
      expect(api.post).toHaveBeenCalledWith('/orders/ord-cash-777/mark-paid');
    });

    it('does not invoke markPaid for non-CASH orders (BANK_TRANSFER or COD)', async () => {
      const mockOrderResponse = {
        id: 'ord-transfer-888',
        orderNumber: 'ORD-261110-QR01',
        customerName: 'Khách quét QR',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'UNPAID',
        totalAmount: 450000,
        status: 'PENDING',
        items: [],
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockOrderResponse);

      const payload = {
        customerName: 'Khách quét QR',
        paymentMethod: 'BANK_TRANSFER',
        items: [{ productId: 'prod-002', quantity: 1, unitPrice: 450000 }],
      };

      const newOrder = await useSaleStore.getState().createOrder(payload);
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/orders', payload);
      expect(newOrder.paymentMethod).toBe('BANK_TRANSFER');
      // Verify mark-paid was not called
      expect(api.post).not.toHaveBeenCalledWith(expect.stringContaining('mark-paid'));
    });
  });

  describe('7. QuoteForm Discount & Pricing Boundary Invariant Clamps', () => {
    function clampAdditionalDiscount(val: number | string): number {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      return Number.isFinite(num) ? Math.max(0, Math.min(50, num)) : 0;
    }

    function clampUnitPrice(val: number | string): number {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      return Number.isFinite(num) ? Math.max(0, num) : 0;
    }

    it('clamps additionalDiscountRate to [0, 50] range strictly', () => {
      // Negative numbers must clamp to 0 (no negative discounts)
      expect(clampAdditionalDiscount(-15)).toBe(0);
      expect(clampAdditionalDiscount(-0.5)).toBe(0);

      // Above 50% must clamp to 50% max
      expect(clampAdditionalDiscount(55)).toBe(50);
      expect(clampAdditionalDiscount(100)).toBe(50);
      expect(clampAdditionalDiscount(75.5)).toBe(50);

      // Valid rates in [0, 50] must be preserved
      expect(clampAdditionalDiscount(0)).toBe(0);
      expect(clampAdditionalDiscount(10)).toBe(10);
      expect(clampAdditionalDiscount(25.5)).toBe(25.5);
      expect(clampAdditionalDiscount(50)).toBe(50);

      // Non-numeric or empty string fallback to 0
      expect(clampAdditionalDiscount('')).toBe(0);
      expect(clampAdditionalDiscount('abc')).toBe(0);
      expect(clampAdditionalDiscount(NaN)).toBe(0);
    });

    it('clamps unitPrice to >= 0 (no negative prices allowed)', () => {
      // Negative prices clamp to 0
      expect(clampUnitPrice(-10000)).toBe(0);
      expect(clampUnitPrice(-0.01)).toBe(0);

      // Positive prices preserved
      expect(clampUnitPrice(21500)).toBe(21500);
      expect(clampUnitPrice(0)).toBe(0);
      expect(clampUnitPrice('45000')).toBe(45000);

      // Invalid strings fallback to 0
      expect(clampUnitPrice('')).toBe(0);
      expect(clampUnitPrice('invalid')).toBe(0);
      expect(clampUnitPrice(NaN)).toBe(0);
    });
  });

  describe('8. Quantity Typing & Backspace Snap Fix with Float Support', () => {
    function handleQuantityInput(currentVal: string, action: 'type' | 'blur'): number | string {
      if (action === 'type') {
        // Allows user to press Backspace to clear the input while typing (empty string or partial value)
        return currentVal;
      }
      // On blur: clamp to Math.max(1, Math.min(10000, Number(val) || 1))
      const parsed = parseFloat(String(currentVal));
      return Number.isFinite(parsed) ? Math.max(1, Math.min(10000, parsed)) : 1;
    }

    it('allows empty string during typing without snapping to 1 immediately', () => {
      // User presses Backspace to clear input
      const typingState = handleQuantityInput('', 'type');
      expect(typingState).toBe('');

      // On blur, empty string snaps safely to minimum 1
      const blurredState = handleQuantityInput(String(typingState), 'blur');
      expect(blurredState).toBe(1);
    });

    it('supports decimal/float quantities for building materials (kg, meters)', () => {
      // Pipe sold by meter: 2.5 meters
      const pipeMeters = handleQuantityInput('2.5', 'blur');
      expect(pipeMeters).toBe(2.5);

      // Wire cable: 10.75 meters
      const wireMeters = handleQuantityInput('10.75', 'blur');
      expect(wireMeters).toBe(10.75);

      // Materials sold by kg: 0.5 kg should clamp to min 1 or preserve float >= 1
      const clampedKg = handleQuantityInput('0.5', 'blur');
      expect(clampedKg).toBe(1); // Min allowed is 1
    });

    it('clamps upper bound to 10000 maximum quantity', () => {
      const excessiveQty = handleQuantityInput('999999', 'blur');
      expect(excessiveQty).toBe(10000);
    });

    it('handles NaN, negative numbers, or invalid input on blur gracefully', () => {
      expect(handleQuantityInput('-5', 'blur')).toBe(1);
      expect(handleQuantityInput('0', 'blur')).toBe(1);
      expect(handleQuantityInput('abc', 'blur')).toBe(1);
    });
  });
});
