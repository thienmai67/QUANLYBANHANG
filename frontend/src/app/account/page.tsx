'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import FacebookSignInButton from '@/components/FacebookSignInButton';
import {
  User,
  LogIn,
  LogOut,
  ShoppingBag,
  Clock,
  Zap,
  Package,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getCurrentUser,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  decodeToken,
} from '@/lib/auth';
import { api, API_BASE_URL, getFriendlyErrorMessage } from '@/lib/api';

interface AccountOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  quantity: number;
  unitPrice: number;
}

interface AccountOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  paymentMethod?: string;
  totalAmount: number;
  status: 'PENDING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | string;
  items?: AccountOrderItem[];
  createdAt: string;
}

function getOrderStatusBadge(status: string): { label: string; className: string } {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return {
        label: 'Chờ Xác Nhận',
        className:
          'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
      };
    case 'PACKING':
      return {
        label: 'Đang Đóng Gói',
        className:
          'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
      };
    case 'SHIPPING':
      return {
        label: 'Đang Giao Hàng',
        className:
          'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900',
      };
    case 'DELIVERED':
      return {
        label: 'Đã Giao Thành Công',
        className:
          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
      };
    case 'CANCELLED':
      return {
        label: 'Đã Hủy',
        className:
          'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
      };
    default:
      return {
        label: status || 'Đang xử lý',
        className:
          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      };
  }
}

