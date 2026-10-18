import { describe, it, expect } from 'vitest';
import {
  mapOrderFromApi,
  mapShipperSummary,
  mapCODSettlement,
  buildUpdateOrderStatusPayload,
} from '@/lib/orderMapper';

describe('orderMapper - Centralized DTO Mapping & Contract Compliance', () => {
  describe('mapOrderFromApi', () => {
    it('maps full camelCase server response with metadata into frontend Order model', () => {
      const serverResponse = {
        id: 'e445091b-64d5-4556-9a2c-f6ebfe4f7063',
        orderNumber: 'ORD-261008-AB12CD',
        customerId: '8f8ef1ef-f604-4530-9df1-c88f1d8f5ef1',
        customerName: 'Nguyễn Văn A',
        shipperId: '9b642ca2-1a48-4330-95b8-d218841dafc5',
        paymentMethod: 'COD',
        is2h: true,
        deadline2h: '2026-10-08T16:00:00Z',
        deliveredAt: '2026-10-08T15:30:00Z',
        cancellationReason: null,
        totalAmount: 1500000.5,
        status: 'DELIVERED',
        version: 4,
        podPhotoUrl: 'https://storage.tdt-me.vn/pod/ord-261008-01.jpg',
        podRecipientName: 'Nguyễn Văn Nhận',
        podConfirmedAt: '2026-10-08T15:30:00Z',
        codCollected: 1500000.0,
        codRemitted: false,
        codRemittedAt: null,
        incidentDetail: null,
        incidentReportedBy: null,
        incidentReportedAt: null,
        items: [
          {
            productId: 'prod-cad-01',
            productName: 'Dây cáp điện Cadivi CV 1.5 mm²',
            brand: 'Cadivi',
            unitPrice: 500000,
            quantity: 3,
            unit: 'Cuộn',
            total: 1500000,
          },
        ],
        createdAt: '2026-10-08T14:30:00Z',
        updatedAt: '2026-10-08T15:30:00Z',
      };

      const mapped = mapOrderFromApi(serverResponse);

      expect(mapped.id).toBe('e445091b-64d5-4556-9a2c-f6ebfe4f7063');
      expect(mapped.orderNumber).toBe('ORD-261008-AB12CD');
      expect(mapped.code).toBe('ORD-261008-AB12CD');
      expect(mapped.shipperId).toBe('9b642ca2-1a48-4330-95b8-d218841dafc5');
      expect(mapped.status).toBe('DELIVERED');
      expect(mapped.version).toBe(4);
      expect(mapped.is2H).toBe(true);
      expect(mapped.is2h).toBe(true);
      expect(mapped.deadline2H).toBe('2026-10-08T16:00:00Z');
      expect(mapped.totalAmount).toBe(1500001); // Rounded to integer VND
      expect(mapped.podPhotoUrl).toBe('https://storage.tdt-me.vn/pod/ord-261008-01.jpg');
      expect(mapped.podRecipientName).toBe('Nguyễn Văn Nhận');
      expect(mapped.podConfirmedAt).toBe('2026-10-08T15:30:00Z');
      expect(mapped.codCollected).toBe(1500000);
      expect(mapped.codRemitted).toBe(false);
      expect(mapped.codRemittedAt).toBeUndefined();

      // Synthesized legacy UI objects
      expect(mapped.pod?.receiverName).toBe('Nguyễn Văn Nhận');
      expect(mapped.pod?.photos[0]?.thumbnail).toBe('https://storage.tdt-me.vn/pod/ord-261008-01.jpg');
      expect(mapped.cod?.amount).toBe(1500000);
      expect(mapped.cod?.settlementId).toBeNull();
    });

    it('handles minimal order without crashing and maps missing metadata to undefined', () => {
      const minimalServerResponse = {
        id: '2d8f95c0-ae7a-4412-8ea7-a367ba0813f0',
        orderNumber: 'ORD-MINIMAL',
        customerName: 'Khách vãng lai',
        status: 'PENDING',
        version: 1,
        totalAmount: 250000,
      };

      const mapped = mapOrderFromApi(minimalServerResponse);

      expect(mapped.id).toBe('2d8f95c0-ae7a-4412-8ea7-a367ba0813f0');
      expect(mapped.orderNumber).toBe('ORD-MINIMAL');
      expect(mapped.status).toBe('PENDING');
      expect(mapped.version).toBe(1);
      expect(mapped.totalAmount).toBe(250000);
      expect(mapped.shipperId).toBeUndefined();
      expect(mapped.podPhotoUrl).toBeUndefined();
      expect(mapped.podRecipientName).toBeUndefined();
      expect(mapped.cancellationReason).toBeUndefined();
      expect(mapped.incidentDetail).toBeUndefined();
      expect(mapped.deliveredAt).toBeUndefined();
      expect(mapped.is2H).toBe(false);
      expect(mapped.items).toEqual([]);
      expect(mapped.paymentStatus).toBe('UNPAID');
    });

    it('correctly maps PayOS payment fields for bank transfer orders', () => {
      const payosResponse = {
        id: '3f9f95c0-ae7a-4412-8ea7-a367ba0813f1',
        orderNumber: 'ORD-261018-PAYOS01',
        customerName: 'Khách PayOS',
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PAID',
        payosOrderCode: 1729267200123456,
        paidAt: '2026-10-18T16:00:00Z',
        paymentReceiptUrl: 'https://pay.payos.vn/receipt/123456',
        refundTxCode: 'REFUND-001',
        refundedAt: '2026-10-18T17:00:00Z',
        version: 1,
        totalAmount: 500000,
      };

      const mapped = mapOrderFromApi(payosResponse);

      expect(mapped.paymentMethod).toBe('BANK_TRANSFER');
      expect(mapped.paymentStatus).toBe('PAID');
      expect(mapped.payosOrderCode).toBe(1729267200123456);
      expect(mapped.paidAt).toBe('2026-10-18T16:00:00Z');
      expect(mapped.paymentReceiptUrl).toBe('https://pay.payos.vn/receipt/123456');
      expect(mapped.refundTxCode).toBe('REFUND-001');
      expect(mapped.refundedAt).toBe('2026-10-18T17:00:00Z');
    });

    it('maps cancelled order with cancellationReason and incidentDetail', () => {
      const cancelledResponse = {
        id: 'ord-cancelled-01',
        orderNumber: 'ORD-CANCEL-01',
        status: 'CANCELLED',
        version: 3,
        cancellationReason: 'Khách hàng đổi ý hủy đơn',
        incidentDetail: '[Khách hủy] Khách hàng đổi ý hủy đơn',
        incidentReportedBy: 'ship-uuid-01',
        incidentReportedAt: '2026-10-08T15:00:00Z',
      };

      const mapped = mapOrderFromApi(cancelledResponse);

      expect(mapped.status).toBe('CANCELLED');
      expect(mapped.version).toBe(3);
      expect(mapped.cancellationReason).toBe('Khách hàng đổi ý hủy đơn');
      expect(mapped.incidentDetail).toBe('[Khách hủy] Khách hàng đổi ý hủy đơn');
      expect(mapped.incidentReportedBy).toBe('ship-uuid-01');
      expect(mapped.incident?.category).toBe('[Khách hủy] Khách hàng đổi ý hủy đơn');
    });

    it('throws error when passed non-object or null input', () => {
      expect(() => mapOrderFromApi(null)).toThrow('Dữ liệu đơn hàng không hợp lệ');
      expect(() => mapOrderFromApi(undefined)).toThrow('Dữ liệu đơn hàng không hợp lệ');
      expect(() => mapOrderFromApi('string-not-json')).toThrow('Dữ liệu đơn hàng không hợp lệ');
    });
  });

  describe('mapShipperSummary', () => {
    it('maps pure camelCase backend shipper response to ShipperSummary', () => {
      const raw = {
        id: '9b642ca2-1a48-4330-95b8-d218841dafc5',
        fullName: 'Nguyễn Văn Shipper',
        phone: '0912345678',
        activeOrderCount: 3,
      };

      const mapped = mapShipperSummary(raw);

      expect(mapped.id).toBe('9b642ca2-1a48-4330-95b8-d218841dafc5');
      expect(mapped.fullName).toBe('Nguyễn Văn Shipper');
      expect(mapped.phone).toBe('0912345678');
      expect(mapped.activeOrderCount).toBe(3);
    });

    it('safely handles fallback for invalid or missing fields', () => {
      expect(mapShipperSummary(null)).toEqual({
        id: '',
        fullName: '',
        phone: undefined,
        activeOrderCount: 0,
      });

      expect(mapShipperSummary({})).toEqual({
        id: '',
        fullName: '',
        phone: undefined,
        activeOrderCount: 0,
      });
    });
  });

  describe('mapCODSettlement', () => {
    it('maps pure camelCase server settlement to CODSettlement with integer rounding', () => {
      const raw = {
        id: 'c71a3298-2fb0-4e36-931f-0e12918843c0',
        shipperId: '9b642ca2-1a48-4330-95b8-d218841dafc5',
        totalAmount: 3500000.75,
        orderCount: 2,
        createdAt: '2026-10-08T18:00:00Z',
      };

      const mapped = mapCODSettlement(raw);

      expect(mapped.id).toBe('c71a3298-2fb0-4e36-931f-0e12918843c0');
      expect(mapped.shipperId).toBe('9b642ca2-1a48-4330-95b8-d218841dafc5');
      expect(mapped.totalAmount).toBe(3500001); // Integer VND
      expect(mapped.orderCount).toBe(2);
      expect(mapped.createdAt).toBe('2026-10-08T18:00:00Z');
    });
  });

  describe('buildUpdateOrderStatusPayload', () => {
    it('generates strictly snake_case request body for assignment (PACKING -> SHIPPING)', () => {
      const payload = buildUpdateOrderStatusPayload({
        status: 'SHIPPING',
        version: 2,
        shipperId: '9b642ca2-1a48-4330-95b8-d218841dafc5',
      });

      expect(payload).toEqual({
        status: 'SHIPPING',
        version: 2,
        shipper_id: '9b642ca2-1a48-4330-95b8-d218841dafc5',
      });

      expect(Object.keys(payload)).not.toContain('shipperId');
      expect(Object.keys(payload)).toContain('shipper_id');
    });

    it('generates strictly snake_case request body for POD (SHIPPING -> DELIVERED)', () => {
      const payload = buildUpdateOrderStatusPayload({
        status: 'DELIVERED',
        version: 3,
        podPhotoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        podRecipientName: 'Trần Văn Nhận',
      });

      expect(payload).toEqual({
        status: 'DELIVERED',
        version: 3,
        pod_photo_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        pod_recipient_name: 'Trần Văn Nhận',
      });

      expect(Object.keys(payload)).not.toContain('podPhotoUrl');
      expect(Object.keys(payload)).not.toContain('podRecipientName');
      expect(Object.keys(payload)).toContain('pod_photo_url');
      expect(Object.keys(payload)).toContain('pod_recipient_name');
    });

    it('generates strictly snake_case request body for order cancellation (-> CANCELLED)', () => {
      const payload = buildUpdateOrderStatusPayload({
        status: 'CANCELLED',
        version: 1,
        cancellationReason: 'Địa chỉ không thể tiếp cận',
        incidentDetail: '[Giao thất bại] Địa chỉ không thể tiếp cận',
      });

      expect(payload).toEqual({
        status: 'CANCELLED',
        version: 1,
        cancellation_reason: 'Địa chỉ không thể tiếp cận',
        incident_detail: '[Giao thất bại] Địa chỉ không thể tiếp cận',
      });

      expect(Object.keys(payload)).not.toContain('cancellationReason');
      expect(Object.keys(payload)).not.toContain('incidentDetail');
      expect(Object.keys(payload)).toContain('cancellation_reason');
      expect(Object.keys(payload)).toContain('incident_detail');
    });
  });
});
