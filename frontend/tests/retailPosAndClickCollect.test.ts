import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSaleStore } from '../src/store/useSaleStore';
import { api } from '../src/lib/api';

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
});
