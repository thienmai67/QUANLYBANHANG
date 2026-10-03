'use client';

import React, { useState } from 'react';
import { Plus, Search, FolderTree, Edit2, Trash2, X, Check } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { Category, ProductCategoryType } from '../../types/admin';

export function CategoriesManager() {
  const { categories, addCategory, updateCategory, deleteCategory, addToast } =
    useAdminStore();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<{
    name: ProductCategoryType;
    slug: string;
    description: string;
    status: 'Active' | 'Inactive';
  }>({
    name: 'Dây & Cáp Điện',
    slug: 'day-cap-dien',
    description: '',
    status: 'Active',
  });

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: 'Dây & Cáp Điện',
      slug: 'day-cap-dien',
      description: '',
      status: 'Active',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      status: cat.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
      addToast(`Đã cập nhật danh mục ${formData.name}`, 'success');
    } else {
      addCategory(formData);
      addToast(`Đã thêm danh mục mới ${formData.name}`, 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteCategory(id);
    addToast(`Đã xóa danh mục ${name}`, 'warning');
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
            Phân loại danh mục dây điện, ống nhựa, tủ điện, van công nghiệp
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-900/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục Mới
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
                    <span className="text-[11px] font-mono text-slate-400">/{cat.slug}</span>
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
                {cat.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Tổng số SKU: <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">{cat.skuCount}</span> sản phẩm
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  title="Chỉnh sửa danh mục"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  title="Xóa danh mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
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
                  Tên danh mục
                </label>
                <select
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value as ProductCategoryType,
                      slug: e.target.value.toLowerCase().replace(/ /g, '-'),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Dây & Cáp Điện">Dây & Cáp Điện</option>
                  <option value="Ống & Phụ Kiện Nhựa">Ống & Phụ Kiện Nhựa</option>
                  <option value="Tủ & Thiết Bị Đóng Cắt">Tủ & Thiết Bị Đóng Cắt</option>
                  <option value="Van & Phụ Kiện Đường Ống">Van & Phụ Kiện Đường Ống</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Active">Kinh doanh</option>
                  <option value="Inactive">Tạm ngưng</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả danh mục
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả nhóm sản vật tư..."
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
                  <Check className="w-4 h-4" /> Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
