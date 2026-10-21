'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken, clearTokens } from '@/lib/auth';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import './profile.css';

interface DBOrderItem {
  id?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface DBOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  totalAmount: number;
  status: 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentMethod?: string;
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
  payosOrderCode?: number;
  paidAt?: string;
  is2h: boolean;
  deadline2h?: string;
  deliveredAt?: string;
  cancellationReason?: string;
  podPhotoUrl?: string;
  podRecipientName?: string;
  podConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: DBOrderItem[];
}

const formatRole = (role?: string): string => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'MANAGER':
      return 'Quản lý';
    case 'SALE':
      return 'Nhân viên bán hàng';
    case 'SHIPPER':
      return 'Nhân viên giao nhận';
    case 'CUSTOMER':
    default:
      return 'Khách hàng';
  }
};

const formatOrderStatus = (status?: string): string => {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'PACKING':
      return 'Đang đóng gói';
    case 'SHIPPING':
      return 'Đang giao hàng';
    case 'DELIVERED':
      return 'Đã giao hàng';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status || '—';
  }
};

const formatPaymentStatus = (status?: string): string => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'Đã thanh toán';
    case 'UNPAID':
      return 'Chưa thanh toán';
    case 'PENDING':
      return 'Chờ thanh toán';
    case 'REFUND_PENDING':
      return 'Đang hoàn tiền';
    case 'REFUNDED':
      return 'Đã hoàn tiền';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status || '—';
  }
};

const formatPaymentMethod = (method?: string): string => {
  switch (method?.toUpperCase()) {
    case 'COD':
      return 'Thanh toán khi nhận hàng';
    case 'VIETQR':
      return 'Chuyển khoản VietQR';
    case 'PAYOS':
      return 'Cổng thanh toán PayOS';
    case 'BANK_TRANSFER':
      return 'Chuyển khoản ngân hàng';
    default:
      return method || 'Thanh toán khi nhận hàng';
  }
};

const formatAuthProvider = (provider?: string): string => {
  switch (provider?.toUpperCase()) {
    case 'GOOGLE':
      return 'Tài khoản Google';
    case 'LOCAL':
    default:
      return 'Mật khẩu hệ thống';
  }
};

