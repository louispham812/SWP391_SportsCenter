import React, { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { getSessionRoster, getUpcomingClasses, updateBookingAttendance } from '../../services/bookingApi';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default function CoachAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [roster, setRoster] = useState([]);
  const [rosterSessionId, setRosterSessionId] = useState('');
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [savingBookingId, setSavingBookingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    getUpcomingClasses()
      .then((classRows) => {
        if (!isCurrent) return;
        setClasses(classRows);
        setSelectedSessionId(classRows[0]?.sessionId?.toString() || '');
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || 'Không thể tải các lớp được phân công.');
      })
      .finally(() => {
        if (isCurrent) setIsLoadingClasses(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return undefined;
    let isCurrent = true;
    getSessionRoster(selectedSessionId)
      .then((bookingRows) => {
        if (isCurrent) {
          setRoster(bookingRows);
          setRosterSessionId(selectedSessionId);
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || 'Không thể tải danh sách hội viên.');
      })
    return () => {
      isCurrent = false;
    };
  }, [selectedSessionId]);

  const updateLocalRoster = (bookingId, changes) => {
    setRoster((current) => current.map((booking) => (
      booking.bookingId === bookingId ? { ...booking, ...changes } : booking
    )));
  };

  const handleSaveAttendance = async (booking) => {
    if (!['PRESENT', 'ABSENT'].includes(booking.attendanceStatus)) {
      setError('Hãy chọn trạng thái có mặt hoặc vắng trước khi lưu.');
      return;
    }
    setSavingBookingId(booking.bookingId);
    setError('');
    setSuccessMessage('');
    try {
      const saved = await updateBookingAttendance(
        booking.bookingId,
        booking.attendanceStatus,
        booking.coachNote,
      );
      updateLocalRoster(booking.bookingId, {
        attendanceStatus: saved.attendanceStatus,
        coachNote: saved.coachNote,
      });
      setSuccessMessage('Đã lưu điểm danh vào hệ thống.');
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu điểm danh.');
    } finally {
      setSavingBookingId(null);
    }
  };

  const selectedClass = classes.find((item) => item.sessionId.toString() === selectedSessionId);
  const presentCount = roster.filter((booking) => booking.attendanceStatus === 'PRESENT').length;

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            F SPORT COACH · ĐIỂM DANH &amp; NHẬN XÉT
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
            Điểm Danh &amp; Đánh Giá Học Viên
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Ghi nhận chuyên cần thực tế và gửi phản hồi, lời dặn bài tập cho từng học viên.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {successMessage && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="attendance-session" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Chọn lớp giảng dạy được phân công
          </label>
          {isLoadingClasses ? (
            <p className="text-sm text-slate-500">Đang tải danh sách ca dạy...</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-slate-500">Hiện chưa có lớp sắp diễn ra được phân công cho bạn.</p>
          ) : (
            <select
              id="attendance-session"
              value={selectedSessionId}
              onChange={(event) => {
                setRosterSessionId('');
                setRoster([]);
                setSelectedSessionId(event.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 sm:max-w-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-medium"
            >
              {classes.map((classSession) => (
                <option key={classSession.sessionId} value={classSession.sessionId}>
                  {classSession.className} — {formatDateTime(classSession.startTime)}
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedClass && (
          <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Buổi học</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{selectedClass.className}</div>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thời gian</div>
              <div className="mt-1 text-sm font-bold text-slate-800">{formatDateTime(selectedClass.startTime)}</div>
            </div>
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Sĩ số có mặt</div>
              <div className="mt-1 text-sm font-black text-emerald-700">
                {presentCount} / {rosterSessionId === selectedSessionId ? roster.length : 0} học viên
              </div>
            </div>
          </section>
        )}

        {selectedSessionId && (
          <section className="space-y-3">
            {rosterSessionId !== selectedSessionId ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">progress_activity</span>
                <span>Đang tải danh sách hội viên đặt lớp...</span>
              </div>
            ) : roster.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                <span>Chưa có hội viên nào đặt chỗ cho buổi học này.</span>
              </div>
            ) : (
              roster.map((booking) => (
                <article key={booking.bookingId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 hover:border-slate-300 transition-all">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_minmax(240px,1fr)_auto] lg:items-end">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        {booking.memberName || `Hội viên #${booking.memberId}`}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.memberPhone || 'Không có số điện thoại trong hồ sơ'}
                      </p>
                    </div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Trạng thái
                      <select
                        value={!booking.attendanceStatus || booking.attendanceStatus === 'PENDING' ? '' : booking.attendanceStatus}
                        onChange={(event) => updateLocalRoster(booking.bookingId, {
                          attendanceStatus: event.target.value,
                        })}
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold focus:border-orange-500 outline-none"
                      >
                        <option value="">Chưa điểm danh</option>
                        <option value="PRESENT">✅ Có mặt (Present)</option>
                        <option value="ABSENT">❌ Vắng (Absent)</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Nhận xét & Dặn dò
                      <textarea
                        value={booking.coachNote || ''}
                        onChange={(event) => updateLocalRoster(booking.bookingId, {
                          coachNote: event.target.value,
                        })}
                        maxLength={2000}
                        rows={2}
                        className="mt-1 block w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal focus:border-orange-500 outline-none"
                        placeholder="Nhận xét kỹ thuật, cường độ, lời dặn..."
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSaveAttendance(booking)}
                      disabled={savingBookingId === booking.bookingId}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all disabled:cursor-wait disabled:opacity-60"
                    >
                      {savingBookingId === booking.bookingId ? 'Đang lưu...' : 'Lưu Điểm Danh'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </CoachLayout>
  );
}
