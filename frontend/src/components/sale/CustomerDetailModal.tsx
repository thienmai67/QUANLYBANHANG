'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  Plus,
  ShoppingBag,
  Save,
  MessageSquare,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { SaleCustomerSummary, CustomerTier } from '@/types/sale';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { isValidVietnamesePhone, sanitizePhone } from '@/lib/validation';
import { getFriendlyErrorMessage } from '@/lib/api';
import SearchableSelect from '@/components/sale/SearchableSelect';

interface CustomerDetailModalProps {
  customer: SaleCustomerSummary | null;
  onClose: () => void;
  onRefresh: () => void;
}

const TIER_OPTIONS = [
  { value: 'Retail', label: 'Retail (Khách lẻ)' },
  { value: 'Bronze', label: 'Bronze (Nhà thầu phụ)' },
  { value: 'Silver', label: 'Silver (Tổng thầu / Đơn vị lớn)' },
  { value: 'Gold', label: 'Gold (Đối tác chiến lược VIP)', badge: 'VIP' },
];

export default function CustomerDetailModal({
  customer,
  onClose,
  onRefresh,
}: CustomerDetailModalProps) {
  const { updateCustomer, orders, quotes, activities, fetchOrders, fetchQuotes, fetchActivities } =
    useSaleStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'quotes' | 'activities'>('profile');

  // Form states for profile editing
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [tier, setTier] = useState<CustomerTier>('Retail');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setPhone(customer.phone || '');
      setCompanyName(customer.profile?.companyName || '');
      setSiteAddress(customer.profile?.siteAddress || '');
      setTier(customer.profile?.tier || 'Retail');
      setCreditLimit(customer.profile?.creditLimit || 0);
      setNotes(customer.profile?.notes || '');

      // Load related data
      fetchOrders({ customerId: customer.id });
      fetchQuotes({ customerId: customer.id });
      fetchActivities({ customerId: customer.id });
    }
  }, [customer, fetchOrders, fetchQuotes, fetchActivities]);

  if (!customer) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidVietnamesePhone(trimmedPhone)) {
      toast.error(
        'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).'
      );
      return;
    }

    try {
      setIsSaving(true);
      await updateCustomer(customer.id, {
        fullName: customer.fullName,
        phone: trimmedPhone ? sanitizePhone(trimmedPhone) : undefined,
        companyName,
        siteAddress,
        tier,
        creditLimit: Number(creditLimit) || 0,
        notes,
      });
      toast.success('Đã cập nhật hồ sơ khách hàng thành công');
      onRefresh();
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const customerQuotes = quotes.filter((q) => q.customerId === customer.id);
  const customerActivities = activities.filter((a) => a.customerId === customer.id);

  const getTierBadge = (t: string) => {
    switch (t) {
      case 'Gold':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
      case 'Silver':
        return 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'Bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in-overlay">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full h-[88vh] sm:h-[620px] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-up-desktop">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-base sm:text-lg flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60">
                {customer.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {customer.fullName}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${getTierBadge(
                      tier
                    )}`}
                  >
                    {tier}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors font-mono"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{customer.phone}</span>
                    </a>
                  )}
                  {customer.email && (
                    <span className="flex items-center gap-1 truncate max-w-[180px] sm:max-w-none">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Buttons Row */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs active:scale-95 transition-all whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Gọi điện</span>
              </a>
            )}
            <Link
              href={`/sale/orders/new?customerId=${customer.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đơn hộ khách</span>
            </Link>
            <Link
              href={`/sale/quotes/new?customerId=${customer.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl shadow-2xs active:scale-95 transition-all whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lập báo giá</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-2.5 sm:py-3">
          <div className="px-1">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Doanh số tích lũy
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {formatCurrencyVND(customer.totalSpent)}
            </div>
          </div>
          <div className="px-1">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Công nợ hiện tại
            </div>
            <div
              className={`text-xs sm:text-sm font-black mt-0.5 truncate ${
                customer.currentDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formatCurrencyVND(customer.currentDebt)}
            </div>
          </div>
          <div className="px-1">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tổng đơn hàng
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {customer.orderCount} đơn
            </div>
          </div>
        </div>

        {/* Tab Navigation (Lướt ngang mượt mà, không thanh cuộn) */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 gap-2 sm:gap-6 text-xs sm:text-sm overflow-x-auto no-scrollbar whitespace-nowrap bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-1 font-semibold border-b-2 transition-colors shrink-0 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Hồ sơ & Phân hạng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-1 font-semibold border-b-2 transition-colors shrink-0 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Đơn hàng ({customerOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`py-3 px-1 font-semibold border-b-2 transition-colors shrink-0 ${
              activeTab === 'quotes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Báo giá ({customerQuotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`py-3 px-1 font-semibold border-b-2 transition-colors shrink-0 ${
              activeTab === 'activities'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Nhật ký CSKH ({customerActivities.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3.5 sm:p-5">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 sm:space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên công ty / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="VD: Cty TNHH Xây dựng Nam Phát"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phân hạng khách hàng (Tier)
                </label>
                <SearchableSelect
                  options={TIER_OPTIONS}
                  value={tier}
                  onChange={(val) => setTier(val as CustomerTier)}
                  placeholder="Chọn phân hạng..."
                  searchPlaceholder="Tìm phân hạng..."
                  title="Phân hạng khách hàng"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Địa chỉ công trình / Kho giao hàng
                </label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="VD: Công trình KĐT Sala, P. An Khánh, TP. Thủ Đức"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hạn mức công nợ tối đa (VND)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ghi chú hồ sơ & lưu ý chăm sóc
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lưu ý về sở thích, giờ gọi điện, yêu cầu chứng từ CO/CQ, thanh toán..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-xs transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-2.5">
              {customerOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                  Chưa có đơn hàng nào được tạo cho khách hàng này.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/70 transition-colors space-y-1.5"
                    >
                      {/* Dòng 1: Mã đơn (trái) - Tổng tiền (phải) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                          {ord.orderNumber}
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-purple-700 dark:text-purple-400 shrink-0">
                          {formatCurrencyVND(ord.totalAmount)}
                        </span>
                      </div>

                      {/* Dòng 2: Ngày tạo (trái) - Huy hiệu số món & Trạng thái (phải) */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {formatDateTime(ord.createdAt)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0 whitespace-nowrap">
                            {ord.items.length} món
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">
                            {ord.status} • {ord.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-2.5">
              {customerQuotes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                  Chưa có báo giá nào được tạo cho khách hàng này.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerQuotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/70 transition-colors space-y-1.5"
                    >
                      {/* Dòng 1: Mã báo giá (trái) - Tổng tiền (phải) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                          {q.quoteNumber}
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-blue-600 dark:text-blue-400 shrink-0">
                          {formatCurrencyVND(q.totalAmount)}
                        </span>
                      </div>

                      {/* Dòng 2: Hạn hiệu lực (trái) - Trạng thái (phải) */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Hạn: {new Date(q.validUntil).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0 whitespace-nowrap">
                          {q.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-2.5">
              {customerActivities.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                  Chưa có nhật ký chăm sóc nào.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px]">
                          [{act.type}]
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {formatDateTime(act.contactedAt)}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {act.content}
                      </div>
                      {act.nextFollowupAt && (
                        <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center gap-1">
                          <span>⏰ Nhắc hẹn:</span>
                          <span>{formatDateTime(act.nextFollowupAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
