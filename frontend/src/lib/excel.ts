import { Order, OrderStatus } from '@/types/manager';
import { formatDateTime } from './formatters';

const STATUS_VIETNAMESE: Record<OrderStatus, string> = {
  PENDING: 'Chờ duyệt',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

/**
 * Builds the Workbook object containing the 2 designated sheets:
 * 1. "Đơn hàng" (Order summary)
 * 2. "Chi tiết sản phẩm" (Line items)
 */
export function buildOrdersWorkbook(orders: Order[], XLSX: any) {
  // 1. Sheet "Đơn hàng"
  const orderHeaders = [
    'Mã đơn hàng',
    'Khách hàng',
    'Số điện thoại',
    'Địa chỉ công trình',
    'Ngày đặt',
    'Ngày giao',
    'Loại giao hàng',
    'Trạng thái',
    'Shipper phụ trách',
    'Tổng tiền hàng',
    'Chiết khấu',
    'Thực thu',
    'Lý do hủy / Ghi chú',
  ];

  const orderRows: any[][] = [orderHeaders];

  for (const o of orders) {
    const rawTotal = o.totalAmount ?? 0;
    const discount = o.discountAmount ?? 0;
    const finalAmt = o.finalAmount ?? Math.max(0, rawTotal - discount);

    orderRows.push([
      o.code,
      o.customerName,
      o.customerPhone,
      o.shippingAddress,
      formatDateTime(o.createdAt),
      o.deliveredAt ? formatDateTime(o.deliveredAt) : 'Chưa giao',
      o.is2H ? 'Giao 2H' : 'Tiêu chuẩn',
      STATUS_VIETNAMESE[o.status] || o.status,
      o.shipperName || 'Chưa phân công',
      rawTotal,
      discount,
      finalAmt,
      o.cancellationReason || '',
    ]);
  }

  const wsOrders = XLSX.utils.aoa_to_sheet(orderRows);

  // Set number format #,##0 for columns: Tổng tiền hàng (9), Chiết khấu (10), Thực thu (11)
  const orderRange = XLSX.utils.decode_range(wsOrders['!ref'] || 'A1');
  for (let R = 1; R <= orderRange.e.r; ++R) {
    for (const C of [9, 10, 11]) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (wsOrders[cellRef] && typeof wsOrders[cellRef].v === 'number') {
        wsOrders[cellRef].t = 'n';
        wsOrders[cellRef].z = '#,##0';
      }
    }
  }

  // Column widths for sheet 1
  wsOrders['!cols'] = [
    { wch: 14 }, // Mã đơn hàng
    { wch: 22 }, // Khách hàng
    { wch: 14 }, // Số điện thoại
    { wch: 32 }, // Địa chỉ công trình
    { wch: 18 }, // Ngày đặt
    { wch: 18 }, // Ngày giao
    { wch: 14 }, // Loại giao hàng
    { wch: 16 }, // Trạng thái
    { wch: 20 }, // Shipper
    { wch: 16 }, // Tổng tiền hàng
    { wch: 14 }, // Chiết khấu
    { wch: 16 }, // Thực thu
    { wch: 30 }, // Ghi chú
  ];

  // 2. Sheet "Chi tiết sản phẩm"
  const itemHeaders = [
    'Mã đơn hàng',
    'Mã SKU',
    'Tên vật tư M&E',
    'Thương hiệu',
    'Đơn vị tính',
    'Số lượng',
    'Đơn giá niêm yết',
    'Chiết khấu (%)',
    'Thành tiền',
  ];

  const itemRows: any[][] = [itemHeaders];

  for (const o of orders) {
    if (!o.items) continue;
    for (const item of o.items) {
      const itemTotal =
        typeof item.total === 'number'
          ? item.total
          : Math.round(item.quantity * item.unitPrice);

      itemRows.push([
        o.code,
        item.sku || item.productId,
        item.productName,
        item.brand,
        item.unit,
        item.quantity,
        item.unitPrice,
        item.discountRate ?? 0,
        itemTotal,
      ]);
    }
  }

  const wsItems = XLSX.utils.aoa_to_sheet(itemRows);

  // Set number format #,##0 for Đơn vị tính/Số lượng (5), Đơn giá (6), Thành tiền (8)
  const itemRange = XLSX.utils.decode_range(wsItems['!ref'] || 'A1');
  for (let R = 1; R <= itemRange.e.r; ++R) {
    for (const C of [6, 8]) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (wsItems[cellRef] && typeof wsItems[cellRef].v === 'number') {
        wsItems[cellRef].t = 'n';
        wsItems[cellRef].z = '#,##0';
      }
    }
  }

  wsItems['!cols'] = [
    { wch: 14 }, // Mã đơn hàng
    { wch: 16 }, // Mã SKU
    { wch: 36 }, // Tên vật tư
    { wch: 15 }, // Thương hiệu
    { wch: 12 }, // ĐVT
    { wch: 10 }, // Số lượng
    { wch: 16 }, // Đơn giá
    { wch: 14 }, // Chiết khấu %
    { wch: 18 }, // Thành tiền
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Đơn hàng');
  XLSX.utils.book_append_sheet(wb, wsItems, 'Chi tiết sản phẩm');

  return wb;
}

/**
 * Dynamically imports xlsx and triggers an Excel download with 2 structured sheets.
 */
export async function exportOrdersToExcel(
  orders: Order[],
  filename: string = `Bao_cao_don_hang_${new Date().toISOString().slice(0, 10)}.xlsx`
): Promise<any> {
  const XLSX = await import('xlsx');
  const wb = buildOrdersWorkbook(orders, XLSX);

  // Browser environment: trigger download
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    XLSX.writeFile(wb, filename);
  }

  return wb;
}
