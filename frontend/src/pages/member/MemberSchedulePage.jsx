import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import CoachLayout from '../../components/layouts/CoachLayout';
import { cancelMemberBooking, getCoachPublicProfile, getMemberBookingSchedule } from '../../services/bookingApi';
import { useApp } from '../../context/AppContext';

const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatShortDate = (date) =>
  date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const getWeekDays = (weekStart) =>
  WEEKDAYS.map((weekday, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return { weekday, date, key: getDateKey(date) };
  });

const getWeekLabel = (weekStart, weekEnd) => {
  const startLabel = weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const endLabel = weekEnd.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
};

export default function MemberSchedulePage() {
  const { showToast, currentRole } = useApp();
  const LayoutComponent = currentRole === 'coach' ? CoachLayout : MemberLayout;
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'grid'
  const [bookingTypeFilter, setBookingTypeFilter] = useState('ALL'); // 'ALL' | 'CLASS' | 'COURT'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED'

  // Modals
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [cancelingBooking, setCancelingBooking] = useState(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMemberBookingSchedule();
      setScheduleEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(err.message || 'Không thể tải thời khóa biểu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleTodayWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  // Click on Coach
  const handleViewCoach = async (coachId) => {
    if (!coachId) return;
    setCoachLoading(true);
    try {
      const coachProfile = await getCoachPublicProfile(coachId);
      setSelectedCoach(coachProfile);
    } catch (err) {
      showToast('Huấn luyện viên', err.message || 'Không thể tải hồ sơ huấn luyện viên.', 'warning');
    } finally {
      setCoachLoading(false);
    }
  };

  // Confirm cancel booking with 100% refund
  const handleConfirmCancel = async () => {
    if (!cancelingBooking) return;
    setSubmittingCancel(true);
    try {
      await cancelMemberBooking(cancelingBooking.bookingType, cancelingBooking.bookingId);
      showToast(
        'Hủy đặt chỗ thành công',
        `Đã hủy thành công ${cancelingBooking.title}. Hệ thống đã hoàn tiền 100% vào sổ giao dịch.`,
        'success'
      );
      setCancelingBooking(null);
      await loadSchedule();
    } catch (err) {
      showToast('Hủy lịch thất bại', err.message || 'Không thể hủy lịch này.', 'error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Filter entries for the selected week
  const weekStartMs = currentWeekStart.getTime();
  const weekEndMs = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59).getTime();
  const nowMs = Date.now();

  const weekEntries = useMemo(() => {
    return scheduleEntries.filter((entry) => {
      const startMs = new Date(entry.startTime).getTime();
      const inWeek = startMs >= weekStartMs && startMs <= weekEndMs;
      if (!inWeek) return false;

      if (bookingTypeFilter !== 'ALL' && entry.bookingType !== bookingTypeFilter) {
        return false;
      }

      if (statusFilter === 'UPCOMING' && startMs < nowMs) return false;
      if (statusFilter === 'COMPLETED' && startMs >= nowMs) return false;

      return true;
    });
  }, [scheduleEntries, weekStartMs, weekEndMs, bookingTypeFilter, statusFilter, nowMs]);

  // Group entries by date key (YYYY-MM-DD)
  const entriesByDate = useMemo(() => {
    const map = new Map(weekDays.map((d) => [d.key, []]));
    weekEntries.forEach((entry) => {
      const key = getDateKey(new Date(entry.startTime));
      if (map.has(key)) {
        map.get(key).push(entry);
      }
    });
    // Sort each day's entries by startTime
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    return map;
  }, [weekDays, weekEntries]);

  const canCancel = (entry) => {
    const startMs = new Date(entry.startTime).getTime();
    const diffHours = (startMs - nowMs) / (1000 * 60 * 60);
    return diffHours >= 2 && entry.status !== 'CANCELLED' && entry.status !== 'REFUNDED';
  };

  return (
    <LayoutComponent>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* =========================================
            1. PAGE HEADER & CONTROL BAR
           ========================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold mb-2 border border-orange-200/80">
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Lịch trình cá nhân
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Thời khóa biểu tập luyện
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi lịch học với huấn luyện viên, khung giờ sân đã đặt và tình trạng buổi tập.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/member/classes"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Đăng Ký Lớp Học</span>
            </Link>
            <Link
              to="/member/book/court/sports"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">sports_tennis</span>
              <span>Đặt Sân Thể Thao</span>
            </Link>
            <button
              onClick={loadSchedule}
              type="button"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Làm mới lịch"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </div>

        {/* Policy Alert Banner */}
        <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-start gap-3 text-xs text-orange-950">
          <span className="material-symbols-outlined text-orange-600 text-[20px] shrink-0 mt-0.5">info</span>
          <div className="leading-relaxed">
            <strong>Chính sách hủy lịch &amp; hoàn phí:</strong> Bạn có thể hủy lịch đặt sân hoặc lớp học trực tuyến <strong>trước giờ bắt đầu ít nhất 2 tiếng</strong> để nhận hoàn trả 100% chi phí vào tài khoản. Trong vòng 2 tiếng trước giờ diễn ra, tính năng hủy trực tuyến sẽ đóng để đảm bảo công tác chuẩn bị sân bãi và huấn luyện viên.
          </div>
        </div>

        {/* =========================================
            2. WEEK NAVIGATOR & VIEW SWITCHER
           ========================================= */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Week Date Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrevWeek}
              type="button"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            <button
              onClick={handleTodayWeek}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Tuần Hiện Tại
            </button>

            <button
              onClick={handleNextWeek}
              type="button"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Tuần kế tiếp"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>

            <div className="ml-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-[20px]">date_range</span>
              <span className="font-headline-sm font-black text-sm sm:text-base text-slate-900 tracking-tight">
                {getWeekLabel(currentWeekStart, weekEnd)}
              </span>
            </div>
          </div>

          {/* Filters & Mode Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBookingTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bookingTypeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setBookingTypeFilter('CLASS')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bookingTypeFilter === 'CLASS' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lớp học
              </button>
              <button
                type="button"
                onClick={() => setBookingTypeFilter('COURT')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bookingTypeFilter === 'COURT' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Đặt sân
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng thẻ ngày (Trực quan, dễ nhìn)"
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                <span>Thẻ Ngày</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng ma trận lịch tuần"
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span>Lưới Tuần</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================
            3. MAIN SCHEDULE CONTENT
           ========================================= */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500">Đang đồng bộ thời khóa biểu từ máy chủ...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center text-xs font-bold text-red-700">
            {error}
          </div>
        ) : weekEntries.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[36px]">event_busy</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Không Có Lịch Tập Trong Tuần Này</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tuần từ {getWeekLabel(currentWeekStart, weekEnd)} chưa có lịch tập nào. Bạn có thể đăng ký lớp học mới hoặc đặt sân thể thao để rèn luyện!
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to="/member/classes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                <span>Đăng Ký Lớp Ngay</span>
              </Link>
              <Link
                to="/member/book/court/sports"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">sports_tennis</span>
                <span>Đặt Sân Thể Thao</span>
              </Link>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          /* =========================================
              VIEW 1: DAY CARDS / AGENDA VIEW (RECOMMENDED)
             ========================================= */
          <div className="space-y-4">
            {weekDays.map(({ weekday, date, key }) => {
              const dayEntries = entriesByDate.get(key) || [];
              const isToday = key === getDateKey(new Date());

              return (
                <div
                  key={key}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isToday
                      ? 'bg-orange-50/20 border-orange-300 ring-2 ring-orange-400/20 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`px-5 py-3.5 border-b flex items-center justify-between ${
                      isToday
                        ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/5 border-orange-200'
                        : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-black ${
                          isToday
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] leading-tight uppercase font-bold">
                          {weekday.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}
                        </span>
                        <span className="text-sm leading-tight">{date.getDate()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{weekday}</span>
                          <span className="text-xs text-slate-500 font-medium">
                            Ngày {date.toLocaleDateString('vi-VN')}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                              Hôm nay
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      {dayEntries.length > 0 ? (
                        <span className="text-orange-600 font-extrabold">{dayEntries.length} lịch tập</span>
                      ) : (
                        <span className="text-slate-400">Không có lịch</span>
                      )}
                    </div>
                  </div>

                  {/* Day Entries List */}
                  {dayEntries.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium italic">
                      Không có hoạt động nào được lên lịch cho ngày này.
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dayEntries.map((entry) => {
                        const isClass = entry.bookingType === 'CLASS';
                        const isPast = new Date(entry.startTime).getTime() < nowMs;
                        const isAttended = entry.attendanceStatus === 'ATTENDED' || entry.attendanceStatus === 'PRESENT';
                        const isAbsent = entry.attendanceStatus === 'ABSENT';

                        return (
                          <div
                            key={`${entry.bookingType}-${entry.bookingId}`}
                            className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative group"
                          >
                            <div className="space-y-3">
                              {/* Top row: Type badge + Time */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                    isClass
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    {isClass ? 'school' : 'sports_tennis'}
                                  </span>
                                  {isClass ? 'Lớp Huấn Luyện' : 'Thuê Sân Chơi'}
                                </span>

                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                                  <span className="material-symbols-outlined text-orange-500 text-[16px]">schedule</span>
                                  <span>
                                    {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                                  </span>
                                </div>
                              </div>

                              {/* Title & Sport */}
                              <div>
                                <h3 className="font-headline-sm text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                                  {entry.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                    <span className="material-symbols-outlined text-[16px] text-orange-500">
                                      sports
                                    </span>
                                    {entry.sportName}
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 text-slate-600">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                                      location_on
                                    </span>
                                    {entry.location}
                                  </span>
                                </div>
                              </div>

                              {/* Coach row (if class) */}
                              {entry.coachName && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center shrink-0">
                                      {entry.coachName.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        Huấn luyện viên
                                      </div>
                                      <div className="text-xs font-bold text-slate-900">{entry.coachName}</div>
                                    </div>
                                  </div>

                                  {entry.coachId && (
                                    <button
                                      type="button"
                                      onClick={() => handleViewCoach(entry.coachId)}
                                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <span>Xem hồ sơ</span>
                                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Coach feedback if completed session */}
                              {entry.coachNote && (
                                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                                  <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">
                                    rate_review
                                  </span>
                                  <div>
                                    <span className="font-bold">Đánh giá HLV: </span>
                                    <span className="italic">"{entry.coachNote}"</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Bottom row: Attendance / Upcoming Status & Cancel Action */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                              {/* Status Tag */}
                              <div>
                                {isPast ? (
                                  isAttended ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                      Đã tham gia (Có mặt)
                                    </span>
                                  ) : isAbsent ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                      <span className="material-symbols-outlined text-[14px]">cancel</span>
                                      Vắng mặt
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                      <span className="material-symbols-outlined text-[14px]">history</span>
                                      Đã hoàn thành
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    Sắp diễn ra
                                  </span>
                                )}
                              </div>

                              {/* Cancel Button if eligible */}
                              {canCancel(entry) ? (
                                <button
                                  type="button"
                                  onClick={() => setCancelingBooking(entry)}
                                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-red-200"
                                >
                                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                                  <span>Hủy lịch (Hoàn 100%)</span>
                                </button>
                              ) : (
                                !isPast && (
                                  <span className="text-[11px] text-slate-400 italic">
                                    Không thể hủy (&lt; 2h trước giờ học)
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* =========================================
              VIEW 2: WEEKLY MATRIX / TABLE OVERVIEW
             ========================================= */
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[840px]">
                {/* Table Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
                  {weekDays.map(({ weekday, date, key }) => {
                    const isToday = key === getDateKey(new Date());
                    return (
                      <div
                        key={key}
                        className={`p-3 border-r border-slate-200 last:border-r-0 ${
                          isToday ? 'bg-orange-50 font-bold' : ''
                        }`}
                      >
                        <div className="text-xs text-slate-500 font-bold uppercase">{weekday}</div>
                        <div className={`text-base font-black mt-0.5 ${isToday ? 'text-orange-600' : 'text-slate-900'}`}>
                          {formatShortDate(date)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Table Body Columns */}
                <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[360px]">
                  {weekDays.map(({ key }) => {
                    const dayEntries = entriesByDate.get(key) || [];
                    return (
                      <div key={key} className="p-2 space-y-2 bg-slate-50/20">
                        {dayEntries.length === 0 ? (
                          <div className="text-[11px] text-slate-300 text-center py-8 italic">Trống</div>
                        ) : (
                          dayEntries.map((entry) => (
                            <div
                              key={`${entry.bookingType}-${entry.bookingId}`}
                              className={`p-2.5 rounded-xl border text-xs shadow-xs space-y-1.5 transition-all ${
                                entry.bookingType === 'CLASS'
                                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              }`}
                            >
                              <div className="font-bold font-mono text-[11px] text-slate-700 flex items-center justify-between">
                                <span>{formatTime(entry.startTime)}</span>
                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-white/80">
                                  {entry.bookingType}
                                </span>
                              </div>
                              <div className="font-extrabold text-[12px] line-clamp-2 leading-tight">
                                {entry.title}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{entry.location}</div>
                              {entry.coachName && (
                                <button
                                  type="button"
                                  onClick={() => handleViewCoach(entry.coachId)}
                                  className="text-[10px] text-orange-600 font-bold hover:underline block truncate text-left"
                                >
                                  HLV: {entry.coachName}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            4. COACH PUBLIC PROFILE MODAL
           ========================================= */}
        {selectedCoach && createPortal(
          <div
            onClick={() => setSelectedCoach(null)}
            className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative"
            >
              {/* Header Cover */}
              <div className="h-28 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Coach Avatar & Info */}
              <div className="px-6 pb-6 pt-0 -mt-12 space-y-4">
                <div className="flex items-end justify-between">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border-4 border-white text-orange-400 font-black text-2xl flex items-center justify-center shadow-lg">
                    {selectedCoach.avatar || selectedCoach.fullName?.charAt(0) || 'HLV'}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                    HLV Đang Giảng Dạy
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedCoach.fullName}</h3>
                  <p className="text-xs text-orange-600 font-bold mt-0.5">
                    Huấn Luyện Viên Thể Thao F Sport Center
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">Tiểu sử & Chuyên môn:</span>
                  {selectedCoach.bio || 'Huấn luyện viên chuyên môn cao với nhiều năm kinh nghiệm đào tạo học viên đạt chuẩn thể lực và kỹ thuật chuyên nghiệp.'}
                </div>

                {/* Sports Taught */}
                {selectedCoach.sportsTaught && selectedCoach.sportsTaught.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Bộ môn phụ trách
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCoach.sportsTaught.map((sport, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact metadata */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Email liên hệ</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedCoach.email}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Lớp đang mở</span>
                    <span className="font-bold text-slate-800 block">
                      {selectedCoach.activeClassesCount || 0} lớp học
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Đóng thông tin
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* =========================================
            5. CANCEL BOOKING CONFIRMATION MODAL
           ========================================= */}
        {cancelingBooking && createPortal(
          <div
            onClick={() => setCancelingBooking(null)}
            className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">Xác Nhận Hủy Lịch Tập?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn có chắc muốn hủy <strong>"{cancelingBooking.title}"</strong> vào lúc{' '}
                  <strong>{formatTime(cancelingBooking.startTime)}</strong> ngày{' '}
                  <strong>{new Date(cancelingBooking.startTime).toLocaleDateString('vi-VN')}</strong>?
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Chính sách hoàn tiền 100%
                </div>
                <p className="text-emerald-700 leading-relaxed text-[11px]">
                  Do bạn thực hiện hủy trước giờ học trên 2 tiếng, toàn bộ học phí/tiền sân ({formatMoney(cancelingBooking.amountPaid)}) sẽ được hoàn 100% vào sổ giao dịch điện tử của bạn. Lịch này sẽ được xóa khỏi thời khóa biểu.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelingBooking(null)}
                  disabled={submittingCancel}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Giữ Lịch Lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={submittingCancel}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingCancel ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Xác Nhận Hủy (Hoàn 100%)</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </LayoutComponent>
  );
}
