import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getCoachSchedule } from '../../services/bookingApi';

const mondayOf = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const dateKey = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const formatTime = (value) => new Date(value).toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

export default function CoachSchedulePage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [scheduleResponse, setScheduleResponse] = useState(null);
  const startKey = dateKey(weekStart);
  const loading = scheduleResponse?.key !== startKey;
  const classes = scheduleResponse?.key === startKey ? scheduleResponse.rows : [];
  const error = scheduleResponse?.key === startKey ? scheduleResponse.error : '';

  useEffect(() => {
    let active = true;
    getCoachSchedule(startKey)
      .then((rows) => {
        if (active) setScheduleResponse({ key: startKey, rows, error: '' });
      })
      .catch((requestError) => {
        if (active) setScheduleResponse({
          key: startKey,
          rows: [],
          error: requestError.message || 'Không thể tải lịch giảng dạy.',
        });
      });
    return () => {
      active = false;
    };
  }, [startKey]);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    return {
      key: dateKey(date),
      date,
      classes: classes.filter((classItem) => dateKey(new Date(classItem.startTime)) === dateKey(date)),
    };
  });

  const todayKey = dateKey(new Date());
  const endOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT COACH · LỊCH GIẢNG DẠY
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Lịch giảng dạy trong tuần</h1>
            <p className="text-sm text-slate-500">Lịch phân công lớp học trực tiếp từ hệ thống dành cho Huấn luyện viên.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Tuần trước"
              onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              onClick={() => setWeekStart(mondayOf(new Date()))}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm"
            >
              Tuần hiện tại
            </button>
            <button
              aria-label="Tuần sau"
              onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </header>

        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm w-fit">
          <span className="material-symbols-outlined text-orange-500 text-[18px]">calendar_today</span>
          <span>
            {weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' })} – {endOfWeek.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">progress_activity</span>
            <span>Đang tải lịch giảng dạy huấn luyện viên...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
              const isToday = day.key === todayKey;
              return (
                <section
                  key={day.key}
                  className={`rounded-2xl border bg-white p-4 transition-all shadow-sm ${
                    isToday ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md' : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-orange-600' : 'text-slate-800'}`}>
                        {day.date.toLocaleDateString('vi-VN', { weekday: 'long' })}
                      </h2>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                        {day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    {isToday && (
                      <span className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {day.classes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-slate-300 text-2xl">event_available</span>
                      <span>Không có ca dạy</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {day.classes.map((classItem) => {
                        const status = classItem.status?.toUpperCase();
                        const isCancelled = status === 'CANCELLED';
                        const hasPassed = status === 'COMPLETED' || new Date(classItem.endTime) < new Date();
                        const isNext = !isCancelled && !hasPassed && !classes.some((candidate) => (
                          candidate.sessionId !== classItem.sessionId
                          && candidate.status?.toUpperCase() !== 'CANCELLED'
                          && new Date(candidate.startTime) > new Date()
                          && new Date(candidate.startTime) < new Date(classItem.startTime)
                        ));
                        return (
                          <article
                            key={classItem.sessionId}
                            className={`rounded-xl border p-3.5 transition-all ${
                              isNext
                                ? 'border-orange-500 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-md shadow-slate-900/15'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`font-mono text-xs font-bold ${isNext ? 'text-orange-400' : 'text-slate-700'}`}>
                                {formatTime(classItem.startTime)} – {formatTime(classItem.endTime)}
                              </span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                isCancelled
                                  ? 'bg-red-100 text-red-800'
                                  : hasPassed
                                  ? 'bg-slate-200 text-slate-600'
                                  : isNext
                                  ? 'bg-orange-500 text-white shadow-sm'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isCancelled ? 'Đã hủy' : hasPassed ? 'Đã diễn ra' : isNext ? 'Ca tiếp theo' : 'Sắp diễn ra'}
                              </span>
                            </div>
                            <h3 className={`mt-2.5 text-sm font-bold ${isNext ? 'text-white' : 'text-slate-900'}`}>
                              {classItem.className}
                            </h3>
                            <p className={`mt-1 text-[11px] ${isNext ? 'text-slate-300' : 'text-slate-500'}`}>
                              {classItem.sportName || 'Lớp thể thao'} · {classItem.facilityName || 'Cơ sở F Sport'}
                            </p>
                            <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center justify-between">
                              <span className={`text-[11px] font-semibold ${isNext ? 'text-orange-300' : 'text-slate-600'}`}>
                                Sĩ số: <strong className={isNext ? 'text-white' : 'text-slate-900'}>{classItem.bookedSlots ?? 0}</strong> / {classItem.maxSlots ?? '—'}
                              </span>
                            </div>
                            {isNext && (
                              <Link
                                to="/coach/attendance"
                                className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 py-2 text-center text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                                Mở điểm danh ca này
                              </Link>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
