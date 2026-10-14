import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { getReceptionistClasses } from '../../services/receptionistApi';

const toDateKey = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const mondayOf = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const time = (value) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function ReceptionClassesPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [scheduleResponse, setScheduleResponse] = useState(null);
  const [sportFilter, setSportFilter] = useState('all');
  const startKey = toDateKey(weekStart);
  const loading = scheduleResponse?.key !== startKey;
  const classes = scheduleResponse?.key === startKey ? scheduleResponse.rows : [];
  const error = scheduleResponse?.key === startKey ? scheduleResponse.error : '';

  useEffect(() => {
    let active = true;
    getReceptionistClasses(startKey)
      .then((rows) => {
        if (active) setScheduleResponse({ key: startKey, rows, error: '' });
      })
      .catch((requestError) => {
        if (active) setScheduleResponse({
          key: startKey,
          rows: [],
          error: requestError.message || 'Không thể tải thời khóa biểu.',
        });
      });
    return () => {
      active = false;
    };
  }, [startKey]);

  const sports = [...new Set(classes.map((classItem) => classItem.sportName).filter(Boolean))].sort();
  const visibleClasses = sportFilter === 'all'
    ? classes
    : classes.filter((classItem) => classItem.sportName === sportFilter);

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              F SPORT RECEPTION · THỜI KHÓA BIỂU CÁC LỚP
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Thời khóa biểu các lớp</h1>
            <p className="text-sm text-slate-500">Lịch lớp trong tuần, huấn luyện viên và số chỗ đã đặt được cập nhật trực tiếp từ hệ thống.</p>
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="material-symbols-outlined text-orange-500 text-[18px]">calendar_today</span>
            <span>
              {weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long' })} – {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
            Bộ môn
            <select
              value={sportFilter}
              onChange={(event) => setSportFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-1.5 font-semibold text-slate-800 outline-none focus:border-orange-500"
            >
              <option value="all">Tất cả bộ môn</option>
              {sports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
            </select>
          </label>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">progress_activity</span>
            <span>Đang tải thời khóa biểu các lớp...</span>
          </div>
        ) : visibleClasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
            <span>Không có lớp học nào trong tuần này.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleClasses.map((classItem) => {
              const start = new Date(classItem.startTime);
              const isCancelled = classItem.status?.toUpperCase() === 'CANCELLED';
              const isCompleted = classItem.status?.toUpperCase() === 'COMPLETED' || new Date(classItem.endTime) < new Date();
              return (
                <article key={classItem.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">{start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                      <h2 className="mt-1 font-bold text-slate-900">{classItem.className}</h2>
                      <p className="mt-0.5 text-xs text-slate-500">{classItem.sportName || 'Chưa phân loại'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isCancelled ? 'bg-red-100 text-red-700' : isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>{isCancelled ? 'Đã hủy' : isCompleted ? 'Đã diễn ra' : 'Sắp diễn ra'}</span>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-800">Thời gian:</span> {time(classItem.startTime)} – {time(classItem.endTime)}</p>
                    <p><span className="font-semibold text-slate-800">Địa điểm:</span> {classItem.facilityName || 'Chưa cập nhật'}</p>
                    <p><span className="font-semibold text-slate-800">Huấn luyện viên:</span> {classItem.coachName || 'Chưa phân công'}</p>
                    <p><span className="font-semibold text-slate-800">Chỗ đã đặt:</span> {classItem.bookedSlots ?? 0} / {classItem.maxSlots ?? '—'}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ReceptionistLayout>
  );
}
