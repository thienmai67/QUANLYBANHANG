'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  FolderTree,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  LogOut,
  Layers,
  Truck,
} from 'lucide-react';
import { useManagerShellStore } from '@/store/useManagerShellStore';
import { useManagerStore } from '@/store/useManagerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { removeTokens } from '@/lib/auth';
import { shipperApi } from '@/services/shipperApi';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function ManagerSidebar() {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileDrawerOpen,
    setMobileDrawerOpen,
  } = useManagerShellStore();

  const { orders } = useManagerStore();
  const { user, logout } = useAuthStore();

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  // Thông báo có hồ sơ shipper mới: badge số hồ sơ đang chờ duyệt.
  // Sidebar nằm trong layout manager nên không remount khi chuyển trang
  // trong khu vực manager — vì vậy poll mỗi 30 giây + tải lại khi quay
  // lại tab, để hồ sơ mới đăng ký hiện badge mà không cần tải lại trang.
  const [pendingShipperCount, setPendingShipperCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const fetchPendingShipperCount = () => {
      shipperApi
        .listApplications('PENDING')
        .then((apps) => {
          if (!cancelled) setPendingShipperCount(apps.length);
        })
        .catch(() => {
          // Không có quyền hoặc lỗi mạng thì ẩn badge, không chặn sidebar.
          // Lần poll sau sẽ thử lại.
        });
    };
    fetchPendingShipperCount();
    const timer = setInterval(fetchPendingShipperCount, 30000);
    window.addEventListener('focus', fetchPendingShipperCount);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', fetchPendingShipperCount);
    };
  }, []);

  // Consolidated navigation menu for Manager role
  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/manager/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Đơn hàng',
      href: '/manager/orders',
      icon: ShoppingCart,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      name: 'Kho vật tư',
      href: '/manager/products',
      icon: Boxes,
    },
    {
      name: 'Danh mục',
      href: '/manager/categories',
      icon: FolderTree,
    },
    {
      name: 'Khách hàng',
      href: '/manager/customers',
      icon: Users,
    },
    {
      name: 'Duyệt shipper',
      href: '/manager/shipper-applications',
      icon: Truck,
      badge: pendingShipperCount > 0 ? pendingShipperCount : undefined,
    },
    {
      name: 'Cài đặt',
      href: '/manager/settings',
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    removeTokens();
    logout();
    window.location.href = '/login';
  };

  const renderNavLinks = (isMobile: boolean = false) => {
    return (
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/manager/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/manager/dashboard' && pathname === '/manager');

          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) setMobileDrawerOpen(false);
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all relative ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              } ${sidebarCollapsed && !isMobile ? 'justify-center px-0' : ''}`}
              title={sidebarCollapsed && !isMobile ? item.name : undefined}
            >
              <IconComponent
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive
                    ? 'text-slate-950'
                    : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-105'
                }`}
              />

              {(!sidebarCollapsed || isMobile) && (
                <span className="truncate flex-1 tracking-tight">{item.name}</span>
              )}

              {/* Badge for PENDING orders */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                    isActive
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-rose-500 text-white animate-pulse'
                  } ${
                    sidebarCollapsed && !isMobile
                      ? 'absolute top-1 right-1 w-4 h-4 p-0 text-[9px] flex items-center justify-center'
                      : ''
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  };

  const renderUserProfile = (isMobile: boolean = false) => {
    return (
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div
          className={`flex items-center gap-2.5 ${
            sidebarCollapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>

          {(!sidebarCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {user?.name || user?.email || 'Quản lý kho'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  MANAGER
                </span>
              </div>
            </div>
          )}

          {(!sidebarCollapsed || isMobile) && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-slate-800 transition-all duration-300 select-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/30">
          <Link
            href="/manager/dashboard"
            className={`flex items-center gap-2.5 overflow-hidden ${
              sidebarCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-amber-500/20">
              <Layers className="w-5 h-5 text-slate-950" />
            </div>

            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm text-white tracking-tight leading-tight">
                  TDT M&E
                </span>
                <span className="text-[10px] text-amber-400/90 font-semibold tracking-wide uppercase">
                  Quản Lý Vận Hành
                </span>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Thu gọn sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed expand toggle button */}
        {sidebarCollapsed && (
          <div className="flex justify-center py-2 border-b border-slate-800/60">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation list */}
        {renderNavLinks(false)}

        {/* User profile footer */}
        {renderUserProfile(false)}
      </aside>

      {/* ===================== MOBILE DRAWER + OVERLAY ===================== */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 text-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                  <Layers className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">TDT M&E Manager</div>
                  <div className="text-[10px] text-amber-400 font-medium">Hệ Thống Phân Phối</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Đóng thanh điều hướng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            {renderNavLinks(true)}

            {/* Mobile User Profile */}
            {renderUserProfile(true)}
          </div>
        </div>
      )}
    </>
  );
}

export default ManagerSidebar;
