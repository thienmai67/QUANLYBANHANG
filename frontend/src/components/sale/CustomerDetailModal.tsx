'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Shield,
  CreditCard,
  FileText,
  Clock,
  Plus,
  ShoppingBag,
  Send,
  Calendar,
  Save,
  MessageSquare,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { SaleCustomerSummary, CustomerTier } from '@/types/sale';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrencyVND, formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

interface CustomerDetailModalProps {
  customer: SaleCustomerSummary | null;
  onClose: () => void;
  onRefresh: () => void;
}

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
  const [companyName, setCompanyName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [tier, setTier] = useState<CustomerTier>('Retail');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
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
    try {
      setIsSaving(true);
      await updateCustomer(customer.id, {
        fullName: customer.fullName,
        phone: customer.phone,
        companyName,
        siteAddress,
        tier,
        creditLimit: Number(creditLimit) || 0,
        notes,
      });
      toast.success('Đã cập nhật hồ sơ khách hàng thành công');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật hồ sơ khách hàng');
    } finally {
      setIsSaving(false);
    }
  };

  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const customerQuotes = quotes.filter((q) => q.customerId === customer.id);
  const customerActivities = activities.filter((a) => a.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-lg flex items-center justify-center">
              {customer.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {customer.fullName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    tier === 'Gold'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : tier === 'Silver'
                      ? 'bg-slate-200 text-slate-700 border border-slate-300'
                      : tier === 'Bronze'
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {tier}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/sale/orders/new?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Lên đơn
            </Link>
            <Link
              href={`/sale/quotes/new?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> Báo giá
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Doanh số tích lũy</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatCurrencyVND(customer.totalSpent)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Công nợ hiện tại</div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                customer.currentDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formatCurrencyVND(customer.currentDebt)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tổng đơn hàng</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {customer.orderCount} đơn
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 gap-6 text-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Hồ sơ & Phân hạng
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Lịch sử đơn hàng ({customerOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'quotes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Báo giá ({customerQuotes.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'activities'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Nhật ký chăm sóc ({customerActivities.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tên công ty / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="VD: Cty TNHH Xây dựng Nam Phát"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phân hạng khách hàng (Tier)
                  </label>
                  <div className="relative">
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as CustomerTier)}
                      className="w-full appearance-none pl-3.5 pr-9 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-xs"
                    >
                      <option value="Retail">Retail (Khách lẻ)</option>
                      <option value="Bronze">Bronze (Nhà thầu phụ)</option>
                      <option value="Silver">Silver (Tổng thầu / Đơn vị lớn)</option>
                      <option value="Gold">Gold (Đối tác chiến lược VIP)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ công trình / Kho giao hàng
                </label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="VD: Công trình KĐT Sala, P. An Khánh, TP. Thủ Đức"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hạn mức công nợ tối đa (VND)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú hồ sơ & lưu ý chăm sóc
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lưu ý về sở thích, giờ gọi điện, yêu cầu chứng từ CO/CQ, thanh toán..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              {customerOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Chưa có đơn hàng nào.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerOrders.map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {ord.orderNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Ngày tạo: {formatDateTime(ord.createdAt)} • {ord.items.length} món
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrencyVND(ord.totalAmount)}
                        </div>
                        <div className="text-xs font-medium mt-0.5 text-blue-600 dark:text-blue-400">
                          {ord.status} / {ord.paymentStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-3">
              {customerQuotes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Chưa có báo giá nào.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerQuotes.map((q) => (
                    <div key={q.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {q.quoteNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Hạn: {new Date(q.validUntil).toLocaleDateString('vi-VN')} • Trạng thái:{' '}
                          <span className="font-semibold">{q.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          {formatCurrencyVND(q.totalAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-3">
              {customerActivities.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Chưa có nhật ký chăm sóc nào.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerActivities.map((act) => (
                    <div key={act.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          [{act.type}]
                        </span>
                        <span className="text-slate-500">{formatDateTime(act.contactedAt)}</span>
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-200">{act.content}</div>
                      {act.nextFollowupAt && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          Nhắc hẹn: {formatDateTime(act.nextFollowupAt)}
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
