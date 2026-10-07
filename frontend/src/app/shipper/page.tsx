'use client';

import React, { useState } from 'react';
import MaterialHeader from '@/components/MaterialHeader';
import MaterialFooter from '@/components/MaterialFooter';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  Phone,
  ArrowRight,
  ShieldAlert,
  Navigation,
} from 'lucide-react';

import RouteGuard from '@/components/auth/RouteGuard';

export default function ShipperPage() {
  const { user } = useAuthStore();
  const { orders, updateOrderStatus, addToast } = useAdminStore();
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED' | 'SHIPPING' | 'COMPLETED'>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ASSIGNED') return o.status === 'Preparing';
    if (filter === 'SHIPPING') return o.status === 'Shipping2H';
    if (filter === 'COMPLETED') return o.status === 'Completed';
    return o.status === 'Preparing' || o.status === 'Shipping2H' || o.status === 'Completed';
  });

  const handleUpdateStatus = (orderId: string, orderCode: string, newStatus: 'Shipping2H' | 'Completed') => {
    updateOrderStatus(orderId, newStatus);
    if (newStatus === 'Shipping2H') {
      addToast(`[SHIPPER] Đã lấy hàng đơn ${orderCode} và đang vận chuyển!`, 'info');
    } else if (newStatus === 'Completed') {
      addToast(`[SHIPPER] Đơn hàng ${orderCode} đã giao thành công tận tay khách hàng!`, 'success');
    }
  };

  return (
    <RouteGuard allowedRoles={['ADMIN', 'MANAGER', 'SHIPPER']}>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 2. Header */}
      <MaterialHeader />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Shipper Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 rounded-3xl border border-emerald-800/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30 uppercase tracking-wider inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" /> Đội Vận Tải Xe Cẩu & Giao Hàng Siêu Tốc
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bảng Giao Vận Shipper — {user?.name || user?.email || 'Shipper'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Đội xe giao nhận vật tư M&E tận nơi. Cập nhật tiến độ giao hàng thời gian thực cho hệ thống.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-right shrink-0">
            <p className="text-xs text-slate-400 uppercase font-mono">Trạng Thái Đội Xe</p>
            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> Đang Sẵn Sàng Nhận Đơn
            </p>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Navigation className="w-4 h-4 text-emerald-400" /> Lọc danh sách giao hàng:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tất cả đơn cần giao' },
              { id: 'ASSIGNED', label: 'Chờ lấy hàng' },
              { id: 'SHIPPING', label: 'Đang vận chuyển' },
              { id: 'COMPLETED', label: 'Đã hoàn tất' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/40 rounded-3xl border border-slate-800/60 space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
              <h3 className="text-base font-bold text-slate-300">Hiện Không Có Đơn Hàng Nào Nằm Trong Mục Này</h3>
              <p className="text-xs text-slate-500">
                Các đơn hàng mới được Manager duyệt sẽ tự động đẩy sang danh sách giao vận của Shipper.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 sm:p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      {order.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Ngày đặt: {order.createdAt}
                    </span>
                  </div>

                  <div>
                    {order.status === 'Preparing' && (
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-full inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Kho Đã Đóng Gói - Chờ Lấy Hàng
                      </span>
                    )}
                    {order.status === 'Shipping2H' && (
                      <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded-full inline-flex items-center gap-1.5 animate-pulse">
                        <Truck className="w-3.5 h-3.5" /> Đang Trên Đường Giao Tới Điểm
                      </span>
                    )}
                    {order.status === 'Completed' && (
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-full inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã Giao Hàng Thành Công
                      </span>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Delivery Location */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <MapPin className="w-4 h-4" /> Địa Điểm Giao Vận:
                    </div>
                    <p className="text-white font-semibold pl-6 leading-relaxed">
                      {order.deliveryAddress || 'Kho Công Trình Khách Hàng'}
                    </p>
                    <div className="pl-6 text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Người nhận: <strong className="text-slate-200">{order.contractorName}</strong></span>
                      <span>Hạng: <strong>{order.contractorTier}</strong></span>
                    </div>
                  </div>

                  {/* Order Summary & Items */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 font-bold">
                      <span>Tổng Tiền Đơn Hàng:</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        {order.finalAmount.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                      <p className="font-semibold text-slate-300">Vật tư cần giao ({order.items.length} món):</p>
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="truncate text-slate-400">
                          • {item.productName} (<strong className="text-white">{item.quantity} {item.unit}</strong>)
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {order.status === 'Preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, order.code, 'Shipping2H')}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Truck className="w-4 h-4" /> 🚚 Lấy Hàng Tại Kho & Bắt Đầu Giao
                    </button>
                  )}

                  {order.status === 'Shipping2H' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, order.code, 'Completed')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" /> ✅ Xác Nhận Đã Giao Hàng Cho Khách
                    </button>
                  )}

                  {order.status === 'Completed' && (
                    <span className="text-xs text-emerald-400 font-bold font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Biên Bản Giao Hàng Hoàn Tất
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <MaterialFooter />
    </div>
    </RouteGuard>
  );
}
