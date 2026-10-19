import { api } from '@/lib/api';

export interface ShipperCheckinRecord {
  id: string;
  shipperId: string;
  workDate: string;
  checkinAt: string;
  checkoutAt?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface ShipperAvailabilityItem {
  id: string;
  fullName: string;
  phone?: string | null;
  onDuty: boolean;
  checkinAt?: string | null;
  activeOrderCount: number;
}

export const shipperCheckinApi = {
  // Shipper tự điểm danh vào ca
  checkin: (note?: string): Promise<ShipperCheckinRecord> =>
    api
      .post<{ data: ShipperCheckinRecord }>('/shipper/checkin', note ? { note } : {})
      .then((r) => r.data),

  // Shipper kết ca
  checkout: (): Promise<ShipperCheckinRecord> =>
    api.post<{ data: ShipperCheckinRecord }>('/shipper/checkout', {}).then((r) => r.data),

  // Trạng thái ca hiện tại của chính mình (đồng bộ khi reload trang)
  getMyStatus: (): Promise<ShipperCheckinRecord | null> =>
    api.get<{ data: ShipperCheckinRecord | null }>('/shipper/checkin-status').then((r) => r.data),

  // Manager xem ai đang đi làm (ADMIN/MANAGER)
  getAvailability: (): Promise<ShipperAvailabilityItem[]> =>
    api.get<{ data: ShipperAvailabilityItem[] }>('/shippers/availability').then((r) => r.data ?? []),
};
