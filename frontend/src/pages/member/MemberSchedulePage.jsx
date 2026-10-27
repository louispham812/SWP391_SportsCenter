import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import CoachLayout from '../../components/layouts/CoachLayout';
import { cancelMemberBooking, getCoachPublicProfile, getMemberBookingSchedule } from '../../services/bookingApi';
import { ScheduleSkeleton } from '../../components/common/Skeleton';
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

const getDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const getWeekDays = (weekStart) =>
  WEEKDAYS.map((weekday, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    return { weekday, date, key: getDateKey(date) };
  });

export default function MemberSchedulePage() {
  const { showToast, currentRole } = useApp();
  const LayoutComponent = currentRole === 'coach' ? CoachLayout : MemberLayout;
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State (Coach-style interface)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Coach standard grid) | 'agenda' (Detailed cards)
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CLASS' | 'COURT' | 'UPCOMING'

  // Modals
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [cancelingBooking, setCancelingBooking] = useState(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const todayKey = getDateKey(new Date());
  const nowMs = Date.now();

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
      const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
      return next;
    });
  };

  const handleTodayWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  // View Coach Profile
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
    const target = cancelingBooking;
    setSubmittingCancel(true);
    try {
      await cancelMemberBooking(target.bookingType, target.bookingId);
      showToast(
        'Hủy đặt chỗ thành công',
        `Đã hủy thành công ${target.title}. Hệ thống đã hoàn tiền 100% vào sổ giao dịch.`,
        'success'
      );
      // Optimistically remove immediately from local schedule state
      setScheduleEntries((prev) =>
        prev.filter(
          (item) => !(item.bookingType === target.bookingType && String(item.bookingId) === String(target.bookingId))
        )
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

  const weekEntries = useMemo(() => {
    return scheduleEntries.filter((entry) => {
      // Exclude cancelled and refunded bookings from the schedule
      if (entry.status === 'CANCELLED' || entry.status === 'REFUNDED' || entry.refundStatus === 'REFUNDED') {
        return false;
      }

      const startMs = new Date(entry.startTime).getTime();
      const inWeek = startMs >= weekStartMs && startMs <= weekEndMs;
      if (!inWeek) return false;

      if (filterType === 'CLASS' && entry.bookingType !== 'CLASS') return false;
      if (filterType === 'COURT' && entry.bookingType !== 'COURT') return false;
      if (filterType === 'UPCOMING' && startMs < nowMs) return false;

      return true;
    });
  }, [scheduleEntries, weekStartMs, weekEndMs, filterType, nowMs]);

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

  // Stats for the week
  const stats = useMemo(() => {
    let classesCount = 0;
    let courtsCount = 0;
    let upcomingCount = 0;

    weekEntries.forEach((e) => {
      if (e.bookingType === 'CLASS') classesCount++;
      if (e.bookingType === 'COURT') courtsCount++;
      if (new Date(e.startTime).getTime() >= nowMs && e.status !== 'CANCELLED') upcomingCount++;
    });

    return {
      total: weekEntries.length,
      classes: classesCount,
      courts: courtsCount,
      upcoming: upcomingCount,
    };
  }, [weekEntries, nowMs]);

  const canCancel = (entry) => {
    const startMs = new Date(entry.startTime).getTime();
    const diffHours = (startMs - nowMs) / (1000 * 60 * 60);
    return diffHours >= 2 && entry.status !== 'CANCELLED' && entry.status !== 'REFUNDED';
  };

  return (
    <LayoutComponent>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* =========================================
            1. PAGE HEADER (COACH STYLE AESTHETICS)
           ========================================= */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              F SPORT MEMBER · LỊCH TẬP &amp; THỜI KHÓA BIỂU
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thời Khóa Biểu Tập Luyện
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi lịch lớp học với huấn luyện viên, lịch đặt sân thể thao và trạng thái điểm danh.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/member/classes"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Đăng Ký Lớp Học</span>
            </Link>
            <Link
              to="/member/book/court/sports"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">sports_tennis</span>
              <span>Đặt Sân Chơi</span>
            </Link>
            <button
              onClick={loadSchedule}
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all cursor-pointer"
              title="Làm mới lịch"
            >
              <span className="material-symbols-outlined text-[20px]">sync</span>
            </button>
          </div>
        </header>

        {/* Policy Alert Banner */}
        <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex items-start gap-3 text-xs text-orange-950">
          <span className="material-symbols-outlined text-orange-600 text-[20px] shrink-0 mt-0.5">policy</span>
          <div className="leading-relaxed">
            <strong className="block font-bold mb-0.5">Chính sách hủy lịch &amp; hoàn phí tự động 100%:</strong>
            Bạn có thể hủy lịch đặt sân hoặc lớp học trực tuyến <strong>trước giờ bắt đầu ít nhất 2 tiếng</strong> để nhận hoàn trả 100% học phí/tiền sân vào sổ giao dịch điện tử. Trong vòng 2 tiếng trước giờ diễn ra, tính năng hủy trực tuyến sẽ đóng để đảm bảo công tác vận hành sân bãi và huấn luyện viên.
          </div>
        </div>

        {/* =========================================
            2. WEEK NAVIGATOR & FILTER CONTROLS (COACH STYLE)
           ========================================= */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Week Date Display Pill */}
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-orange-500 text-[18px]">calendar_today</span>
              <span>
                {currentWeekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' })} –{' '}
                {weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Week Navigator Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                aria-label="Tuần trước"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleTodayWeek}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm cursor-pointer"
              >
                Tuần hiện tại
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                aria-label="Tuần sau"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              {[
                { id: 'ALL', label: `Tất cả (${stats.total})`, icon: 'calendar_month' },
                { id: 'CLASS', label: `Lớp học (${stats.classes})`, icon: 'school' },
                { id: 'COURT', label: `Đặt sân (${stats.courts})`, icon: 'sports_tennis' },
                { id: 'UPCOMING', label: `Sắp tới (${stats.upcoming})`, icon: 'schedule' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng lưới cột tuần chuẩn Coach"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                <span>Lưới Tuần (Chuẩn Coach)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng danh sách chi tiết"
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                <span>Chi Tiết</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================
            3. MAIN CONTENT: COACH-STYLE SCHEDULE
           ========================================= */}
        {loading ? (
          <ScheduleSkeleton rows={3} cols={4} />
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs font-bold text-red-700">
            {error}
          </div>
        ) : weekEntries.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[36px]">event_busy</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Không Có Lịch Tập Trong Tuần Này</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tuần này bạn chưa có lịch học hay ca đặt sân nào. Hãy đăng ký lớp học thể thao mới hoặc giữ chỗ sân tập cùng bạn bè!
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
        ) : viewMode === 'grid' ? (
          /* =========================================
              VIEW 1: COACH-STYLE WEEKLY COLUMNS GRID
             ========================================= */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {weekDays.map(({ weekday, date, key }) => {
              const dayEntries = entriesByDate.get(key) || [];
              const isToday = key === todayKey;

              return (
                <section
                  key={key}
                  className={`flex flex-col rounded-2xl border p-4 shadow-sm transition-all ${
                    isToday
                      ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Column Day Header */}
                  <header className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        {weekday}
                      </p>
                      <p className={`text-base font-black ${isToday ? 'text-orange-600' : 'text-slate-900'}`}>
                        {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        dayEntries.length > 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {dayEntries.length} lịch
                    </span>
                  </header>

                  {/* Day Content */}
                  {dayEntries.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-400 font-medium">
                      Không có lịch tập
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {dayEntries.map((entry, idx) => {
                        const isClass = entry.bookingType === 'CLASS';
                        const isPast = new Date(entry.startTime).getTime() < nowMs;
                        const isNext = isToday && !isPast && idx === 0;
                        const isAttended =
                          entry.attendanceStatus === 'ATTENDED' || entry.attendanceStatus === 'PRESENT';
                        const isAbsent = entry.attendanceStatus === 'ABSENT';

                        return (
                          <article
                            key={`${entry.bookingType}-${entry.bookingId}`}
                            className={`rounded-xl border p-3.5 transition-all ${
                              isNext
                                ? 'border-orange-500 bg-slate-900 text-white shadow-md'
                                : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                            }`}
                          >
                            {/* Time & Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isNext
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isClass
                                    ? isNext ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'
                                    : isNext ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {isClass ? 'school' : 'sports_tennis'}
                                </span>
                                {isClass ? 'Lớp học' : 'Đặt sân'}
                              </span>
                            </div>

                            {/* Title */}
                            <h3
                              className={`mt-2 text-xs font-bold leading-snug line-clamp-2 ${
                                isNext ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {entry.title}
                            </h3>

                            {/* Sport & Facility */}
                            <p
                              className={`mt-1 text-[11px] truncate ${
                                isNext ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {entry.sportName || 'Thể thao'} · {entry.location || 'Khu phức hợp chính'}
                            </p>

                            {/* Coach Row (if Class) */}
                            {entry.coachName && (
                              <div
                                className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-2 ${
                                  isNext ? 'border-slate-800' : 'border-slate-200/60'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      isNext ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                                    }`}
                                  >
                                    {entry.coachName.charAt(0)}
                                  </div>
                                  <span
                                    className={`text-[11px] font-semibold truncate ${
                                      isNext ? 'text-slate-200' : 'text-slate-700'
                                    }`}
                                  >
                                    HLV: {entry.coachName}
                                  </span>
                                </div>
                                {entry.coachId && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewCoach(entry.coachId)}
                                    className={`text-[10px] font-bold underline cursor-pointer shrink-0 ${
                                      isNext ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
                                    }`}
                                  >
                                    Hồ sơ
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Status & Cancel Action */}
                            <div
                              className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-1.5 flex-wrap ${
                                isNext ? 'border-slate-800' : 'border-slate-200/60'
                              }`}
                            >
                              {/* Status Badge */}
                              <div>
                                {isPast ? (
                                  isAttended ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <span className="material-symbols-outlined text-[12px]">check</span>
                                      Có mặt
                                    </span>
                                  ) : isAbsent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                      <span className="material-symbols-outlined text-[12px]">close</span>
                                      Vắng mặt
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                      Đã diễn ra
                                    </span>
                                  )
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isNext
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Sắp diễn ra
                                  </span>
                                )}
                              </div>

                              {/* Cancel Action */}
                              {canCancel(entry) && (
                                <button
                                  type="button"
                                  onClick={() => setCancelingBooking(entry)}
                                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                                >
                                  Hủy (Hoàn 100%)
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          /* =========================================
              VIEW 2: DETAILED AGENDA VIEW
             ========================================= */
          <div className="space-y-4">
            {weekDays.map(({ weekday, date, key }) => {
              const dayEntries = entriesByDate.get(key) || [];
              const isToday = key === todayKey;

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
                        <span className="text-slate-400">Trống</span>
                      )}
                    </div>
                  </div>

                  {/* Day Entries */}
                  {dayEntries.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium italic">
                      Không có hoạt động nào được lên lịch cho ngày này.
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dayEntries.map((entry) => {
                        const isClass = entry.bookingType === 'CLASS';
                        const isPast = new Date(entry.startTime).getTime() < nowMs;
                        const isAttended =
                          entry.attendanceStatus === 'ATTENDED' || entry.attendanceStatus === 'PRESENT';
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
                                <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                                  {entry.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                    <span className="material-symbols-outlined text-[16px] text-orange-500">sports</span>
                                    {entry.sportName}
                                  </span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 text-slate-600">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                                    {entry.location}
                                  </span>
                                </div>
                              </div>

                              {/* Coach row */}
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

                            {/* Bottom row: Attendance & Cancel Action */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
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
                                      Đã hoàn thành
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    Sắp diễn ra
                                  </span>
                                )}
                              </div>

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
              <div className="h-28 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

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
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
