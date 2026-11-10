'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Plus,
  Search,
  X,
  Check,
} from 'lucide-react';
import { useSaleStore } from '@/store/useSaleStore';
import { CustomerActivity, ActivityType } from '@/types/sale';
import { formatDateTime } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import ActivityForm from '@/components/sale/ActivityForm';

export default function SaleActivitiesPage() {
  const {
    activities,
    customers,
    fetchActivities,
    fetchCustomers,
    updateActivity,
    createActivity,
    isLoading,
  } = useSaleStore();
  const toast = useToast();

  const [filterMode, setFilterMode] = useState<'ALL' | 'DUE_TODAY' | 'OVERDUE' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for activity creation
  const [customerId, setCustomerId] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('CALL');
  const [content, setContent] = useState('');
  const [contactedAt, setContactedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [nextFollowupAt, setNextFollowupAt] = useState('');
  const [isDone, setIsDone] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Activity Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchActivities({
      dueToday: filterMode === 'DUE_TODAY',
      overdue: filterMode === 'OVERDUE',
      isDone: filterMode === 'PENDING' ? false : undefined,
    });
  }, [fetchActivities, filterMode]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchCustomer = (act.customerName || '').toLowerCase().includes(term);
      const matchContent = (act.content || '').toLowerCase().includes(term);
      return matchCustomer || matchContent;
    });
  }, [activities, searchTerm]);

  const handleToggleDone = async (act: CustomerActivity) => {
    try {
      await updateActivity(act.id, {
        type: act.type,
        content: act.content,
        contactedAt: act.contactedAt,
        nextFollowupAt: act.nextFollowupAt,
        isDone: !act.isDone,
      });
      toast.success(
        act.isDone ? 'Đã chuyển thành Chưa hoàn thành' : 'Đã đánh dấu hoàn thành hoạt động'
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung chăm sóc');
      return;
    }

    try {
      setIsSubmitting(true);
      await createActivity({
        customerId,
        type: activityType,
        content: content.trim(),
        contactedAt: new Date(contactedAt).toISOString(),
        nextFollowupAt: nextFollowupAt ? new Date(nextFollowupAt).toISOString() : undefined,
        isDone,
      });
      toast.success('Đã lưu nhật ký chăm sóc khách hàng thành công!');
      setIsModalOpen(false);
      setContent('');
      setNextFollowupAt('');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm nhật ký chăm sóc');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubmit = handleCreateActivity;

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-4 h-4 text-emerald-600" />;
      case 'ZALO':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'VISIT':
        return <MapPin className="w-4 h-4 text-amber-600" />;
      case 'FOLLOWUP':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActivityBadgeColor = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ZALO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VISIT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FOLLOWUP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Nhật ký Chăm sóc Khách hàng (CRM Activities)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ghi nhận các cuộc gọi, tin nhắn Zalo, khảo sát công trình và đặt lịch hẹn đôn đốc theo dõi.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhật ký mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Tất cả hoạt động
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('DUE_TODAY')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                filterMode === 'DUE_TODAY'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Lịch hẹn hôm nay
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('OVERDUE')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                filterMode === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Quá hạn nhắc việc
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('PENDING')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                filterMode === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Chưa hoàn thành
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo khách hàng, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Đang tải nhật ký chăm sóc...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Chưa có nhật ký nào trong mục này.</div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredActivities.map((act) => {
              const isOverdueFollowup =
                !act.isDone && act.nextFollowupAt && new Date(act.nextFollowupAt) < new Date();

              return (
                <div key={act.id} className="relative flex items-start gap-4 group">
                  {/* Timeline bullet / toggle check */}
                  <button
                    onClick={() => handleToggleDone(act)}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-transform hover:scale-105 ${
                      act.isDone
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : isOverdueFollowup
                        ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/60'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}
                    title={act.isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                  >
                    {act.isDone ? <Check className="w-5 h-5" /> : getActivityIcon(act.type)}
                  </button>

                  {/* Content card */}
                  <div className="flex-1 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${getActivityBadgeColor(
                            act.type
                          )}`}
                        >
                          {act.type}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {act.customerName || 'Khách hàng'}
                        </span>
                        {act.customerPhone && (
                          <span className="text-xs text-slate-500">({act.customerPhone})</span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400">
                        {formatDateTime(act.contactedAt)}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {act.content}
                    </p>

                    {act.nextFollowupAt && (
                      <div
                        className={`text-xs flex items-center gap-1.5 pt-1 font-medium ${
                          isOverdueFollowup
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Nhắc hẹn tiếp theo: {formatDateTime(act.nextFollowupAt)}{' '}
                          {isOverdueFollowup ? '(Đã quá hạn)' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Ghi nhật ký chăm sóc khách hàng
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ActivityForm
              onCancel={() => setIsModalOpen(false)}
              onSuccess={() => {
                setIsModalOpen(false);
                fetchActivities({
                  dueToday: filterMode === 'DUE_TODAY',
                  overdue: filterMode === 'OVERDUE',
                  isDone: filterMode === 'PENDING' ? false : undefined,
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
