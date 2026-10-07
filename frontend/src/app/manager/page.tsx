'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { OrdersManager } from '@/components/admin/OrdersManager';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { CustomersManager } from '@/components/admin/CustomersManager';
import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';

export default function ManagerPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'customers' | 'categories'>('orders');
  const { darkMode, sidebarCollapsed, toasts, removeToast } = useAdminStore();

  return (
    <RouteGuard allowedRoles={['ADMIN', 'MANAGER']}>
      <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
        <Sidebar />

        {/* Main Content Wrapper */}
        <div
          className={`transition-all duration-300 flex flex-col min-h-screen ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <Header />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* Manager Header Banner */}
            <div className="p-6 bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 text-white rounded-3xl border border-amber-800/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30 uppercase tracking-wider">
                  Trang Vận Hành Quản Lý (Manager Portal)
                </span>
                <h1 className="text-2xl font-black mt-2 text-white">
                  Xin chào, {user?.name || user?.email || 'Quản Lý'} 👋
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Quản lý duyệt đơn bán lẻ, phân công Shipper giao 2H & theo dõi kho vật tư M&E.
                </p>
              </div>

              {/* Tab navigation buttons for Manager */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'orders', label: '📦 Quản Lý Đơn Hàng' },
                  { id: 'products', label: '🛠️ Kho Vật Tư' },
                  { id: 'customers', label: '👥 Khách Bán Lẻ' },
                  { id: 'dashboard', label: '📊 Thống Kê' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tab View */}
            {activeTab === 'orders' && <OrdersManager />}
            {activeTab === 'products' && <ProductsManager />}
            {activeTab === 'customers' && <CustomersManager />}
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'categories' && <CategoriesManager />}
          </main>
        </div>

        {/* Toast Container */}
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-right ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  : toast.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-500 shrink-0" />}

              <span className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </span>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}
