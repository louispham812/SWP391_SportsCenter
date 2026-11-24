import { useEffect, useId, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import ModalDialog from '../../components/common/ModalDialog';
import { CardGridSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import {
  cancelReceptionistClassBooking,
  enrollReceptionistClassMember,
  getReceptionistClasses,
  searchReceptionistMembers,
} from '../../services/receptionistApi';
import { getSessionRoster, updateBookingAttendance } from '../../services/bookingApi';
import { generatePayment } from '../../services/apiClient';
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

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function ReceptionClassesPage() {
  const { showToast } = useApp();
  const modalTitleId = useId();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [scheduleResponse, setScheduleResponse] = useState(null);
  const [sportFilter, setSportFilter] = useState('all');

  const startKey = toDateKey(weekStart);
  const requestKey = `${startKey}\u0000${scheduleRefreshKey}`;
  const loading = scheduleResponse?.key !== requestKey;
  const classes = scheduleResponse?.key === requestKey ? scheduleResponse.rows : [];
  const error = scheduleResponse?.key === requestKey ? scheduleResponse.error : '';

  // Roster, Attendance Correction, Enroll & Cancel on behalf of Member
  const [selectedSession, setSelectedSession] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Enroll Member State
  const [memberQuery, setMemberQuery] = useState('');
  const [memberSearchState, setMemberSearchState] = useState({ query: '', rows: [] });
  const [selectedMember, setSelectedMember] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState('CASH'); // 'QUOTA' | 'CASH' | 'VNPAY'
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [pendingVnpayUrl, setPendingVnpayUrl] = useState('');

  // Cancel Confirmation State
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let active = true;
    getReceptionistClasses(startKey)
      .then((rows) => {
        if (active) setScheduleResponse({ key: requestKey, rows, error: '' });
      })
      .catch((requestError) => {
        if (active) {
          setScheduleResponse({
            key: requestKey,
            rows: [],
            error: requestError.message || 'Không thể tải thời khóa biểu.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [startKey, requestKey]);

  useEffect(() => {
    if (!selectedSession || memberQuery.trim().length < 2) {
      return undefined;
    }
    let active = true;
    const q = memberQuery.trim();
    const timer = window.setTimeout(() => {
      searchReceptionistMembers(q, 0)
        .then((res) => {
          if (active) setMemberSearchState({ query: q, rows: res?.content || [] });
        })
        .catch(() => {
          if (active) setMemberSearchState({ query: q, rows: [] });
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedSession, memberQuery]);

  const memberOptions = memberQuery.trim().length >= 2 && memberSearchState.query === memberQuery.trim()
    ? memberSearchState.rows
    : [];

  const reloadRoster = async (sessionId) => {
    setLoadingRoster(true);
    try {
      const students = await getSessionRoster(sessionId);
      setRoster(students || []);
      setSelectedSession((prev) =>
        prev && prev.sessionId === sessionId
          ? { ...prev, bookedSlots: (students || []).length }
          : prev
      );
    } catch {
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleOpenRoster = async (classItem) => {
    setSelectedSession(classItem);
    setMemberQuery('');
    setMemberSearchState({ query: '', rows: [] });
    setSelectedMember(null);
    setPaymentChoice('CASH');
    setEnrollError('');
    setPendingVnpayUrl('');
    setConfirmCancelBookingId(null);
    await reloadRoster(classItem.sessionId);
  };

  const handleSelectMember = (member) => {
    if (member?.status && member.status !== 'ACTIVE') {
      setEnrollError('Tài khoản hội viên chưa kích hoạt hoặc đang tạm khóa, chưa thể đăng ký lớp.');
      return;
    }
    setSelectedMember(member);
    setMemberQuery(member.fullName);
    setEnrollError('');
    setPendingVnpayUrl('');
    setPaymentChoice((member.remainingQuotaSessions || 0) > 0 ? 'QUOTA' : 'CASH');
  };

  const handleEnrollMember = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    setEnrollError('');
    setPendingVnpayUrl('');
    if (!selectedMember?.userId) {
      setEnrollError('Vui lòng tìm và chọn hội viên cần đăng ký lớp.');
      return;
    }
    if (selectedMember.status && selectedMember.status !== 'ACTIVE') {
      setEnrollError('Tài khoản hội viên chưa kích hoạt hoặc đang tạm khóa, chưa thể đăng ký lớp.');
      return;
    }

    const useQuota = paymentChoice === 'QUOTA';
    setEnrolling(true);
    try {
      const confirmation = await enrollReceptionistClassMember(selectedSession.sessionId, {
        memberId: selectedMember.userId,
        paymentMethod: useQuota ? null : paymentChoice,
        useQuota,
      });

      if (paymentChoice === 'VNPAY' && confirmation?.paymentStatus === 'PENDING' && confirmation?.paymentId) {
        try {
          const vnpay = await generatePayment(confirmation.paymentId, 'VNPAY');
          if (vnpay?.paymentUrl) {
            setPendingVnpayUrl(vnpay.paymentUrl);
          }
        } catch {
          // Booking still created in BOOKED state; show toast below.
        }
      }

      showToast(
        'Đăng ký lớp hộ thành công',
        useQuota
          ? `Đã đăng ký lớp "${selectedSession.className}" cho ${selectedMember.fullName} bằng 1 buổi quota.`
          : paymentChoice === 'CASH'
          ? `Đã đăng ký lớp "${selectedSession.className}" cho ${selectedMember.fullName} (Đã thu tiền mặt).`
          : `Đã giữ chỗ lớp "${selectedSession.className}" cho ${selectedMember.fullName} (Chờ thanh toán VNPay).`,
        'success'
      );

      setSelectedMember(null);
      setMemberQuery('');
      setScheduleRefreshKey((k) => k + 1);
      await reloadRoster(selectedSession.sessionId);
    } catch (err) {
      setEnrollError(err.message || 'Không thể đăng ký lớp hộ hội viên.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCancelStudentBooking = async (student) => {
    if (!selectedSession || cancellingId) return;
    setCancellingId(student.bookingId);
    try {
      const res = await cancelReceptionistClassBooking(student.bookingId);
      showToast(
        res?.status === 'PENDING_APPROVAL' ? 'Đã gửi yêu cầu hoàn tiền' : 'Hủy lớp hộ thành công',
        res?.message || `Đã hủy lịch lớp cho học viên ${student.memberName || `#${student.memberId}`}.`,
        'success'
      );
      setConfirmCancelBookingId(null);
      setScheduleRefreshKey((k) => k + 1);
      await reloadRoster(selectedSession.sessionId);
    } catch (err) {
      showToast('Không thể hủy lớp hộ', err.message || 'Lỗi khi hủy đặt chỗ cho học viên.', 'error');
    } finally {
      setCancellingId(null);
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

  const sports = [...new Set(classes.map((classItem) => classItem.sportName).filter(Boolean))].sort();
  const visibleClasses = sportFilter === 'all'
    ? classes
    : classes.filter((classItem) => classItem.sportName === sportFilter);

  const selectedIsCancelled = selectedSession?.status?.toUpperCase() === 'CANCELLED';
  const selectedHasStarted = selectedSession?.startTime ? new Date(selectedSession.startTime) <= new Date() : false;
  const selectedIsFull = selectedSession
    ? (selectedSession.bookedSlots ?? 0) >= (selectedSession.maxSlots ?? 0)
    : false;
  const canEnrollSelected = Boolean(selectedSession) && !selectedIsCancelled && !selectedHasStarted && !selectedIsFull;

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              F SPORT RECEPTION · THỜI KHÓA BIỂU &amp; ĐĂNG KÝ LỚP HỘ
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Thời khóa biểu các lớp</h1>
            <p className="text-sm text-slate-500">
              Xem lịch lớp trong tuần, đăng ký hoặc hủy lớp hộ hội viên tại quầy và đối soát điểm danh.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Tuần trước"
              onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(mondayOf(new Date()))}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all shadow-sm cursor-pointer"
            >
              Tuần hiện tại
            </button>
            <button
              type="button"
              aria-label="Tuần sau"
              onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-300 text-slate-700 transition-all shadow-sm cursor-pointer"
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
                <article key={classItem.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs card-hover flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                          {start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </p>
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
                      {classItem.priceAmount != null && (
                        <p>
                          <span className="font-semibold text-slate-800">Học phí lẻ:</span>{' '}
                          <span className="font-bold text-orange-600">{formatMoney(classItem.priceAmount)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenRoster(classItem)}
                    className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    <span>Quản lý lớp · Đăng ký / Hủy hộ</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal Quản lý lớp: Đăng ký hộ HV, Hủy lớp hộ HV & Sửa điểm danh */}
        <ModalDialog
          open={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          titleId={modalTitleId}
          maxWidthClass="max-w-2xl"
        >
          {selectedSession && (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">
                    QUẢN LÝ HỌC VIÊN LỚP HỌC
                  </span>
                  <h2 id={modalTitleId} className="text-base font-bold text-slate-900 mt-1">
                    {selectedSession.className}
                  </h2>
                  <p className="text-xs text-slate-500">
                    HLV: {selectedSession.coachName || 'Chưa phân công'} · {time(selectedSession.startTime)} – {time(selectedSession.endTime)} · Chỗ: {selectedSession.bookedSlots ?? roster.length}/{selectedSession.maxSlots ?? '—'}
                    {selectedSession.priceAmount != null ? ` · Học phí: ${formatMoney(selectedSession.priceAmount)}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Section 1: Đăng ký lớp hộ hội viên */}
              <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px]">person_add</span>
                    Đăng ký lớp hộ hội viên tại quầy
                  </h3>
                  {!canEnrollSelected && (
                    <span className="text-[11px] font-bold text-red-600">
                      {selectedIsCancelled
                        ? 'Lớp đã hủy'
                        : selectedHasStarted
                        ? 'Lớp đã diễn ra'
                        : 'Lớp đã hết chỗ'}
                    </span>
                  )}
                </div>

                {canEnrollSelected && (
                  <form onSubmit={handleEnrollMember} className="space-y-3">
                    {enrollError && (
                      <div role="alert" className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
                        {enrollError}
                      </div>
                    )}

                    {pendingVnpayUrl && (
                      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                        <span>Đơn VNPay đang chờ thanh toán (10 phút):</span>
                        <a
                          href={pendingVnpayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                        >
                          Mở cổng thanh toán VNPay
                        </a>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="class-member-search" className="text-xs font-bold text-slate-700">
                        Tìm hội viên (tên, SĐT, email) *
                      </label>
                      <input
                        id="class-member-search"
                        type="text"
                        autoFocus
                        value={memberQuery}
                        onChange={(e) => {
                          setMemberQuery(e.target.value);
                          setSelectedMember(null);
                        }}
                        placeholder="Nhập tên, SĐT hoặc email hội viên (tối thiểu 2 ký tự)..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-orange-500"
                      />

                      {memberOptions.length > 0 && !selectedMember && (
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
                          {memberOptions.map((m) => {
                            const isInactive = Boolean(m.status && m.status !== 'ACTIVE');
                            return (
                              <button
                                key={m.userId}
                                type="button"
                                disabled={isInactive}
                                onClick={() => handleSelectMember(m)}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 ${
                                  isInactive
                                    ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                                    : 'hover:bg-orange-50 cursor-pointer'
                                }`}
                              >
                                <div className="min-w-0">
                                  <strong className="text-slate-900 block truncate">{m.fullName}</strong>
                                  <span className="text-[11px] text-slate-500">{m.phone || m.email}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  {isInactive ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                      {m.status === 'PENDING' ? 'Chờ kích hoạt' : m.status}
                                    </span>
                                  ) : m.activePackageName ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                      {m.activePackageName} · {m.remainingQuotaSessions ?? 0} buổi
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Chưa có gói</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedMember && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs">
                          <div>
                            <strong className="text-slate-900">{selectedMember.fullName}</strong>
                            <span className="text-slate-500 ml-1.5">({selectedMember.phone || selectedMember.email})</span>
                            {selectedMember.activePackageName && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                {selectedMember.activePackageName} · Còn {selectedMember.remainingQuotaSessions ?? 0} buổi quota
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(null);
                              setMemberQuery('');
                            }}
                            className="font-bold text-orange-600 hover:underline cursor-pointer"
                          >
                            Đổi
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                      <div className="flex-1 space-y-1">
                        <label htmlFor="class-payment-choice" className="text-xs font-bold text-slate-700">
                          Hình thức thanh toán
                        </label>
                        <select
                          id="class-payment-choice"
                          value={paymentChoice}
                          onChange={(e) => setPaymentChoice(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold cursor-pointer"
                        >
                          <option
                            value="QUOTA"
                            disabled={!(selectedMember && (selectedMember.remainingQuotaSessions || 0) > 0)}
                          >
                            Dùng 1 buổi Quota gói {selectedMember ? `(Còn ${selectedMember.remainingQuotaSessions ?? 0} buổi)` : ''}
                          </option>
                          <option value="CASH">Thu tiền mặt tại quầy (CASH)</option>
                          <option value="VNPAY">Thanh toán VNPay (VNPAY)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={enrolling || !selectedMember}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap"
                      >
                        {enrolling ? 'Đang đăng ký...' : 'Đăng ký hộ'}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* Section 2: Danh sách học viên & Hủy lớp hộ / Sửa điểm danh */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Danh sách học viên đã đặt chỗ ({roster.length})
                </h3>
                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {loadingRoster ? (
                    <TableSkeleton rows={3} cols={3} />
                  ) : roster.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-slate-200 bg-slate-50">
                      Chưa có học viên nào đặt chỗ cho lớp này.
                    </div>
                  ) : (
                    roster.map((student) => {
                      const canCancelRow = !selectedIsCancelled
                        && !selectedHasStarted
                        && (!student.attendanceStatus || student.attendanceStatus === 'PENDING');
                      const isConfirming = confirmCancelBookingId === student.bookingId;
                      return (
                        <div key={student.bookingId} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <strong className="block text-slate-900 text-xs">{student.memberName || `Học viên #${student.memberId}`}</strong>
                            <span className="text-[11px] text-slate-500">
                              {student.memberPhone || '—'} · Mã: #{student.bookingId} · {student.bookingStatus}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {(() => {
                              const hasInitialAttendance = Boolean(student.attendanceStatus && student.attendanceStatus !== 'PENDING');
                              const canEditAttendance = selectedHasStarted && hasInitialAttendance;
                              return (
                                <select
                                  aria-label={`Điểm danh ${student.memberName || student.memberId}`}
                                  disabled={!canEditAttendance}
                                  title={!selectedHasStarted ? 'Chưa đến giờ học' : !hasInitialAttendance ? 'Chờ HLV điểm danh lần đầu' : 'Cập nhật chuyên cần'}
                                  value={student.attendanceStatus || 'PENDING'}
                                  onChange={(e) => handleUpdateStudentAttendance(student.bookingId, e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold outline-none focus:border-orange-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                >
                                  {!hasInitialAttendance && <option value="PENDING">Chờ HLV điểm danh</option>}
                                  <option value="PRESENT">Có mặt (PRESENT)</option>
                                  <option value="EXCUSED_ABSENCE">Vắng có phép (EXCUSED)</option>
                                  <option value="UNEXCUSED_ABSENCE">Vắng không phép (UNEXCUSED)</option>
                                </select>
                              );
                            })()}

                            {canCancelRow && !isConfirming && (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelBookingId(student.bookingId)}
                                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition cursor-pointer"
                              >
                                Hủy lớp hộ
                              </button>
                            )}

                            {canCancelRow && isConfirming && (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={cancellingId === student.bookingId}
                                  onClick={() => handleCancelStudentBooking(student)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {cancellingId === student.bookingId ? 'Đang hủy...' : 'Xác nhận hủy'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelBookingId(null)}
                                  className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs font-bold cursor-pointer"
                                >
                                  Không
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>* Mọi thao tác đăng ký/hủy hộ và sửa điểm danh được ghi vào Nhật ký Audit Log.</span>
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </ModalDialog>
      </div>
    </ReceptionistLayout>
  );
}
