"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  shipperApi,
  type ShipperApplication,
  type ShipperEmailPoolEntry,
  type ReviewChecks,
  type ApproveResult,
  type ResetPasswordResult,
  type ApplicationStatus,
} from "@/services/shipperApi";

type Filter = "" | ApplicationStatus;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const STATUS_CLASS: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  REJECTED: "bg-red-500/10 text-red-700 border-red-500/30",
};

const CHECK_LABELS: { key: keyof ReviewChecks; label: string }[] = [
  { key: "identity", label: "Giấy tờ định danh" },
  { key: "vehicle", label: "Phương tiện / biển số" },
  { key: "terms", label: "Điều khoản hợp tác" },
  { key: "training", label: "Đã học quy trình" },
];

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

// GĐ1 shipper (MANAGER): danh sách hồ sơ chờ duyệt, tick 4 điều kiện,
// duyệt kèm 1 mail trống trong pool 20 mail, từ chối kèm lý do.
// Duyệt có 2 lớp nhắc: thiếu tick/mail thì báo rõ còn thiếu gì, đủ rồi thì
// hỏi lại "có chắc cấp quyền không" trước khi gọi API.
export default function ManagerShipperApplicationsPage() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [applications, setApplications] = useState<ShipperApplication[]>([]);
  const [pool, setPool] = useState<ShipperEmailPoolEntry[]>([]);
  const [selected, setSelected] = useState<ShipperApplication | null>(null);
  const [checks, setChecks] = useState<ReviewChecks>({
    identity: false,
    vehicle: false,
    terms: false,
    training: false,
  });
  const [selectedEmail, setSelectedEmail] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [approveResult, setApproveResult] = useState<ApproveResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Modal duyệt: 'missing' = báo còn thiếu gì, 'confirm' = hỏi chắc cấp quyền.
  const [approveModal, setApproveModal] = useState<null | "missing" | "confirm">(null);
  // Mã tra cứu cấp lại (chỉ hiện một lần, manager chuyển cho người nộp).
  const [reissueResult, setReissueResult] = useState<string | null>(null);
  // Mật khẩu tạm sau khi manager reset cho shipper quên mật khẩu
  // (chỉ hiện một lần, manager chuyển riêng cho shipper).
  const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  // Mail pool đang chờ xác nhận thu hồi.
  const [reclaimTarget, setReclaimTarget] = useState<ShipperEmailPoolEntry | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [apps, poolEntries] = await Promise.all([
        shipperApi.listApplications(filter === "" ? undefined : filter),
        shipperApi.listEmailPool(),
      ]);
      setApplications(apps);
      setPool(poolEntries);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openApplication = (app: ShipperApplication) => {
    setSelected(app);
    setChecks({
      identity: app.identityChecked,
      vehicle: app.vehicleChecked,
      terms: app.termsChecked,
      training: app.trainingChecked,
    });
    setSelectedEmail("");
    setRejectReason("");
    setApproveResult(null);
    setReissueResult(null);
    setResetResult(null);
    setResetConfirm(false);
    setApproveModal(null);
  };

  // Những gì còn thiếu trước khi duyệt được: tên các tick chưa tick + mail.
  const missingItems: string[] = [
    ...CHECK_LABELS.filter((item) => !checks[item.key]).map((item) => item.label),
    ...(selectedEmail ? [] : ["Chưa chọn mail cấp cho shipper"]),
  ];

  // Bấm "Duyệt": thiếu gì thì mở modal báo thiếu, đủ rồi thì mở modal hỏi chắc.
  const handleApproveClick = () => {
    if (!selected) return;
    setErrorMsg(null);
    setApproveModal(missingItems.length > 0 ? "missing" : "confirm");
  };

  // Xác nhận trong modal "có chắc cấp quyền không" rồi mới gọi API duyệt.
  const handleApproveConfirm = async () => {
    if (!selected) return;
    setApproveModal(null);
    setIsActing(true);
    setErrorMsg(null);
    try {
      const result = await shipperApi.approveApplication(selected.id, selectedEmail, checks);
      setApproveResult(result);
      setSelected(result.application);
      const [apps, poolEntries] = await Promise.all([
        shipperApi.listApplications(filter === "" ? undefined : filter),
        shipperApi.listEmailPool(),
      ]);
      setApplications(apps);
      setPool(poolEntries);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể duyệt hồ sơ");
    } finally {
      setIsActing(false);
    }
  };

  const handleReissueCode = async () => {
    if (!selected) return;
    setIsActing(true);
    setErrorMsg(null);
    try {
      const result = await shipperApi.reissueLookupCode(selected.id);
      setReissueResult(result.lookupCode);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể cấp lại mã tra cứu");
    } finally {
      setIsActing(false);
    }
  };

  const handleResetConfirm = async () => {
    if (!selected) return;
    setResetConfirm(false);
    setIsActing(true);
    setErrorMsg(null);
    try {
      const result = await shipperApi.resetShipperPassword(selected.id);
      setResetResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu");
    } finally {
      setIsActing(false);
    }
  };

  const handleReclaimConfirm = async () => {
    if (!reclaimTarget) return;
    setReclaimTarget(null);
    setIsActing(true);
    setErrorMsg(null);
    try {
      await shipperApi.reclaimPoolEmail(reclaimTarget.email);
      const refreshed = await shipperApi.listEmailPool();
      setPool(refreshed);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể thu hồi mail");
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (rejectReason.trim().length < 5) {
      setErrorMsg("Lý do từ chối phải có ít nhất 5 ký tự");
      return;
    }
    setIsActing(true);
    setErrorMsg(null);
    try {
      const updated = await shipperApi.rejectApplication(selected.id, rejectReason.trim());
      setSelected(updated);
      const apps = await shipperApi.listApplications(filter === "" ? undefined : filter);
      setApplications(apps);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể từ chối hồ sơ");
    } finally {
      setIsActing(false);
    }
  };

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Bỏ qua lỗi copy (trình duyệt chặn clipboard)
    }
  };

  const freePool = pool.filter((entry) => entry.status === "FREE");
  const usedCount = pool.filter((entry) => entry.status === "USED").length;
  const allChecked = checks.identity && checks.vehicle && checks.terms && checks.training;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">
          Duyệt hồ sơ shipper
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Hồ sơ đang chờ duyệt chưa được gán đơn và chưa thấy thông tin khách.
          Pool mail: {usedCount}/{pool.length || 20} đang dùng.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-[13px] font-medium"
        >
          {errorMsg}
        </div>
      )}

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "PENDING", label: "Chờ duyệt" },
            { value: "APPROVED", label: "Đã duyệt" },
            { value: "REJECTED", label: "Từ chối" },
            { value: "", label: "Tất cả" },
          ] as { value: Filter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.value || "ALL"}
            type="button"
            onClick={() => {
              setFilter(tab.value);
              setSelected(null);
              setApproveResult(null);
            }}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
              filter === tab.value
                ? "bg-[#1E6BFF] text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Danh sách hồ sơ */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <p className="p-6 text-[13px] text-slate-500">Đang tải...</p>
          ) : applications.length === 0 ? (
            <p className="p-6 text-[13px] text-slate-500">Không có hồ sơ nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => openApplication(app)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                      selected?.id === app.id ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[14px] text-slate-900">
                        {app.fullName}
                      </span>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_CLASS[app.status]}`}
                      >
                        {STATUS_LABEL[app.status]}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1">
                      {app.phone} · {app.documentType} ...{app.documentNumberMasked}
                      {app.licensePlate ? ` · Biển số ${app.licensePlate}` : ""} ·{" "}
                      {formatDate(app.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chi tiết + duyệt / từ chối */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          {!selected ? (
            <p className="text-[13px] text-slate-500">
              Chọn một hồ sơ bên trái để xem và duyệt.
            </p>
          ) : (
            <>
              <div>
                <h2 className="font-bold text-[16px] text-slate-900">{selected.fullName}</h2>
                <p className="text-[13px] text-slate-500 mt-1">
                  SĐT: {selected.phone} · Sinh: {formatDate(selected.dateOfBirth)}
                </p>
                <p className="text-[13px] text-slate-500">
                  Giấy tờ: {selected.documentType} ...{selected.documentNumberMasked}
                </p>
                {selected.licensePlate && (
                  <p className="text-[13px] text-slate-500">
                    Biển số: {selected.licensePlate}
                  </p>
                )}
                {selected.driverLicense && (
                  <p className="text-[13px] text-slate-500">GPLX: {selected.driverLicense}</p>
                )}
                <p className="text-[13px] text-slate-500">
                  Trạng thái:{" "}
                  <span className="font-semibold">{STATUS_LABEL[selected.status]}</span>
                </p>
                {selected.status === "REJECTED" && selected.rejectionReason && (
                  <p className="text-[13px] text-red-600">
                    Lý do từ chối: {selected.rejectionReason}
                  </p>
                )}
                {selected.status === "APPROVED" && selected.issuedEmail && (
                  <p className="text-[13px] text-emerald-700">
                    Đã cấp mail: {selected.issuedEmail}
                  </p>
                )}
                {(selected.status === "PENDING" || selected.status === "APPROVED") && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleReissueCode}
                      disabled={isActing}
                      className="w-full py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[13px] hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Cấp lại mã tra cứu
                    </button>
                    <p className="text-[12px] text-slate-500 mt-1.5">
                      Dùng khi người nộp làm mất mã. Mã mới chỉ hiện một lần bên
                      dưới, mã cũ hết hiệu lực ngay.
                    </p>
                  </div>
                )}
                {reissueResult && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
                    <p className="font-bold text-[14px] text-slate-900">
                      Mã tra cứu mới — chuyển cho người nộp ngay:
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-[16px] tracking-[0.2em] text-slate-900">
                        {reissueResult}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText("reissue", reissueResult)}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-700"
                      >
                        {copiedKey === "reissue" ? "Đã copy" : "Copy"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReissueResult(null)}
                      className="w-full py-2 rounded-full bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 transition-colors"
                    >
                      Đã chuyển cho người nộp
                    </button>
                  </div>
                )}
                {selected.status === "APPROVED" && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setResetConfirm(true)}
                      disabled={isActing}
                      className="w-full py-2.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold text-[13px] border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Đặt lại mật khẩu
                    </button>
                    <p className="text-[12px] text-slate-500 mt-1.5">
                      Dùng khi shipper quên mật khẩu. Mật khẩu cũ hết hiệu lực
                      ngay, mật khẩu tạm mới chỉ hiện một lần bên dưới.
                    </p>
                  </div>
                )}
                {resetResult && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-3">
                    <p className="font-bold text-[14px] text-slate-900">
                      Mật khẩu tạm mới — chuyển riêng cho shipper ngay:
                    </p>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600">
                          Email đăng nhập: <strong>{resetResult.issuedEmail}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText("reset-email", resetResult.issuedEmail)}
                          className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-700"
                        >
                          {copiedKey === "reset-email" ? "Đã copy" : "Copy"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600">
                          Mật khẩu tạm: <strong>{resetResult.tempPassword}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText("reset-pass", resetResult.tempPassword)}
                          className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-700"
                        >
                          {copiedKey === "reset-pass" ? "Đã copy" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[12px] text-amber-700">
                      Mật khẩu tạm chỉ hiện một lần ở đây. Shipper đăng nhập bằng
                      mật khẩu tạm sẽ bị bắt đổi mật khẩu mới ngay.
                    </p>
                    <button
                      type="button"
                      onClick={() => setResetResult(null)}
                      className="w-full py-2 rounded-full bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 transition-colors"
                    >
                      Đã chuyển cho shipper
                    </button>
                  </div>
                )}
              </div>

              {selected.status === "PENDING" && (
                <>
                  <div className="space-y-2 pt-1">
                    <p className="text-[13px] font-semibold text-slate-900">
                      Tick từng điều kiện đạt:
                    </p>
                    {CHECK_LABELS.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 cursor-pointer text-[13px] text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checks[item.key]}
                          onChange={(e) =>
                            setChecks((prev) => ({ ...prev, [item.key]: e.target.checked }))
                          }
                          className="w-4 h-4 accent-[#1E6BFF]"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>

                  <div>
                    <label
                      htmlFor="approve-email"
                      className="block text-[13px] font-semibold text-slate-900 mb-1.5"
                    >
                      Chọn mail cấp cho shipper
                    </label>
                    {freePool.length === 0 ? (
                      <p className="text-[13px] text-red-600">
                        Pool đã đầy (20/20). Thu hồi mail của shipper đã nghỉ rồi mới
                        duyệt thêm được.
                      </p>
                    ) : (
                      <select
                        id="approve-email"
                        value={selectedEmail}
                        onChange={(e) => setSelectedEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F3F5F9] text-[13px] font-semibold text-slate-900 outline-none border border-transparent focus:border-[#1E6BFF]"
                      >
                        <option value="">— Chọn mail trống —</option>
                        {freePool.map((entry) => (
                          <option key={entry.email} value={entry.email}>
                            {entry.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Nhắc trực tiếp dưới nút duyệt khi còn thiếu tick hoặc mail */}
                  {!allChecked || !selectedEmail ? (
                    <p className="text-[12px] text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                      Chưa duyệt được, còn thiếu: {missingItems.join(", ")}.
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleApproveClick}
                    disabled={isActing}
                    className="w-full py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] hover:bg-[#0F56E8] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isActing ? "Đang xử lý..." : "Duyệt và cấp tài khoản"}
                  </button>

                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <label
                      htmlFor="reject-reason"
                      className="block text-[13px] font-semibold text-slate-900"
                    >
                      Từ chối kèm lý do
                    </label>
                    <input
                      id="reject-reason"
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối (tối thiểu 5 ký tự)"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3F5F9] text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none border border-transparent focus:border-red-400"
                    />
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isActing || rejectReason.trim().length < 5}
                      className="w-full py-2.5 rounded-full bg-red-500/10 text-red-600 font-semibold text-[13px] border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isActing ? "Đang xử lý..." : "Từ chối hồ sơ"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Kết quả duyệt: không còn mật khẩu tạm để chuyển tay nữa.
              Shipper tự xem email + đặt mật khẩu qua trang tra cứu bằng mã của mình. */}
          {approveResult && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-3">
              <p className="font-bold text-[14px] text-emerald-800">
                Đã duyệt và cấp tài khoản!
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">
                    Email đăng nhập: <strong>{approveResult.issuedEmail}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText("email", approveResult.issuedEmail)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-700"
                  >
                    {copiedKey === "email" ? "Đã copy" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-slate-600">
                Shipper dùng số điện thoại cộng mã tra cứu để xem email này và tự
                đặt mật khẩu. Không còn mật khẩu tạm cần chuyển tay nữa.
              </p>
              <button
                type="button"
                onClick={() => setApproveResult(null)}
                className="w-full py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-[13px] hover:bg-emerald-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách pool 20 mail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-[16px] text-slate-900 mb-1">
          Pool mail shipper ({usedCount}/{pool.length || 20} đang dùng)
        </h2>
        <p className="text-[13px] text-slate-500 mb-4">
          20 mail này là tài khoản đăng nhập trong hệ thống, không phải hộp thư Gmail thật.
        </p>
        {pool.length === 0 ? (
          <p className="text-[13px] text-slate-500">Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {pool.map((entry) => (
              <div
                key={entry.email}
                className="px-3 py-2.5 rounded-xl bg-[#F3F5F9] space-y-1.5"
              >
                {/* Email luôn hiện đầy đủ trên 1 dòng riêng, không cắt ngắn
                    như trước (thẻ hẹp + tên + nút Thu hồi làm email bị "s..."). */}
                <span
                  className="block text-[13px] font-semibold text-slate-900 break-all"
                  title={entry.email}
                >
                  {entry.email}
                </span>
                <div className="flex items-center justify-between gap-2">
                  {entry.status === "FREE" ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                      Trống
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 border border-slate-300 truncate max-w-[140px]"
                        title={entry.shipperName || undefined}
                      >
                        {entry.shipperName || "Đang dùng"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReclaimTarget(entry)}
                        disabled={isActing}
                        className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/30 text-[11px] font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Thu hồi
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nhắc thiếu tick/mail khi bấm duyệt mà chưa đủ điều kiện */}
      {approveModal === "missing" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-[16px] text-slate-900">
              Chưa duyệt được hồ sơ này
            </h3>
            <p className="text-[13px] text-slate-600">
              Còn thiếu những mục sau, tick đủ và chọn mail rồi duyệt lại:
            </p>
            <ul className="list-disc list-inside text-[13px] text-amber-700 space-y-1">
              {missingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setApproveModal(null)}
              className="w-full py-2.5 rounded-full bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Modal hỏi chắc chắn trước khi cấp quyền shipper */}
      {approveModal === "confirm" && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-[16px] text-slate-900">
              Chắc chắn cấp quyền shipper?
            </h3>
            <p className="text-[13px] text-slate-600">
              Bạn sắp duyệt hồ sơ của <strong>{selected.fullName}</strong> và cấp
              tài khoản đăng nhập là <strong>{selectedEmail}</strong>. Sau khi
              duyệt, shipper sẽ dùng mã tra cứu để xem email và tự đặt mật khẩu.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[13px] hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                className="flex-1 py-2.5 rounded-full bg-[#1E6BFF] text-white font-semibold text-[13px] hover:bg-[#0F56E8] transition-colors"
              >
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hỏi chắc chắn trước khi đặt lại mật khẩu cho shipper */}
      {resetConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-[16px] text-slate-900">
              Chắc chắn đặt lại mật khẩu?
            </h3>
            <p className="text-[13px] text-slate-600">
              Đặt lại mật khẩu cho <strong>{selected.fullName}</strong>
              {selected.issuedEmail ? (
                <>
                  {" "}
                  (<strong>{selected.issuedEmail}</strong>)
                </>
              ) : null}
              : mật khẩu cũ hết hiệu lực ngay. Mật khẩu tạm mới chỉ hiện một
              lần, manager chuyển riêng cho shipper, shipper đăng nhập bằng mật
              khẩu tạm sẽ bị bắt đổi mật khẩu mới ngay.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[13px] hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-full bg-amber-500 text-white font-semibold text-[13px] hover:bg-amber-600 transition-colors"
              >
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hỏi chắc chắn trước khi thu hồi mail */}
      {reclaimTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-[16px] text-slate-900">
              Chắc chắn thu hồi mail này?
            </h3>
            <p className="text-[13px] text-slate-600">
              Thu hồi <strong>{reclaimTarget.email}</strong>
              {reclaimTarget.shipperName ? (
                <>
                  {" "}
                  của <strong>{reclaimTarget.shipperName}</strong>
                </>
              ) : null}
              : người này sẽ không đăng nhập được nữa, mail về lại pool trống cho
              shipper mới. Lịch sử đơn hàng của người cũ vẫn được giữ nguyên.
              Shipper còn đơn đang giao thì hệ thống sẽ chặn thu hồi.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReclaimTarget(null)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[13px] hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReclaimConfirm}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-semibold text-[13px] hover:bg-red-600 transition-colors"
              >
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
