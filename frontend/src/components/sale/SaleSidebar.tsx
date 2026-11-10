'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  Boxes,
  CreditCard,
  PhoneCall,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useSaleShellStore } from '@/store/useSaleShellStore';
import { useSaleStore } from '@/store/useSaleStore';
import { useAuthStore } from '@/store/useAuthStore';
import { removeTokens } from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function SaleSidebar() {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileDrawerOpen,
    setMobileDrawerOpen,
  } = useSaleShellStore();

  const { orders, activities } = useSaleStore();
  const { user, logout } = useAuthStore();

  // Lock body scroll and handle Escape key when mobile drawer is open
  React.useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileDrawerOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileDrawerOpen, setMobileDrawerOpen]);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const dueFollowupCount = activities.filter((a) => !a.isDone).length;

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/sale/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Đơn hàng của tôi',
      href: '/sale/orders',
      icon: ShoppingCart,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      name: 'Khách hàng phụ trách',
      href: '/sale/customers',
      icon: Users,
    },
    {
      name: 'Báo giá',
      href: '/sale/quotes',
      icon: FileText,
    },
    {
      name: 'Tra cứu sản phẩm',
      href: '/sale/products',
      icon: Boxes,
    },
    {
      name: 'Thanh toán & Công nợ',
      href: '/sale/payments',
      icon: CreditCard,
    },
    {
      name: 'Chăm sóc khách hàng',
      href: '/sale/activities',
      icon: PhoneCall,
      badge: dueFollowupCount > 0 ? dueFollowupCount : undefined,
    },
    {
      name: 'Báo cáo cá nhân',
      href: '/sale/reports',
      icon: BarChart3,
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
            (item.href !== '/sale/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/sale/dashboard' && pathname === '/sale');

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
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              } ${sidebarCollapsed && !isMobile ? 'justify-center px-0' : ''}`}
              title={sidebarCollapsed && !isMobile ? item.name : undefined}
            >
              <IconComponent
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-purple-400 group-hover:scale-105'
                }`}
              />

              {(!sidebarCollapsed || isMobile) && (
                <span className="truncate flex-1 tracking-tight">{item.name}</span>
              )}

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                    isActive
                      ? 'bg-white text-purple-700'
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
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>

          {(!sidebarCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {user?.name || user?.email || 'Nhân viên bán hàng'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  SALE
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
            href="/sale/dashboard"
            className={`flex items-center gap-2.5 overflow-hidden ${
              sidebarCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-extrabold tracking-tight text-white uppercase font-display truncate">
                  TDT M&amp;E
                </span>
                <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">
                  Sale Workspace
                </span>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Thu gọn menu"
              aria-label="Thu gọn menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button for collapsed mode */}
        {sidebarCollapsed && (
          <div className="py-2 flex justify-center border-b border-slate-800/60">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Mở rộng menu"
              aria-label="Mở rộng menu"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Nav Links */}
        {renderNavLinks(false)}

        {/* User Profile */}
        {renderUserProfile(false)}
      </aside>

      {/* ===================== MOBILE DRAWER (SMOOTH SLIDE-IN) ===================== */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-[visibility] duration-300 ${
          mobileDrawerOpen ? 'visible' : 'invisible delay-300'
        }`}
        aria-hidden={!mobileDrawerOpen}
      >
        {/* Backdrop overlay with fade transition */}
        <div
          className={`fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileDrawerOpen(false)}
        />

        {/* Drawer panel with slide-in from left transition */}
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-out will-change-transform z-10 ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white uppercase font-display">
                  TDT M&amp;E
                </span>
                <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">
                  Sale Workspace
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {renderNavLinks(true)}
          {renderUserProfile(true)}
        </div>
      </div>
    </>
  );
}
