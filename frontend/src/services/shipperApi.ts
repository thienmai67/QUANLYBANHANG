import axios from 'axios';
import { getAccessToken } from '../lib/auth';
import { API_BASE_URL } from '../lib/api';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShipperApplication {
  id: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  documentType: string;
  documentNumberMasked: string;
  licensePlate?: string | null;
  driverLicense?: string | null;
  termsAccepted: boolean;
  trainingConfirmed: boolean;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  identityChecked: boolean;
  vehicleChecked: boolean;
  termsChecked: boolean;
  trainingChecked: boolean;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  issuedUserId?: string | null;
  issuedEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewChecks {
  identity: boolean;
  vehicle: boolean;
  terms: boolean;
  training: boolean;
}

export interface ApproveResult {
  application: ShipperApplication;
  issuedEmail: string;
}

// Kết quả manager reset mật khẩu cho shipper quên mật khẩu: mật khẩu tạm
// chỉ trả về đúng 1 lần này, manager chuyển riêng cho shipper.
export interface ResetPasswordResult {
  tempPassword: string;
  issuedEmail: string;
}

// Kết quả nộp hồ sơ: kèm mã tra cứu bản text gốc, chỉ trả về đúng 1 lần này.
// Người nộp tự lưu mã; hệ thống chỉ giữ dạng băm.
export interface CreateApplicationResult {
  application: ShipperApplication;
  lookupCode: string;
}

export interface ShipperEmailPoolEntry {
  email: string;
  status: 'FREE' | 'USED';
  assignedUserId?: string | null;
  shipperName?: string | null;
  assignedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Kết quả tra cứu công khai theo SĐT + mã tra cứu: trạng thái + lý do từ chối.
// Với hồ sơ APPROVED thì kèm email đã cấp + cờ đã đặt mật khẩu hay chưa —
// chỉ người có mã tra cứu mới thấy được tới đây.
export interface PublicApplicationStatus {
  status: ApplicationStatus;
  rejectionReason?: string | null;
  issuedEmail?: string | null;
  passwordSet?: boolean;
}

export interface CreateApplicationInput {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  documentType: string;
  documentNumber: string;
  licensePlate?: string;
  driverLicense?: string;
  termsAccepted: boolean;
  trainingConfirmed: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractMessage(err: unknown, fallback: string): string {
  const maybeAxios = err as {
    response?: { status?: number; data?: { message?: string } };
  } | null;
  const response = maybeAxios?.response;
  if (response) {
    if (response.data?.message) return response.data.message;
    if (response.status === 401) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
    if (response.status === 403) return 'Bạn không có quyền thực hiện thao tác này';
    if (response.status === 409) return 'Dữ liệu đã thay đổi, vui lòng tải lại trang';
  }
  return fallback;
}

export const shipperApi = {
  // Hồ sơ đăng ký mới (public, không cần đăng nhập).
  // Trả về kèm mã tra cứu — trang đăng ký phải hiện mã này ngay cho người nộp.
  submitApplication: async (input: CreateApplicationInput): Promise<CreateApplicationResult> => {
    try {
      const res = await apiClient.post('/shipper-applications', input);
      return res.data as CreateApplicationResult;
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể gửi hồ sơ đăng ký, vui lòng thử lại'));
    }
  },

  // Tra cứu công khai theo SĐT + mã tra cứu: không cần đăng nhập.
  // SĐT không có hồ sơ hoặc mã sai thì backend trả cùng 1 lỗi 404 — hàm này
  // đánh dấu riêng trường hợp đó (notFound) để trang tra cứu hiện panel
  // hướng dẫn đăng ký thay vì hiện lỗi đỏ chung chung.
  lookupApplicationByPhone: async (
    phone: string,
    code: string
  ): Promise<PublicApplicationStatus> => {
    try {
      const res = await apiClient.get('/shipper-applications/lookup', {
        params: { phone, code },
      });
      return res.data as PublicApplicationStatus;
    } catch (err) {
      const maybeAxios = err as { response?: { status?: number } } | null;
      if (maybeAxios?.response?.status === 404) {
        const notFoundError = new Error('NOT_FOUND');
        (notFoundError as unknown as { notFound: boolean }).notFound = true;
        throw notFoundError;
      }
      throw new Error(extractMessage(err, 'Không thể tra cứu hồ sơ'));
    }
  },

  // Shipper đã duyệt tự đặt mật khẩu bằng SĐT + mã tra cứu (public).
  // Chỉ đặt được 1 lần; đặt rồi thì backend trả 409.
  setShipperPassword: async (
    phone: string,
    code: string,
    newPassword: string
  ): Promise<{ issuedEmail: string | null }> => {
    try {
      const res = await apiClient.post('/shipper-applications/set-password', {
        phone,
        code,
        newPassword,
      });
      return res.data as { issuedEmail: string | null };
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể đặt mật khẩu, vui lòng thử lại'));
    }
  },

  // Manager đặt lại mật khẩu cho shipper quên mật khẩu (chỉ hồ sơ APPROVED).
  // Mật khẩu cũ hết hiệu lực ngay, mật khẩu tạm mới chỉ hiện một lần.
  resetShipperPassword: async (id: string): Promise<ResetPasswordResult> => {
    try {
      const res = await apiClient.post(`/shipper-applications/${id}/reset-password`);
      return res.data as ResetPasswordResult;
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể đặt lại mật khẩu'));
    }
  },

  // Manager cấp lại mã tra cứu khi người nộp làm mất mã (mã cũ hết hiệu lực).
  reissueLookupCode: async (id: string): Promise<{ lookupCode: string }> => {
    try {
      const res = await apiClient.post(`/shipper-applications/${id}/reissue-code`);
      return res.data as { lookupCode: string };
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể cấp lại mã tra cứu'));
    }
  },

  // Manager thu hồi mail của shipper đã nghỉ: tài khoản cũ bị vô hiệu hóa,
  // mail về lại pool trống. Shipper còn đơn đang giao thì backend chặn lại.
  reclaimPoolEmail: async (email: string): Promise<ShipperEmailPoolEntry> => {
    try {
      const res = await apiClient.post(`/shipper-email-pool/${email}/reclaim`);
      return res.data as ShipperEmailPoolEntry;
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể thu hồi mail'));
    }
  },

  // Danh sách hồ sơ chờ duyệt (MANAGER). status bỏ trống = tất cả.
  listApplications: async (status?: ApplicationStatus | ''): Promise<ShipperApplication[]> => {
    try {
      const res = await apiClient.get('/shipper-applications', {
        params: status ? { status } : undefined,
      });
      return res.data as ShipperApplication[];
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể tải danh sách hồ sơ'));
    }
  },

  getApplication: async (id: string): Promise<ShipperApplication> => {
    try {
      const res = await apiClient.get(`/shipper-applications/${id}`);
      return res.data as ShipperApplication;
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể tải hồ sơ'));
    }
  },

  // Duyệt hồ sơ: cần tick đủ 4 điều kiện + chọn 1 mail trống trong pool.
  // Trả về application đã duyệt kèm email đã cấp. Không còn mật khẩu tạm:
  // shipper tự đặt mật khẩu qua trang tra cứu bằng mã của mình.
  approveApplication: async (
    id: string,
    email: string,
    checks: ReviewChecks
  ): Promise<ApproveResult> => {
    try {
      const res = await apiClient.post(`/shipper-applications/${id}/approve`, {
        email,
        checks,
      });
      return res.data as ApproveResult;
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể duyệt hồ sơ, vui lòng thử lại'));
    }
  },

  rejectApplication: async (id: string, reason: string): Promise<ShipperApplication> => {
    try {
      const res = await apiClient.post(`/shipper-applications/${id}/reject`, { reason });
      return res.data as ShipperApplication;
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể từ chối hồ sơ, vui lòng thử lại'));
    }
  },

  // Pool 20 mail cố định: mỗi mail hiện trạng thái trống hay đang dùng bởi ai.
  listEmailPool: async (): Promise<ShipperEmailPoolEntry[]> => {
    try {
      const res = await apiClient.get('/shipper-email-pool');
      return res.data as ShipperEmailPoolEntry[];
    } catch (err) {
      throw new Error(extractMessage(err, 'Không thể tải danh sách mail'));
    }
  },
};
