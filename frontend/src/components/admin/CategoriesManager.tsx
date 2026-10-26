'use client';

import React, { useState, useEffect } from 'react';
import { Search, FolderTree } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

export function CategoriesManager() {
  const {
    categories,
    fetchCategories,
    fetchProducts,
  } = useAdminStore();

  useEffect(() => {
    fetchProducts().then(() => fetchCategories());
  }, [fetchProducts, fetchCategories]);

  const [search, setSearch] = useState('');

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Nhóm Vật Tư M&E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh mục phân loại vật tư từ cơ sở dữ liệu hệ thống (Chế độ chỉ đọc)
          </p>
        </div>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoriesManager;
