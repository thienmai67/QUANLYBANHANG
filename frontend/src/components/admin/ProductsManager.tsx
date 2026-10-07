'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { Product, ProductBrand, ProductCategoryType, ProductUnit } from '../../types/admin';

export function ProductsManager() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    addToast,
    searchQuery,
  } = useAdminStore();

  const [filterBrand, setFilterBrand] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'discount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    sku: string;
    name: string;
    brand: ProductBrand;
    category: ProductCategoryType;
    basePrice: number;
    discountRate: number;
    unit: ProductUnit;
    stock: number;
    description: string;
  }>({
    sku: '',
    name: '',
    brand: 'Cadivi',
    category: 'Dây & Cáp Điện',
    basePrice: 0,
    discountRate: 20,
    unit: 'Cuộn 100m',
    stock: 100,
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesQuery =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = filterBrand === 'ALL' || p.brand === filterBrand;
        const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
        return matchesQuery && matchesBrand && matchesCat;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        if (sortBy === 'price') comp = a.basePrice - b.basePrice;
        if (sortBy === 'stock') comp = a.stock - b.stock;
        if (sortBy === 'discount') comp = a.discountRate - b.discountRate;
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [products, searchQuery, filterBrand, filterCategory, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      brand: 'Cadivi',
      category: 'Dây & Cáp Điện',
      basePrice: 0,
      discountRate: 20,
      unit: 'Cuộn 100m',
      stock: 100,
      description: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      basePrice: product.basePrice,
      discountRate: product.discountRate,
      unit: product.unit,
      stock: product.stock,
      description: product.description || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.sku.trim()) errors.sku = 'Mã SKU không được để trống';
    if (!formData.name.trim()) errors.name = 'Tên vật tư không được để trống';
    if (formData.basePrice <= 0) errors.basePrice = 'Giá niêm yết phải lớn hơn 0';
    if (formData.discountRate < 0 || formData.discountRate > 70)
      errors.discountRate = '% Chiết khấu hợp lệ từ 0% đến 70%';
    if (formData.stock < 0) errors.stock = 'Tồn kho không được âm';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const status =
      formData.stock === 0
        ? 'OutOfStock'
        : formData.stock < 20
        ? 'LowStock'
        : 'InStock';

    const formattedPrice = `${formData.basePrice.toLocaleString('vi-VN')} ₫`;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        status,
        price: formattedPrice,
      });
      addToast(`Đã cập nhật thông tin vật tư ${formData.sku}`, 'success');
    } else {
      addProduct({
        ...formData,
        status,
        price: formattedPrice,
      });
      addToast(`Đã thêm mới vật tư ${formData.name}`, 'success');
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteProduct(id);
    setDeleteConfirmId(null);
    addToast(`Đã xóa vật tư ${name}`, 'warning');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Danh Mục Vật Tư M&E
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý giá niêm yết, % chiết khấu nhà thầu, ĐVT & tồn kho thực tế
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md shadow-cyan-900/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Vật Tư Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Category filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4" /> Lọc thương hiệu:
          </div>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-cyan-500 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="ALL">Tất cả thương hiệu</option>
            <option value="Cadivi">Cadivi</option>
            <option value="Bình Minh">Bình Minh</option>
            <option value="Schneider">Schneider</option>
            <option value="Minh Hòa">Minh Hòa</option>
            <option value="Panasonic">Panasonic</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-cyan-500 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="ALL">Tất cả loại vật tư</option>
            <option value="Dây & Cáp Điện">Dây & Cáp Điện</option>
            <option value="Ống & Phụ Kiện Nhựa">Ống & Phụ Kiện Nhựa</option>
            <option value="Tủ & Thiết Bị Đóng Cắt">Tủ & Thiết Bị Đóng Cắt</option>
            <option value="Van & Phụ Kiện Đường Ống">Van & Phụ Kiện Đường Ống</option>
          </select>
        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-2 text-xs w-full md:w-auto justify-end">
          <span className="text-slate-500 dark:text-slate-400">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-cyan-500 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value="name">Tên vật tư</option>
            <option value="price">Giá niêm yết</option>
            <option value="stock">Số lượng tồn kho</option>
            <option value="discount">% Chiết khấu</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300"
          >
            {sortOrder === 'asc' ? '↑ Tăng' : '↓ Giảm'}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-4">Mã SKU / Tên Vật Tư</th>
                <th className="py-3.5 px-4">Thương hiệu & Loại</th>
                <th className="py-3.5 px-4 text-right">Giá niêm yết (VND)</th>
                <th className="py-3.5 px-4 text-center">Chiết khấu</th>
                <th className="py-3.5 px-4 text-center">ĐVT & Tồn kho</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Không tìm thấy vật tư nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                        {prod.sku}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 max-w-sm">
                        {prod.name}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                        {prod.brand}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">{prod.category}</p>
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {prod.basePrice.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      -{prod.discountRate}%
                    </td>

                    <td className="py-4 px-4 text-center">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{prod.stock} {prod.unit}</p>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {prod.status === 'InStock' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                          Sẵn hàng
                        </span>
                      ) : prod.status === 'LowStock' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full">
                          Sắp hết ({prod.stock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full">
                          Hết hàng
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Chỉnh sửa vật tư"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(prod.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Xóa vật tư"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Confirm Delete Popup inline */}
                      {deleteConfirmId === prod.id && (
                        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-left">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                              Xác nhận xóa vật tư?
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              Bạn có chắc muốn xóa <span className="font-bold">{prod.name}</span> ({prod.sku})? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex items-center justify-end gap-3 mt-6">
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                onClick={() => handleDelete(prod.id, prod.name)}
                                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-md"
                              >
                                Đồng ý Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
            Hiển thị {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredProducts.length)} / {filteredProducts.length} vật tư
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

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {editingProduct ? 'Chỉnh Sửa Vật Tư M&E' : 'Thêm Vật Tư M&E Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="VD: CAD-CV-2.5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  {formErrors.sku && <p className="text-rose-500 text-[11px] mt-1">{formErrors.sku}</p>}
                </div>

                {/* Brand */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thương hiệu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Cadivi">Cadivi</option>
                    <option value="Bình Minh">Bình Minh</option>
                    <option value="Schneider">Schneider</option>
                    <option value="Minh Hòa">Minh Hòa</option>
                    <option value="Panasonic">Panasonic</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên vật tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Dây Cáp Điện Cadivi CV 2.5 mm²"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                />
                {formErrors.name && <p className="text-rose-500 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nhóm vật tư
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Dây & Cáp Điện">Dây & Cáp Điện</option>
                    <option value="Ống & Phụ Kiện Nhựa">Ống & Phụ Kiện Nhựa</option>
                    <option value="Tủ & Thiết Bị Đóng Cắt">Tủ & Thiết Bị Đóng Cắt</option>
                    <option value="Van & Phụ Kiện Đường Ống">Van & Phụ Kiện Đường Ống</option>
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn vị tính (ĐVT)
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Cuộn 100m">Cuộn 100m</option>
                    <option value="Mét">Mét</option>
                    <option value="Cây">Cây (4m)</option>
                    <option value="Cái">Cái</option>
                    <option value="Bộ">Bộ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Base Price */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Giá niêm yết (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  {formErrors.basePrice && <p className="text-rose-500 text-[11px] mt-1">{formErrors.basePrice}</p>}
                </div>

                {/* Discount Rate */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chiết khấu nhà thầu (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold text-emerald-600 focus:border-cyan-500 focus:outline-none"
                  />
                  {formErrors.discountRate && <p className="text-rose-500 text-[11px] mt-1">{formErrors.discountRate}</p>}
                </div>

                {/* Stock */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  {formErrors.stock && <p className="text-rose-500 text-[11px] mt-1">{formErrors.stock}</p>}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md"
                >
                  <Check className="w-4 h-4" /> {editingProduct ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
