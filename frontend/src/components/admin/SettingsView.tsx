'use client';

import React, { useState } from 'react';
import {
  Building,
  User,
  Shield,
  Percent,
  Lock,
  Loader2,
  Info,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api, getFriendlyErrorMessage } from '../../lib/api';

export function SettingsView() {
  const { addToast } = useAdminStore();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'general' | 'discounts' | 'profile' | 'security'>('general');

  // Form states (Read-only reference)
  const generalConfig = {
    companyName: 'Công Ty TNHH Thương Mại & Kỹ Thuật TDT M&E',
    taxCode: '0315889988',
    hotline: '0909 123 456',
    address: 'Số 150 Đường D1, KDC Him Lam, Q.7, TP. Hồ Chí Minh',
    vatRate: 8,
  };

  const discountsConfig = {
    tier1: 35, // % Chiết khấu Đại lý Cấp 1
    tier2: 28, // % Chiết khấu Đại lý Cấp 2
    contractor: 22, // % Chiết khấu Nhà thầu M&E
    project: 18, // % Chiết khấu Khách công trình
  };

  const profileData = {
    name: user?.name || 'Quản Trị Viên TDT',
    email: user?.email || 'admin@tdt.vn',
    phone: user?.phone || '0908888999',
    role: 'Quản Trị Viên Hệ Thống M&E (ADMIN)',
  };

  // Password state for Security tab
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword.trim()) {
      addToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Mật khẩu mới phải có ít nhất 8 ký tự', 'error');
      return;
    }
    if (newPassword === oldPassword) {
      addToast('Mật khẩu mới không được trùng với mật khẩu cũ', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/users/me/change-password', {
        oldPassword,
        newPassword,
      });
      addToast('Đổi mật khẩu tài khoản Admin thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast(getFriendlyErrorMessage(err), 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Cấu Hình Hệ Thống TDT M&E
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý tỷ lệ chiết khấu đại lý, thuế VAT, hồ sơ Admin & bảo mật
        </p>
      </div>

      {/* Settings Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 shrink-0">
          {[
            { id: 'general', label: 'Thông tin công ty & VAT', icon: Building },
            { id: 'discounts', label: 'Tỷ lệ chiết khấu đại lý', icon: Percent },
            { id: 'profile', label: 'Hồ sơ tài khoản Admin', icon: User },
            { id: 'security', label: 'Bảo mật & Mật khẩu', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 p-6 lg:p-8">
          {/* TAB 1: General (Read-Only) */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-xl text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Thông tin pháp lý doanh nghiệp được đồng bộ từ hồ sơ thuế (Chế độ chỉ đọc).</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                Thông Tin Doanh Nghiệp TDT M&E
              </h3>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên công ty xuất hóa đơn
                </label>
                <input
                  type="text"
                  readOnly
                  value={generalConfig.companyName}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế (MST)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={generalConfig.taxCode}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-200 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thuế VAT mặc định (%)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${generalConfig.vatRate}%`}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-cyan-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hotline bộ phận báo giá vật tư
                </label>
                <input
                  type="text"
                  readOnly
                  value={generalConfig.hotline}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ kho trung tâm giao 2H
                </label>
                <input
                  type="text"
                  readOnly
                  value={generalConfig.address}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Discounts (Read-Only) */}
          {activeTab === 'discounts' && (
            <div className="space-y-4 max-w-xl text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Khung chiết khấu cố định theo chính sách bán buôn đại lý (Chế độ chỉ đọc).</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                Khung Tỷ Lệ Chiết Khấu Mặc Định (% Tối Đa)
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ lệ này được áp dụng tự động khi nhân viên lập đơn hàng theo từng cấp độ đại lý.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Đại lý Cấp 1 (Chính thức)</p>
                    <p className="text-[11px] text-slate-400">Cam kết doanh số tối thiểu 500tr/tháng</p>
                  </div>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    {discountsConfig.tier1}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Đại lý Cấp 2</p>
                    <p className="text-[11px] text-slate-400">Lấy hàng định kỳ theo đơn công trình</p>
                  </div>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    {discountsConfig.tier2}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Nhà thầu M&E / Đội thi công</p>
                    <p className="text-[11px] text-slate-400">Cung cấp vật tư trọn gói dự án</p>
                  </div>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    {discountsConfig.contractor}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Khách công trình</p>
                    <p className="text-[11px] text-slate-400">Giao hàng theo tiến độ đợt</p>
                  </div>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    {discountsConfig.project}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Profile (Read-Only) */}
          {activeTab === 'profile' && (
            <div className="space-y-4 max-w-xl text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Hồ sơ Admin hệ thống được cấp phát bởi quản trị viên cấp cao.</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                Hồ Sơ Tài Khoản Quản Trị
              </h3>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  readOnly
                  value={profileData.name}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email đăng nhập
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={profileData.email}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={profileData.phone}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chức vụ / Vai trò
                </label>
                <input
                  type="text"
                  readOnly
                  value={profileData.role}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-cyan-600 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Security (Active Form calling real API) */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl text-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                Đổi Mật Khẩu & Bảo Mật Tài Khoản
              </h3>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới (tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Cập Nhật Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
