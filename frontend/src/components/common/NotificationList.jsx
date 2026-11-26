import { useCallback, useEffect, useState } from 'react';
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
  REFUND: 'currency_exchange',
};

/** Danh sách thông báo lưu trong DB, có trạng thái đã đọc. Dùng chung cho Member/Coach. */
export default function NotificationList({ title = 'Thông báo hệ thống' }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const data = await getNotifications();
      const nextItems = data.items || [];
      setItems(nextItems);
      setUnread(data.unreadCount ?? nextItems.filter((n) => !n.read).length);
      setError('');
    } catch (err) {
      setError(err.message || 'Không tải được thông báo.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRead = async (item) => {
    if (item.read) return;
    setItems((prev) =>
      prev.map((n) => (n.notificationId === item.notificationId ? { ...n, read: true } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    await markNotificationRead(item.notificationId).catch(() => {
      load({ silent: true });
    });
    window.dispatchEvent(new Event('sporthub:notifications-updated'));
  };

  const handleReadAll = async () => {
    if (unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await markAllNotificationsRead().catch(() => {
      load({ silent: true });
    });
    window.dispatchEvent(new Event('sporthub:notifications-updated'));
  };

  const visibleItems = filterMode === 'UNREAD' ? items.filter((n) => !n.read) : items;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-900 uppercase text-sm tracking-wider">
            {title}
          </h2>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">
              {unread} chưa đọc
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('UNREAD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterMode === 'UNREAD' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa đọc ({unread})
            </button>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px]">refresh</span>
            Làm mới
          </button>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleReadAll}
              className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700 hover:bg-orange-100 cursor-pointer"
            >
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => load()}
            className="px-3 py-1 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <div className="py-10 text-center text-xs text-slate-500 space-y-2">
          <span aria-hidden="true" className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
          <p>{filterMode === 'UNREAD' ? 'Bạn đã đọc hết tất cả thông báo.' : 'Chưa có thông báo nào.'}</p>
          {filterMode === 'UNREAD' && items.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className="text-orange-600 font-bold hover:underline cursor-pointer"
            >
              Xem tất cả thông báo
            </button>
          )}
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <ul className="space-y-2">
          {visibleItems.map((item) => (
            <li key={item.notificationId}>
              <button
                type="button"
                onClick={() => handleRead(item)}
                className={`w-full text-left flex gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  item.read
                    ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                    : 'bg-orange-50/60 border-orange-200 hover:bg-orange-50'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${
                    item.read ? 'text-slate-400' : 'text-orange-600'
                  }`}
                >
                  {TYPE_ICON[item.type] || 'notifications'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.read ? 'text-slate-700 font-medium' : 'font-bold text-slate-900'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>
                {!item.read && <span className="w-2 h-2 mt-2 rounded-full bg-orange-500 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
