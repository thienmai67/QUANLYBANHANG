'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

export function Header() {
  const {
    darkMode,
    toggleDarkMode,
    setMobileDrawerOpen,
    searchQuery,
    setSearchQuery,
    bomRequests,
  } = useAdminStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const pendingBoms = bomRequests.filter((b) => b.status === 'PendingReview');

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left section: Mobile menu + Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm vật tư, mã đơn hàng, nhà thầu..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-transparent focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right section: Dark Mode + Notifications + User Profile */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={darkMode ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {pendingBoms.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-cyan-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Yêu cầu BOM mới ({pendingBoms.length})
                </span>
                <Link
                  href="/admin/bom-requests"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                {pendingBoms.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Không có yêu cầu BOM mới
                  </div>
                ) : (
                  pendingBoms.map((bom) => (
                    <Link
                      key={bom.id}
                      href="/admin/bom-requests"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {bom.code} - {bom.contractorName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {bom.projectName} ({bom.itemsCount} vật tư)
                        </p>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                          {bom.createdAt}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 pl-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600 text-white font-bold text-sm shadow-sm">
              A
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
                TDT Admin
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Quản trị viên M&E
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  TDT M&E Manager
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  admin@tdt-me.com.vn
                </p>
              </div>

              <Link
                href="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <User className="w-4 h-4 text-slate-400" /> Hồ sơ cá nhân
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Đăng xuất
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
