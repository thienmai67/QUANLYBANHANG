'use client';

import React, { useState } from 'react';
import {
  Building,
  User,
  Shield,
  Bell,
  Palette,
  Check,
  Save,
  Percent,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

export function SettingsView() {
  const { addToast, darkMode, toggleDarkMode } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'general' | 'discounts' | 'profile' | 'security'>('general');

  // Form states
  const [generalConfig, setGeneralConfig] = useState({
    companyName: 'Công Ty TNHH Thương Mại & Kỹ Thuật TDT M&E',
    taxCode: '0315889988',
    hotline: '0909 123 456',
    address: 'Số 150 Đường D1, KDC Him Lam, Q.7, TP. Hồ Chí Minh',
    vatRate: 8,
  });

  const [discountsConfig, setDiscountsConfig] = useState({
    tier1: 35, // % Chiết khấu Đại lý Cấp 1
    tier2: 28, // % Chiết khấu Đại lý Cấp 2
    contractor: 22, // % Chiết khấu Nhà thầu M&E
    project: 18, // % Chiết khấu Khách công trình
  });

  const [profileData, setProfileData] = useState({
    name: 'Nguyễn Văn Minh',
    email: 'admin@tdt-me.com.vn',
    phone: '0903 888 999',
    role: 'Giám Đốc Kinh Doanh Vật Tư M&E',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Đã lưu cấu hình hệ thống thành công!', 'success');
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
          <form onSubmit={handleSave} className="space-y-6 max-w-xl text-xs">
            {/* TAB 1: General */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Thông Tin Doanh Nghiệp TDT M&E
                </h3>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên công ty xuất hóa đơn
                  </label>
                  <input
                    type="text"
                    value={generalConfig.companyName}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mã số thuế (MST)
                    </label>
                    <input
                      type="text"
                      value={generalConfig.taxCode}
                      onChange={(e) => setGeneralConfig({ ...generalConfig, taxCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Thuế VAT mặc định (%)
                    </label>
                    <input
                      type="number"
                      value={generalConfig.vatRate}
                      onChange={(e) => setGeneralConfig({ ...generalConfig, vatRate: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-cyan-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotline bộ phận báo giá vật tư
                  </label>
                  <input
                    type="text"
                    value={generalConfig.hotline}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, hotline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ kho trung tâm giao 2H
                  </label>
                  <input
                    type="text"
                    value={generalConfig.address}
                    onChange={(e) => setGeneralConfig({ ...generalConfig, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Discounts */}
            {activeTab === 'discounts' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Khung Tỷ Lệ Chiết Khấu Mặc Định (% Tối Đa)
                </h3>
                <p className="text-xs text-slate-500">
                  Tỷ lệ này sẽ được tự động tính toán khi tiếp nhận file bóc tách BOM hoặc khởi tạo đơn hàng mới.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Đại lý Cấp 1 (Chính thức)</p>
                      <p className="text-[11px] text-slate-400">Cam kết doanh số tối thiểu 500tr/tháng</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                      <input
                        type="number"
                        value={discountsConfig.tier1}
                        onChange={(e) => setDiscountsConfig({ ...discountsConfig, tier1: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Đại lý Cấp 2</p>
                      <p className="text-[11px] text-slate-400">Lấy hàng định kỳ theo đơn công trình</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                      <input
                        type="number"
                        value={discountsConfig.tier2}
                        onChange={(e) => setDiscountsConfig({ ...discountsConfig, tier2: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Nhà thầu M&E / Đội thi công</p>
                      <p className="text-[11px] text-slate-400">Cung cấp vật tư trọn gói dự án</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                      <input
                        type="number"
                        value={discountsConfig.contractor}
                        onChange={(e) => setDiscountsConfig({ ...discountsConfig, contractor: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Hồ Sơ Tài Khoản Quản Trị
                </h3>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email đăng nhập
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chức vụ / Vai trò
                  </label>
                  <input
                    type="text"
                    value={profileData.role}
                    onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-cyan-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Security */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Đổi Mật Khẩu & Bảo Mật Tài Khoản
                </h3>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                <Save className="w-4 h-4" /> Lưu Cấu Hình
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
