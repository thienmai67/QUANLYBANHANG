'use client';

import React, { useEffect } from 'react';
import { Customer } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatCurrencyVND, formatDateTime, formatDate } from '@/lib/formatters';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  ShoppingBag,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
}

const tierBadgeStyles: Record<string, string> = {
  Gold: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
  Silver: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Bronze: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800',
  Retail: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  'Khách mua lẻ': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  'Thợ điện nước': 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
  'Hộ gia đình': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
  'Khách công trình': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
};

export function CustomerDetailModal({
  customer,
  isOpen,
  onClose,
  onSelectOrder,
}: CustomerDetailModalProps) {
  const { orders, getCustomerMetrics } = useManagerStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  const metrics = getCustomerMetrics(customer.id);
  const customerOrders = orders
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tierStyle =
    tierBadgeStyles[customer.tier] ||
    'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="customer-detail-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {customer.name}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierStyle}`}>
                  {customer.tier}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã khách hàng: {customer.code} • Ngày tham gia: {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer info card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Tổng chi tiêu thực tế
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrencyVND(metrics.totalSpent)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Chỉ tính đơn đã giao thành công
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                Số đơn đặt hàng
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {metrics.orderCount} <span className="text-xs font-normal text-slate-400">đơn</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Hoàn thành: {metrics.deliveredOrderCount} đơn
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-blue-500" />
                Hạng thành viên
              </span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                {customer.tier}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Chính sách ưu đãi độc quyền
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
              Thông tin liên hệ & Địa chỉ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Điện thoại: <strong className="text-slate-900 dark:text-white">{customer.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email: <strong className="text-slate-900 dark:text-white">{customer.email}</strong></span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Địa chỉ công trình/giao hàng: <strong className="text-slate-900 dark:text-white">{customer.address}</strong></span>
              </div>
            </div>
          </div>

          {/* Past Orders History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Lịch sử đơn hàng ({customerOrders.length})</span>
              </h3>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                Khách hàng chưa phát sinh đơn hàng nào
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5">Mã đơn</th>
                        <th className="px-3 py-2.5">Thời gian</th>
                        <th className="px-3 py-2.5">Loại</th>
                        <th className="px-3 py-2.5 text-right">Tổng tiền</th>
                        <th className="px-3 py-2.5 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {customerOrders.map((o) => (
                        <tr
                          key={o.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-3 py-2.5 font-bold text-amber-600 dark:text-amber-400 font-mono">
                            #{o.code}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                            {formatDateTime(o.createdAt)}
                          </td>
                          <td className="px-3 py-2.5">
                            {o.is2H ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                2H
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Tiêu chuẩn</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrencyVND(o.finalAmount ?? o.totalAmount)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <OrderStatusBadge status={o.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: STRICT RBAC - NO Edit or Delete Buttons! */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Phân quyền Quản lý: Chỉ xem lịch sử (View-Only)</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailModal;
