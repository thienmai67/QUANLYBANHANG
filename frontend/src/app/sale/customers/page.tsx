'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  CreditCard,
  FileText,
  ShoppingBag,
  ExternalLink,
  Filter,
  DollarSign,
  AlertCircle,
  X,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { SaleCustomerSummary, CustomerTier } from '@/types/sale';
import { formatCurrencyVND } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import CustomerDetailModal from '@/components/sale/CustomerDetailModal';
import { isValidVietnamesePhone, sanitizePhone } from '@/lib/validation';
import { getFriendlyErrorMessage } from '@/lib/api';
import SearchableSelect from '@/components/sale/SearchableSelect';

export default function SaleCustomersPage() {
  const { customers, fetchCustomers, createCustomer, isLoading } = useSaleStore();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<SaleCustomerSummary | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Customer Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [tier, setTier] = useState<CustomerTier>('Retail');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers(searchTerm.trim() ? searchTerm.trim() : undefined);
  }, [fetchCustomers, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchTier = tierFilter === 'ALL' || (c.profile?.tier || 'Retail') === tierFilter;
      return matchTier;
    });
  }, [customers, tierFilter]);

  // Quick stats
  const totalDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  }, [customers]);

  const vipCount = useMemo(() => {
    return customers.filter(
      (c) => c.profile?.tier === 'Gold' || c.profile?.tier === 'Silver'
    ).length;
  }, [customers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Vui lòng nhập họ tên và email');
      return;
    }
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidVietnamesePhone(trimmedPhone)) {
      toast.error(
        'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).'
      );
      return;
    }
    try {
      setIsSubmitting(true);
      await createCustomer({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: trimmedPhone ? sanitizePhone(trimmedPhone) : undefined,
        companyName: companyName.trim() || undefined,
        siteAddress: siteAddress.trim() || undefined,
        tier,
        creditLimit: Number(creditLimit) || 0,
        notes: notes.trim() || undefined,
      });
      toast.success('Đã thêm khách hàng mới vào danh mục phụ trách!');
      setIsCreateModalOpen(false);
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setSiteAddress('');
      setTier('Retail');
      setCreditLimit(0);
      setNotes('');
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const tierOptions = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'Gold', label: 'Gold (VIP)' },
    { value: 'Silver', label: 'Silver' },
    { value: 'Bronze', label: 'Bronze' },
    { value: 'Retail', label: 'Retail' },
  ];

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Gold':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700">
            Gold
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Silver
          </span>
        );
      case 'Bronze':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700">
            Bronze
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            Retail
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top KPI Cards (Compact on mobile, 3-card on desktop) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Khách phụ trách
            </div>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {customers.length}
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="p-2 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Đối tác VIP
            </div>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {vipCount}
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="p-2 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Tổng công nợ
            </div>
            <div className="text-xs sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              {formatCurrencyVND(totalDebt)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm khách hàng theo tên, SĐT, công ty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* New Customer Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-98 rounded-2xl shadow-md shadow-blue-600/20 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khách hàng</span>
          </button>
        </div>

        {/* Tier filter pills (Lướt ngang 1 chạm) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline mr-1">
            Phân hạng:
          </span>
          {tierOptions.map((opt) => {
            const isSelected = tierFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTierFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Customer Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
            <p className="text-xs">Đang tải danh sách khách hàng...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">Không tìm thấy khách hàng nào phù hợp.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const currentTier = cust.profile?.tier || 'Retail';
            return (
              <div
                key={cust.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 transition-shadow hover:shadow-md"
              >
                {/* Header: Name + Tier */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(cust)}
                      className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 transition-colors text-left truncate block max-w-full"
                    >
                      {cust.fullName}
                    </button>
                    {cust.profile?.companyName ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Building className="w-3 h-3 shrink-0" />
                        <span className="truncate">{cust.profile.companyName}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic mt-0.5">Khách lẻ cá nhân</div>
                    )}
                  </div>
                  <div className="shrink-0">{getTierBadge(currentTier)}</div>
                </div>

                {/* Body Metrics: Công nợ, Doanh số, Số đơn */}
                <div className="grid grid-cols-3 gap-2 py-1 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-2.5 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Công nợ</div>
                    <div
                      className={`text-xs font-bold mt-0.5 truncate ${
                        cust.currentDebt > 0
                          ? 'text-rose-600 dark:text-rose-400 font-black'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {formatCurrencyVND(cust.currentDebt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Doanh số</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {formatCurrencyVND(cust.totalSpent)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Số đơn</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {cust.orderCount}
                    </div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400">
                  {cust.phone && (
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{cust.phone}</span>
                    </div>
                  )}
                  {cust.profile?.siteAddress && (
                    <div className="text-[11px] text-slate-500 truncate">
                      📍 {cust.profile.siteAddress}
                    </div>
                  )}
                </div>

                {/* Footer Quick Actions */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {cust.phone && (
                      <a
                        href={`tel:${cust.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all"
                        title="Gọi điện"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Gọi</span>
                      </a>
                    )}

                    <Link
                      href={`/sale/orders/new?customerId=${cust.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 active:scale-95 transition-all"
                      title="Lên đơn hàng mới"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Lên đơn</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(cust)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 active:scale-95 transition-all ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Hồ sơ</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer List Table (Desktop >= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Khách hàng / Doanh nghiệp</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-center">Phân hạng</th>
                <th className="py-3 px-4">Địa chỉ giao hàng</th>
                <th className="py-3 px-4 text-right">Doanh số</th>
                <th className="py-3 px-4 text-right">Công nợ</th>
                <th className="py-3 px-4 text-center">Số đơn</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const currentTier = cust.profile?.tier || 'Retail';
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Company */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="text-left group"
                        >
                          <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                            {cust.fullName}
                          </div>
                          {cust.profile?.companyName ? (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3" />
                              <span>{cust.profile.companyName}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic mt-0.5">Khách lẻ cá nhân</div>
                          )}
                        </button>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
                          {cust.phone && (
                            <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                              <Phone className="w-3 h-3 text-slate-400" /> {cust.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" /> {cust.email}
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            currentTier === 'Gold'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                              : currentTier === 'Silver'
                              ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              : currentTier === 'Bronze'
                              ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                          }`}
                        >
                          {currentTier}
                        </span>
                      </td>

                      {/* Site Address */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {cust.profile?.siteAddress || 'Chưa cập nhật'}
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrencyVND(cust.totalSpent)}
                      </td>

                      {/* Current Debt */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            cust.currentDebt > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {formatCurrencyVND(cust.currentDebt)}
                        </span>
                      </td>

                      {/* Order Count */}
                      <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                        {cust.orderCount}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Xem chi tiết hồ sơ"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/sale/orders/new?customerId=${cust.id}`}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Tạo đơn hàng hỗ trợ"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/sale/quotes/new?customerId=${cust.id}`}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Tạo báo giá B2B"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onRefresh={() => fetchCustomers()}
        />
      )}

      {/* Create New Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Thêm khách hàng mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Trần Văn Hùng"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="hungtran@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tên công ty (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Cty TNHH Xây Lắp..."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phân hạng Tier
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'Retail', label: 'Retail (Khách lẻ)' },
                      { value: 'Bronze', label: 'Bronze (Nhà thầu phụ)' },
                      { value: 'Silver', label: 'Silver (Tổng thầu)' },
                      { value: 'Gold', label: 'Gold (VIP)', badge: 'VIP' },
                    ]}
                    value={tier}
                    onChange={(val) => setTier(val as CustomerTier)}
                    placeholder="Chọn phân hạng..."
                    searchPlaceholder="Tìm phân hạng..."
                    title="Phân hạng khách hàng"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ công trình / Kho
                </label>
                <input
                  type="text"
                  placeholder="Khu phố 3, P. Hiệp Bình Chánh..."
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hạn mức công nợ ban đầu (VND)
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
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Thông tin thêm..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
