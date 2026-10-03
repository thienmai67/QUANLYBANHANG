'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
  Phone,
  Mail,
  Building,
  DollarSign,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { BomRequest } from '../../types/admin';

export function BomRequestsManager() {
  const { bomRequests, updateBomStatus, addToast } = useAdminStore();
  const [selectedBom, setSelectedBom] = useState<BomRequest | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ConvertedToOrder':
        return <span className="px-3 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">Đã duyệt → Đơn hàng</span>;
      case 'Quoted':
        return <span className="px-3 py-1 text-xs font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-full">Đã gửi báo giá</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full animate-pulse">Chờ bóc tách 2H</span>;
    }
  };

  const handleConvertOrder = (bom: BomRequest) => {
    updateBomStatus(bom.id, 'ConvertedToOrder');
    addToast(`Đã duyệt file BOM ${bom.code} và khởi tạo đơn hàng công trình thành công!`, 'success');
    setSelectedBom(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Quản Lý Yêu Cầu Báo Giá BOM M&E
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tiếp nhận file bóc tách khối lượng từ nhà thầu, áp chiết khấu đại lý & xuất báo giá
        </p>
      </div>

      {/* BOM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {bomRequests.map((bom) => (
          <div
            key={bom.id}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                      {bom.code}
                    </h3>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                      {bom.contractorName}
                    </p>
                  </div>
                </div>

                {getStatusBadge(bom.status)}
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Dự án: <strong className="text-slate-900 dark:text-slate-100">{bom.projectName}</strong>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> SĐT liên hệ: <span>{bom.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email: <span>{bom.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Ước tính BOM:</span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {bom.estimatedTotal.toLocaleString('vi-VN')} VND
                </p>
              </div>

              <button
                onClick={() => setSelectedBom(bom)}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Xem chi tiết BOM <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOM Detail Modal */}
      {selectedBom && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {selectedBom.code}
                  </h3>
                  {getStatusBadge(selectedBom.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedBom.projectName}</p>
              </div>

              <button
                onClick={() => setSelectedBom(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Contractor info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400">Nhà thầu:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedBom.contractorName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Liên hệ:</span>
                  <p className="font-medium">{selectedBom.phone} · {selectedBom.email}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
                  Danh mục bóc tách vật tư ({selectedBom.items.length} mục)
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                      <tr>
                        <th className="p-3">Tên vật tư bóc tách</th>
                        <th className="p-3">Gợi ý SKU</th>
                        <th className="p-3 text-center">Số lượng</th>
                        <th className="p-3 text-right">Đơn giá ước tính</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedBom.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                            {item.materialName}
                          </td>
                          <td className="p-3 font-mono font-bold text-cyan-600">
                            {item.suggestedSku || 'N/A'}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {item.estimatedPrice.toLocaleString('vi-VN')} VND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total & Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400">Tổng giá trị dự toán BOM:</span>
                  <p className="font-mono font-black text-xl text-cyan-600 dark:text-cyan-400">
                    {selectedBom.estimatedTotal.toLocaleString('vi-VN')} VND
                  </p>
                </div>

                {selectedBom.status === 'PendingReview' && (
                  <button
                    onClick={() => handleConvertOrder(selectedBom)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    <CheckCircle className="w-5 h-5" /> Duyệt & Tạo Đơn Hàng 2H
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