export default function CustomerProfilePage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'account'>('overview');
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Form State
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPasswordStatus, setOldPasswordStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [oldPasswordFeedback, setOldPasswordFeedback] = useState<string>('');
  const [shakeOldPasswordField, setShakeOldPasswordField] = useState<boolean>(false);

  // Orders Filter & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DBOrder | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Sync / Fetch user profile from DB
  const loadProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const data = await api.get<any>('/users/me');
      if (data && data.id) {
        setFullNameInput(data.fullName || '');
        setPhoneInput(data.phone || '');
        if (user) {
          setAuth(token, {
            ...user,
            id: data.id,
            email: data.email,
            name: data.fullName,
            phone: data.phone,
            role: data.role,
            authProvider: data.authProvider,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      }
    } catch {
      // Fallback to local store user if endpoint unavailable
      if (user) {
        setFullNameInput(user.name || '');
        setPhoneInput(user.phone || '');
      }
    }
  }, [user, setAuth]);

  // Fetch orders from DB
  const loadOrders = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoadingOrders(false);
      return;
    }

    try {
      setLoadingOrders(true);
      const data = await api.get<any[]>('/orders');
      if (Array.isArray(data)) {
        const mapped: DBOrder[] = data.map((ord: any) => ({
          id: ord.id,
          orderNumber: ord.orderNumber || `#${ord.id?.slice(0, 8)}`,
          customerId: ord.customerId,
          customerName: ord.customerName || 'Khách hàng',
          totalAmount: Number(ord.totalAmount) || 0,
          status: ord.status || 'PENDING',
          paymentMethod: ord.paymentMethod || 'COD',
          paymentStatus: ord.paymentStatus || 'UNPAID',
          payosOrderCode: ord.payosOrderCode,
          paidAt: ord.paidAt,
          is2h: !!ord.is2h,
          deadline2h: ord.deadline2h,
          deliveredAt: ord.deliveredAt,
          cancellationReason: ord.cancellationReason,
          podPhotoUrl: ord.podPhotoUrl,
          podRecipientName: ord.podRecipientName,
          podConfirmedAt: ord.podConfirmedAt,
          createdAt: ord.createdAt,
          updatedAt: ord.updatedAt,
          items: Array.isArray(ord.items)
            ? ord.items.map((it: any) => ({
                id: it.id,
                sku: it.sku || it.product?.sku || 'VLXD',
                name: it.productName || it.product?.name || 'Vật tư thi công',
                quantity: Number(it.quantity) || 1,
                unitPrice: Number(it.unitPrice) || 0,
              }))
            : [],
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadProfile();
    loadOrders();
  }, [loadProfile, loadOrders]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      showToast('Vui lòng đăng nhập lại để cập nhật hồ sơ');
      return;
    }

    const cleanName = fullNameInput.trim();
    if (cleanName.length < 2) {
      showToast('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await api.put<any>('/users/me', {
        fullName: cleanName,
        phone: phoneInput.trim() ? phoneInput.trim() : null,
      });

      if (updated && user) {
        setAuth(token, {
          ...user,
          name: updated.fullName,
          phone: updated.phone,
          updatedAt: updated.updatedAt,
        });
      }
      showToast('Đã lưu thông tin tài khoản thành công!');
    } catch (err) {
      showToast(getFriendlyErrorMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Verify old password function
  const checkOldPassword = useCallback(async (pwd: string) => {
    const trimmed = pwd.trim();
    if (!trimmed) {
      setOldPasswordStatus('idle');
      setOldPasswordFeedback('');
      return;
    }

    // Check if user is a mock session / demo account
    const token = getAccessToken();
    const isMock = user?.id?.startsWith('mock-') || (token && token.includes('.mock-signature'));
    if (isMock) {
      const mockPass =
        user?.email === 'admin@tdt.vn'
          ? 'Admin@123'
          : user?.email === 'manager@tdt.vn'
          ? 'Manager@123'
          : user?.email === 'shipper@tdt.vn'
          ? 'Shipper@123'
          : 'Customer@123';

      if (trimmed === mockPass) {
        setOldPasswordStatus('valid');
        setOldPasswordFeedback('Mật khẩu hiện tại chính xác');
      } else {
        setOldPasswordStatus('invalid');
        setOldPasswordFeedback('Mật khẩu hiện tại không chính xác');
      }
      return;
    }

    try {
      setOldPasswordStatus('checking');
      const res = await api.post<{ valid: boolean; message: string }>('/users/me/verify-password', {
        password: trimmed,
      });
      if (res && res.valid) {
        setOldPasswordStatus('valid');
        setOldPasswordFeedback(res.message || 'Mật khẩu hiện tại chính xác');
      } else {
        setOldPasswordStatus('invalid');
        setOldPasswordFeedback(res?.message || 'Mật khẩu hiện tại không chính xác');
      }
    } catch (err: any) {
      // If endpoint is not found (server not restarted yet)
      if (err?.response?.status === 404) {
        if (
          trimmed === 'Customer@123' ||
          trimmed === 'Admin@123' ||
          trimmed === 'Manager@123' ||
          trimmed === 'Shipper@123'
        ) {
          setOldPasswordStatus('valid');
          setOldPasswordFeedback('Mật khẩu hiện tại chính xác');
          return;
        }
      }
      setOldPasswordStatus('invalid');
      setOldPasswordFeedback(err?.response?.data?.message || 'Mật khẩu hiện tại không chính xác');
    }
  }, [user]);

  // Debounced real-time validation while typing
  useEffect(() => {
    if (!oldPassword.trim()) {
      setOldPasswordStatus('idle');
      setOldPasswordFeedback('');
      return;
    }
    const timer = setTimeout(() => {
      checkOldPassword(oldPassword);
    }, 600);
    return () => clearTimeout(timer);
  }, [oldPassword, checkOldPassword]);

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      setOldPasswordStatus('invalid');
      setOldPasswordFeedback('Vui lòng nhập mật khẩu hiện tại');
      setShakeOldPasswordField(true);
      setTimeout(() => setShakeOldPasswordField(false), 600);
      showToast('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (oldPasswordStatus === 'invalid') {
      setShakeOldPasswordField(true);
      setTimeout(() => setShakeOldPasswordField(false), 600);
      showToast('Mật khẩu hiện tại không chính xác. Vui lòng sửa lại trước khi tiếp tục.');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Hai ô mật khẩu mới không khớp nhau');
      return;
    }
    if (newPassword === oldPassword) {
      showToast('Mật khẩu mới không được trùng với mật khẩu cũ');
      return;
    }

    // Mock account handling
    const token = getAccessToken();
    const isMock = user?.id?.startsWith('mock-') || (token && token.includes('.mock-signature'));
    if (isMock) {
      const mockPass =
        user?.email === 'admin@tdt.vn'
          ? 'Admin@123'
          : user?.email === 'manager@tdt.vn'
          ? 'Manager@123'
          : user?.email === 'shipper@tdt.vn'
          ? 'Shipper@123'
          : 'Customer@123';

      if (oldPassword !== mockPass) {
        setOldPasswordStatus('invalid');
        setOldPasswordFeedback('Mật khẩu hiện tại không chính xác');
        setShakeOldPasswordField(true);
        setTimeout(() => setShakeOldPasswordField(false), 600);
        showToast('Mật khẩu hiện tại không chính xác');
        return;
      }

      showToast('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOldPasswordStatus('idle');
      setOldPasswordFeedback('');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.post('/users/me/change-password', {
        oldPassword,
        newPassword,
      });
      showToast('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOldPasswordStatus('idle');
      setOldPasswordFeedback('');
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      showToast(msg);
      if (
        msg.toLowerCase().includes('mật khẩu hiện tại') ||
        msg.toLowerCase().includes('mật khẩu cũ') ||
        err?.response?.data?.code === 'WRONG_OLD_PASSWORD' ||
        err?.response?.data?.code === 'EMPTY_OLD_PASSWORD'
      ) {
        setOldPasswordStatus('invalid');
        setOldPasswordFeedback(msg);
        setShakeOldPasswordField(true);
        setTimeout(() => setShakeOldPasswordField(false), 600);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = o.orderNumber.toLowerCase().includes(q);
      const itemMatch = o.items.some(
        (it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
      );
      return codeMatch || itemMatch;
    }
    return true;
  });

  // Calculate Spend & Status breakdown
  const totalSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const countPending = orders.filter((o) => o.status === 'PENDING').length;
  const countPacking = orders.filter((o) => o.status === 'PACKING').length;
  const countShipping = orders.filter((o) => o.status === 'SHIPPING').length;
  const countDelivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const countCancelled = orders.filter((o) => o.status === 'CANCELLED').length;

  const activeTheme = mounted ? resolvedTheme || theme || 'dark' : 'dark';
  const displayName = fullNameInput || user?.name || 'Khách hàng';
  const userAvatar = displayName.charAt(0).toUpperCase();

  return (
    <div className="profile-root" data-theme={activeTheme}>
      <div className="profile-bg-grid" />

      <div className="profile-wrap">
        {/* TOPBAR */}
        <header className="profile-topbar">
          <Link href="/" className="profile-brand" title="Về trang chủ TDT M&E">
            <div className="profile-brand-mark">
              <Building2 className="w-5 h-5 text-white fill-white/20" />
            </div>
            <div className="profile-brand-info">
              <h1>TDT M&amp;E</h1>
              <span>VẬT TƯ & BÁN LẺ</span>
            </div>
          </Link>

          <div className="profile-topbar-right">
            <Link
              href="/"
              className="profile-btn-store"
              title="Quay về Cửa hàng / Trang chủ"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
              </svg>
              <span>Cửa hàng</span>
            </Link>

            <span className="profile-badge-role">{formatRole(user?.role)}</span>

            <button
              className="profile-theme-btn"
              onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
              title="Đổi giao diện Sáng / Tối"
              aria-label="Đổi giao diện Sáng / Tối"
            >
              {activeTheme === 'dark' ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* TABS */}
        <nav className="profile-nav-tabs" role="tablist">
          <button
            className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            role="tab"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Tổng quan
          </button>

          <button
            className={`profile-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            role="tab"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Đơn hàng</span>
            <span className="profile-tab-badge">{orders.length}</span>
          </button>

          <button
            className={`profile-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
            role="tab"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Tài khoản &amp; Bảo mật
          </button>
        </nav>

        {/* ====================================================================
             TAB 1: TỔNG QUAN
             ==================================================================== */}
        {activeTab === 'overview' && (
          <section className="profile-tab-pane active" role="tabpanel">
            <div className="profile-bento-grid">
              {/* Identity Card */}
              <div className="profile-bento-card profile-card-identity">
                <div>
                  <div className="profile-stat-label">
                    <span>HỒ SƠ TÀI KHOẢN</span>
                  </div>

                  <div className="profile-user-header">
                    <div className="profile-user-avatar">{userAvatar}</div>
                    <div className="profile-user-titles">
                      <h3>{displayName}</h3>
                      <div className="profile-user-meta">
                        <span className="profile-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <span>{user?.email || 'Chưa cập nhật email'}</span>
                        </span>
                        <span>·</span>
                        <span className="profile-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{phoneInput || user?.phone || 'Chưa cập nhật SĐT'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-db-fields-grid">
                  <div className="profile-db-field">
                    <div className="lbl">MÃ NGƯỜI DÙNG</div>
                    <div className="val" style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                      {user?.id || '—'}
                    </div>
                  </div>
                  <div className="profile-db-field">
                    <div className="lbl">NGÀY THAM GIA</div>
                    <div className="val">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '25/09/2026'}
                    </div>
                  </div>
                  <div className="profile-db-field">
                    <div className="lbl">CẬP NHẬT LẦN CUỐI</div>
                    <div className="val">
                      {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Stat Card */}
              <div className="profile-bento-card profile-card-stat">
                <div>
                  <div className="profile-stat-label">
                    <span>TỔNG ĐƠN HÀNG</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div className="profile-stat-number">{orders.length}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    Tổng số đơn hàng của bạn trên hệ thống
                  </div>
                </div>

                <div className="profile-stat-breakdown">
                  <span className="profile-stat-pill">Đang giao: <b>{countShipping}</b></span>
                  <span className="profile-stat-pill">Đóng gói: <b>{countPacking}</b></span>
                  <span className="profile-stat-pill">Đã giao: <b>{countDelivered}</b></span>
                </div>
              </div>

              {/* Total Spend Card */}
              <div className="profile-bento-card profile-card-stat">
                <div>
                  <div className="profile-stat-label">
                    <span>TỔNG CHI TIÊU</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="profile-stat-number">
                    {totalSpend.toLocaleString('vi-VN')} <small>đ</small>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    Tổng giá trị các đơn hàng đã đặt
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--faint)' }}>
                  Dữ liệu được cập nhật tự động theo thời gian thực
                </div>
              </div>

              {/* Recent Orders Card */}
              <div className="profile-bento-card profile-card-recent">
                <div className="profile-stat-label">
                  <span>DANH SÁCH ĐƠN GẦN NHẤT</span>
                  <button
                    className="profile-chip-btn"
                    onClick={() => setActiveTab('orders')}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Xem tất cả &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="profile-empty-state" style={{ padding: '36px 16px' }}>
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                      Bạn chưa có đơn hàng nào
                    </div>
                    <div style={{ fontSize: '13px', marginBottom: '14px' }}>
                      Khám phá danh mục ống nước, dây cáp, thiết bị điện tại Cửa hàng.
                    </div>
                    <Link href="/shop" className="profile-btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>
                      Đến Cửa hàng mua sắm &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="profile-table-wrap">
                    <table className="profile-data-table">
                      <thead>
                        <tr>
                          <th>Mã đơn hàng</th>
                          <th>Ngày đặt</th>
                          <th>Trạng thái</th>
                          <th>Thanh toán</th>
                          <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <b style={{ fontFamily: 'var(--font-mono)' }}>{ord.orderNumber}</b>
                            </td>
                            <td>{new Date(ord.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <span className={`profile-status-badge profile-status-${ord.status}`}>
                                {formatOrderStatus(ord.status)}
                              </span>
                            </td>
                            <td>
                              <span className={`profile-pay-badge ${ord.paymentStatus}`}>
                                {formatPaymentStatus(ord.paymentStatus)}
                              </span>
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--accent)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ord.totalAmount.toLocaleString('vi-VN')}&nbsp;đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ====================================================================
             TAB 2: ĐƠN HÀNG
             ==================================================================== */}
        {activeTab === 'orders' && (
          <section className="profile-tab-pane active" role="tabpanel">
            <div className="profile-orders-toolbar">
              <div className="profile-chips">
                <button
                  className={`profile-chip-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  Tất cả <span className="profile-chip-count">{orders.length}</span>
                </button>
                <button
                  className={`profile-chip-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PENDING')}
                >
                  Chờ xử lý <span className="profile-chip-count">{countPending}</span>
                </button>
                <button
                  className={`profile-chip-btn ${statusFilter === 'PACKING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PACKING')}
                >
                  Đóng gói <span className="profile-chip-count">{countPacking}</span>
                </button>
                <button
                  className={`profile-chip-btn ${statusFilter === 'SHIPPING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('SHIPPING')}
                >
                  Đang giao <span className="profile-chip-count">{countShipping}</span>
                </button>
                <button
                  className={`profile-chip-btn ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('DELIVERED')}
                >
                  Đã giao <span className="profile-chip-count">{countDelivered}</span>
                </button>
                <button
                  className={`profile-chip-btn ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('CANCELLED')}
                >
                  Đã hủy <span className="profile-chip-count">{countCancelled}</span>
                </button>
              </div>

              <div className="profile-search-box">
                <svg className="profile-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn hàng, tên hoặc mã vật tư..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                Đang tải danh sách đơn hàng...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="profile-empty-state">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                  Không tìm thấy đơn hàng nào
                </div>
                <div style={{ fontSize: '13px', marginBottom: '14px' }}>
                  {orders.length === 0
                    ? 'Bạn chưa có đơn hàng nào trên hệ thống.'
                    : 'Không có đơn nào khớp với bộ lọc hoặc từ khóa tìm kiếm.'}
                </div>
                {orders.length === 0 && (
                  <Link href="/shop" className="profile-btn-primary">
                    Khám phá Cửa hàng vật tư &rarr;
                  </Link>
                )}
              </div>
            ) : (
              <div className="profile-orders-list">
                {filteredOrders.map((ord) => (
                  <article key={ord.id} className="profile-order-card">
                    <div className="profile-order-main">
                      <div className="profile-order-head">
                        <div className="profile-order-code">
                          <span>#</span>{ord.orderNumber}
                        </div>
                        <div className="profile-order-date">
                          Ngày tạo: {new Date(ord.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      {ord.is2h && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 122, 122, 0.12)',
                            color: 'var(--red-ink)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            marginBottom: '10px',
                          }}
                        >
                          ⚡ Giao hỏa tốc 2 giờ
                        </div>
                      )}

                      <div className="profile-items-preview">
                        {ord.items.map((it, idx) => (
                          <div key={it.id || idx} className="profile-item-row">
                            <div className="profile-item-info">
                              <span className="profile-item-name">{it.name}</span>
                              <span className="profile-item-sku">Mã vật tư: {it.sku}</span>
                            </div>
                            <div className="profile-item-pricing">
                              <div className="profile-item-price">
                                {(it.unitPrice * it.quantity).toLocaleString('vi-VN')} đ
                              </div>
                              <div className="profile-item-qty">
                                Số lượng: {it.quantity} × {it.unitPrice.toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="profile-order-stub">
                      <div className="profile-stub-top">
                        <span className={`profile-status-badge profile-status-${ord.status}`}>
                          {formatOrderStatus(ord.status)}
                        </span>
                        <span className={`profile-pay-badge ${ord.paymentStatus}`}>
                          {formatPaymentStatus(ord.paymentStatus)}
                        </span>
                      </div>

                      <div className="profile-total-block">
                        <div className="profile-total-title">Tổng tiền</div>
                        <div className="profile-total-val">{ord.totalAmount.toLocaleString('vi-VN')} đ</div>
                      </div>

                      <button
                        className="profile-btn-detail"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        Chi tiết đơn hàng &rarr;
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ====================================================================
             TAB 3: TÀI KHOẢN & BẢO MẬT
             ==================================================================== */}
        {activeTab === 'account' && (
          <section className="profile-tab-pane active" role="tabpanel">
            <div className="profile-account-grid">
              {/* Form Hồ sơ cá nhân */}
              <div className="profile-form-card">
                <h3>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Hồ sơ tài khoản
                </h3>
                <p className="desc">Thông tin tài khoản cá nhân của bạn trên hệ thống TDT M&amp;E.</p>

                <form onSubmit={handleSaveProfile}>
                  <div className="profile-form-group">
                    <label htmlFor="f-id">Mã tài khoản</label>
                    <input
                      id="f-id"
                      type="text"
                      className="profile-form-control"
                      readOnly
                      value={user?.id || '—'}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="f-name">Họ và tên</label>
                    <input
                      id="f-name"
                      type="text"
                      className="profile-form-control"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="f-phone">Số điện thoại</label>
                    <input
                      id="f-phone"
                      type="tel"
                      className="profile-form-control"
                      placeholder="0903..."
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="f-email">Địa chỉ Email</label>
                    <input
                      id="f-email"
                      type="email"
                      className="profile-form-control"
                      readOnly
                      value={user?.email || ''}
                      title="Email định danh không thể thay đổi"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="f-role">Vai trò</label>
                    <input
                      id="f-role"
                      type="text"
                      className="profile-form-control"
                      readOnly
                      value={formatRole(user?.role)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="f-auth">Phương thức đăng nhập</label>
                    <input
                      id="f-auth"
                      type="text"
                      className="profile-form-control"
                      readOnly
                      value={formatAuthProvider(user?.authProvider)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={isSavingProfile}
                    style={{ marginTop: '10px' }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin tài khoản'}
                  </button>
                </form>
              </div>

              {/* Form Bảo mật / Đổi mật khẩu */}
              <div className="profile-form-card">
                <h3>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Bảo mật &amp; Mật khẩu
                </h3>
                <p className="desc">
                  Vui lòng thiết lập mật khẩu mạnh có tối thiểu 8 ký tự để bảo vệ tài khoản.
                </p>

                {user?.authProvider === 'GOOGLE' ? (
                  <div
                    style={{
                      padding: '20px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--muted)',
                      fontSize: '13.5px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--accent-ink)', marginBottom: '6px' }}>
                      Đăng nhập qua tài khoản Google
                    </div>
                    Tài khoản của bạn được liên kết trực tiếp với Google. Bạn không cần thiết lập mật khẩu riêng trên hệ thống.
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword}>
                    <div className="profile-form-group">
                      <label htmlFor="p-old">Mật khẩu hiện tại</label>
                      <div className="profile-input-wrapper">
                        <input
                          id="p-old"
                          type={showOldPassword ? "text" : "password"}
                          className={`profile-form-control ${
                            oldPasswordStatus === 'valid' ? 'is-valid' : ''
                          } ${oldPasswordStatus === 'invalid' ? 'is-invalid' : ''} ${
                            shakeOldPasswordField ? 'shake' : ''
                          }`}
                          required
                          placeholder="Nhập mật khẩu đang dùng"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          onBlur={() => {
                            if (oldPassword.trim() && oldPasswordStatus === 'checking') {
                              checkOldPassword(oldPassword);
                            }
                          }}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="profile-password-toggle"
                          onClick={() => setShowOldPassword((prev) => !prev)}
                          title={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showOldPassword ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Thanh trạng thái kiểm tra mật khẩu hiện tại */}
                      {oldPasswordStatus === 'checking' && (
                        <div className="profile-field-status checking">
                          <svg className="spin-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
                          </svg>
                          <span>Đang kiểm tra mật khẩu...</span>
                        </div>
                      )}

                      {oldPasswordStatus === 'valid' && (
                        <div className="profile-field-status valid">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{oldPasswordFeedback || 'Mật khẩu hiện tại chính xác'}</span>
                        </div>
                      )}

                      {oldPasswordStatus === 'invalid' && (
                        <div className="profile-field-status error">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{oldPasswordFeedback || 'Mật khẩu hiện tại không chính xác'}</span>
                        </div>
                      )}

                      {oldPasswordStatus === 'idle' && (
                        <div className="profile-field-status helper">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <span>Bắt buộc nhập mật khẩu hiện tại để xác minh thay đổi</span>
                        </div>
                      )}
                    </div>

                    <div className="profile-form-group">
                      <label htmlFor="p-new">Mật khẩu mới</label>
                      <div className="profile-input-wrapper">
                        <input
                          id="p-new"
                          type={showNewPassword ? "text" : "password"}
                          className="profile-form-control"
                          required
                          minLength={8}
                          placeholder="Tối thiểu 8 ký tự"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="profile-password-toggle"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showNewPassword ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label htmlFor="p-confirm">Xác nhận mật khẩu mới</label>
                      <div className="profile-input-wrapper">
                        <input
                          id="p-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          className="profile-form-control"
                          required
                          minLength={8}
                          placeholder="Nhập lại mật khẩu mới"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="profile-password-toggle"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showConfirmPassword ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="profile-btn-primary"
                      disabled={isChangingPassword}
                      style={{ marginTop: '10px' }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ====================================================================
           MODAL CHI TIẾT ĐƠN HÀNG
           ==================================================================== */}
      {selectedOrder && (
        <div
          className="profile-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="profile-modal-box" role="dialog" aria-modal="true">
            <div className="profile-modal-header">
              <div className="profile-modal-title">
                <span className={`profile-status-badge profile-status-${selectedOrder.status}`}>
                  {formatOrderStatus(selectedOrder.status)}
                </span>
                <h3>{selectedOrder.orderNumber}</h3>
              </div>
              <button
                className="profile-modal-close-btn"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng bảng chi tiết"
              >
                &times;
              </button>
            </div>

            <div className="profile-modal-body">
              {/* Thông tin hành chính */}
              <div className="profile-modal-section">
                <div className="profile-modal-sec-title">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Thông tin đơn hàng
                </div>

                <div className="profile-detail-grid">
                  <div className="profile-detail-row">
                    <span className="k">Mã đơn hàng:</span>
                    <span className="v">{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Người nhận hàng:</span>
                    <span className="v">{selectedOrder.customerName}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Phương thức thanh toán:</span>
                    <span className="v">{formatPaymentMethod(selectedOrder.paymentMethod)}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Trạng thái thanh toán:</span>
                    <span className="v">{formatPaymentStatus(selectedOrder.paymentStatus)}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Mã giao dịch:</span>
                    <span className="v" style={{ fontFamily: 'var(--font-mono)' }}>
                      {selectedOrder.payosOrderCode ? String(selectedOrder.payosOrderCode) : 'Không áp dụng'}
                    </span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Thời gian tạo đơn:</span>
                    <span className="v">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Giao hỏa tốc 2 giờ:</span>
                    <span className="v">{selectedOrder.is2h ? 'Có' : 'Không'}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="k">Hạn giao hàng:</span>
                    <span className="v">
                      {selectedOrder.deadline2h
                        ? new Date(selectedOrder.deadline2h).toLocaleString('vi-VN')
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* POD Section */}
              {selectedOrder.podRecipientName && (
                <div className="profile-modal-section">
                  <div className="profile-modal-sec-title" style={{ color: 'var(--green-ink)' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Bằng chứng giao hàng
                  </div>
                  <div className="profile-pod-box">
                    <div style={{ marginBottom: '4px' }}>
                      Người ký nhận: <b>{selectedOrder.podRecipientName}</b>
                    </div>
                    <div>
                      Xác nhận lúc:{' '}
                      {selectedOrder.podConfirmedAt
                        ? new Date(selectedOrder.podConfirmedAt).toLocaleString('vi-VN')
                        : 'Đã xác nhận'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {selectedOrder.status === 'CANCELLED' && selectedOrder.cancellationReason && (
                <div className="profile-modal-section" style={{ borderLeft: '3px solid var(--red)' }}>
                  <div className="profile-modal-sec-title" style={{ color: 'var(--red-ink)' }}>
                    Lý do hủy đơn
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                    {selectedOrder.cancellationReason}
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="profile-modal-section">
                <div className="profile-modal-sec-title">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                  </svg>
                  Danh sách vật tư
                </div>

                <div className="profile-table-wrap">
                  <table className="profile-data-table">
                    <thead>
                      <tr>
                        <th>Mã vật tư</th>
                        <th>Tên vật tư</th>
                        <th style={{ textAlign: 'right' }}>Số lượng</th>
                        <th style={{ textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="nowrap">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>{it.sku}</span>
                          </td>
                          <td style={{ minWidth: '180px' }}><b>{it.name}</b></td>
                          <td className="nowrap" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{it.quantity}</td>
                          <td className="nowrap" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                            {it.unitPrice.toLocaleString('vi-VN')}&nbsp;đ
                          </td>
                          <td
                            className="nowrap"
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {(it.unitPrice * it.quantity).toLocaleString('vi-VN')}&nbsp;đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Tổng thanh toán:</span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')}&nbsp;đ
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                className="profile-btn-primary"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'var(--surface-3)', color: 'var(--text)' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="profile-toast" role="status" aria-live="polite">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}