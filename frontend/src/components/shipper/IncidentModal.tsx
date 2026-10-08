'use client';

import React, { useState } from 'react';
import { Order } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useToast } from '@/hooks/useToast';
import {
  AlertTriangle,
  X,
  Loader2,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface IncidentModalProps {
  order: Order | null;
  shipperId: string;
  shipperName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INCIDENT_CATEGORIES = [
  'Khách không nghe máy',
  'Hẻm cấm tải',
  'Công trình chưa có mặt bằng hạ hàng',
  'Khác',
];

export default function IncidentModal({
  order,
  shipperId,
  shipperName,
  isOpen,
  onClose,
  onSuccess,
}: IncidentModalProps) {
  const toast = useToast();
  const { isHighContrast } = useShipperUIStore();
  const { updateOrderStatusWithActor } = useManagerStore();

  const [category, setCategory] = useState(INCIDENT_CATEGORIES[0]);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const isDetailValid = detail.trim().length >= 5;
  const canSubmit = isDetailValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const fullReason = `${category}: ${detail.trim()}`;
      const res = await updateOrderStatusWithActor(
        order.id,
        'CANCELLED',
        {
          role: 'SHIPPER',
          shipperId,
          name: shipperName,
        },
        {
          cancelReason: fullReason,
          incidentCategory: category,
        }
      );

      if (res.success) {
        toast.warning(
          `Đã ghi nhận sự cố giao thất bại đơn #${order.code}. Hàng hóa đã tự động hoàn về kho!`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || 'Báo cáo sự cố không thành công');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống khi cập nhật trạng thái đơn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-modal-title"
        className={`relative w-full max-w-sm rounded-3xl shadow-2xl border overflow-hidden z-10 transition-colors ${
          isHighContrast
            ? 'bg-white text-black border-2 border-black'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isHighContrast
              ? 'bg-rose-100 border-b-2 border-black text-black'
              : 'bg-rose-950/40 border-slate-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="incident-modal-title" className="font-bold text-sm leading-tight text-rose-500">
                Báo sự cố giao thất bại
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đơn #{order.code} • {order.customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Warning Banner */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 leading-relaxed ${
              isHighContrast
                ? 'bg-amber-100 border-2 border-black text-black'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-[11px]">
              <strong>Lưu ý:</strong> Khi xác nhận giao thất bại, đơn hàng sẽ chuyển sang trạng thái <strong>ĐÃ HỦY</strong> và toàn bộ vật tư sẽ được <strong>tự động hoàn về kho công ty</strong>.
            </p>
          </div>

          {/* Incident Category Selection */}
          <div className="space-y-1.5">
            <label className="font-bold block">
              Phân loại sự cố <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {INCIDENT_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    category === cat
                      ? isHighContrast
                        ? 'bg-amber-100 border-2 border-black font-black'
                        : 'bg-rose-500/10 border-rose-500/60 text-white font-bold'
                      : isHighContrast
                      ? 'border-black hover:bg-slate-100'
                      : 'border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="incident-cat"
                    value={cat}
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Incident Detail */}
          <div className="space-y-1.5">
            <label className="font-bold block">
              Chi tiết sự cố hiện trường <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="VD: Gọi điện 4 lần khách không bắt máy; ngõ hẹp xe ba gác không thể vào..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className={`w-full p-3 rounded-xl border transition-all outline-none font-medium ${
                isHighContrast
                  ? 'bg-white border-2 border-black text-black placeholder:text-slate-500'
                  : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
              }`}
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Tối thiểu 5 ký tự</span>
              <span className={detail.trim().length < 5 ? 'text-rose-500 font-bold' : 'text-emerald-500'}>
                {detail.trim().length}/5
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex items-center justify-end gap-2.5 ${
            isHighContrast
              ? 'bg-slate-100 border-t-2 border-black'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`min-h-[48px] px-4 rounded-xl font-bold transition-all ${
              isHighContrast
                ? 'border-2 border-black bg-white hover:bg-slate-200 text-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Quay lại
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`min-h-[48px] flex-1 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
              canSubmit
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Xác nhận hoàn kho</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
