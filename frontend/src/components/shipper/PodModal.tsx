'use client';

import React, { useState } from 'react';
import { Order } from '@/types/manager';
import { useManagerStore } from '@/store/useManagerStore';
import { useShipperUIStore } from '@/store/useShipperUIStore';
import { useToast } from '@/hooks/useToast';
import { resizeImageCanvas } from '@/lib/shipperHelpers';
import { formatCurrencyVND } from '@/lib/formatters';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  UserCheck,
  Banknote,
} from 'lucide-react';

interface PodModalProps {
  order: Order | null;
  shipperId: string;
  shipperName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PodModal({
  order,
  shipperId,
  shipperName,
  isOpen,
  onClose,
  onSuccess,
}: PodModalProps) {
  const toast = useToast();
  const { isHighContrast } = useShipperUIStore();
  const { updateOrderStatusWithActor } = useManagerStore();

  const [receiverName, setReceiverName] = useState('');
  const [photos, setPhotos] = useState<Array<{ name: string; thumbnail: string }>>([]);
  const [codConfirmed, setCodConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !order) return null;

  const isCod = order.paymentMethod === 'COD';
  const codAmount = order.total ?? order.totalAmount ?? 0;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 3) {
      toast.warning('Tối đa 3 ảnh bằng chứng giao hàng (POD)');
      return;
    }

    setProcessing(true);
    try {
      const newPhotos: Array<{ name: string; thumbnail: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Ảnh ${file.name} vượt quá 10MB`);
          continue;
        }

        try {
          const resizedDataUrl = await resizeImageCanvas(file, 800, 0.7);
          newPhotos.push({
            name: file.name,
            thumbnail: resizedDataUrl,
          });
        } catch (canvasErr: any) {
          toast.error(canvasErr?.message || 'Không thể xử lý ảnh bằng canvas');
        }
      }

      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 3));
    } catch (err: any) {
      toast.error('Lỗi khi đọc file ảnh');
    } finally {
      setProcessing(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const isReceiverValid = receiverName.trim().length >= 2;
  const isPhotosValid = photos.length >= 1;
  const isCodValid = !isCod || codConfirmed;
  const canSubmit = isReceiverValid && isPhotosValid && isCodValid && !processing;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setProcessing(true);
    try {
      const res = updateOrderStatusWithActor(
        order.id,
        'DELIVERED',
        {
          role: 'SHIPPER',
          shipperId,
          name: shipperName,
        },
        {
          pod: {
            receiverName: receiverName.trim(),
            photos,
          },
          codConfirmed: isCod ? codConfirmed : undefined,
        }
      );

      if (res.success) {
        toast.success(
          `Đã giao thành công đơn #${order.code} cho ${receiverName.trim()}!`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || 'Xác nhận giao hàng thất bại');
      }
    } catch (err: any) {
      // Catch quota exceeded or unexpected error
      if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
        toast.error('Bộ nhớ trình duyệt (localStorage) đã đầy, vui lòng dọn dẹp hoặc chọn ảnh nhỏ hơn!');
      } else {
        toast.error(err.message || 'Lỗi hệ thống khi cập nhật đơn');
      }
    } finally {
      setProcessing(false);
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

      {/* Modal Dialog (Max-w-sm for Driver Thumb reachability) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pod-modal-title"
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
              ? 'bg-slate-100 border-b-2 border-black'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isHighContrast
                  ? 'bg-emerald-400 text-black border-2 border-black'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pod-modal-title" className="font-bold text-sm leading-tight">
                Xác nhận đã giao hàng (POD)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đơn #{order.code} • {order.customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isHighContrast
                ? 'text-black hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Receiver Name */}
          <div className="space-y-1.5">
            <label className="font-bold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              Tên người ký nhận thực tế <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Anh Nam (Thủ kho công trình)"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border font-medium transition-all outline-none ${
                isHighContrast
                  ? 'bg-white border-2 border-black text-black placeholder:text-slate-500 focus:border-black'
                  : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500'
              }`}
            />
            {receiverName.trim().length > 0 && receiverName.trim().length < 2 && (
              <p className="text-[10px] text-rose-500 font-bold">
                Tên người nhận phải có ít nhất 2 ký tự
              </p>
            )}
          </div>

          {/* Photo Proof Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-500" />
                Ảnh biên bản / Hiện trường (1–3 ảnh) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {photos.length}/3 ảnh
              </span>
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnail}
                    alt={`POD ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white shadow-md hover:bg-rose-700 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button (Trigger native camera / file input) */}
              {photos.length < 3 && (
                <label
                  className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
                    isHighContrast
                      ? 'border-black hover:bg-slate-100 text-black'
                      : 'border-slate-700 hover:border-emerald-500 hover:bg-slate-800/40 text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Chụp/Chọn</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                    disabled={processing}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Chụp ảnh hạ hàng tại công trình hoặc phiếu ký nhận (tự động nén canvas để tiết kiệm bộ nhớ).
            </p>
          </div>

          {/* COD Collection Confirmation (If payment method is COD) */}
          {isCod ? (
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                isHighContrast
                  ? 'bg-amber-100 border-2 border-black text-black'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-500" />
                  Thu tiền mặt (COD):
                </span>
                <span className="text-sm font-mono font-black text-amber-500 dark:text-amber-400">
                  {formatCurrencyVND(codAmount)}
                </span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-amber-500/20">
                <input
                  type="checkbox"
                  checked={codConfirmed}
                  onChange={(e) => setCodConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded mt-0.5 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
                  Tôi đã thu đủ <strong className="text-emerald-500">{formatCurrencyVND(codAmount)}</strong> tiền mặt từ khách hàng.
                </span>
              </label>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đơn này đã thanh toán chuyển khoản trước (không thu tiền mặt).</span>
            </div>
          )}
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
            disabled={processing}
            className={`min-h-[48px] px-4 rounded-xl font-bold transition-all ${
              isHighContrast
                ? 'border-2 border-black bg-white hover:bg-slate-200 text-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`min-h-[48px] flex-1 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
              canSubmit
                ? isHighContrast
                  ? 'bg-black text-white hover:bg-slate-900 border-2 border-black'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn tất giao hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
