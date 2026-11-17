'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  PenTool,
  RotateCcw,
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

  // Digital Signature Pad (BUG-47)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: (mouseEvent.clientX - rect.left) * scaleX,
      y: (mouseEvent.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleAutoFillDemo = () => {
    const defaultReceiver = order?.customerName || 'A. Nam (Đội trưởng thi công)';
    setReceiverName(defaultReceiver);
    setPhotos([
      {
        name: 'bien-ban-giao-hang-tai-cong-trinh.jpg',
        thumbnail: '/images/products/day-dien-cong-trinh.jpg',
      },
    ]);
    if (isCod) {
      setCodConfirmed(true);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(30, 50);
        ctx.bezierCurveTo(60, 20, 100, 70, 140, 35);
        ctx.bezierCurveTo(160, 20, 200, 65, 250, 45);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        setHasSignature(true);
      }
    }
    toast.success('Đã nạp nhanh biên bản, chữ ký & ảnh POD mẫu phục vụ demo!');
  };

  // D2.6: Reset state completely on order change or when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReceiverName('');
      setPhotos([]);
      setCodConfirmed(false);
      setProcessing(false);
      setHasSignature(false);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [isOpen, order?.id]);

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
  const isPhotosValid = photos.length >= 1 || hasSignature;
  const isCodValid = !isCod || codConfirmed;
  const canSubmit = isReceiverValid && isPhotosValid && isCodValid && !processing;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setProcessing(true);
    try {
      let finalPhotos = [...photos];
      if (hasSignature && canvasRef.current) {
        const sigUrl = canvasRef.current.toDataURL('image/png');
        finalPhotos.push({
          name: 'chu-ky-nguoi-nhan.png',
          thumbnail: sigUrl,
        });
      }

      const res = await updateOrderStatusWithActor(
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
            photos: finalPhotos,
          },
          codConfirmed: isCod ? codConfirmed : undefined,
        }
      );

      if (res.success) {
        // Haptic vibration feedback on mobile device
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([40, 60, 40]);
          } catch {
            // ignore
          }
        }
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
            <div className="flex items-center justify-between">
              <label className="font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                Tên người ký nhận thực tế <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline transition-colors"
                title="Tự động điền tên và ảnh mẫu phục vụ báo cáo"
              >
                ✨ Điền mẫu nhanh (Demo)
              </button>
            </div>
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

          {/* Digital Signature Pad (BUG-47) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-blue-500" />
                Chữ ký điện tử người nhận
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa chữ ký</span>
                </button>
              )}
            </div>
            <div
              className={`relative rounded-xl border overflow-hidden ${
                isHighContrast
                  ? 'bg-white border-2 border-black'
                  : 'bg-slate-950 border-slate-700'
              }`}
            >
              <canvas
                ref={canvasRef}
                width={330}
                height={100}
                className="w-full h-[100px] touch-none cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-500 text-[11px] select-none">
                  ✍️ Ký tay trực tiếp vào ô này
                </div>
              )}
            </div>
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
