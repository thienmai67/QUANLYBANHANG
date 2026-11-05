'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, QrCode, ExternalLink, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface PayOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    totalAmount?: number;
  } | null;
  onPaymentSuccess?: () => void;
}

interface PaymentLinkData {
  orderId: string;
  orderNumber: string;
  orderCode: number;
  amount: number;
  checkoutUrl: string;
  qrCode: string;
}

export default function PayOSModal({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
}: PayOSModalProps) {
  const toast = useToast();
  const [paymentInfo, setPaymentInfo] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const checkPaymentStatus = useCallback(
    async (orderId: string, isManual = false) => {
      if (!orderId || isPaid) return;
      if (isManual) setIsChecking(true);

      try {
        const res = await api.get<{ paymentStatus?: string }>(`/orders/${orderId}/payment-status`);
        if (res?.paymentStatus === 'PAID') {
          setIsPaid(true);
          stopPolling();
          toast.success('Thanh toán thành công! Đơn hàng đang chờ quản lý duyệt đóng gói.');
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        }
      } catch (err: any) {
        if (isManual) {
          toast.error(getFriendlyErrorMessage(err));
        }
      } finally {
        if (isManual) setIsChecking(false);
      }
    },
    [isPaid, stopPolling, toast, onPaymentSuccess]
  );

  // Fetch or generate payment link when modal opens
  useEffect(() => {
    if (!isOpen || !order?.id) {
      setPaymentInfo(null);
      setError(null);
      setIsPaid(false);
      setPollCount(0);
      stopPolling();
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsPaid(false);
    setPollCount(0);

    const initPaymentLink = async () => {
      try {
        const linkRes = await api.post<any>(`/orders/${order.id}/payment-link`);
        if (!isMounted) return;

        const info: PaymentLinkData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderCode: linkRes.orderCode,
          amount: linkRes.amount || order.totalAmount || 0,
          checkoutUrl: linkRes.checkoutUrl,
          qrCode: linkRes.qrCode,
        };
        setPaymentInfo(info);
      } catch (err: any) {
        if (!isMounted) return;
        const msg = getFriendlyErrorMessage(err);
        setError(msg);
        toast.error(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initPaymentLink();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [isOpen, order?.id, order?.orderNumber, order?.totalAmount, stopPolling, toast]);

  // Setup polling interval once paymentInfo is ready
  useEffect(() => {
    if (!paymentInfo?.orderId || isPaid || !isOpen) {
      stopPolling();
      return;
    }

    stopPolling();
    const timer = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= 60) {
          // 5 minutes reached
          clearInterval(timer);
          return prev;
        }
        checkPaymentStatus(paymentInfo.orderId);
        return prev + 1;
      });
    }, 5000);

    pollTimerRef.current = timer;

    return () => {
      clearInterval(timer);
    };
  }, [paymentInfo?.orderId, isPaid, isOpen, checkPaymentStatus, stopPolling]);

  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payos-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <QrCode className="w-5 h-5" />
            <h3 id="payos-modal-title" className="font-bold text-base text-slate-900 dark:text-white">
              Thanh Toán VietQR (PayOS)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-medium">Đang tạo liên kết thanh toán PayOS...</p>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Không thể tạo mã QR</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs mx-auto">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          )}

          {isPaid && (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Đã Thanh Toán Thành Công!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Hệ thống đã nhận thanh toán cho đơn hàng #{order.orderNumber}. Quản lý kho sẽ tiến hành đóng gói và giao hàng.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-all"
              >
                Hoàn tất
              </button>
            </div>
          )}

          {paymentInfo && !loading && !error && !isPaid && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500">Đơn hàng #{order.orderNumber}</p>
                <p className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
                  {paymentInfo.amount.toLocaleString('vi-VN')} VND
                </p>
              </div>

              {/* QR Image Box */}
              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900 flex flex-col items-center justify-center space-y-3 shadow-inner">
                <div className="p-2 bg-white rounded-xl shadow-md border border-slate-100">
                  <img
                    src={
                      paymentInfo.qrCode.startsWith('http') || paymentInfo.qrCode.startsWith('data:')
                        ? paymentInfo.qrCode
                        : `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentInfo.qrCode)}`
                    }
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = 'true';
                        target.src = `https://quickchart.io/qr?size=240&text=${encodeURIComponent(paymentInfo.qrCode)}`;
                      }
                    }}
                    alt="VietQR PayOS"
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                </div>
                <p className="text-[11px] text-center font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 w-full">
                  ⚠️ <strong>Lưu ý:</strong> Vui lòng giữ nguyên số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận.
                </p>
              </div>

              {/* Polling & action buttons */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2.5">
                {pollCount < 60 ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Đang chờ thanh toán (tự động kiểm tra mỗi 5s)...</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-medium">
                    Hết thời gian chờ tự động. Vui lòng bấm kiểm tra nếu bạn đã chuyển khoản.
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={paymentInfo.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <span>Mở app ngân hàng / Trang PayOS</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    disabled={isChecking}
                    onClick={() => checkPaymentStatus(paymentInfo.orderId, true)}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>{isChecking ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Đóng (Thanh toán sau)
          </button>
        </div>
      </div>
    </div>
  );
}
