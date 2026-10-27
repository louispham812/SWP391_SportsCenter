import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import {
  cancelMemberBooking,
  checkoutBooking,
  getAllBookableClasses,
  getBookingQuote,
  getBookingSports,
  getCoachPublicProfile,
} from '../../services/bookingApi';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';
import { getSportMedia } from '../../utils/mediaMap';

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (value) =>
  new Date(value).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function MemberClassesPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [sports, setSports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedSportId, setSelectedSportId] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | '3DAYS' | '7DAYS'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const [cancelingBooking, setCancelingBooking] = useState(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [registeringSession, setRegisteringSession] = useState(null);
  const [sessionQuote, setSessionQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [submittingRegister, setSubmittingRegister] = useState(false);

  // Load quote with active membership discount whenever a session is selected
  useEffect(() => {
    if (registeringSession) {
      setQuoteLoading(true);
      setPaymentMethod('VIETQR');
      getBookingQuote('CLASS', registeringSession.sessionId)
        .then((q) => setSessionQuote(q))
        .catch(() => setSessionQuote(null))
        .finally(() => setQuoteLoading(false));
    } else {
      setSessionQuote(null);
    }
  }, [registeringSession]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sportList, classList] = await Promise.all([
        getBookingSports(),
        getAllBookableClasses(selectedSportId || null),
      ]);
      setSports(sportList || []);
      setClasses(classList || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lớp học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSportId]);

  // Lọc danh sách lớp học
  const filteredClasses = useMemo(() => {
    const now = new Date();
    return classes.filter((cls) => {
      // Sport filter
      if (selectedSportId && String(cls.sportId) !== String(selectedSportId)) {
        return false;
      }

      const startTime = new Date(cls.startTime);

      // Date filter
      if (dateFilter === 'TODAY') {
        const isToday = startTime.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (dateFilter === '3DAYS') {
        const limit = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        if (startTime > limit) return false;
      } else if (dateFilter === '7DAYS') {
        const limit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (startTime > limit) return false;
      }

      // Time of day filter
      const hour = startTime.getHours();
      if (timeFilter === 'MORNING' && (hour < 5 || hour >= 12)) return false;
      if (timeFilter === 'AFTERNOON' && (hour < 12 || hour >= 17)) return false;
      if (timeFilter === 'EVENING' && (hour < 17 || hour >= 23)) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const classNameMatch = cls.className?.toLowerCase().includes(query);
        const coachMatch = cls.coachName?.toLowerCase().includes(query);
        if (!classNameMatch && !coachMatch) return false;
      }

      return true;
    });
  }, [classes, selectedSportId, timeFilter, dateFilter, searchQuery]);

  // Xem chi tiết HLV
  const handleViewCoach = async (coachId) => {
    if (!coachId) return;
    setCoachLoading(true);
    try {
      const coachProfile = await getCoachPublicProfile(coachId);
      setSelectedCoach(coachProfile);
    } catch (err) {
      showToast({
        title: 'Huấn luyện viên',
        message: err.message || 'Không thể tải hồ sơ huấn luyện viên.',
        type: 'warning',
      });
    } finally {
      setCoachLoading(false);
    }
  };

  // Xác nhận đăng ký lớp
  const handleConfirmRegister = async () => {
    if (!registeringSession) return;
    setSubmittingRegister(true);
    try {
      const confirmation = await checkoutBooking(
        'CLASS',
        registeringSession.sessionId,
        registeringSession.startTime,
        registeringSession.endTime,
        paymentMethod
      );
      showToast({
        title: 'Đăng ký thành công!',
        message: `Mã xác nhận: ${confirmation.referenceCode || 'TXN-OK'}. Lớp "${registeringSession.className}" đã được thêm vào Thời khóa biểu!`,
        type: 'success',
      });
      setRegisteringSession(null);
      await loadData();
    } catch (err) {
      showToast({
        title: 'Đăng ký thất bại',
        message: err.message || 'Không thể đăng ký lớp học này.',
        type: 'error',
      });
    } finally {
      setSubmittingRegister(false);
    }
  };

  // Xác nhận hủy đăng ký lớp
  const handleConfirmCancel = async () => {
    if (!cancelingBooking) return;
    setSubmittingCancel(true);
    try {
      await cancelMemberBooking('CLASS', cancelingBooking.bookingId);
      showToast({
        title: 'Hủy đăng ký thành công',
        message: 'Lớp học đã được xóa khỏi thời khóa biểu. 100% học phí đã được hoàn vào ví giao dịch sandbox.',
        type: 'success',
      });
      setCancelingBooking(null);
      await loadData();
    } catch (err) {
      showToast({
        title: 'Không thể hủy lớp',
        message: err.message || 'Chỉ được hủy trước giờ bắt đầu ít nhất 2 tiếng.',
        type: 'error',
      });
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
              Đăng Ký Khóa Học & Lớp Thể Thao
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tra cứu thời khóa biểu của từng bộ môn, đăng ký theo lớp học và quản lý suất học cá nhân.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/member/schedule')}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/20 transition"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Thời khóa biểu của tôi</span>
          </button>
        </header>

        {/* Policy Notice Box */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">verified_user</span>
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900">Quy định đăng ký & Hoàn tiền khi hủy lớp:</div>
            <p className="text-amber-800 leading-relaxed">
              Học viên được phép <strong>hủy đăng ký trước giờ học ít nhất 2 tiếng</strong> và nhận <strong>hoàn tiền 100%</strong> vào tài khoản sandbox. Khi hủy, lịch tương lai sẽ tự động được xóa khỏi thời khóa biểu và suất học được chuyển cho học viên danh sách chờ.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Search + Time + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm tên lớp hoặc huấn luyện viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Khung giờ:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả khung giờ</option>
                <option value="MORNING">Buổi Sáng (06:00 - 12:00)</option>
                <option value="AFTERNOON">Buổi Chiều (12:00 - 17:00)</option>
                <option value="EVENING">Buổi Tối (17:00 - 22:00)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Thời gian:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả các ngày</option>
                <option value="TODAY">Hôm nay</option>
                <option value="3DAYS">Trong 3 ngày tới</option>
                <option value="7DAYS">Trong 7 ngày tới</option>
              </select>
            </div>
          </div>

          {/* Sport Filter Tabs */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedSportId('')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedSportId === ''
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả môn ({sports.length})
            </button>
            {sports.map((sp) => (
              <button
                key={sp.sportId}
                type="button"
                onClick={() => setSelectedSportId(String(sp.sportId))}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  String(selectedSportId) === String(sp.sportId)
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sp.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            {error}
          </div>
        )}

        {/* Classes List */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="h-36 bg-slate-100 rounded-2xl" />
                <div className="h-5 w-3/4 bg-slate-100 rounded" />
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Không tìm thấy lớp học nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {filteredClasses.map((cls) => {
              const remaining = Math.max(0, cls.maxSlots - cls.bookedSlots);
              const alreadyBooked = ['BOOKED', 'CONFIRMED'].includes(cls.memberBookingStatus);
              const sportObj = sports.find((s) => s.sportId === cls.sportId);
              const media = getSportMedia(sportObj?.slug || sportObj?.code || cls.className);

              return (
                <article
                  key={cls.sessionId}
                  className="group flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-md"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                      <img
                        src={media.image}
                        alt={cls.className}
                        className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-orange-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {sportObj?.name || media.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                            alreadyBooked
                              ? 'bg-emerald-500 text-white'
                              : remaining < 1
                              ? 'bg-red-500 text-white'
                              : 'bg-white/90 text-slate-800'
                          }`}
                        >
                          {alreadyBooked ? 'Đã đăng ký' : remaining < 1 ? 'Hết chỗ' : `Còn ${remaining}/${cls.maxSlots} chỗ`}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 left-4 right-4">
                        <h3 className="font-bold text-base text-white truncate drop-shadow-sm">
                          {cls.className}
                        </h3>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-3">
                      {/* Coach Clickable Link */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Huấn luyện viên:</span>
                        <button
                          type="button"
                          onClick={() => handleViewCoach(cls.coachId)}
                          className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                          title="Bấm để xem hồ sơ huấn luyện viên"
                        >
                          <span className="material-symbols-outlined text-[16px]">sports</span>
                          <span>{cls.coachName || `HLV #${cls.coachId}`}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Thời gian học:</span>
                        <span className="font-semibold text-slate-800 text-right">
                          {formatDate(cls.startTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Thời lượng:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(cls.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (60 phút)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-700">Học phí:</span>
                        <span className="text-base font-extrabold text-orange-600">
                          {formatMoney(cls.priceAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 mt-auto">
                    {alreadyBooked ? (
                      <div className="space-y-2">
                        <div className="text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-xl border border-emerald-200">
                          ✓ Bạn đã đăng ký lớp học này
                        </div>
                        <button
                          type="button"
                          onClick={() => setCancelingBooking({ bookingId: cls.memberBookingId, className: cls.className })}
                          className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 py-2.5 text-xs font-bold text-red-700 transition cursor-pointer"
                        >
                          Hủy đăng ký lớp này
                        </button>
                      </div>
                    ) : remaining < 1 ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl bg-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-not-allowed"
                      >
                        Lớp đã đủ học viên
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRegisteringSession(cls)}
                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 transition cursor-pointer"
                      >
                        Đăng ký lớp học ngay
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal Coach Profile */}
        {selectedCoach && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md my-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-orange-500">sports_score</span>
                  <h3 className="text-lg font-bold text-slate-900">Thông Tin Huấn Luyện Viên</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="my-5 text-center">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-slate-800 flex items-center justify-center">
                  {selectedCoach.avatar ? (
                    <img src={selectedCoach.avatar} alt={selectedCoach.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-orange-400">
                      {selectedCoach.fullName?.slice(0, 2).toUpperCase() || 'HLV'}
                    </span>
                  )}
                </div>
                <h4 className="mt-3 text-lg font-bold text-slate-900">{selectedCoach.fullName}</h4>
                <div className="text-xs font-semibold text-orange-600">{selectedCoach.specialty}</div>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {selectedCoach.bio}
                </p>

                <div className="mt-4 space-y-2 text-xs text-left border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Số điện thoại:</span>
                    <strong className="text-slate-900">{selectedCoach.phone || '0901.888.xxx'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Email liên hệ:</span>
                    <strong className="text-slate-900">{selectedCoach.email}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Số lớp đang phụ trách:</span>
                    <strong className="text-orange-600">{selectedCoach.activeClassesCount} lớp học</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bộ môn giảng dạy:</span>
                    <strong className="text-slate-900">{selectedCoach.sportsTaught?.join(', ')}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCoach(null)}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-xs font-bold uppercase tracking-wider text-white transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Modal Register Confirmation */}
        {registeringSession && (() => {
          const originalPrice = sessionQuote?.originalAmount ?? registeringSession.priceAmount;
          const discountAmt = sessionQuote?.discountAmount ?? 0;
          const finalPrice = sessionQuote?.amount ?? sessionQuote?.finalAmount ?? registeringSession.priceAmount;

          const actionBtnLabel = submittingRegister
            ? 'Đang xử lý...'
            : paymentMethod === 'VIETQR'
            ? 'Tôi Đã Chuyển Khoản — Đăng Ký'
            : paymentMethod === 'CASH_COUNTER'
            ? 'Đặt Chỗ — Trả Tại Quầy'
            : paymentMethod === 'VNPAY'
            ? 'Thanh Toán Qua VNPAY'
            : 'Xác Nhận Đăng Ký';

          return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-xl max-h-[92vh] my-auto flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-orange-500">how_to_reg</span>
                    <h3 className="text-lg font-bold text-slate-900">Xác Nhận Đăng Ký & Thanh Toán</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegisteringSession(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Course card info */}
                  <div className="rounded-2xl bg-orange-50/70 border border-orange-100 p-4">
                    <div className="text-xs text-orange-800 font-bold uppercase tracking-wider">Khóa học thể thao</div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{registeringSession.className}</div>
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                      <span>Huấn luyện viên: <strong>{registeringSession.coachName}</strong></span>
                      <span>·</span>
                      <span>Sân: <strong>{registeringSession.facilityName || 'F Sport Center'}</strong></span>
                    </div>
                  </div>

                  {/* Class schedule & price breakdown */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Thời gian diễn ra:</span>
                      <strong className="text-slate-900">{formatDate(registeringSession.startTime)}</strong>
                    </div>

                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Học phí niêm yết:</span>
                      <span className={`font-semibold ${discountAmt > 0 ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {formatMoney(originalPrice)}
                      </span>
                    </div>

                    {discountAmt > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        <span className="flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-sm">stars</span>
                          {sessionQuote?.discountLabel || 'Ưu đãi thẻ hội viên:'}
                        </span>
                        <strong className="font-bold">-{formatMoney(discountAmt)}</strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-900">Cần thanh toán:</span>
                      <span className="text-xl font-extrabold text-orange-600">
                        {formatMoney(finalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onChange={setPaymentMethod}
                    amount={finalPrice}
                    transferMemo={`VQRCLS${registeringSession.sessionId}`}
                  />

                  {/* Policy hint */}
                  <div className="rounded-xl bg-blue-50 p-3 text-[11px] text-blue-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-blue-600 shrink-0">info</span>
                    <span>Bạn được hủy lớp và nhận hoàn 100% trước giờ bắt đầu ít nhất 2 tiếng. Lịch học sẽ tự động đồng bộ vào Thời khóa biểu.</span>
                  </div>
                </div>

                <div className="p-6 pt-3 border-t border-slate-100 flex gap-3 bg-white">
                  <button
                    type="button"
                    disabled={submittingRegister}
                    onClick={() => setRegisteringSession(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={submittingRegister}
                    onClick={handleConfirmRegister}
                    className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/25 transition disabled:opacity-60 cursor-pointer"
                  >
                    {actionBtnLabel}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Modal Cancel Registration */}
        {cancelingBooking && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md my-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-red-600">
                <span className="material-symbols-outlined text-2xl">cancel</span>
                <h3 className="text-lg font-bold text-slate-900">Hủy Đăng Ký Lớp Học</h3>
              </div>

              <div className="my-5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có chắc chắn muốn hủy đăng ký lớp <strong>{cancelingBooking.className}</strong>?
                </p>

                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 space-y-2 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">currency_exchange</span>
                    <span>Quyền lợi hoàn tiền 100%:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                    <li>Học phí đã thanh toán sẽ được hoàn 100% vào tài khoản ví sandbox.</li>
                    <li>Lớp học này sẽ tự động xóa khỏi thời khóa biểu tương lai của bạn.</li>
                    <li>Suất học được nhượng lại cho người kế tiếp trong danh sách chờ.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={submittingCancel}
                  onClick={() => setCancelingBooking(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Giữ lại lớp
                </button>
                <button
                  type="button"
                  disabled={submittingCancel}
                  onClick={handleConfirmCancel}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-600/20 transition disabled:opacity-60 cursor-pointer"
                >
                  {submittingCancel ? 'Đang xử lý...' : 'Xác Nhận Hủy & Hoàn Tiền'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </MemberLayout>
  );
}
