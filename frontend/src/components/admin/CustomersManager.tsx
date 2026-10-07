'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  Edit2,
  X,
  Check,
  Building,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { Customer, CustomerTier } from '../../types/admin';

export function CustomersManager() {
  const { customers, addCustomer, updateCustomer, addToast, searchQuery } =
    useAdminStore();

  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    taxId: string;
    phone: string;
    email: string;
    tier: CustomerTier;
    creditLimit: number;
    address: string;
    status: 'Active' | 'Locked';
  }>({
    name: '',
    taxId: '',
    phone: '',
    email: '',
    tier: 'Khách mua lẻ',
    creditLimit: 30000000,
    address: '',
    status: 'Active',
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.taxId.includes(searchQuery) ||
      c.phone.includes(searchQuery);
    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      taxId: '',
      phone: '',
      email: '',
      tier: 'Khách mua lẻ',
      creditLimit: 30000000,
      address: '',
      status: 'Active',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      taxId: cust.taxId,
      phone: cust.phone,
      email: cust.email,
      tier: cust.tier,
      creditLimit: cust.creditLimit,
      address: cust.address,
      status: cust.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
      addToast(`Đã cập nhật thông tin đối tác ${formData.name}`, 'success');
    } else {
      addCustomer(formData);
      addToast(`Đã thêm mới đối tác ${formData.name}`, 'success');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Nhà Thầu & Đại Lý M&E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý mã số thuế, phân hạng chiết khấu & hạn mức công nợ đối tác
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Đối Tác Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4" /> Lọc phân hạng:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất cả khách hàng' },
            { id: 'Khách mua lẻ', label: 'Khách mua lẻ' },
            { id: 'Thợ điện nước', label: 'Thợ điện nước' },
            { id: 'Hộ gia đình', label: 'Hộ gia đình' },
            { id: 'Khách công trình', label: 'Khách công trình' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTierFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                tierFilter === t.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-4">Tên Đối Tác / MST</th>
                <th className="py-3.5 px-4">Phân hạng & Liên hệ</th>
                <th className="py-3.5 px-4 text-right">Công nợ hiện tại</th>
                <th className="py-3.5 px-4 text-right">Hạn mức nợ</th>
                <th className="py-3.5 px-4 text-right">Tổng chi tiêu</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Không tìm thấy đối tác nào
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {cust.name}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        MST: {cust.taxId}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded">
                        {cust.tier}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        SĐT: {cust.phone} · {cust.email}
                      </p>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {cust.currentDebt.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-medium text-slate-500">
                      {cust.creditLimit.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {cust.totalSpent.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {cust.status === 'Active' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full">
                          Đã khóa
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="Chỉnh sửa đối tác"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Hiển thị {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredCustomers.length)} / {filteredCustomers.length} đối tác
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingCustomer ? 'Chỉnh Sửa Hồ Sơ Đối Tác' : 'Thêm Đối Tác M&E Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên công ty / Nhà thầu
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Công ty Cổ phần M&E Hòa Bình"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế (MST)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="VD: 0301234567"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phân hạng chiết khấu
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Đại lý Cấp 1">Đại lý Cấp 1</option>
                    <option value="Đại lý Cấp 2">Đại lý Cấp 2</option>
                    <option value="Nhà thầu M&E">Nhà thầu M&E</option>
                    <option value="Khách công trình">Khách công trình</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0903..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn mức công nợ (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ trụ sở / văn phòng
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Địa chỉ công ty..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md"
                >
                  <Check className="w-4 h-4" /> Lưu Đối Tác
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
