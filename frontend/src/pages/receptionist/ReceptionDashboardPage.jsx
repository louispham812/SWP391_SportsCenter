import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { useApp } from '../../context/AppContext';
import { getReceptionistOverview } from '../../services/receptionistApi';
import { CardGridSkeleton } from '../../components/common/Skeleton';
import { getAvatarImageUrl, getAvatarInitials } from '../../utils/avatarHelper';

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatTime = (value) => {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateFull = (date) =>
  new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export default function ReceptionDashboardPage() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getReceptionistOverview();
      setOverview(data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu tổng quan lễ tân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const todayStr = useMemo(() => formatDateFull(new Date()), []);

  const quickActions = [
    {
      title: 'Check-in tại quầy',
      desc: 'Quét thẻ từ RFID hoặc mã QR mở cổng tự động cho hội viên',
      icon: 'how_to_reg',
      path: '/receptionist/checkin',
      color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
    },
    {
      title: 'Bán hàng & Thu ngân POS',
      desc: 'Bán gói tập, nước uống, gia hạn thẻ và thanh toán VietQR / POS',
      icon: 'point_of_sale',
      path: '/receptionist/pos',
      color: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white',
    },
    {
      title: 'Mượn & Thuê Dụng Cụ',
      desc: 'Ghi nhận mượn trả vợt, bóng, tủ đồ locker và phụ kiện thể thao',
      icon: 'sports_tennis',
      path: '/receptionist/equipment',
      color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      title: 'Tra cứu & Quản lý Hội viên',
      desc: 'Cấp thẻ RFID, tìm kiếm thông tin, xem gói tập và lịch sử check-in',
      icon: 'badge',
      path: '/receptionist/members',
      color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
    {
      title: 'Thời khóa biểu các lớp',
      desc: 'Xem lịch các ca học theo tuần, kiểm tra HLV và danh sách học viên',
      icon: 'calendar_month',
      path: '/receptionist/classes',
      color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    },
    {
      title: 'Báo cáo ca trực & Doanh thu',
      desc: 'Xem sao kê biên lai, đối soát doanh thu ca và xuất báo cáo CSV',
      icon: 'monitoring',
      path: '/receptionist/shift',
      color: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    },
  ];

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                QUẦY LỄ TÂN & ĐIỀU HÀNH TRUNG TÂM
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Tổng quan</h1>
              <p className="text-xs sm:text-sm text-slate-300 capitalize">
                {todayStr} · Xin chào, <strong>{currentUser?.name || 'Lễ tân F Sport'}</strong>!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fetchOverview}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Làm mới</span>
              </button>
              <Link
                to="/receptionist/checkin"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white transition shadow-md shadow-orange-500/25 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>Vào Check-in</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : (
          <>
            {/* 5 Top Operational KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Doanh thu */}
              <Link
                to="/receptionist/shift"
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-orange-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doanh thu hôm nay</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                    {formatMoney(overview?.todayRevenue || 0)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {overview?.completedTransactionsCount || 0} giao dịch
                  </div>
                </div>
              </Link>

              {/* Lượt Check-in */}
              <Link
                to="/receptionist/checkin"
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lượt Check-in</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {overview?.todayCheckInsCount || 0} <span className="text-xs font-semibold text-slate-500">lượt</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    <span className="text-emerald-600 font-bold">{overview?.validCheckInsCount || 0} hợp lệ</span>
                    {' · '}
                    <span className="text-rose-500 font-bold">{overview?.rejectedCheckInsCount || 0} từ chối</span>
                  </div>
                </div>
              </Link>

              {/* Hội viên mới */}
              <Link
                to="/receptionist/members"
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hội viên mới</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {overview?.newMembersTodayCount || 0} <span className="text-xs font-semibold text-slate-500">người</span>
                  </div>
                  <div className="text-[11px] text-blue-600 font-bold mt-0.5">
                    Đăng ký & kích hoạt
                  </div>
                </div>
              </Link>

              {/* Lớp học hôm nay */}
              <Link
                to="/receptionist/classes"
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lớp học hôm nay</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                    {overview?.todayClassesCount || 0} <span className="text-xs font-semibold text-slate-500">ca dạy</span>
                  </div>
                  <div className="text-[11px] text-purple-600 font-bold mt-0.5">
                    Đang & sắp diễn ra
                  </div>
                </div>
              </Link>

              {/* Dụng cụ đang mượn */}
              <Link
                to="/receptionist/equipment"
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dụng cụ đang mượn</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">sports_tennis</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                    {overview?.activeLoansCount || 0} <span className="text-xs font-semibold text-slate-500">thiết bị</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Chưa hoàn trả quầy
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">bolt</span>
                  Thao tác nghiệp vụ quầy
                </h2>
                <span className="text-xs text-slate-500">Chọn chức năng làm việc nhanh</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {quickActions.map((act) => (
                  <Link
                    key={act.path}
                    to={act.path}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-orange-400 hover:shadow-md transition-all group flex items-start gap-3.5"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${act.color}`}>
                      <span className="material-symbols-outlined text-[22px]">{act.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors flex items-center justify-between">
                        <span>{act.title}</span>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2-Column Live Operation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Column 1: Live Check-in Feed (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">sensors</span>
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Lượt Check-in gần nhất tại quầy</h3>
                      <p className="text-[11px] text-slate-500">Ghi nhận quẹt thẻ RFID và mã QR vào cửa</p>
                    </div>
                  </div>
                  <Link
                    to="/receptionist/checkin"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Vào quầy</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>

                {(!overview?.recentCheckIns || overview.recentCheckIns.length === 0) ? (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">how_to_reg</span>
                    <p className="text-xs">Chưa có lượt check-in nào được ghi nhận gần đây.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {overview.recentCheckIns.map((ci) => {
                      const isValid = ci.result === 'VALID';
                      const avatarUrl = getAvatarImageUrl(ci.memberAvatar);

                      return (
                        <div
                          key={ci.checkInId}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-100 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={ci.memberName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{getAvatarInitials(ci.memberName, 'HV')}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {ci.memberName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                <span>{ci.memberPhone || `#${ci.memberId}`}</span>
                                <span>·</span>
                                <span>{formatTime(ci.checkedInAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {isValid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                Từ chối
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column 2: Today's Class Schedule (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">event_available</span>
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Lớp học hôm nay</h3>
                      <p className="text-[11px] text-slate-500">{overview?.todayClasses?.length || 0} ca học diễn ra</p>
                    </div>
                  </div>
                  <Link
                    to="/receptionist/classes"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Lịch tuần</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>

                {(!overview?.todayClasses || overview.todayClasses.length === 0) ? (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                    <p className="text-xs">Hôm nay không có lớp học nào được xếp lịch.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {overview.todayClasses.map((cls) => {
                      const coachAvatarUrl = getAvatarImageUrl(cls.coachAvatar);

                      return (
                        <div
                          key={cls.sessionId}
                          className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-purple-50/30 border border-slate-100 transition space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-black text-xs text-slate-900 line-clamp-1">
                                {cls.className}
                              </div>
                              <div className="text-[11px] text-purple-700 font-bold mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                              {cls.bookedSlots || 0}/{cls.maxSlots || 20} HV
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                            <div className="w-6 h-6 rounded-lg bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                              {coachAvatarUrl ? (
                                <img src={coachAvatarUrl} alt={cls.coachName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{getAvatarInitials(cls.coachName, 'HLV')}</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-600 font-medium truncate">
                              HLV: <strong>{cls.coachName}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Shift Revenue Breakdown by Payment Method */}
            {overview?.paymentMethods && overview.paymentMethods.length > 0 && (
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-[18px]">account_balance_wallet</span>
                    Doanh thu quầy theo phương thức thanh toán
                  </h3>
                  <Link to="/receptionist/shift" className="text-xs font-bold text-orange-600 hover:text-orange-700">
                    Xem chi tiết sao kê ca &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {overview.paymentMethods.map((pm) => (
                    <div key={pm.method} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{pm.method}</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{formatMoney(pm.amount)}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200">
                        {pm.count} GD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ReceptionistLayout>
  );
}
