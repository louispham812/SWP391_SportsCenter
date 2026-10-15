import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberNotifications } from '../../services/memberApi';

export default function MemberNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMemberNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (item) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    if (item.link) {
      navigate(item.link);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') return notifications;
    return notifications.filter((n) => {
      if (activeFilter === 'CLASS_REMINDER') return n.type === 'CLASS_REMINDER' || n.type === 'REMINDER';
      if (activeFilter === 'MEMBERSHIP_EXPIRY') return n.type === 'MEMBERSHIP_EXPIRY' || n.type === 'MEMBERSHIP';
      if (activeFilter === 'COACH_FEEDBACK') return n.type === 'COACH_FEEDBACK' || n.type === 'ATTENDANCE';
      return n.type === activeFilter;
    });
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const getTypeMeta = (type) => {
    switch (type) {
      case 'CLASS_REMINDER':
      case 'REMINDER':
        return {
          icon: 'event_available',
          color: 'bg-blue-50 text-blue-600 border-blue-200',
          badge: 'Nhắc Lịch Học',
          badgeColor: 'bg-blue-100 text-blue-800',
        };
      case 'MEMBERSHIP_EXPIRY':
      case 'MEMBERSHIP':
        return {
          icon: 'warning',
          color: 'bg-amber-50 text-amber-600 border-amber-200',
          badge: 'Hạn Gói Tập',
          badgeColor: 'bg-amber-100 text-amber-800',
        };
      case 'COACH_FEEDBACK':
      case 'ATTENDANCE':
        return {
          icon: 'rate_review',
          color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'Đánh Giá HLV',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        };
      default:
        return {
          icon: 'campaign',
          color: 'bg-orange-50 text-orange-600 border-orange-200',
          badge: 'Thông Báo Hệ Thống',
          badgeColor: 'bg-orange-100 text-orange-800',
        };
    }
  };

  const formatRelativeTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              Trung Tâm Tin Tức
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thông Báo & Nhắc Nhở
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Cập nhật tức thời về lịch học sắp tới, thời hạn thẻ hội viên và phản hồi từ ban huấn luyện.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                type="button"
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                Đọc tất cả ({unreadCount})
              </button>
            )}
            <button
              onClick={fetchNotifications}
              type="button"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-slate-50 shadow-sm transition-all"
              title="Làm mới"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
          {[
            { id: 'ALL', label: 'Tất cả thông báo' },
            { id: 'CLASS_REMINDER', label: 'Lịch học' },
            { id: 'MEMBERSHIP_EXPIRY', label: 'Gói thành viên' },
            { id: 'COACH_FEEDBACK', label: 'Đánh giá HLV' },
            { id: 'SYSTEM', label: 'Hệ thống' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              type="button"
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Đang tải thông báo...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200 text-xs">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[32px]">notifications_off</span>
            </div>
            <h3 className="text-base font-bold text-slate-800">Không có thông báo nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hệ thống sẽ gửi thông báo tự động khi có lịch học mới, sắp hết hạn thẻ hội viên hoặc khi HLV để lại nhận xét.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const meta = getTypeMeta(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    item.isRead
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-orange-50/30 border-orange-200 shadow-sm hover:border-orange-300'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeColor}`}>
                          {meta.badge}
                        </span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{formatRelativeTime(item.createdAt)}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                    {item.link && (
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                        <span>Xem chi tiết</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
