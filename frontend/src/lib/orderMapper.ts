import {
  Order,
  OrderItem,
  OrderStatus,
  ShipperSummary,
  CODSettlement,
  UpdateOrderStatusPayload,
} from '@/types/manager';

/**
 * mapOrderFromApi: Centralized parser transforming API order responses (camelCase)
 * into the frontend Order model. Safe against missing or null fields.
 */
export function mapOrderFromApi(raw: any): Order {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Dữ liệu đơn hàng không hợp lệ');
  }

  const id: string = raw.id || '';
  const orderNumber: string =
    raw.orderNumber ||
    raw.code ||
    (id ? `ORD-${id.slice(0, 8).toUpperCase()}` : 'ORD-UNKNOWN');
  const code: string = orderNumber;

  const totalAmountNum =
    typeof raw.totalAmount === 'number'
      ? Math.round(raw.totalAmount)
      : typeof raw.total_amount === 'number'
      ? Math.round(raw.total_amount)
      : typeof raw.total === 'number'
      ? Math.round(raw.total)
      : 0;

  const is2hBool = Boolean(raw.is2h ?? raw.is2H ?? false);
  const deadlineStr = raw.deadline2h || raw.deadline2H || undefined;

  const podPhotoUrl: string | undefined =
    raw.podPhotoUrl || raw.pod_photo_url || undefined;
  const podRecipientName: string | undefined =
    raw.podRecipientName || raw.pod_recipient_name || undefined;
  const podConfirmedAt: string | undefined =
    raw.podConfirmedAt || raw.pod_confirmed_at || undefined;

  const codCollectedNum: number | undefined =
    typeof raw.codCollected === 'number'
      ? Math.round(raw.codCollected)
      : typeof raw.cod_collected === 'number'
      ? Math.round(raw.cod_collected)
      : undefined;

  const codRemittedBool: boolean = Boolean(
    raw.codRemitted ?? raw.cod_remitted ?? false
  );
  const codRemittedAt: string | undefined =
    raw.codRemittedAt || raw.cod_remitted_at || undefined;

  const incidentDetail: string | undefined =
    raw.incidentDetail || raw.incident_detail || undefined;
  const incidentReportedBy: string | undefined =
    raw.incidentReportedBy || raw.incident_reported_by || undefined;
  const incidentReportedAt: string | undefined =
    raw.incidentReportedAt || raw.incident_reported_at || undefined;

  const cancellationReason: string | undefined =
    raw.cancellationReason || raw.cancellation_reason || undefined;
  const deliveredAt: string | undefined =
    raw.deliveredAt || raw.delivered_at || undefined;

  const items: OrderItem[] = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        productId: it.productId || it.product_id || '',
        productName: it.productName || it.name || it.product?.name || 'Vật tư M&E',
        name: it.productName || it.name || it.product?.name || 'Vật tư M&E',
        brand: (it.brand || it.product?.brand?.name || it.brand_name || 'Cadivi') as any,
        unitPrice:
          typeof it.unitPrice === 'number'
            ? Math.round(it.unitPrice)
            : typeof it.unit_price === 'number'
            ? Math.round(it.unit_price)
            : 0,
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || it.product?.unit?.name || 'Cái',
        total:
          typeof it.total === 'number'
            ? Math.round(it.total)
            : Math.round((it.unitPrice || it.unit_price || 0) * (it.quantity || 1)),
        sku: it.sku || it.product?.sku || undefined,
        discountRate: it.discountRate ?? it.discount_rate ?? undefined,
      }))
    : [];

  const createdAt = raw.createdAt || raw.created_at || new Date().toISOString();
  const updatedAt = raw.updatedAt || raw.updated_at || createdAt;

  // Synthesize convenience UI objects for backwards compatibility
  const pod =
    raw.pod ||
    (podRecipientName || podPhotoUrl
      ? {
          receiverName: podRecipientName || '',
          photos: podPhotoUrl
            ? [{ name: 'Bằng chứng giao hàng', thumbnail: podPhotoUrl }]
            : [],
          capturedAt: podConfirmedAt || deliveredAt || createdAt,
        }
      : undefined);

  const paymentMethod = raw.paymentMethod || raw.payment_method || 'COD';

  const cod =
    raw.cod ||
    (paymentMethod === 'COD'
      ? {
          amount: codCollectedNum ?? totalAmountNum,
          collectedAt: podConfirmedAt || deliveredAt || createdAt,
          settlementId: codRemittedBool ? 'REMITTED' : null,
        }
      : undefined);

  const incident =
    raw.incident ||
    (incidentDetail
      ? {
          category: incidentDetail,
          detail: incidentDetail,
          at: incidentReportedAt || updatedAt,
          shipperId: incidentReportedBy || raw.shipperId || '',
        }
      : undefined);

  const statusHistory =
    Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0
      ? raw.statusHistory
      : [
          {
            status: (raw.status || 'PENDING') as OrderStatus,
            timestamp: createdAt,
            changedBy: 'Hệ thống',
            note: cancellationReason || undefined,
          },
        ];

  return {
    id,
    code,
    orderNumber,
    customerId: raw.customerId || raw.customer_id || '',
    customerName: raw.customerName || raw.customer_name || 'Khách hàng',
    customerPhone: raw.customerPhone || raw.customer_phone || '0901234567',
    shippingAddress: raw.shippingAddress || raw.shipping_address || 'TP. Hồ Chí Minh',
    items,
    totalAmount: totalAmountNum,
    total: totalAmountNum,
    discountAmount: raw.discountAmount ?? raw.discount_amount ?? 0,
    finalAmount: totalAmountNum,
    status: (raw.status || 'PENDING') as OrderStatus,
    version: typeof raw.version === 'number' ? raw.version : 1,
    createdAt,
    updatedAt,
    approvedAt: raw.approvedAt || raw.approved_at || undefined,
    shippingStartedAt: raw.shippingStartedAt || raw.shipping_started_at || undefined,
    deliveredAt,
    cancelledAt: raw.cancelledAt || raw.cancelled_at || undefined,
    cancellationReason,
    is2H: is2hBool,
    is2h: is2hBool,
    deliveryType: is2hBool ? '2H' : 'STANDARD',
    paymentMethod,
    deadline2H: deadlineStr,
    deadline2h: deadlineStr,
    shipperId: raw.shipperId || raw.shipper_id || undefined,
    shipperName: raw.shipperName || raw.shipper_name || undefined,
    podPhotoUrl,
    podRecipientName,
    podConfirmedAt,
    codCollected: codCollectedNum,
    codRemitted: codRemittedBool,
    codRemittedAt,
    incidentDetail,
    incidentReportedBy,
    incidentReportedAt,
    pod,
    cod,
    incident,
    statusHistory,
  };
}

