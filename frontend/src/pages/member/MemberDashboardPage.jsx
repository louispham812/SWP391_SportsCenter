import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { CardGridSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useApp } from '../../context/AppContext';
import { getMemberBookingSchedule } from '../../services/bookingApi';
import { getMemberMemberships } from '../../services/memberApi';

const formatBookingTime = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const formatBookingAmount = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

export default function MemberDashboardPage() {
  const { currentUser } = useApp();
  const [bookings, setBookings] = useState([]);
  const [activeMembership, setActiveMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingPage, setBookingPage] = useState(1);

  const BOOKINGS_PER_PAGE = 4;
  const totalBookingPages = Math.ceil(bookings.length / BOOKINGS_PER_PAGE) || 1;
  const currentBookings = useMemo(() => {
    const start = (bookingPage - 1) * BOOKINGS_PER_PAGE;
    return bookings.slice(start, start + BOOKINGS_PER_PAGE);
  }, [bookings, bookingPage]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getMemberBookingSchedule(),
      getMemberMemberships().catch(() => []),
    ])
      .then(([schedule, memberships]) => {
        if (!isMounted) return;
        const now = Date.now();
        const upcoming = Array.isArray(schedule)
          ? schedule.filter((booking) => new Date(booking.endTime).getTime() >= now && booking.status !== 'CANCELLED')
          : [];
        setBookings(upcoming);

        const currentActive = Array.isArray(memberships)
          ? memberships.find((m) => m.status === 'ACTIVE')
          : null;
        setActiveMembership(currentActive);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || 'Không thể tải dữ liệu hội viên.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const quickActions = [
    {
      title: 'Đăng ký lớp học',
      desc: 'Đăng ký môn học theo kỳ, chọn lịch và HLV',
      icon: 'school',
      path: '/member/classes',
      color: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white',
    },
    {
      title: 'Đặt sân chơi',
      desc: 'Chọn bộ môn, sân tiêu chuẩn và khung giờ trống',
      icon: 'sports_tennis',
      path: '/member/book/court/sports',
      color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      title: 'Gói tập & Quyền lợi',
      desc: 'Xem hạn dùng, gia hạn hoặc nâng cấp thẻ',
      icon: 'card_membership',
      path: '/member/packages',
      color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      title: 'Lịch sử điểm danh',
      desc: 'Chuyên cần buổi học và lượt qua cổng RFID',
      icon: 'fact_check',
      path: '/member/attendance',
      color: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      title: 'Kế hoạch & Đánh giá HLV',
      desc: 'Chỉ số InBody và nhận xét trực tiếp từ HLV',
      icon: 'monitor_weight',
      path: '/member/workout-plans',
      color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    },
    {
      title: 'Trợ lý AI thể thao',
      desc: 'Hỏi đáp bài tập, dinh dưỡng và giải đáp lịch',
      icon: 'smart_toy',
      path: '/member/ai-assistant',
      color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
  ];

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tổng quan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi trạng thái gói hội viên, lịch tập sắp tới và các dịch vụ thể thao.
          </p>
        </div>

        {/* =========================================
            1. WELCOME HERO BANNER
           ========================================= */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-900 p-6 sm:p-8 text-white shadow-md border border-slate-700">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                Khu vực Hội viên
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Xin chào, <span className="text-orange-400">{currentUser?.name || 'Hội viên'}</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                Chào mừng bạn quay trở lại. Hãy kiểm tra lịch tập hôm nay hoặc đặt sân mới bên dưới.
              </p>

              {/* Thông tin thẻ nhanh */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-orange-400">badge</span>
                  <span className="text-slate-300">Mã:</span>
                  <strong className="text-white font-mono">#{currentUser?.id || '—'}</strong>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">card_membership</span>
                  <span className="text-slate-300">Gói tập:</span>
                  <strong className="text-white">
                    {activeMembership?.packageName || 'Chưa đăng ký gói'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-blue-400">contactless</span>
                  <span className="text-slate-300">Thẻ số:</span>
                  <strong className="text-emerald-400">Sẵn sàng sử dụng</strong>
                </div>
              </div>
            </div>

            {/* Nút hành động nhanh bên phải */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                to="/member/book"
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đặt Sân / Lớp Ngay</span>
                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              </Link>
              <Link
                to="/member/profile"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Thẻ Số &amp; QR Check-in</span>
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================
            2. QUICK SHORTCUTS (6 TILES)
           ========================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.path}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-colors ${action.color}`}>
                  <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                <span>Truy cập</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* =========================================
            3. UPCOMING BOOKINGS LIST
           ========================================= */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Lịch Tập &amp; Đặt Sân Sắp Tới
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi lịch tập và hoạt động thể thao sắp tới của bạn.
              </p>
            </div>

            <Link
              to="/member/schedule"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Xem Thời Khóa Biểu Tuần</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <CardGridSkeleton count={2} cols="grid grid-cols-1 md:grid-cols-2 gap-4" />
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
              <span className="material-symbols-outlined text-[44px] text-slate-300">event_available</span>
              <h3 className="text-sm font-bold text-slate-700 uppercase">Bạn chưa có lịch đặt sân hay lớp học sắp tới</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                Khám phá hệ thống cụm sân Pickleball, Tennis, Bơi lội hoặc các lớp nhóm chất lượng cao ngay hôm nay!
              </p>
              <div className="pt-2">
                <Link
                  to="/member/book"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Đặt Sân Hoặc Lớp Ngay</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentBookings.map((booking) => (
                  <div
                    key={`${booking.bookingType}-${booking.bookingId}`}
                    className="rounded-2xl border border-slate-200 p-5 flex flex-col justify-between card-hover bg-slate-50/50"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          booking.bookingType === 'COURT'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {booking.bookingType === 'COURT' ? 'Sân Chơi' : 'Lớp Huấn Luyện'}
                        </span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {formatBookingAmount(booking.amountPaid)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase">
                          {booking.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          {booking.sportName} • {booking.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <span className="material-symbols-outlined text-orange-500 text-[18px]">schedule</span>
                        <span>{formatBookingTime(booking.startTime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalBookingPages > 1 && (
                <div className="pt-2 border-t border-slate-100">
                  <Pagination
                    currentPage={bookingPage}
                    totalPages={totalBookingPages}
                    onPageChange={setBookingPage}
                  />
                </div>
              )}
            </div>
          )}
        </section>

      </div>
    </MemberLayout>
  );
}
