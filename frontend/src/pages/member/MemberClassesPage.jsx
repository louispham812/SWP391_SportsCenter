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
import { apiRequest } from '../../services/apiClient';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';
import { getSportMedia } from '../../utils/mediaMap';
import Pagination from '../../components/common/Pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const CLASSES_PER_PAGE = 6;

  // Modals
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const [cancelingBooking, setCancelingBooking] = useState(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [registeringSession, setRegisteringSession] = useState(null);
  const [sessionQuote, setSessionQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('RETAIL'); // 'QUOTA' | 'RETAIL'
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [submittingRegister, setSubmittingRegister] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Member Quota State - fetch from API
  const [memberQuota, setMemberQuota] = useState({
    packageName: 'Đang tải...',
    initialQuota: 0,
    usedQuota: 0,
    heldQuota: 0,
    remainingQuota: 0,
    canUseForBooking: false,
  });
  const [quotaLoading, setQuotaLoading] = useState(true);

  // Fetch member quota from API
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        setQuotaLoading(true);
        const data = await apiRequest('/members/me/quota');
        setMemberQuota({
          packageName: data.packageName || 'Chưa có gói tập',
          initialQuota: data.initialQuota || 0,
          usedQuota: data.usedQuota || 0,
          heldQuota: data.heldQuota || 0,
          remainingQuota: data.remainingQuota || 0,
          canUseForBooking: data.canUseForBooking || false,
        });
      } catch (err) {
        setMemberQuota({
          packageName: 'Chưa có gói tập',
          initialQuota: 0,
          usedQuota: 0,
          heldQuota: 0,
          remainingQuota: 0,
          canUseForBooking: false,
        });
      } finally {
        setQuotaLoading(false);
      }
    };
    
    fetchQuota();
  }, []); // Chỉ gọi 1 lần khi mount

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // Load quote with active membership discount whenever a session is selected
  useEffect(() => {
    if (registeringSession) {
      setRegisterError('');
      setQuoteLoading(true);
      setPaymentMethod('VIETQR');
      setPaymentMode('RETAIL');
      setAppliedVoucher(null);
      setVoucherCode('');
      setVoucherError('');
      getBookingQuote('CLASS', registeringSession.sessionId)
        .then((q) => setSessionQuote(q))
        .catch(() => setSessionQuote(null))
        .finally(() => setQuoteLoading(false));
    } else {
      setSessionQuote(null);
      setRegisterError('');
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

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSportId, timeFilter, dateFilter, searchQuery]);

  const totalPages = Math.ceil(filteredClasses.length / CLASSES_PER_PAGE) || 1;

  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * CLASSES_PER_PAGE;
    return filteredClasses.slice(start, start + CLASSES_PER_PAGE);
  }, [filteredClasses, currentPage]);

  // Xem chi tiết HLV
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

  // Handle Voucher Application (MGR-18)
  const applyVoucher = async () => {
    setVoucherError('');
    if (!voucherCode.trim()) return;

    const code = voucherCode.trim().toUpperCase();
    try {
      const res = await apiRequest('/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({ code, amount: selectedSession?.priceAmount || 0 }),
      });
      if (res && res.valid && res.voucher) {
        setAppliedVoucher(res.voucher);
      } else {
        setVoucherError(res?.message || 'Mã ưu đãi không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      setVoucherError(err.message || 'Không thể xác thực mã ưu đãi từ hệ thống.');
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  // Xác nhận đăng ký lớp
  const handleConfirmRegister = async () => {
    if (!registeringSession) return;

    // Business rule: Quota validation (CLASS always needs 1 quota)
    const requiredQuota = 1;
    if (paymentMode === 'QUOTA') {
      if (memberQuota.remainingQuota < requiredQuota) {
        showToast(
          'Không đủ quota',
          `Số buổi trong gói hội viên của bạn không đủ (cần ${requiredQuota} buổi, hiện còn ${memberQuota.remainingQuota} buổi). Vui lòng thanh toán theo giá bán lẻ hoặc nạp thêm gói tập.`,
          'error'
        );
        return;
      }

      // Xử lý thanh toán bằng quota - Backend tính toán và trừ quota
      setSubmittingRegister(true);
      try {
        const confirmation = await checkoutBooking(
          'CLASS',
          registeringSession.sessionId,
          registeringSession.startTime,
          registeringSession.endTime,
          'MEMBERSHIP_QUOTA',
          true  // useQuota = true
        );
        
        showToast(
          'Đăng ký thành công!',
          confirmation.quotaMessage || `Lớp "${registeringSession.className}" đã được thêm vào Thời khóa biểu! Đã trừ ${requiredQuota} buổi từ gói hội viên.`,
          'success'
        );
        setRegisteringSession(null);
        await loadData();
      } catch (err) {
        showToast('Đăng ký thất bại', err.message || 'Không thể đăng ký lớp học này bằng quota.', 'error');
      } finally {
        setSubmittingRegister(false);
      }
      return;
    }

    // Retail payment mode
    setSubmittingRegister(true);
    setRegisterError('');
    try {
      const confirmation = await checkoutBooking(
        'CLASS',
        registeringSession.sessionId,
        registeringSession.startTime,
        registeringSession.endTime,
        paymentMethod
      );
      showToast(
        'Đăng ký thành công!',
        `Mã xác nhận: ${confirmation.referenceCode || 'TXN-OK'}. Lớp "${registeringSession.className}" đã được thêm vào Thời khóa biểu!`,
        'success'
      );
      setRegisteringSession(null);
      await loadData();
    } catch (err) {
      const errorMsg = err.message || 'Không thể đăng ký lớp học này.';
      setRegisterError(errorMsg);
      showToast('Đăng ký thất bại', errorMsg, 'error');
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
      showToast(
        'Hủy đăng ký thành công',
        'Lớp học đã được xóa khỏi thời khóa biểu. 100% học phí đã được hoàn vào ví giao dịch sandbox.',
        'success'
      );
      setCancelingBooking(null);
      await loadData();
    } catch (err) {
      showToast('Không thể hủy lớp', err.message || 'Chỉ được hủy trước giờ bắt đầu ít nhất 2 tiếng.', 'error');
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
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {paginatedClasses.map((cls) => {
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Hiển thị {(currentPage - 1) * CLASSES_PER_PAGE + 1} - {Math.min(currentPage * CLASSES_PER_PAGE, filteredClasses.length)} trên tổng số {filteredClasses.length} lớp học
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
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

        {/* Full Page Payment UI (like court booking) */}
        {registeringSession && (() => {
          const requiredQuota = 1; // CLASS always needs 1 quota
          const originalPrice = sessionQuote?.originalAmount ?? registeringSession.priceAmount;
          const systemDiscount = sessionQuote?.discountAmount ?? 0;

          // Calculate voucher discount (only for RETAIL mode)
          let voucherDiscount = 0;
          if (paymentMode === 'RETAIL' && appliedVoucher) {
            if (appliedVoucher.discountType === 'PERCENT') {
              voucherDiscount = Math.round((originalPrice * appliedVoucher.discountValue) / 100);
            } else if (appliedVoucher.discountType === 'FIXED') {
              voucherDiscount = Math.min(originalPrice, appliedVoucher.discountValue);
            }
          }

          const finalRetailPrice = Math.max(0, originalPrice - systemDiscount - voucherDiscount);
          const finalPrice = paymentMode === 'QUOTA' ? 0 : finalRetailPrice;

          const actionBtnLabel = submittingRegister
            ? 'Đang xử lý...'
            : paymentMode === 'QUOTA'
            ? `Xác Nhận Đặt Chỗ — Trừ ${requiredQuota} Buổi Gói Tập (Còn: ${memberQuota.remainingQuota - requiredQuota} buổi)`
            : paymentMethod === 'VIETQR'
            ? `Tôi Đã Chuyển Khoản — Xác Nhận ${formatMoney(finalPrice)}`
            : paymentMethod === 'CASH_COUNTER'
            ? `Giữ Chỗ (Thanh Toán Tại Quầy) — ${formatMoney(finalPrice)}`
            : paymentMethod === 'VNPAY'
            ? `Thanh Toán Qua VNPAY — ${formatMoney(finalPrice)}`
            : `Xác Nhận & Thanh Toán ${formatMoney(finalPrice)}`;

          return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-3xl max-h-[92vh] my-auto flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 shrink-0">
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

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Main payment card */}
                  <div className="space-y-6">
                    {/* Class info header */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-orange-600">
                        Đăng ký lớp học
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">{registeringSession.className}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {sports.find(s => s.sportId === registeringSession.sportId)?.name || 'Thể thao'}
                      </p>
                    </div>

                    {/* Detailed info section */}
                    <dl className="space-y-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-5 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Thời gian học</dt>
                        <dd className="text-right font-semibold text-slate-800">
                          {formatDate(registeringSession.startTime)}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Kết thúc</dt>
                        <dd className="text-right font-semibold text-slate-800">
                          {new Date(registeringSession.endTime).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} (60 phút)
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Địa điểm / HLV</dt>
                        <dd className="text-right font-semibold text-slate-800">
                          {registeringSession.coachName} · {registeringSession.facilityName || 'F Sport Center'}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Môn thể thao</dt>
                        <dd className="text-right font-semibold text-slate-800">
                          {sports.find(s => s.sportId === registeringSession.sportId)?.name || 'Thể thao'}
                        </dd>
                      </div>

                      {/* Price breakdown */}
                      <div className="flex justify-between gap-4 border-t border-slate-200/60 pt-3">
                        <dt className="text-slate-500">Học phí niêm yết</dt>
                        <dd className={`font-semibold ${paymentMode === 'QUOTA' || systemDiscount > 0 ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {formatMoney(originalPrice)}
                        </dd>
                      </div>

                      {paymentMode === 'QUOTA' && (
                        <div className="flex justify-between items-center rounded-lg bg-orange-100/70 px-3 py-1.5 text-xs text-orange-900 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-orange-600">verified</span>
                            Khấu trừ Quota Gói Hội Viên ({memberQuota.packageName}):
                          </span>
                          <strong className="font-bold text-orange-700">Trừ {requiredQuota} Buổi (0đ)</strong>
                        </div>
                      )}

                      {paymentMode === 'RETAIL' && systemDiscount > 0 && (
                        <div className="flex justify-between items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span className="material-symbols-outlined text-sm text-emerald-600">stars</span>
                            {sessionQuote?.discountLabel || 'Ưu đãi thẻ hội viên'}
                          </span>
                          <strong className="font-bold text-emerald-700">-{formatMoney(systemDiscount)}</strong>
                        </div>
                      )}

                      {paymentMode === 'RETAIL' && voucherDiscount > 0 && (
                        <div className="flex justify-between items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span className="material-symbols-outlined text-sm text-emerald-600">sell</span>
                            Voucher ưu đãi ({appliedVoucher.code}):
                          </span>
                          <strong className="font-bold text-emerald-700">-{formatMoney(voucherDiscount)}</strong>
                        </div>
                      )}

                      {paymentMode === 'RETAIL' && appliedVoucher?.discountType === 'EXTEND_DURATION' && (
                        <div className="flex justify-between items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-800">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span className="material-symbols-outlined text-sm text-blue-600">more_time</span>
                            Ưu đãi Voucher ({appliedVoucher.code}):
                          </span>
                          <strong className="font-bold text-blue-700">Tặng thêm 30 ngày thời hạn gói</strong>
                        </div>
                      )}

                      <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
                        <dt className="font-bold text-slate-800">Tổng thanh toán</dt>
                        <dd className="text-xl font-extrabold text-orange-600">{formatMoney(finalPrice)}</dd>
                      </div>
                    </dl>

                    {/* QUOTA VS RETAIL SELECTOR */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Phương Thức Quyết Toán (Quota Gói vs Bán Lẻ)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Use Quota */}
                        <button
                          type="button"
                          onClick={() => {
                            if (memberQuota.remainingQuota < requiredQuota) {
                              showToast(
                                'Không đủ quota',
                                `Số buổi trong gói hội viên của bạn không đủ (cần ${requiredQuota} buổi, hiện còn ${memberQuota.remainingQuota} buổi). Vui lòng thanh toán theo giá bán lẻ hoặc nạp thêm gói tập.`,
                                'error'
                              );
                              return;
                            }
                            setPaymentMode('QUOTA');
                          }}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            paymentMode === 'QUOTA'
                              ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } ${memberQuota.remainingQuota < requiredQuota ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] text-orange-600">card_membership</span>
                                Dùng Buổi Gói Hội Viên ({requiredQuota} buổi)
                              </span>
                              {paymentMode === 'QUOTA' && (
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">{memberQuota.packageName}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Số dư khả dụng:</span>
                            <span className={`font-extrabold ${memberQuota.remainingQuota >= requiredQuota ? 'text-emerald-600' : 'text-red-500'}`}>
                              {memberQuota.remainingQuota} / {memberQuota.initialQuota} buổi
                            </span>
                          </div>
                        </button>

                        {/* Option 2: Retail Cash / QR */}
                        <button
                          type="button"
                          onClick={() => setPaymentMode('RETAIL')}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            paymentMode === 'RETAIL'
                              ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] text-blue-600">payments</span>
                                Thanh Toán Giá Bán Lẻ
                              </span>
                              {paymentMode === 'RETAIL' && (
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">Chuyển khoản VietQR, VNPay hoặc tiền mặt</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Cần thanh toán:</span>
                            <span className="font-extrabold text-orange-600">{formatMoney(finalRetailPrice)}</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* VOUCHER INPUT BOX (Only applicable for RETAIL payment) */}
                    {paymentMode === 'RETAIL' && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-orange-500">confirmation_number</span>
                          Mã Giảm Giá / Voucher (MGR-18)
                        </label>

                        {appliedVoucher ? (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[11px]">
                                {appliedVoucher.code}
                              </span>
                              <span className="text-emerald-800 font-semibold">
                                {appliedVoucher.discountType === 'PERCENT'
                                  ? `Giảm ${appliedVoucher.discountValue}%`
                                  : appliedVoucher.discountType === 'FIXED'
                                  ? `Giảm ${formatMoney(appliedVoucher.discountValue)}`
                                  : 'Tặng 30 ngày gia hạn'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={removeVoucher}
                              className="text-xs text-red-500 hover:text-red-700 font-bold"
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nhập mã (ví dụ: WELCOME20, SUMMER50K)"
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wider bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={applyVoucher}
                              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                            >
                              Áp Dụng
                            </button>
                          </div>
                        )}
                        {voucherError && <p className="text-[11px] text-red-600 font-medium">{voucherError}</p>}
                      </div>
                    )}

                    {/* Payment method selector (Only for Retail mode) */}
                    {paymentMode === 'RETAIL' && (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Phương Thức Thanh Toán
                        </span>
                        <PaymentMethodSelector
                          selectedMethod={paymentMethod}
                          onChange={setPaymentMethod}
                          amount={finalPrice}
                          transferMemo={`VQRCLS${registeringSession.sessionId}`}
                        />
                      </div>
                    )}

                    {/* Policy notice */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
                      <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0 mt-0.5">verified_user</span>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Quy định hủy lớp học:</div>
                        <p className="text-blue-800 leading-relaxed">
                          Bạn được phép <strong>hủy đăng ký trước giờ học ít nhất 2 tiếng</strong> và nhận <strong>hoàn tiền 100%</strong> vào tài khoản sandbox. 
                          Lịch học sẽ tự động được đồng bộ vào Thời khóa biểu của bạn.
                        </p>
                      </div>
                    </div>
                  </div>
                  {paymentMode === 'RETAIL' && (
                    <PaymentMethodSelector
                      selectedMethod={paymentMethod}
                      onChange={setPaymentMethod}
                      amount={finalPrice}
                      transferMemo={`VQRCLS${registeringSession.sessionId}`}
                    />
                  )}

                  {/* Inline Error Alert */}
                  {registerError && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-start gap-3 animate-in fade-in">
                      <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0 mt-0.5">error</span>
                      <div className="space-y-0.5">
                        <div className="font-bold text-red-900">Không thể hoàn tất đăng ký:</div>
                        <p className="leading-relaxed font-medium">{registerError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Bottom Actions */}
                <div className="p-6 pt-3 border-t border-slate-100 flex gap-3 bg-white shrink-0">
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
                    className="flex-[2] rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/25 transition disabled:opacity-60 cursor-pointer"
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
