import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { CardGridSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import { getReceptionistClasses } from '../../services/receptionistApi';
import { getSessionRoster, updateBookingAttendance } from '../../services/bookingApi';
import { useApp } from '../../context/AppContext';

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
  const { showToast } = useApp();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [scheduleResponse, setScheduleResponse] = useState(null);
  const [sportFilter, setSportFilter] = useState('all');
  const startKey = toDateKey(weekStart);
  const loading = scheduleResponse?.key !== startKey;
  const classes = scheduleResponse?.key === startKey ? scheduleResponse.rows : [];
  const error = scheduleResponse?.key === startKey ? scheduleResponse.error : '';

  // Roster and Attendance Correction (REC-26)
  const [selectedSession, setSelectedSession] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const handleOpenRoster = async (classItem) => {
    setSelectedSession(classItem);
    setLoadingRoster(true);
    try {
      const students = await getSessionRoster(classItem.sessionId);
      setRoster(students || []);
    } catch {
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleUpdateStudentAttendance = async (bookingId, newStatus) => {
    try {
      await updateBookingAttendance(bookingId, newStatus, 'Receptionist corrected');
      setRoster((prev) =>
        prev.map((s) => (s.bookingId === bookingId ? { ...s, attendanceStatus: newStatus } : s))
      );
      showToast('Sửa điểm danh thành công', `Đã cập nhật trạng thái học viên sang ${newStatus} (Ghi Audit Log).`, 'success');
    } catch (err) {
      showToast('Không thể cập nhật', err.message || 'Lỗi khi sửa điểm danh.', 'error');
    }
  };

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
          <CardGridSkeleton count={6} cols="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" />
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
                <article key={classItem.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs card-hover">
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
                  <button
                    type="button"
                    onClick={() => handleOpenRoster(classItem)}
                    className="mt-3.5 flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    <span>Xem danh sách &amp; Sửa điểm danh</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal Danh sách học viên & Sửa điểm danh (REC-26) */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">
                      ĐỐI SOÁT &amp; SỬA ĐIỂM DANH
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedSession.className}</h3>
                  <p className="text-xs text-slate-500">HLV: {selectedSession.coachName || 'Chưa phân công'} · {time(selectedSession.startTime)} – {time(selectedSession.endTime)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingRoster ? (
                  <TableSkeleton rows={3} cols={3} />
                ) : roster.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Chưa có học viên nào đặt chỗ cho lớp này.</div>
                ) : (
                  roster.map((student) => (
                    <div key={student.bookingId} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="block text-slate-900 text-xs">{student.memberName || `Học viên #${student.memberId}`}</strong>
                        <span className="text-[11px] text-slate-500">{student.memberPhone || '—'} · Mã: #{student.bookingId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={student.attendanceStatus || 'PENDING'}
                          onChange={(e) => handleUpdateStudentAttendance(student.bookingId, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="PENDING">Chưa điểm danh</option>
                          <option value="PRESENT">✅ Có mặt (PRESENT)</option>
                          <option value="EXCUSED_ABSENCE">ℹ️ Vắng có phép (EXCUSED)</option>
                          <option value="UNEXCUSED_ABSENCE">❌ Vắng không phép (UNEXCUSED)</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>* Thao tác sửa điểm danh tại quầy sẽ được lưu vào Nhật Ký Audit Log theo quy định.</span>
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReceptionistLayout>
  );
}
