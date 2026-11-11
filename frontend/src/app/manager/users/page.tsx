'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  UserCheck,
  Shield,
  Briefcase,
  Truck,
  User as UserIcon,
  Crown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  Info,
  Calendar,
  Phone,
  Mail,
  X,
  Loader2,
} from 'lucide-react';
import { request, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'CUSTOMER' | 'SALE' | 'MANAGER' | 'SHIPPER';
  authProvider: 'LOCAL' | 'GOOGLE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLES_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }
> = {
  SALE: {
    label: 'Nhân viên Sale',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    desc: 'Truy cập quầy POS, bán lẻ tại quầy, thu tiền mặt, in hóa đơn K80, tạo báo giá cho thầu thợ.',
  },
  SHIPPER: {
    label: 'Tài xế Shipper',
    icon: Truck,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    desc: 'Truy cập ứng dụng giao vận di động, nhận đơn giao hàng, chụp ảnh POD, quản lý sổ quỹ thu tiền COD.',
  },
  MANAGER: {
    label: 'Quản lý (Manager)',
    icon: Crown,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    desc: 'Toàn quyền quản trị kho vật tư, duyệt và điều phối đơn hàng, xem báo cáo doanh thu, phân quyền tài khoản.',
  },
  CUSTOMER: {
    label: 'Khách hàng',
    icon: UserIcon,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    desc: 'Tài khoản người mua hàng trên website, tra cứu tình trạng đơn hàng, thanh toán VietQR / COD.',
  },
};

export default function ManagerUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal đổi role
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [newRole, setNewRole] = useState<string>('SALE');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Modal toggle status
  const [statusUser, setStatusUser] = useState<SystemUser | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await request<SystemUser[]>('/manager/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      setSubmittingRole(true);
      const updated = await request<SystemUser>(`/manager/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: updated.role } : u))
      );

      toast.success(
        `Đã đổi quyền tài khoản "${selectedUser.email}" thành ${ROLES_CONFIG[newRole]?.label || newRole} thành công!`
      );
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi cập nhật vai trò người dùng');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusUser) return;
    try {
      setSubmittingStatus(true);
      const newActive = !statusUser.isActive;
      await request(`/manager/users/${statusUser.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newActive }),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === statusUser.id ? { ...u, isActive: newActive } : u))
      );

      toast.success(
        newActive
          ? `Đã mở khóa tài khoản ${statusUser.email}`
          : `Đã tạm khóa tài khoản ${statusUser.email}`
      );
      setStatusUser(null);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi cập nhật trạng thái tài khoản');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    const res = { ALL: users.length, SALE: 0, SHIPPER: 0, MANAGER: 0, CUSTOMER: 0 };
    users.forEach((u) => {
      if (res[u.role] !== undefined) res[u.role]++;
    });
    return res;
  }, [users]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Instructions Callout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-blue-600" />
            <span>Quản Lý Phân Quyền & Tài Khoản</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cấp quyền nhân viên Sale, tài xế Shipper và kiểm soát truy cập hệ thống.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* 2. Professional Explainer Banner (Chuẩn nghiệp vụ tuyển dụng) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-4.5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
              <span>Quy trình cấp quyền cho Nhân viên Sale mới tuyển</span>
            </h3>
            <p className="leading-relaxed">
              <strong>Bước 1:</strong> Khi tuyển thêm nhân sự bán hàng, hướng dẫn nhân viên mới vào trang{' '}
              <span className="font-semibold text-blue-700 dark:text-blue-400 underline">Đăng ký tài khoản</span> bằng email cá nhân.
            </p>
            <p className="leading-relaxed">
              <strong>Bước 2:</strong> Quản lý (Manager/Admin) truy cập trang này, tìm email của nhân viên và bấm nút{' '}
              <span className="font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
                Đổi quyền
              </span>{' '}
              để chuyển vai trò từ <em>Khách hàng</em> sang <strong>Nhân viên Sale</strong>.
            </p>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              ⚡ Nhân viên chỉ cần đăng nhập lại là có ngay quyền truy cập toàn diện vào Quầy Bán Hàng (POS), tạo đơn, thu tiền mặt và in hóa đơn K80.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Role Counters Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'ALL', label: 'Tất cả tài khoản', count: counts.ALL },
          { key: 'SALE', label: 'Nhân viên Sale', count: counts.SALE, icon: Briefcase },
          { key: 'SHIPPER', label: 'Shipper Giao hàng', count: counts.SHIPPER, icon: Truck },
          { key: 'MANAGER', label: 'Quản lý', count: counts.MANAGER, icon: Crown },
          { key: 'CUSTOMER', label: 'Khách hàng', count: counts.CUSTOMER, icon: UserIcon },
        ].map((tab) => {
          const active = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo email, họ tên, hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* 5. Users Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Người dùng</th>
                <th className="px-5 py-3.5">Liên hệ</th>
                <th className="px-5 py-3.5">Vai trò hiện tại</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ngày đăng ký</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Đang tải danh sách người dùng...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>Không tìm thấy người dùng nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLES_CONFIG[u.role] || ROLES_CONFIG.CUSTOMER;
                  const RoleIcon = roleConfig.icon;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200 dark:border-blue-800">
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {u.fullName || 'Chưa đặt tên'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4">
                        {u.phone ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có SĐT</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleConfig.color}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Đã khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-all active:scale-95"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Đổi quyền</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusUser(u)}
                            title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              u.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-200'
                                : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
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

      {/* 6. Modal Đổi Vai Trò (Phân Quyền) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Phân Quyền Người Dùng
                  </h3>
                  <p className="text-xs text-slate-500 font-mono truncate max-w-[280px]">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Options */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Chọn vai trò mới cho tài khoản:
              </label>

              {(['SALE', 'SHIPPER', 'MANAGER', 'CUSTOMER'] as const).map((rKey) => {
                const config = ROLES_CONFIG[rKey];
                const Icon = config.icon;
                const isSelected = newRole === rKey;

                return (
                  <label
                    key={rKey}
                    onClick={() => setNewRole(rKey)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={isSelected}
                      onChange={() => setNewRole(rKey)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {config.label}
                        </span>
                        {rKey === 'SALE' && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                            ★ Khuyên dùng cho NV bán hàng
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {config.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={submittingRole}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={submittingRole}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                {submittingRole ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận đổi quyền</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Khóa / Mở Khóa Tài Khoản */}
      {statusUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusUser.isActive
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {statusUser.isActive ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {statusUser.isActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
                </h3>
                <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                  {statusUser.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {statusUser.isActive
                ? 'Khi bị khóa, tài khoản này sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa lại.'
                : 'Tài khoản này sẽ có thể đăng nhập và thao tác bình thường trở lại.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusUser(null)}
                disabled={submittingStatus}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={submittingStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md ${
                  statusUser.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submittingStatus ? 'Đang xử lý...' : statusUser.isActive ? 'Khóa ngay' : 'Mở khóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
