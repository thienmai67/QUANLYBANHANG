"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, Send, Clock, Phone, Building2 } from "lucide-react";

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
}

export default function RFQModal({ isOpen, onClose, initialProductName }: RFQModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contractorName: "",
    phone: "",
    projectName: "",
    deliveryDate: "",
    notes: "",
  });

  useEffect(() => {
    if (initialProductName) {
      setFormData((prev) => ({
        ...prev,
        notes: `Yêu cầu báo giá vật liệu: ${initialProductName}`,
      }));
    }
  }, [initialProductName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // Auto close after 2.5s
      setTimeout(() => {
        setSubmitted(false);
        setFileName(null);
        onClose();
      }, 2500);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-[#090d16] p-6 sm:p-8 shadow-2xl z-10 text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.15] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white font-display">
              Đã Tiếp Nhận Yêu Cầu Báo Giá!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Phòng Kỹ thuật - Dự toán VLXD TDT đang tổng hợp khối lượng và áp mức chiết khấu tốt nhất. Bảng báo giá chi tiết sẽ gửi qua Zalo/SĐT trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-400" />
                  Báo Giá Vật Tư Công Trình
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5 font-display">
                Yêu Cầu Báo Giá & Hồ Sơ Kỹ Thuật
              </h3>
              {initialProductName ? (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Vật liệu đang chọn: <strong>{initialProductName}</strong></span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Gửi danh mục sắt thép, xi măng, gạch xây dựng, cát đá hoặc tải lên bản vẽ để nhận báo giá chiết khấu nhà máy tốt nhất từ VLXD TDT.
                </p>
              )}
            </div>

            {/* File Upload Box */}
            <div
              onClick={() => {
                setFileName("Boc_Tach_Vat_Lieu_Cong_Trinh.xlsx");
              }}
              className="border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-4 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all group"
            >
              <UploadCloud className="w-7 h-7 mx-auto text-amber-400 group-hover:scale-110 transition-transform mb-1.5" />
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono font-semibold">
                  <FileSpreadsheet className="w-4 h-4" />
                  {fileName}
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-200">
                    Bấm để tải file Excel bóc tách hoặc bản vẽ công trình (.DWG, .PDF, .XLSX)
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Hỗ trợ tối đa 25MB • Nhận ngay file mẫu dự toán
                  </p>
                </>
              )}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Đơn Vị / Công Ty / Nhà Thầu: <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="VD: Cty CP Xây Dựng & Phát Triển Hạ Tầng..."
                  value={formData.contractorName}
                  onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Số Điện Thoại / Zalo Báo Giá: <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="096 108 9292"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Tên Dự Án / Vị Trí Công Trình:
              </label>
              <input
                type="text"
                placeholder="VD: Công trình biệt thự liền kề, Tây Hồ, Hà Nội"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Ghi Chú Yêu Cầu Kỹ Thuật:
              </label>
              <textarea
                rows={2}
                placeholder="Quy cách thép Hòa Phát phi 10-25, xi măng Vicem PCB40, gạch ốp lát Prime 80x80, yêu cầu chứng chỉ CO/CQ..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-orange-600/30"
            >
              <Send className="w-4 h-4" /> Gửi Yêu Cầu & Nhận Báo Giá Dự Toán
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
