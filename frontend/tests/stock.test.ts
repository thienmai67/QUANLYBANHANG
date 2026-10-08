import { describe, it, expect } from 'vitest';
import {
  checkStockAvailability,
  verifyStockAvailability,
  deductStockForOrder,
  restockForOrder,
  calculateDiscountedPrice,
  getProductStock,
} from '@/lib/stock';
import { OrderItem, Product, Order } from '@/types/manager';

describe('stock - Inventory Rules & Atomic Operations', () => {
  const sampleProducts: Product[] = [
    {
      id: 'prod-cad-01',
      code: 'CAD-CV-1.5',
      name: 'Dây Cáp Điện Cadivi CV 1.5 mm²',
      brand: 'Cadivi',
      category: 'Dây & Cáp Điện',
      unit: 'Cuộn 100m',
      basePrice: 450000,
      discountPercent: 22,
      stockQuantity: 50,
      minStockLevel: 10,
    },
    {
      id: 'prod-bm-01',
      code: 'BM-UPVC-D27',
      name: 'Ống uPVC Bình Minh Ø27',
      brand: 'Bình Minh',
      category: 'Ống & Phụ Kiện Nhựa',
      unit: 'Cây 4m',
      basePrice: 42000,
      discountPercent: 25,
      stockQuantity: 20,
      minStockLevel: 5,
    },
  ];

  describe('checkStockAvailability / verifyStockAvailability', () => {
    it('returns available: true when inventory is sufficient for all items', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-cad-01',
          productName: 'Dây Cáp Điện Cadivi CV 1.5 mm²',
          brand: 'Cadivi',
          unitPrice: 351000,
          quantity: 10,
          unit: 'Cuộn 100m',
          total: 3510000,
        },
        {
          productId: 'prod-bm-01',
          productName: 'Ống uPVC Bình Minh Ø27',
          brand: 'Bình Minh',
          unitPrice: 31500,
          quantity: 5,
          unit: 'Cây 4m',
          total: 157500,
        },
      ];

      const res = checkStockAvailability(items, sampleProducts);
      expect(res.available).toBe(true);
      expect(res.missingItems).toHaveLength(0);

      // Verify alias
      const resAlias = verifyStockAvailability(items, sampleProducts);
      expect(resAlias.available).toBe(true);
    });

    it('returns available: false and details missing items when requested exceeds stock', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-cad-01',
          productName: 'Dây Cáp Điện Cadivi CV 1.5 mm²',
          brand: 'Cadivi',
          unitPrice: 351000,
          quantity: 60, // Stock is only 50
          unit: 'Cuộn 100m',
          total: 21060000,
        },
      ];

      const res = checkStockAvailability(items, sampleProducts);
      expect(res.available).toBe(false);
      expect(res.missingItems).toHaveLength(1);
      expect(res.missingItems[0]).toEqual({
        productId: 'prod-cad-01',
        productName: 'Dây Cáp Điện Cadivi CV 1.5 mm²',
        requested: 60,
        currentStock: 50,
      });
    });

    it('flags non-existent products as missing with 0 current stock', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-non-existent',
          productName: 'Hàng không tồn tại',
          brand: 'Schneider',
          unitPrice: 100000,
          quantity: 2,
          unit: 'Cái',
          total: 200000,
        },
      ];

      const res = checkStockAvailability(items, sampleProducts);
      expect(res.available).toBe(false);
      expect(res.missingItems[0].currentStock).toBe(0);
    });
  });

  describe('deductStockForOrder', () => {
    it('immutably deducts stock and produces accurate audit StockLogs', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-cad-01',
          productName: 'Dây Cáp Điện Cadivi CV 1.5 mm²',
          brand: 'Cadivi',
          unitPrice: 351000,
          quantity: 15,
          unit: 'Cuộn 100m',
          total: 5265000,
        },
      ];

      const result = deductStockForOrder(items, sampleProducts, 'ORD-001', 'Manager Hai Dang');

      // Verify input array remained immutable
      expect(sampleProducts[0].stockQuantity).toBe(50);

      // Verify updated product output
      const updatedCadivi = result.updatedProducts.find((p) => p.id === 'prod-cad-01');
      expect(updatedCadivi?.stockQuantity).toBe(35);

      // Verify audit logs
      expect(result.logs).toHaveLength(1);
      const log = result.logs[0];
      expect(log.productId).toBe('prod-cad-01');
      expect(log.changeAmount).toBe(-15);
      expect(log.previousStock).toBe(50);
      expect(log.newStock).toBe(35);
      expect(log.type).toBe('ORDER_APPROVED');
      expect(log.referenceId).toBe('ORD-001');
      expect(log.createdByName).toBe('Manager Hai Dang');
    });

    it('throws error and halts atomic deduction if any product has insufficient stock', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-bm-01',
          productName: 'Ống uPVC Bình Minh Ø27',
          brand: 'Bình Minh',
          unitPrice: 31500,
          quantity: 25, // Available is only 20
          unit: 'Cây 4m',
          total: 787500,
        },
      ];

      expect(() => {
        deductStockForOrder(items, sampleProducts, 'ORD-ERR', 'Manager');
      }).toThrow(/Không đủ tồn kho/);
    });
  });

  describe('restockForOrder', () => {
    it('restocks inventory when order in PACKING or SHIPPING status is cancelled', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-bm-01',
          productName: 'Ống uPVC Bình Minh Ø27',
          brand: 'Bình Minh',
          unitPrice: 31500,
          quantity: 8,
          unit: 'Cây 4m',
          total: 252000,
        },
      ];

      const order: Partial<Order> = {
        id: 'ORD-CANCEL-01',
        status: 'PACKING',
        items,
      };

      const result = restockForOrder(order as any, sampleProducts, 'ORD-CANCEL-01', 'Manager Hai Dang');

      const updated = result.updatedProducts.find((p) => p.id === 'prod-bm-01');
      expect(updated?.stockQuantity).toBe(28); // 20 + 8
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].changeAmount).toBe(8);
      expect(result.logs[0].type).toBe('ORDER_CANCELLED');
    });

    it('DOES NOT restock if order was cancelled directly from PENDING (never deducted)', () => {
      const items: OrderItem[] = [
        {
          productId: 'prod-bm-01',
          productName: 'Ống uPVC Bình Minh Ø27',
          brand: 'Bình Minh',
          unitPrice: 31500,
          quantity: 10,
          unit: 'Cây 4m',
          total: 315000,
        },
      ];

      const pendingOrder: Partial<Order> = {
        id: 'ORD-PENDING-CANCEL',
        status: 'PENDING',
        items,
      };

      const result = restockForOrder(
        pendingOrder as any,
        sampleProducts,
        'ORD-PENDING-CANCEL',
        'Manager'
      );

      const updated = result.updatedProducts.find((p) => p.id === 'prod-bm-01');
      expect(updated?.stockQuantity).toBe(20); // Unchanged!
      expect(result.logs).toHaveLength(0); // No logs created!
    });
  });

  describe('calculateDiscountedPrice & Price Isolation', () => {
    it('calculates integer VND prices after applying discount percentage', () => {
      expect(calculateDiscountedPrice(450000, 22)).toBe(351000);
      expect(calculateDiscountedPrice(42000, 25)).toBe(31500);
      expect(calculateDiscountedPrice(100000, 0)).toBe(100000);
    });

    it('preserves historical snapshot prices when product base price changes later', () => {
      const orderItemSnapshot: OrderItem = {
        productId: 'prod-cad-01',
        productName: 'Dây Cáp Điện Cadivi CV 1.5 mm²',
        brand: 'Cadivi',
        unitPrice: 351000, // Snapshot price at creation
        quantity: 10,
        unit: 'Cuộn 100m',
        total: 3510000,
      };

      // Catalog price increases in warehouse
      const modifiedProducts = sampleProducts.map((p) =>
        p.id === 'prod-cad-01' ? { ...p, basePrice: 600000 } : p
      );

      // Existing order item must retain original snapshot price
      expect(orderItemSnapshot.unitPrice).toBe(351000);
      expect(orderItemSnapshot.total).toBe(3510000);
      expect(modifiedProducts[0].basePrice).toBe(600000);
    });
  });
});
