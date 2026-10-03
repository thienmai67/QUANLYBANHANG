'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  FileSpreadsheet,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

export function Sidebar() {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    bomRequests,
  } = useAdminStore();

  const pendingBomCount = bomRequests.filter((b) => b.status === 'PendingReview').length;

  const navItems = [
    { name: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Vật tư M&E', href: '/admin/products', icon: Package },
    { name: 'Danh mục', href: '/admin/categories', icon: FolderTree },
    { name: 'Đơn hàng công trình', href: '/admin/orders', icon: ShoppingBag },
    {
      name: 'Yêu cầu BOM',
      href: '/admin/bom-requests',
      icon: FileSpreadsheet,
      badge: pendingBomCount > 0 ? pendingBomCount : undefined,
    },
    { name: 'Nhà thầu & Đại lý', href: '/admin/customers', icon: Users },
    { name: 'Báo cáo & Phân tích', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Cấu hình hệ thống', href: '/admin/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 transition-all duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-600 text-white font-bold text-lg shrink-0 shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wide text-white leading-tight">
                TDT M&E
              </span>
              <span className="text-[11px] text-cyan-400 font-medium uppercase tracking-wider">
                Admin Control
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileDrawerOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-600/90 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {!sidebarCollapsed && item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer (Desktop only) */}
      <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Thu gọn menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
