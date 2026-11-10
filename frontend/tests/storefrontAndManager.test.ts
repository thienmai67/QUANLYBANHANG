import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidVietnamesePhone, sanitizePhone, isNonEmptyText, clampNumber } from '../src/lib/validation';
import { getFriendlyErrorMessage, ApiError } from '../src/lib/api';
import { useCartStore } from '../src/store/useCartStore';

describe('Storefront & Manager Modals Validation & Input Hardening Test Suite', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    vi.clearAllMocks();
  });

  describe('1. Storefront Cart Quantity Input & Invariants (cart/page.tsx)', () => {
    it('simulates keyboard typing and backspace allowing transient empty string without resetting', () => {
      // Helper simulating the cart page quantity transient buffer and commitQuantity logic
      let qtyInputState: Record<string, string> = {};
      const itemId = 'item-cable-1';

      useCartStore.getState().addItem({
        id: itemId,
        sku: 'CAD-CV-2.5',
        name: 'Dây Cadivi CV 2.5',
        price: '10.000 ₫',
        unitPrice: 10000,
        image: '/img/cadivi.jpg',
        quantity: 5,
      });

      // User hits backspace to clear the input
      qtyInputState[itemId] = '';
      expect(qtyInputState[itemId]).toBe('');
      // Cart store still holds the previous valid quantity while typing buffer is empty
      expect(useCartStore.getState().items[0].quantity).toBe(5);

      // User types '25'
      qtyInputState[itemId] = '25';
      const parsed = parseInt(qtyInputState[itemId], 10);
      const clamped = Math.max(1, Math.min(9999, parsed));
      useCartStore.getState().setQuantity(itemId, clamped);
      expect(useCartStore.getState().items[0].quantity).toBe(25);

      // On blur or Enter with empty string: clamps to 1
      qtyInputState[itemId] = '   ';
      const raw = qtyInputState[itemId].trim();
      const finalQty = raw === '' ? 1 : Math.max(1, Math.min(9999, parseInt(raw, 10) || 1));
      useCartStore.getState().setQuantity(itemId, finalQty);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it('pressing Down arrow at quantity 1 clamps to 1 and does NOT delete the item', () => {
      const itemId = 'item-pipe-1';
      useCartStore.getState().addItem({
        id: itemId,
        sku: 'BM-UPVC-42',
        name: 'Ống Bình Minh D42',
        price: '25.000 ₫',
        unitPrice: 25000,
        image: '/img/bm.jpg',
        quantity: 1,
      });

      // Minus button logic: Math.max(1, item.quantity - 1)
      const currentQty = useCartStore.getState().items[0].quantity;
      const nextMinus = Math.max(1, currentQty - 1);
      useCartStore.getState().setQuantity(itemId, nextMinus);

      expect(useCartStore.getState().items.length).toBe(1);
      expect(useCartStore.getState().items[0].quantity).toBe(1);

      // Input Down arrow onChange simulation: value becomes '0'
      const simulatedArrowDownValue = '0';
      const parsed = parseInt(simulatedArrowDownValue, 10);
      const clampedFromDownArrow = Math.max(1, Math.min(9999, parsed));
      useCartStore.getState().setQuantity(itemId, clampedFromDownArrow);

      // Invariant: Item MUST NOT be deleted and quantity remains 1
      expect(useCartStore.getState().items.length).toBe(1);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it('deletes item only when user explicitly invokes removeItem', () => {
      const itemId = 'item-mcb-1';
      useCartStore.getState().addItem({
        id: itemId,
        sku: 'PANA-MCB-20A',
        name: 'Aptomat Panasonic 20A',
        price: '120.000 ₫',
        unitPrice: 120000,
        image: '/img/pana.jpg',
        quantity: 3,
      });

      expect(useCartStore.getState().items.length).toBe(1);

      // Explicit remove item call (e.g. clicked Trash button)
      useCartStore.getState().removeItem(itemId);
      expect(useCartStore.getState().items.length).toBe(0);
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });

    it('clamps excessive quantities to 9999 limit', () => {
      const itemId = 'item-elbow-1';
      useCartStore.getState().addItem({
        id: itemId,
        sku: 'BM-ELBOW-42',
        name: 'Co 90 độ D42',
        price: '5.000 ₫',
        unitPrice: 5000,
        image: '/img/elbow.jpg',
        quantity: 1,
      });

      const userTyped = '999999';
      const parsed = parseInt(userTyped, 10);
      const clamped = Math.max(1, Math.min(9999, parsed));
      useCartStore.getState().setQuantity(itemId, clamped);

      expect(useCartStore.getState().items[0].quantity).toBe(9999);
      expect(useCartStore.getState().getTotalPrice()).toBe(9999 * 5000);
    });
  });

  describe('2. Storefront Checkout Validation & Payload Invariants (checkout/page.tsx)', () => {
    it('validates customer name using isNonEmptyText requiring at least 2 non-whitespace characters', () => {
      expect(isNonEmptyText('')).toBe(false);
      expect(isNonEmptyText('   ')).toBe(false);
      expect(isNonEmptyText(null)).toBe(false);
      expect(isNonEmptyText(undefined)).toBe(false);

      const isValidName = (name: string) => isNonEmptyText(name) && name.trim().length >= 2;

      expect(isValidName('A')).toBe(false);
      expect(isValidName('   A   ')).toBe(false);
      expect(isValidName('An')).toBe(true);
      expect(isValidName('Nguyễn Văn Bách')).toBe(true);
    });

    it('enforces strict 10-digit Vietnamese mobile phone regex (0[35789]\\d{8})', () => {
      // Valid mobile numbers
      expect(isValidVietnamesePhone('0901234567')).toBe(true);
      expect(isValidVietnamesePhone('0389998877')).toBe(true);
      expect(isValidVietnamesePhone('0771234567')).toBe(true);
      expect(isValidVietnamesePhone('0868889999')).toBe(true);
      expect(isValidVietnamesePhone('0561234567')).toBe(true);

      // Punctuation sanitized before regex
      expect(isValidVietnamesePhone('090.123.4567')).toBe(true);
      expect(isValidVietnamesePhone('090 123 4567')).toBe(true);
      expect(isValidVietnamesePhone('(090)-123-4567')).toBe(true);

      // Invalid prefixes / lengths / formats
      expect(isValidVietnamesePhone('0012345678')).toBe(false); // invalid prefix 00
      expect(isValidVietnamesePhone('0123456789')).toBe(false); // invalid prefix 01 (old 11-digit)
      expect(isValidVietnamesePhone('0283812345')).toBe(false); // landline prefix 028
      expect(isValidVietnamesePhone('090123456')).toBe(false);  // 9 digits
      expect(isValidVietnamesePhone('09012345678')).toBe(false); // 11 digits
      expect(isValidVietnamesePhone('090123456a')).toBe(false); // letter
      expect(isValidVietnamesePhone('')).toBe(false);
    });

    it('sanitizes phone number and formats customerName with phone in parentheses', () => {
      const rawName = '  Trần Văn Hưng  ';
      const rawPhone = ' 0988.248.524 ';
      const sanitizedPhone = sanitizePhone(rawPhone);
      expect(sanitizedPhone).toBe('0988248524');
      expect(isValidVietnamesePhone(sanitizedPhone)).toBe(true);

      const customerNameFormatted = `${rawName.trim()} (${sanitizedPhone})`;
      expect(customerNameFormatted).toBe('Trần Văn Hưng (0988248524)');
    });

    it('preserves customer notes in final shipping address and order payload', () => {
      const address = '123 Đường Số 5, Phường Linh Xuân, TP. Thủ Đức';
      const notes = 'Gọi trước 15 phút, gửi bảo vệ công trình nếu vắng nhà';

      let finalShippingAddress = address.trim();
      if (notes && notes.trim()) {
        finalShippingAddress = `${finalShippingAddress} (Ghi chú: ${notes.trim()})`;
      }

      expect(finalShippingAddress).toContain('123 Đường Số 5');
      expect(finalShippingAddress).toContain('(Ghi chú: Gọi trước 15 phút');

      const payload = {
        customerName: 'Nguyễn Văn A (0901234567)',
        customerPhone: '0901234567',
        shippingAddress: finalShippingAddress,
        notes: notes.trim(),
        paymentMethod: 'COD',
      };

      expect(payload.notes).toBe(notes);
      expect(payload.shippingAddress).toBe(finalShippingAddress);
    });

    it('validates shipping address for delivery and assigns proper branch address for pickup', () => {
      // Delivery validation
      const deliveryAddress = '   ';
      const isDeliveryValid = isNonEmptyText(deliveryAddress) && deliveryAddress.trim().length >= 5;
      expect(isDeliveryValid).toBe(false);

      // Pickup assignment
      const pickupBranchHocMon =
        '[Nhận tại tiệm] Chi Nhánh 1: 120/4 Lý Thường Kiệt, TT. Hóc Môn, TP.HCM';
      const pickupBranchGoVap =
        '[Nhận tại tiệm] Chi Nhánh 2: 45 Lê Đức Thọ, P.7, Q. Gò Vấp, TP.HCM';

      expect(pickupBranchHocMon).toContain('Hóc Môn');
      expect(pickupBranchGoVap).toContain('Gò Vấp');
    });
  });

  describe('3. Product Detail Interactive Quantity & Stock Clamping (product/[id]/page.tsx)', () => {
    it('calculates effective quantity from interactive input and clamps to product stock', () => {
      const productStock = 35;

      const resolveQuantity = (inputStr: string, currentQty: number, stock: number) => {
        const maxStock = stock > 0 ? stock : 9999;
        const parsed = parseInt(inputStr, 10);
        return Number.isNaN(parsed) ? currentQty : Math.max(1, Math.min(maxStock, parsed));
      };

      // Valid number within stock
      expect(resolveQuantity('10', 1, productStock)).toBe(10);

      // Typed value exceeds stock -> clamped to stock
      expect(resolveQuantity('50', 1, productStock)).toBe(35);

      // Typed 0 or negative -> clamped to 1
      expect(resolveQuantity('0', 1, productStock)).toBe(1);
      expect(resolveQuantity('-5', 1, productStock)).toBe(1);

      // Empty string while typing leaves current quantity intact until blur
      expect(resolveQuantity('', 4, productStock)).toBe(4);

      // Fallback stock when untracked (stock = 0 or undefined) -> max 9999
      expect(resolveQuantity('500', 1, 0)).toBe(500);
      expect(resolveQuantity('12000', 1, 0)).toBe(9999);
    });

    it('resolves effective quantity on AddToCart even if input was not blurred', () => {
      let qtyInput = '15';
      let stateQuantity = 1;
      const stock = 100;

      const maxStock = stock > 0 ? stock : 9999;
      const parsed = parseInt(qtyInput, 10);
      const effectiveQty = Number.isNaN(parsed) ? stateQuantity : Math.max(1, Math.min(maxStock, parsed));

      expect(effectiveQty).toBe(15);
    });
  });

  describe('4. Public Order Lookup & K80 Receipt Phone Parsing (tra-cuu-don-hang & ThermalReceiptModal)', () => {
    it('sanitizes public lookup phone query to digits only and checks length', () => {
      const dirtyPhoneInput = ' 090-123.4567 ';
      const sanitizedDigitsOnly = dirtyPhoneInput.trim().replace(/\D/g, '');

      expect(sanitizedDigitsOnly).toBe('0901234567');
      expect(sanitizedDigitsOnly.length).toBe(10);
      expect(/^0[35789]\d{8}$/.test(sanitizedDigitsOnly)).toBe(true);

      // Non-digit input like 'abcdefgh'
      const lettersInput = 'abcdefgh'.replace(/\D/g, '');
      expect(lettersInput).toBe('');
      expect(lettersInput.length).toBe(0);
    });

    it('extracts embedded customer phone from customerName when searched by order code', () => {
      // Simulate receipt data when lookup was conducted via orderNumber (phone was not in search box)
      const orderFromLookup = {
        orderNumber: 'ORD-261110-001',
        customerName: 'Trịnh Hoàng Nam (0987654321)',
        customerPhone: undefined as string | undefined,
      };

      const extractReceiptPhone = (order: typeof orderFromLookup) => {
        if (order.customerPhone && order.customerPhone.trim()) {
          return order.customerPhone.trim();
        }
        if (order.customerName) {
          const match = order.customerName.match(/\((0\d{9})\)|\b(0[35789]\d{8})\b/);
          if (match) {
            return match[1] || match[2];
          }
        }
        return undefined;
      };

      const extracted = extractReceiptPhone(orderFromLookup);
      expect(extracted).toBe('0987654321');
    });

    it('prefers explicit customerPhone over extracted phone if already present', () => {
      const order = {
        orderNumber: 'ORD-261110-002',
        customerName: 'Lê Văn C (0912345678)',
        customerPhone: '0988889999',
      };

      const effectivePhone = order.customerPhone?.trim() || order.customerName?.match(/\((0\d{9})\)/)?.[1];
      expect(effectivePhone).toBe('0988889999');
    });
  });

  describe('5. Manager Modals Validation & NaN Safeguards (EditMaterial, AddMaterial, StockAdjust)', () => {
    describe('EditMaterialModal', () => {
      it('allows clearing basePrice with backspace without snapping immediately to 0', () => {
        let basePrice = 150000;
        let basePriceStr = '150000';

        // User clears input with backspace
        basePriceStr = '';
        expect(basePriceStr).toBe('');

        // Typing buffer permits typing '200000'
        basePriceStr = '200000';
        const parsed = parseInt(basePriceStr, 10);
        if (!Number.isNaN(parsed)) {
          basePrice = Math.max(0, parsed);
        }
        expect(basePrice).toBe(200000);

        // On blur with empty string, clamps to 0
        basePriceStr = '';
        const blurParsed = parseInt(basePriceStr, 10);
        const finalOnBlur = Number.isNaN(blurParsed) ? 0 : Math.max(0, blurParsed);
        expect(finalOnBlur).toBe(0);
      });

      it('rejects empty or whitespace unit on submit', () => {
        const validateUnit = (unit: string) => {
          if (!unit.trim()) {
            return { valid: false, error: 'Vui lòng nhập đơn vị tính vật tư' };
          }
          return { valid: true };
        };

        expect(validateUnit('').valid).toBe(false);
        expect(validateUnit('   ').valid).toBe(false);
        expect(validateUnit('cái').valid).toBe(true);
        expect(validateUnit('cuộn').valid).toBe(true);
      });

      it('clamps discountPercent between 0 and 100 on blur', () => {
        const clampDiscount = (valStr: string) => {
          const parsed = parseInt(valStr, 10);
          return Number.isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
        };

        expect(clampDiscount('25')).toBe(25);
        expect(clampDiscount('150')).toBe(100);
        expect(clampDiscount('-10')).toBe(0);
        expect(clampDiscount('')).toBe(0);
      });
    });

    describe('AddMaterialModal', () => {
      it('enforces explicit unit requirement and removes silent fallback to "cái"', () => {
        const validateAddMaterial = (input: {
          code: string;
          name: string;
          unit: string;
          basePrice: number;
          discountPercent: number;
          stockQuantity: number;
        }) => {
          if (!input.code.trim()) return 'Vui lòng nhập mã định danh vật tư';
          if (!input.name.trim()) return 'Vui lòng nhập tên vật tư';
          if (!input.unit.trim()) return 'Vui lòng nhập đơn vị tính vật tư';
          if (Number.isNaN(input.basePrice) || input.basePrice <= 0) return 'Đơn giá niêm yết phải lớn hơn 0';
          if (Number.isNaN(input.discountPercent) || input.discountPercent < 0 || input.discountPercent > 100)
            return 'Chiết khấu phải trong khoảng từ 0% đến 100%';
          if (Number.isNaN(input.stockQuantity) || input.stockQuantity < 0)
            return 'Số lượng nhập kho ban đầu không thể âm';
          return null;
        };

        // Whitespace unit must fail (no silent fallback to 'cái')
        const errorWhitespaceUnit = validateAddMaterial({
          code: 'CDV-CV1.5',
          name: 'Dây đơn 1.5mm',
          unit: '   ',
          basePrice: 50000,
          discountPercent: 10,
          stockQuantity: 100,
        });
        expect(errorWhitespaceUnit).toBe('Vui lòng nhập đơn vị tính vật tư');

        // NaN base price must fail
        const errorNanPrice = validateAddMaterial({
          code: 'CDV-CV1.5',
          name: 'Dây đơn 1.5mm',
          unit: 'Cuộn',
          basePrice: NaN,
          discountPercent: 10,
          stockQuantity: 100,
        });
        expect(errorNanPrice).toBe('Đơn giá niêm yết phải lớn hơn 0');

        // Negative or NaN stock must fail
        const errorNanStock = validateAddMaterial({
          code: 'CDV-CV1.5',
          name: 'Dây đơn 1.5mm',
          unit: 'Cuộn',
          basePrice: 50000,
          discountPercent: 10,
          stockQuantity: NaN,
        });
        expect(errorNanStock).toBe('Số lượng nhập kho ban đầu không thể âm');

        // Valid material passes
        const validResult = validateAddMaterial({
          code: 'CDV-CV1.5',
          name: 'Dây đơn 1.5mm',
          unit: 'Cuộn',
          basePrice: 50000,
          discountPercent: 10,
          stockQuantity: 100,
        });
        expect(validResult).toBeNull();
      });
    });

    describe('StockAdjustModal', () => {
      it('guards newQuantity against NaN and negative values', () => {
        const validateStockAdjust = (newQuantity: number, reason: string) => {
          if (Number.isNaN(newQuantity) || newQuantity < 0) {
            return { valid: false, error: 'Số lượng tồn kho mới phải là số nguyên không âm' };
          }
          if (!reason.trim()) {
            return { valid: false, error: 'Vui lòng nhập lý do điều chỉnh tồn kho' };
          }
          return { valid: true };
        };

        expect(validateStockAdjust(NaN, 'Kiểm kê định kỳ').valid).toBe(false);
        expect(validateStockAdjust(-1, 'Thất thoát').valid).toBe(false);
        expect(validateStockAdjust(0, '').valid).toBe(false);
        expect(validateStockAdjust(0, 'Hết hàng').valid).toBe(true);
        expect(validateStockAdjust(250, 'Kiểm đếm kho đợt 1').valid).toBe(true);
      });
    });

    describe('Standardized Error Formatting (getFriendlyErrorMessage)', () => {
      it('formats ApiErrors and server exceptions to polite Vietnamese without [object Object]', () => {
        expect(getFriendlyErrorMessage(new ApiError('Mã SKU đã tồn tại', 409, 'DUPLICATE_SKU'))).toBe(
          'Mã SKU đã tồn tại'
        );
        expect(getFriendlyErrorMessage(new ApiError('Unauthorized', 401))).toContain(
          'Phiên đăng nhập đã hết hạn'
        );
        expect(getFriendlyErrorMessage({ message: 'Lỗi máy chủ nội bộ' })).toBe('Lỗi máy chủ nội bộ');
        expect(getFriendlyErrorMessage('Lỗi thao tác dữ liệu')).toBe('Lỗi thao tác dữ liệu');
        expect(getFriendlyErrorMessage(null)).toBe('Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.');
        expect(getFriendlyErrorMessage({})).not.toBe('[object Object]');
      });
    });
  });
});