/**
 * mapShipperSummary: Maps GET /api/v1/shippers list item.
 * Contract: { id, full_name, phone, active_order_count }
 */
export function mapShipperSummary(raw: any): ShipperSummary {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      fullName: '',
      phone: undefined,
      activeOrderCount: 0,
    };
  }

  return {
    id: raw.id || '',
    fullName: raw.fullName || raw.full_name || '',
    phone: raw.phone || undefined,
    activeOrderCount:
      typeof raw.activeOrderCount === 'number'
        ? raw.activeOrderCount
        : typeof raw.active_order_count === 'number'
        ? raw.active_order_count
        : 0,
  };
}

/**
 * mapCODSettlement: Maps POST / GET /api/v1/cod-settlements responses.
 * Contract: { id, shipper_id, total_amount, order_count, created_at }
 */
export function mapCODSettlement(raw: any): CODSettlement {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      shipperId: '',
      totalAmount: 0,
      orderCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: raw.id || '',
    shipperId: raw.shipperId || raw.shipper_id || '',
    totalAmount:
      typeof raw.totalAmount === 'number'
        ? Math.round(raw.totalAmount)
        : typeof raw.total_amount === 'number'
        ? Math.round(raw.total_amount)
        : 0,
    orderCount:
      typeof raw.orderCount === 'number'
        ? raw.orderCount
        : typeof raw.order_count === 'number'
        ? raw.order_count
        : 0,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

/**
 * buildUpdateOrderStatusPayload: Builds snake_case JSON request body
 * for PATCH /api/v1/orders/{id}/status.
 */
export function buildUpdateOrderStatusPayload(params: {
  status: OrderStatus;
  version: number;
  shipperId?: string;
  cancellationReason?: string;
  incidentDetail?: string;
  podPhotoUrl?: string;
  podRecipientName?: string;
}): UpdateOrderStatusPayload {
  const payload: UpdateOrderStatusPayload = {
    status: params.status,
    version: params.version,
  };

  if (params.shipperId) {
    payload.shipper_id = params.shipperId;
  }
  if (params.cancellationReason) {
    payload.cancellation_reason = params.cancellationReason;
  }
  if (params.incidentDetail) {
    payload.incident_detail = params.incidentDetail;
  }
  if (params.podPhotoUrl) {
    payload.pod_photo_url = params.podPhotoUrl;
  }
  if (params.podRecipientName) {
    payload.pod_recipient_name = params.podRecipientName;
  }

  return payload;
}
