'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import FacebookSignInButton from '@/components/FacebookSignInButton';
import {
  User,
  LogIn,
  ShieldCheck,
  Building2,
  LogOut,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Zap,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getCurrentUser } from '@/lib/auth';

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Auto sync auth from token if available on mount & redirect ADMIN to dashboard or unauthenticated to /login
  useEffect(() => {
    const decoded = getCurrentUser();
    if (decoded && !user) {
      const isStaff = decoded.role.toUpperCase() === 'ADMIN' || decoded.role.toUpperCase() === 'MANAGER';
      const role = isStaff ? 'ADMIN' : 'CUSTOMER';

      setAuth('jwt-token-sso', {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email.split('@')[0],
        role: role,
      });

      if (isStaff) {
        router.replace('/admin/dashboard');
      }
    } else if (user && user.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else if (!decoded && !user && !isAuthenticated) {
      router.replace('/login');
    }
  }, [user, isAuthenticated, setAuth, router]);

  // Handle direct login & immediate redirect for ADMIN
  const handleLoginRole = (role: 'ADMIN' | 'CUSTOMER') => {
    if (role === 'ADMIN') {
      const adminUser = {
        id: 'adm-1',
        email: 'admin@tdt-me.com.vn',
        name: 'Nguyễn Văn Minh (Quản trị viên)',
        role: 'ADMIN' as const,
      };
      setAuth('mock-token-admin', adminUser);
      router.replace('/admin/dashboard');
    } else {
      const customerUser = {
        id: 'cust-101',
        email: email || 'khachhang@gmail.com',
        name: fullName || email.split('@')[0] || 'Khách Hàng Mua Lẻ',
        role: 'CUSTOMER' as const,
      };
      setAuth('mock-token-customer', customerUser);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = email.toLowerCase().includes('admin');
    handleLoginRole(isAdmin ? 'ADMIN' : 'CUSTOMER');
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
                    placeholder="nguyenvana@gmail.com (Gõ 'admin' để đăng nhập Admin)"
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
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {activeTab === 'login' ? 'Đăng Nhập Mua Hàng' : 'Tạo Tài Khoản Ngay'}
                </button>
              </form>

              {/* Demo Helper Switcher for fast testing */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cần đăng nhập Admin?</span>
                <button
                  onClick={() => handleLoginRole('ADMIN')}
                  className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Đăng nhập Admin
                </button>
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
                  onClick={logout}
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

                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900">
                  1 Đơn hàng vừa đặt
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        DH-ONLINE-8899
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                        Đang Đóng Gói
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                      1x Dây Cáp Điện Cadivi CV 2.5mm² (Cuộn 100m) + 2x Aptomat Schneider 32A
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> Giao đến: Số 45 Đường số 12, P. Bình Trưng Đông, Q.2, TP.HCM
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-base">
                      1.220.000 VND
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Hình thức: Thanh toán COD khi nhận
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MaterialFooter />
    </div>
  );
}
