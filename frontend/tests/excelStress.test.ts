import { describe, it, expect } from 'vitest';
import { buildOrdersWorkbook, exportOrdersToExcel } from '@/lib/excel';
import { Order, OrderItem } from '@/types/manager';

describe('excel - Empirical Stress Harness & Formatting Verification', () => {
  const sampleItems: OrderItem[] = [
    {
      productId: 'p-01',
      sku: 'CAD-CV-2.5',
      productName: 'Cáp điện đôi mềm Cadivi VCm 2x2.5',
      brand: 'Cadivi',
      unitPrice: 1250000,
      quantity: 10,
      unit: 'Cuộn (100m)',
      total: 12500000,
    },
    {
      productId: 'p-02',
      sku: 'BM-UPVC-C2-90',
      productName: 'Ống nhựa Bình Minh uPVC Thoát Nước D90',
      brand: 'Bình Minh',
      unitPrice: 168000,
      quantity: 25,
      unit: 'Cây (4m)',
      total: 4200000,
    },
  ];

  const sampleOrders: Order[] = [
    {
      id: 'ord-01',
      code: 'DH-CADIVI-001',
      customerId: 'cust-01',
      customerName: 'Nguyễn Văn Hải',
      customerPhone: '0903123456',
      shippingAddress: '123 Điện Biên Phủ, P.15, Bình Thạnh, TP.HCM',
      items: sampleItems,
      totalAmount: 16700000,
      discountAmount: 700000,
      finalAmount: 16000000,
      status: 'DELIVERED',
      createdAt: '2026-10-08T08:30:00.000Z',
      deliveredAt: '2026-10-08T10:15:00.000Z',
      is2H: true,
      shipperName: 'Trần Văn Tốc',
      statusHistory: [],
    },
    {
      id: 'ord-02',
      code: 'DH-CANCEL-002',
      customerId: 'cust-02',
      customerName: 'Lê Văn Cường',
      customerPhone: '0912345678',
      shippingAddress: '456 Võ Văn Kiệt, Q.1, TP.HCM',
      items: [sampleItems[0]],
      totalAmount: 12500000,
      discountAmount: 0,
      finalAmount: 12500000,
      status: 'CANCELLED',
      cancellationReason: 'Khách hàng thay đổi thiết kế thi công công trình',
      createdAt: '2026-10-07T14:00:00.000Z',
      cancelledAt: '2026-10-07T14:30:00.000Z',
      is2H: false,
      statusHistory: [],
    },
  ];

  it('1. Verifies 2 sheets are created: "Đơn hàng" and "Chi tiết sản phẩm"', async () => {
    const XLSX = await import('xlsx');
    const wb = buildOrdersWorkbook(sampleOrders, XLSX);

    expect(wb.SheetNames).toHaveLength(2);
    expect(wb.SheetNames[0]).toBe('Đơn hàng');
    expect(wb.SheetNames[1]).toBe('Chi tiết sản phẩm');
  });

  it('2. Verifies number formatting #,##0 applied to monetary columns in "Đơn hàng"', async () => {
    const XLSX = await import('xlsx');
    const wb = buildOrdersWorkbook(sampleOrders, XLSX);
    const wsOrders = wb.Sheets['Đơn hàng'];

    // Row 2 is ord-01
    // Column 9 (J) is Tổng tiền hàng
    // Column 10 (K) is Chiết khấu
    // Column 11 (L) is Thực thu
    expect(wsOrders['J2'].v).toBe(16700000);
    expect(wsOrders['J2'].z).toBe('#,##0');
    expect(wsOrders['J2'].t).toBe('n');

    expect(wsOrders['K2'].v).toBe(700000);
    expect(wsOrders['K2'].z).toBe('#,##0');
    expect(wsOrders['K2'].t).toBe('n');

    expect(wsOrders['L2'].v).toBe(16000000);
    expect(wsOrders['L2'].z).toBe('#,##0');
    expect(wsOrders['L2'].t).toBe('n');

    // Row 3 is ord-02
    expect(wsOrders['J3'].v).toBe(12500000);
    expect(wsOrders['J3'].z).toBe('#,##0');
    expect(wsOrders['L3'].v).toBe(12500000);
    expect(wsOrders['L3'].z).toBe('#,##0');
  });

  it('3. Verifies number formatting #,##0 applied to monetary columns in "Chi tiết sản phẩm"', async () => {
    const XLSX = await import('xlsx');
    const wb = buildOrdersWorkbook(sampleOrders, XLSX);
    const wsItems = wb.Sheets['Chi tiết sản phẩm'];

    // Column 6 (G) is Đơn giá niêm yết
    // Column 8 (I) is Thành tiền
    expect(wsItems['G2'].v).toBe(1250000);
    expect(wsItems['G2'].z).toBe('#,##0');
    expect(wsItems['G2'].t).toBe('n');

    expect(wsItems['I2'].v).toBe(12500000);
    expect(wsItems['I2'].z).toBe('#,##0');
    expect(wsItems['I2'].t).toBe('n');

    // Row 3 (Item 2 of ord-01)
    expect(wsItems['G3'].v).toBe(168000);
    expect(wsItems['G3'].z).toBe('#,##0');
    expect(wsItems['I3'].v).toBe(4200000);
    expect(wsItems['I3'].z).toBe('#,##0');
  });

  it('4. Verifies exportOrdersToExcel uses dynamic import and returns valid workbook', async () => {
    const wb = await exportOrdersToExcel(sampleOrders, 'test.xlsx');
    expect(wb).toBeDefined();
    expect(wb.SheetNames).toEqual(['Đơn hàng', 'Chi tiết sản phẩm']);
  });

  it('5. Stress-test edge cases: empty orders, orders without items, null monetary values', async () => {
    const XLSX = await import('xlsx');
    
    // Empty orders list
    const emptyWb = buildOrdersWorkbook([], XLSX);
    expect(emptyWb.SheetNames).toEqual(['Đơn hàng', 'Chi tiết sản phẩm']);
    expect(emptyWb.Sheets['Đơn hàng']['A1'].v).toBe('Mã đơn hàng');
    expect(emptyWb.Sheets['Chi tiết sản phẩm']['A1'].v).toBe('Mã đơn hàng');

    // Order with empty items array
    const orderNoItems: Order = {
      ...sampleOrders[0],
      id: 'ord-empty',
      code: 'DH-EMPTY',
      items: [],
      totalAmount: 0,
      discountAmount: undefined as any,
      finalAmount: undefined as any,
    };
    const wbNoItems = buildOrdersWorkbook([orderNoItems], XLSX);
    expect(wbNoItems.Sheets['Đơn hàng']['J2'].v).toBe(0);
    expect(wbNoItems.Sheets['Đơn hàng']['J2'].z).toBe('#,##0');
  });
});
