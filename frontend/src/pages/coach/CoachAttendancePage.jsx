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
          <div className="mb-1 inline-flex rounded bg-secondary-container/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
            FLOW 4: ATTENDANCE &amp; EVALUATION
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
            Điểm Danh &amp; Nhận Xét Lớp Học
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Danh sách lớp và trạng thái điểm danh được tải, lưu từ hệ thống.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {successMessage && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="attendance-session" className="mb-2 block text-xs font-bold uppercase text-slate-600">
            Lớp được phân công
          </label>
          {isLoadingClasses ? (
            <p className="text-sm text-slate-500">Đang tải lịch lớp...</p>
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 sm:max-w-xl"
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
          <section className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-500">Buổi học</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{selectedClass.className}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-500">Thời gian</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(selectedClass.startTime)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-500">Sĩ số hiện tại</div>
              <div className="mt-1 text-sm font-bold text-emerald-700">
                {presentCount} / {rosterSessionId === selectedSessionId ? roster.length : 0} có mặt
              </div>
            </div>
          </section>
        )}

        {selectedSessionId && (
          <section className="space-y-3">
            {rosterSessionId !== selectedSessionId ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                Đang tải danh sách đặt lớp...
              </div>
            ) : roster.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                Chưa có hội viên đặt chỗ cho buổi học này.
              </div>
            ) : (
              roster.map((booking) => (
                <article key={booking.bookingId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_minmax(240px,1fr)_auto] lg:items-end">
                    <div>
                      <h2 className="font-bold text-slate-900">
                        {booking.memberName || `Hội viên #${booking.memberId}`}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.memberPhone || 'Không có số điện thoại trong hồ sơ'}
                      </p>
                    </div>
                    <label className="text-xs font-semibold text-slate-600">
                      Điểm danh
                      <select
                        value={!booking.attendanceStatus || booking.attendanceStatus === 'PENDING' ? '' : booking.attendanceStatus}
                        onChange={(event) => updateLocalRoster(booking.bookingId, {
                          attendanceStatus: event.target.value,
                        })}
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
                      >
                        <option value="">Chưa điểm danh</option>
                        <option value="PRESENT">Có mặt</option>
                        <option value="ABSENT">Vắng</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Nhận xét buổi học
                      <textarea
                        value={booking.coachNote || ''}
                        onChange={(event) => updateLocalRoster(booking.bookingId, {
                          coachNote: event.target.value,
                        })}
                        maxLength={2000}
                        rows={2}
                        className="mt-1 block w-full resize-y rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-normal"
                        placeholder="Nhận xét được lưu cùng bản ghi điểm danh"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSaveAttendance(booking)}
                      disabled={savingBookingId === booking.bookingId}
                      className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      {savingBookingId === booking.bookingId ? 'Đang lưu...' : 'Lưu'}
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
