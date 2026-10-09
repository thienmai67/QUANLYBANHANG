'use client';

import React, { useState, useEffect } from 'react';
import { Order, Shipper } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { checkShipperAssignability } from '@/lib/orderRules';
import { useToast } from '@/hooks/useToast';
import {
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface ShipperAssignModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShipperAssignModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: ShipperAssignModalProps) {
  const { shippers, assignShipper, fetchShippers } = useManagerStore();
  const toast = useToast();
  const [selectedShipperId, setSelectedShipperId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchShippers();
    }
  }, [isOpen, fetchShippers]);

  useEffect(() => {
    if (isOpen && order) {
      setSelectedShipperId(order.shipperId || '');
    }
  }, [isOpen, order]);

  // Handle ESC key
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

  if (!isOpen || !order) return null;

  const handleAssign = async () => {
    if (!selectedShipperId) {
      toast.error('Vui lòng chọn một nhân viên giao hàng');
      return;
    }

    const shipper = shippers.find((s) => s.id === selectedShipperId);
    if (!shipper) {
      toast.error('Không tìm thấy thông tin shipper');
      return;
    }

    const check = checkShipperAssignability(shipper);
    if (!check.allowed) {
      toast.error(check.reason || 'Shipper không khả dụng để nhận đơn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await assignShipper(order.id, selectedShipperId, 'Manager Hải Đăng');
      if (res.success) {
        toast.success(
          `Đã phân công ${shipper.name} và chuyển đơn #${order.code} sang Đang giao`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || 'Phân công shipper thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống khi phân công shipper');
    } finally {
      setSubmitting(false);
    }
  };

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
        aria-labelledby="shipper-assign-title"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="shipper-assign-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Điều phối Shipper giao hàng
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đơn hàng #{order.code} • {order.customerName}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Chọn shipper phụ trách vận chuyển. Hệ thống tự động giới hạn tối đa{' '}
            <strong className="text-slate-900 dark:text-white">5 đơn hàng</strong> đang giao cùng lúc cho mỗi shipper để đảm bảo thời gian cam kết.
          </div>

          {/* Shippers List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {shippers.map((s) => {
              const shift =
                s.shiftStatus ||
                (s.status?.toLowerCase() === 'offline'
                  ? 'offline'
                  : s.status?.toLowerCase() === 'busy'
                  ? 'busy'
                  : 'available');
              const isAvailable = shift === 'available';
              const isFull = s.activeOrders >= 5;
              const check = checkShipperAssignability(s);
              const isEligible = isAvailable && !isFull && check.allowed;
              const isSelected = selectedShipperId === s.id;

              return (
                <label
                  key={s.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !isEligible
                      ? 'bg-slate-100/60 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="shipper-select"
                      value={s.id}
                      checked={isSelected}
                      disabled={!isEligible}
                      onChange={() => setSelectedShipperId(s.id)}
                      className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500 disabled:opacity-50"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          {s.phone}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Phương tiện: {s.vehicle}
                      </div>
                    </div>
                  </div>

                  {/* Status & Workload Chips */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Shift Status Chip */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        shift === 'available'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : shift === 'busy'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {shift === 'available'
                        ? 'Sẵn sàng'
                        : shift === 'busy'
                        ? 'Bận'
                        : 'Ngoại tuyến'}
                    </span>

                    {/* Workload Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isFull
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300'
                          : s.activeOrders >= 4
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {s.activeOrders}/5 đơn
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={submitting || !selectedShipperId}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang điều phối...</span>
              </>
            ) : (
              <span>Xác nhận phân công</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShipperAssignModal;
