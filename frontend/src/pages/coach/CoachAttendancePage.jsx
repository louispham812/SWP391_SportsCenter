import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useApp } from '../../context/AppContext';
import { getSessionRoster, getUpcomingClasses, updateBookingAttendance } from '../../services/bookingApi';
import { formatStatusLabel } from '../../utils/enumLabels';
import { matchesAnyVietnamese } from '../../utils/vietnameseSearch';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default function CoachAttendancePage() {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('sessionId');
  const [classes, setClasses] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [savingBookingId, setSavingBookingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [dirtyIds, setDirtyIds] = useState({});
  const [studentSearch, setStudentSearch] = useState('');
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    getUpcomingClasses()
      .then((classRows) => {
        if (!isCurrent) return;
        setClasses(classRows);
        if (classRows && classRows.length > 0) {
          const requestedMatch = requestedSessionId
            ? classRows.find((c) => String(c.sessionId) === String(requestedSessionId))
            : null;
          if (requestedMatch) {
            setSelectedSessionId(requestedMatch.sessionId.toString());
          } else {
            const now = new Date();
            const startedClasses = classRows.filter((c) => c.startTime && new Date(c.startTime) <= now);
            const activeSession = startedClasses.find((c) => !c.endTime || new Date(c.endTime) >= now)
              || startedClasses[startedClasses.length - 1]
              || classRows[0];
            setSelectedSessionId(activeSession?.sessionId?.toString() || classRows[0].sessionId.toString());
          }
        } else {
          setSelectedSessionId('');
        }
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
  }, [requestedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return undefined;
    let isCurrent = true;
    setLoadingRoster(true);
    setDirtyIds({});
    getSessionRoster(selectedSessionId)
      .then((bookingRows) => {
        if (isCurrent) {
          setRoster(bookingRows);
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || 'Không thể tải danh sách hội viên.');
      })
      .finally(() => {
        if (isCurrent) setLoadingRoster(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedSessionId]);

  const updateLocalRoster = (bookingId, changes) => {
    setRoster((current) => current.map((booking) => (
      booking.bookingId === bookingId ? { ...booking, ...changes } : booking
    )));
    setDirtyIds((prev) => ({ ...prev, [bookingId]: true }));
  };

  const handleSaveAttendance = async (booking) => {
    const validStatuses = ['PRESENT', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE'];
    if (!validStatuses.includes(booking.attendanceStatus)) {
      setError('Hãy chọn trạng thái: Có mặt, Vắng có phép hoặc Vắng không phép trước khi lưu.');
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
      setRoster((current) => current.map((item) => (
        item.bookingId === booking.bookingId
          ? {
              ...item,
              attendanceStatus: saved?.attendanceStatus || booking.attendanceStatus,
              coachNote: saved?.coachNote ?? booking.coachNote,
            }
          : item
      )));
      setDirtyIds((prev) => {
        const next = { ...prev };
        delete next[booking.bookingId];
        return next;
      });
      const msg = `Đã lưu điểm danh cho học viên ${booking.memberName || ''}.`;
      setSuccessMessage(msg);
      showToast('Lưu điểm danh', msg, 'success');
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu điểm danh.');
    } finally {
      setSavingBookingId(null);
    }
  };

  const dirtyBookings = useMemo(() => {
    const validStatuses = ['PRESENT', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE'];
    return roster.filter((b) => dirtyIds[b.bookingId] && validStatuses.includes(b.attendanceStatus));
  }, [roster, dirtyIds]);

  const handleMarkAllPresent = () => {
    const unmarkedIds = roster
      .filter((booking) => (
        (!booking.bookingStatus || booking.bookingStatus === 'CONFIRMED')
        && (!booking.attendanceStatus || booking.attendanceStatus === 'PENDING')
      ))
      .map((booking) => booking.bookingId);
    if (unmarkedIds.length === 0) return;
    const unmarkedSet = new Set(unmarkedIds);
    setRoster((current) => current.map((booking) => (
      unmarkedSet.has(booking.bookingId) ? { ...booking, attendanceStatus: 'PRESENT' } : booking
    )));
    setDirtyIds((prev) => {
      const next = { ...prev };
      unmarkedIds.forEach((id) => { next[id] = true; });
      return next;
    });
    showToast('Đã đánh dấu nhanh', `Đã chọn "Có mặt" cho ${unmarkedIds.length} học viên chưa điểm danh. Bấm "Lưu tất cả" để xác nhận.`, 'info');
  };

  const handleSaveAllDirty = async () => {
    if (dirtyBookings.length === 0) return;
    setSavingAll(true);
    setError('');
    setSuccessMessage('');
    let savedCount = 0;
    try {
      for (const booking of dirtyBookings) {
        const saved = await updateBookingAttendance(
          booking.bookingId,
          booking.attendanceStatus,
          booking.coachNote,
        );
        setRoster((current) => current.map((item) => (
          item.bookingId === booking.bookingId
            ? {
                ...item,
                attendanceStatus: saved?.attendanceStatus || booking.attendanceStatus,
                coachNote: saved?.coachNote ?? booking.coachNote,
              }
            : item
        )));
        savedCount += 1;
        setDirtyIds((prev) => {
          const next = { ...prev };
          delete next[booking.bookingId];
          return next;
        });
      }
      const msg = `Đã lưu điểm danh cho ${savedCount} học viên.`;
      setSuccessMessage(msg);
      showToast('Lưu hàng loạt thành công', msg, 'success');
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu toàn bộ điểm danh.');
    } finally {
      setSavingAll(false);
    }
  };

  const filteredRoster = useMemo(() => {
    return roster.filter((booking) => {
      if (onlyUnmarked && booking.attendanceStatus && booking.attendanceStatus !== 'PENDING') {
        return false;
      }
      if (studentSearch.trim()) {
        return matchesAnyVietnamese([booking.memberName, booking.memberPhone, booking.bookingId], studentSearch);
      }
      return true;
    });
  }, [roster, onlyUnmarked, studentSearch]);

  const selectedClass = classes.find((item) => item.sessionId.toString() === selectedSessionId);
  const isSessionNotStarted = Boolean(selectedClass?.startTime && new Date(selectedClass.startTime) > new Date());
  const presentCount = roster.filter((b) => b.attendanceStatus === 'PRESENT').length;
  const excusedCount = roster.filter((b) => b.attendanceStatus === 'EXCUSED_ABSENCE').length;
  const unexcusedCount = roster.filter((b) => b.attendanceStatus === 'UNEXCUSED_ABSENCE' || b.attendanceStatus === 'ABSENT').length;

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Điểm danh lớp học
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Điểm danh &amp; Đánh giá học viên
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Ghi nhận chuyên cần thực tế (Có mặt / Vắng có phép / Vắng không phép) và gửi nhận xét, bài tập dặn dò.
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
            <div className="h-10 w-full sm:max-w-xl rounded-xl skeleton-shimmer" />
          ) : classes.length === 0 ? (
            <p className="text-sm text-slate-500">Hiện chưa có lớp sắp diễn ra được phân công cho bạn.</p>
          ) : (
            <select
              id="attendance-session"
              value={selectedSessionId}
              onChange={(event) => {
                setRoster([]);
                setDirtyIds({});
                setSelectedSessionId(event.target.value);
                setError('');
                setSuccessMessage('');
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 sm:max-w-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-medium"
            >
              {classes.map((classSession) => (
                <option key={classSession.sessionId} value={classSession.sessionId}>
                  {classSession.className} — {formatDateTime(classSession.startTime)}
                  {classSession.startTime && new Date(classSession.startTime) > new Date() ? ' (Chưa bắt đầu)' : ''}
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedClass && (
          <section className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Buổi học</div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate">{selectedClass.className}</div>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Có mặt (Present)</div>
              <div className="mt-1 text-sm font-black text-emerald-700">
                {presentCount} học viên
              </div>
            </div>
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Vắng có phép (Excused)</div>
              <div className="mt-1 text-sm font-black text-blue-700">
                {excusedCount} học viên (Hoàn quota)
              </div>
            </div>
            <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-700">Vắng không phép (Unexcused)</div>
              <div className="mt-1 text-sm font-black text-red-700">
                {unexcusedCount} học viên (Trừ quota)
              </div>
            </div>
          </section>
        )}

        {selectedSessionId && (
          <section className="space-y-3">
            {loadingRoster ? (
              <TableSkeleton rows={4} cols={4} />
            ) : roster.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                <span>Chưa có hội viên nào đặt chỗ cho buổi học này.</span>
              </div>
            ) : (
              <>
                <div className="sticky top-16 z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xs p-3.5 shadow-xs flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Tìm học viên trong lớp..."
                        className="w-full rounded-xl border border-slate-200 pl-3 pr-8 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      {studentSearch && (
                        <button
                          type="button"
                          onClick={() => setStudentSearch('')}
                          aria-label="Xóa tìm học viên"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOnlyUnmarked((v) => !v)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                        onlyUnmarked
                          ? 'bg-orange-50 border-orange-300 text-orange-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Chưa điểm danh
                    </button>
                  </div>
                  {!isSessionNotStarted && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 transition cursor-pointer"
                      >
                        Có mặt tất cả (chưa điểm danh)
                      </button>
                      {dirtyBookings.length > 0 && (
                        <button
                          type="button"
                          disabled={savingAll}
                          onClick={handleSaveAllDirty}
                          className="rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                        >
                          {savingAll ? 'Đang lưu...' : `Lưu tất cả thay đổi (${dirtyBookings.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {filteredRoster.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 space-y-2">
                    <p>Không tìm thấy học viên phù hợp bộ lọc.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSearch('');
                        setOnlyUnmarked(false);
                      }}
                      className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                ) : (
                  filteredRoster.map((booking) => {
                const isBookingConfirmed = !booking.bookingStatus || booking.bookingStatus === 'CONFIRMED';
                const canMarkAttendance = !isSessionNotStarted && isBookingConfirmed;
                const lockReason = isSessionNotStarted
                  ? 'Chưa đến giờ bắt đầu buổi học'
                  : !isBookingConfirmed
                  ? `Chờ xác nhận / thanh toán (${formatStatusLabel(booking.bookingStatus)})`
                  : '';

                return (
                <article key={booking.bookingId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 hover:border-slate-300 transition-all">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_minmax(220px,1fr)_auto] lg:items-end">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-slate-900">
                          {booking.memberName || `Hội viên #${booking.memberId}`}
                        </h2>
                        {booking.usesMembershipQuota ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                            Quota Gói
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                            Giá Lẻ
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.memberPhone || 'Không có số điện thoại'} · Mã booking: #{booking.bookingId}
                      </p>
                      {lockReason && (
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          {lockReason}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Trạng thái điểm danh *
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { value: 'PRESENT', label: 'Có mặt', active: 'bg-emerald-600 text-white border-emerald-600' },
                          { value: 'EXCUSED_ABSENCE', label: 'Có phép', active: 'bg-blue-600 text-white border-blue-600' },
                          { value: 'UNEXCUSED_ABSENCE', label: 'Không phép', active: 'bg-rose-600 text-white border-rose-600' },
                        ].map((opt) => {
                          const currentVal = booking.attendanceStatus === 'ABSENT' ? 'UNEXCUSED_ABSENCE' : booking.attendanceStatus;
                          const isSelected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={!canMarkAttendance}
                              onClick={() => updateLocalRoster(booking.bookingId, { attendanceStatus: opt.value })}
                              className={`rounded-lg border px-1.5 py-1 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                isSelected ? opt.active : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <select
                        aria-label={`Trạng thái điểm danh ${booking.memberName || `#${booking.memberId}`}`}
                        disabled={!canMarkAttendance}
                        value={
                          booking.attendanceStatus === 'ABSENT'
                            ? 'UNEXCUSED_ABSENCE'
                            : !booking.attendanceStatus || booking.attendanceStatus === 'PENDING'
                            ? ''
                            : booking.attendanceStatus
                        }
                        onChange={(event) => updateLocalRoster(booking.bookingId, {
                          attendanceStatus: event.target.value,
                        })}
                        className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-orange-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">-- Chọn trạng thái --</option>
                        <option value="PRESENT">✅ Có mặt</option>
                        <option value="EXCUSED_ABSENCE">ℹ️ Vắng có phép</option>
                        <option value="UNEXCUSED_ABSENCE">❌ Vắng không phép</option>
                      </select>
                    </div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Nhận xét & Dặn dò
                      <textarea
                        disabled={!canMarkAttendance}
                        value={booking.coachNote || ''}
                        onChange={(event) => updateLocalRoster(booking.bookingId, {
                          coachNote: event.target.value,
                        })}
                        maxLength={2000}
                        rows={2}
                        className="mt-1 block w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal focus:border-orange-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="Nhận xét kỹ thuật, cường độ, lời dặn..."
                      />
                    </label>
                    {canMarkAttendance ? (
                      <button
                        type="button"
                        onClick={() => handleSaveAttendance(booking)}
                        disabled={savingBookingId === booking.bookingId}
                        className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all disabled:cursor-wait disabled:opacity-60"
                      >
                        {savingBookingId === booking.bookingId ? 'Đang lưu...' : 'Lưu Điểm Danh'}
                      </button>
                    ) : (
                      <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                        Chưa mở điểm danh
                      </span>
                    )}
                  </div>
                </article>
                );
                  })
                )}
              </>
            )}
          </section>
        )}
      </div>
    </CoachLayout>
  );
}
