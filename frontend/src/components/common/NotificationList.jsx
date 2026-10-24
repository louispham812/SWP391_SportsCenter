import React, { useCallback, useEffect, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/engagementApi';

const TYPE_ICON = {
  BROADCAST: 'campaign',
  FEEDBACK: 'star',
  SCHEDULE: 'event',
  BOOKING: 'confirmation_number',
  ATTENDANCE: 'fact_check',
};

/** Danh sách thông báo lưu trong DB, có trạng thái đã đọc. Dùng chung cho Member/Coach. */
export default function NotificationList({ title = 'Thông báo hệ thống' }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setItems(data.items || []);
      setUnread(data.unreadCount || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Không tải được thông báo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRead = async (item) => {
    if (item.read) return;
    await markNotificationRead(item.notificationId).catch(() => {});
    load();
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    load();
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-primary uppercase text-sm tracking-wider">
          {title} {unread > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">{unread}</span>}
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="text-xs font-bold text-slate-500 hover:text-primary cursor-pointer">Làm mới</button>
          {unread > 0 && (
            <button type="button" onClick={handleReadAll} className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>
      </div>
      {loading && <p className="text-sm text-slate-500">Đang tải...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">Chưa có thông báo nào.</p>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.notificationId}
            onClick={() => handleRead(item)}
            className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition ${
              item.read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <span className="material-symbols-outlined text-primary">{TYPE_ICON[item.type] || 'notifications'}</span>
            <div className="flex-1">
              <p className={`text-sm ${item.read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>{item.title}</p>
              <p className="text-sm text-slate-600">{item.message}</p>
              <p className="text-xs text-slate-400 mt-1">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</p>
            </div>
            {!item.read && <span className="w-2 h-2 mt-2 rounded-full bg-blue-500" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
