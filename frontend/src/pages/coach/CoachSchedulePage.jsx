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
            <div className="mb-1 inline-flex rounded bg-secondary-container/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              COACH DASHBOARD · FLOW 2
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Lịch giảng dạy trong tuần</h1>
            <p className="text-sm text-slate-500">Lịch được tải từ các lớp phân công cho tài khoản huấn luyện viên của bạn.</p>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Tuần trước" onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">←</button>
            <button onClick={() => setWeekStart(mondayOf(new Date()))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Tuần này</button>
            <button aria-label="Tuần sau" onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">→</button>
          </div>
        </header>

        <p className="text-sm font-semibold text-slate-700">
          {weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' })} – {endOfWeek.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải lịch giảng dạy...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
              const isToday = day.key === todayKey;
              return (
                <section key={day.key} className={`rounded-2xl border bg-white p-4 ${
                  isToday ? 'border-2 border-primary shadow-md' : 'border-slate-200'
                }`}>
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className={`text-xs font-bold uppercase ${isToday ? 'text-secondary' : 'text-slate-800'}`}>
                        {day.date.toLocaleDateString('vi-VN', { weekday: 'long' })}
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-400">{day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                    </div>
                    {isToday && <span className="rounded-full bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase text-primary">Hôm nay</span>}
                  </div>

                  {day.classes.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">Không có ca dạy</p>
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
                          <article key={classItem.sessionId} className={`rounded-xl border p-3 ${
                            isNext ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className={`font-mono text-xs font-bold ${isNext ? 'text-secondary-container' : 'text-slate-700'}`}>
                                {formatTime(classItem.startTime)} – {formatTime(classItem.endTime)}
                              </span>
                              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                isCancelled ? 'bg-red-100 text-red-800' : hasPassed ? 'bg-slate-200 text-slate-600' : isNext ? 'bg-secondary-container text-primary' : 'bg-emerald-100 text-emerald-800'
                              }`}>{isCancelled ? 'Đã hủy' : hasPassed ? 'Đã diễn ra' : isNext ? 'Ca tiếp theo' : 'Sắp diễn ra'}</span>
                            </div>
                            <h3 className={`mt-2 text-sm font-bold ${isNext ? 'text-white' : 'text-slate-900'}`}>{classItem.className}</h3>
                            <p className={`mt-1 text-[11px] ${isNext ? 'text-slate-300' : 'text-slate-500'}`}>{classItem.sportName || 'Lớp học'} · {classItem.facilityName || 'Chưa có địa điểm'}</p>
                            <p className={`mt-2 text-[11px] font-semibold ${isNext ? 'text-secondary-container' : 'text-primary'}`}>
                              Sĩ số: {classItem.bookedSlots ?? 0} / {classItem.maxSlots ?? '—'}
                            </p>
                            {isNext && (
                              <Link to="/coach/attendance" className="mt-3 block rounded-lg bg-secondary-container py-2 text-center text-[11px] font-bold uppercase text-primary hover:bg-secondary-fixed-dim">
                                Mở điểm danh
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
