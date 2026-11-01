'use client';

import React, { useState, useEffect } from 'react';
import { useSaleStore } from '@/store/useSaleStore';
import { ActivityType } from '@/types/sale';
import { useToast } from '@/hooks/useToast';

interface ActivityFormProps {
  initialCustomerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivityForm({ initialCustomerId, onSuccess, onCancel }: ActivityFormProps) {
  const { customers, fetchCustomers, createActivity } = useSaleStore();
  const toast = useToast();

  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [activityType, setActivityType] = useState<ActivityType>('CALL');
  const [content, setContent] = useState('');
  const [contactedAt, setContactedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [nextFollowupAt, setNextFollowupAt] = useState('');
  const [isDone, setIsDone] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customers.length === 0) {
      fetchCustomers();
    }
  }, [customers.length, fetchCustomers]);

  useEffect(() => {
    if (initialCustomerId) {
      setCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn khách hàng liên hệ');
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
      toast.success('Ghi nhận nhật ký chăm sóc thành công!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu nhật ký chăm sóc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Chọn khách hàng <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Chọn khách hàng phụ trách --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} ({c.profile?.companyName || c.phone || c.email})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Loại hình tương tác
          </label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CALL">Gọi điện thoại (Call)</option>
            <option value="ZALO">Nhắn tin Zalo</option>
            <option value="VISIT">Gặp mặt / Khảo sát công trình</option>
            <option value="NOTE">Ghi chú riêng</option>
            <option value="FOLLOWUP">Hẹn chăm sóc lại</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Thời điểm diễn ra
          </label>
          <input
            type="datetime-local"
            value={contactedAt}
            onChange={(e) => setContactedAt(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nội dung trao đổi / Kết quả chăm sóc <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          placeholder="Khách cần báo giá 500m ống uPVC phi 90, chuẩn bị khởi công công trình vào tuần tới..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Lên lịch nhắc việc tiếp theo (Follow-up Date)
        </label>
        <input
          type="datetime-local"
          value={nextFollowupAt}
          onChange={(e) => setNextFollowupAt(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isDoneCheckForm"
          checked={isDone}
          onChange={(e) => setIsDone(e.target.checked)}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isDoneCheckForm" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
          Đánh dấu là hoạt động đã thực hiện xong (Done)
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu hoạt động'}
        </button>
      </div>
    </form>
  );
}
export default ActivityForm;