function formatPaymentMethod(method?: string): string {
  const m = (method || 'COD').toUpperCase();
  if (m === 'BANK_TRANSFER' || m === 'BANK') {
    return 'Chuyển khoản ngân hàng';
  }
  return 'Thanh toán COD khi nhận';
}

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await api.get<AccountOrder[]>('/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrdersError(getFriendlyErrorMessage(err));
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken() || '';
    const decoded = getCurrentUser();

    if (decoded && accessToken) {
      const rawRole = (decoded.role || '').toUpperCase();
      let role: any = 'CUSTOMER';
      if (rawRole === 'ADMIN') role = 'ADMIN';
      else if (rawRole === 'MANAGER') role = 'MANAGER';
      else if (rawRole === 'SHIPPER') role = 'SHIPPER';

      if (!user || user.id !== decoded.userId || user.email !== decoded.email) {
        setAuth(
          accessToken,
          {
            id: decoded.userId,
            email: decoded.email,
            name:
              user && user.email === decoded.email && user.name
                ? user.name
                : decoded.email.split('@')[0],
            role: role,
          },
          refreshToken
        );
      }

      if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
        return;
      } else if (role === 'MANAGER') {
        router.replace('/manager');
        return;
      } else if (role === 'SHIPPER') {
        router.replace('/shipper');
        return;
      }

      fetchMyOrders();
    } else if (user) {
      if (user.role === 'ADMIN') router.replace('/admin/dashboard');
      else if (user.role === 'MANAGER') router.replace('/manager');
      else if (user.role === 'SHIPPER') router.replace('/shipper');
      else fetchMyOrders();
    } else if (!decoded && !user && !isAuthenticated) {
      router.replace('/login');
    }
  }, [user, isAuthenticated, setAuth, router, fetchMyOrders]);

  useEffect(() => {
    const handleOrdersUpdated = () => {
      fetchMyOrders();
    };
    window.addEventListener('tdt-orders-updated', handleOrdersUpdated);
    return () => {
      window.removeEventListener('tdt-orders-updated', handleOrdersUpdated);
    };
  }, [fetchMyOrders]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const endpoint = activeTab === 'login' ? '/auth/login' : '/auth/register';
      const bodyPayload =
        activeTab === 'login'
          ? { email: email.trim().toLowerCase(), password }
          : {
              fullName: fullName.trim() || email.split('@')[0],
              email: email.trim().toLowerCase(),
              phone: phone.trim() || undefined,
              password,
            };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Xác thực không thành công. Vui lòng kiểm tra lại.');
      }

      const data = await res.json();
      let accessToken = data.accessToken || data.access_token;
      let refreshToken = data.refreshToken || data.refresh_token || '';

      if (!accessToken && activeTab === 'register') {
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          accessToken = loginData.accessToken || loginData.access_token;
          refreshToken = loginData.refreshToken || loginData.refresh_token || '';
        }
      }

      if (accessToken) {
        saveTokens(accessToken, refreshToken);
        const decoded = decodeToken(accessToken);
        if (decoded) {
          const rawRole = (decoded.role || 'CUSTOMER').toUpperCase();
          const role: any =
            rawRole === 'ADMIN'
              ? 'ADMIN'
              : rawRole === 'MANAGER'
                ? 'MANAGER'
                : rawRole === 'SHIPPER'
                  ? 'SHIPPER'
                  : 'CUSTOMER';

          setAuth(
            accessToken,
            {
              id: decoded.userId,
              email: decoded.email,
              name: fullName.trim() || decoded.email.split('@')[0],
              role,
            },
            refreshToken
          );

          if (role === 'ADMIN') {
            router.replace('/admin/dashboard');
            return;
          } else if (role === 'MANAGER') {
            router.replace('/manager');
            return;
          } else if (role === 'SHIPPER') {
            router.replace('/shipper');
            return;
          }
          await fetchMyOrders();
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Đã xảy ra lỗi khi xác thực.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <MaterialHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {!isAuthenticated ? (
          /* UNAUTHENTICATED FORM (REGULAR ONLINE BUYER LOGIN / REGISTER) */
          <div className="max-w-md mx-auto bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="p-2 flex bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-[#0c1322] text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-[#0c1322] text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tạo Tài Khoản
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-600/20">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  {activeTab === 'login' ? 'Đăng Nhập Mua Hàng' : 'Đăng Ký Tài Khoản Mới'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Theo dõi đơn hàng online, quản lý địa chỉ nhận hàng & tích điểm
                </p>
              </div>

              {/* Fast Google SSO Button */}
              <div className="space-y-3 mb-6">
                <GoogleSignInButton label="Đăng nhập 1-Click bằng Google" />
                <FacebookSignInButton label="Đăng nhập bằng Facebook" />
              </div>

              <div className="relative my-6 text-center">
                <hr className="border-slate-200 dark:border-slate-800" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-white dark:bg-[#0c1322] text-[10px] uppercase font-bold text-slate-400">
                  Hoặc đăng nhập bằng Email
                </span>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  {authError}
                </div>
              )}

              {/* Standard Registration & Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {activeTab === 'register' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Họ và tên người mua hàng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-slate-100 outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-slate-100 outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenvana@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-slate-100 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-slate-100 outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {authSubmitting
                    ? 'Đang xử lý...'
                    : activeTab === 'login'
                      ? 'Đăng Nhập Mua Hàng'
                      : 'Tạo Tài Khoản Ngay'}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trang đăng nhập đầy đủ</span>
                <Link
                  href="/login"
                  className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Đi tới /login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ONLINE CUSTOMER DASHBOARD */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Customer Header Profile Card */}
            <div className="p-6 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  {user?.name?.[0]?.toUpperCase() || 'K'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {user?.name || 'Khách Hàng Mua Lẻ'}
                    </h2>
                    <span className="px-3 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-900">
                      THÀNH VIÊN THÂN THIẾT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Email: <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/shop"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Tiếp Tục Mua Hàng
                </Link>
                <button
                  onClick={() => {
                    clearTokens();
                    logout();
                    window.location.href = '/login';
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Đăng Xuất
                </button>
              </div>
            </div>

            {/* Customer Orders Tracking */}
            <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Lịch Sử Đơn Hàng Mua Online Của Bạn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Theo dõi tiến độ giao hàng COD tận nhà
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchMyOrders}
                    disabled={ordersLoading}
                    className="p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Làm mới danh sách đơn hàng"
                  >
                    <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900">
                    {orders.length} đơn hàng
                  </span>
                </div>
              </div>

              {ordersLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Đang tải lịch sử đơn hàng...
                </div>
              ) : ordersError ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  {ordersError}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Bạn chưa có đơn hàng nào
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hãy khám phá kho vật tư M&amp;E chính hãng và đặt đơn hàng đầu tiên của bạn.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Mua Sắm Ngay
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const badge = getOrderStatusBadge(order.status);
                    const itemsList = Array.isArray(order.items) ? order.items : [];
                    return (
                      <div
                        key={order.id}
                        className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {order.createdAt && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleString('vi-VN')}
                              </span>
                            )}
                          </div>

                          {itemsList.length > 0 ? (
                            <div className="space-y-1 pt-0.5">
                              {itemsList.map((item) => (
                                <p
                                  key={item.id}
                                  className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"
                                >
                                  <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    {Number(item.quantity)}x{' '}
                                    {item.product?.name || `Sản phẩm (${item.productId.slice(0, 8)})`}
                                    {item.product?.sku ? ` [${item.product.sku}]` : ''} —{' '}
                                    <span className="font-mono text-slate-600 dark:text-slate-300">
                                      {Number(item.unitPrice).toLocaleString('vi-VN')} ₫
                                    </span>
                                  </span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              Khách nhận: {order.customerName}
                            </p>
                          )}
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-base">
                            {Number(order.totalAmount || 0).toLocaleString('vi-VN')} VND
                          </p>
                          <span className="text-[11px] text-slate-500">
                            Hình thức: {formatPaymentMethod(order.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <MaterialFooter />
    </div>
  );
}
