'use client';

import React, { useState, useEffect } from 'react';
import { Search, FolderTree, Plus, X, Loader2, Check } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { api, getFriendlyErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const CATEGORY_TYPES = [
  { value: 'PIPE', label: 'PIPE — Ống nước & Ống luồn dây' },
  { value: 'FITTING', label: 'FITTING — Phụ kiện nối & Co lơ' },
  { value: 'CABLE', label: 'CABLE — Dây & Cáp điện' },
  { value: 'DEVICE', label: 'DEVICE — Thiết bị đóng cắt & CB' },
  { value: 'ACCESSORY', label: 'ACCESSORY — Phụ kiện tủ điện & M&E' },
];

export function CategoriesManager() {
  const {
    categories,
    fetchCategories,
    fetchProducts,
  } = useAdminStore();
  const toast = useToast();

  useEffect(() => {
    fetchProducts().then(() => fetchCategories());
  }, [fetchProducts, fetchCategories]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [catType, setCatType] = useState('PIPE');

  const filteredCategories = categories.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = () => {
    setName('');
    setCode('');
    setCatType('PIPE');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === autoGenerateCode(name)) {
      setCode(autoGenerateCode(val));
    }
  };

  const autoGenerateCode = (text: string) => {
    return text
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên danh mục');
      return;
    }
    if (!code.trim()) {
      toast.warning('Vui lòng nhập mã danh mục (Code/Slug)');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/categories', {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type: catType,
      });
      toast.success(`Đã tạo thành công danh mục "${name.trim()}"!`);
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err) || 'Không thể tạo danh mục');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Nhóm Vật Tư M&E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh mục phân loại vật tư ngành cơ điện M&E từ cơ sở dữ liệu hệ thống
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Danh Mục Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-cyan-500 focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>
      </div>

      {/* Grid of Category Cards */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
          <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Chưa có dữ liệu danh mục</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 rounded-xl">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {cat.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">/{cat.slug || (cat as any).code || ''}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      cat.status === 'Active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {cat.status === 'Active' ? 'Kinh doanh' : 'Tạm ngưng'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                  {cat.description || `Nhóm vật tư ${cat.name} phục vụ thi công hệ thống điện nước công trình.`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Tổng số SKU: <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">{cat.skuCount || 0}</span> sản phẩm
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tạo Danh Mục Vật Tư M&E Mới
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Thêm nhóm danh mục vào cơ sở dữ liệu hệ thống
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Ống Thép Luồn Dây Điện"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã danh mục (Code / Slug) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: STEEL_PIPE"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phân loại nhóm ngành <span className="text-rose-500">*</span>
                </label>
                <select
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
                >
                  {CATEGORY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Xác nhận tạo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesManager;
