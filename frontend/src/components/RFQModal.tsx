"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, Send, Clock, Phone, AlertCircle } from "lucide-react";

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RFQModal({ isOpen, onClose }: RFQModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contractorName: "",
    phone: "",
    projectName: "",
    deliveryDate: "",
    notes: "",
  });

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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#0c1322] p-6 sm:p-8 shadow-2xl z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">
              Đã Tiếp Nhận Hồ Sơ BOM!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Chuyên viên phòng Kỹ thuật - Dự toán TDT đang bóc tách và tính tỷ lệ chiết khấu tốt nhất. Bảng báo giá chi tiết sẽ gửi qua Zalo/SĐT trong vòng 15 phút.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                Báo Giá Siêu Tốc 15 Phút
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white mt-1">
                Gửi File BOM / Danh Mục Vật Tư
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tải lên bản vẽ, file Excel bóc tách khối lượng hoặc danh sách vật tư cần báo giá chiết khấu nhà máy.
              </p>
            </div>

            {/* File Upload Box */}
            <div
              onClick={() => {
                setFileName("BOM_HeThongDienNuoc_VillaAnGia_v2.xlsx");
              }}
              className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-5 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all group"
            >
              <UploadCloud className="w-8 h-8 mx-auto text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-mono font-semibold">
                  <FileSpreadsheet className="w-4 h-4" />
                  {fileName}
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-200">
                    Bấm để chọn file hoặc kéo thả file BOM Excel / PDF vào đây
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Hỗ trợ .XLSX, .XLS, .PDF, .DWG (Tối đa 25MB)
                  </p>
                </>
              )}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Đơn Vị / Nhà Thầu:
                </label>
                <input
                  required
                  type="text"
                  placeholder="VD: Cty XD & Cơ Điện An Gia"
                  value={formData.contractorName}
                  onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Số Điện Thoại / Zalo Báo Giá:
                </label>
                <input
                  required
                  type="tel"
                  placeholder="0908 xxx xxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Tên Dự Án & Địa Điểm Giao Hàng:
              </label>
              <input
                type="text"
                placeholder="VD: Chung cư Masterise Thủ Đức, cần giao trước ngày 28/09"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              <Send className="w-4 h-4" /> Gửi Yêu Cầu & Nhận Báo Giá Sau 15 Phút
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
