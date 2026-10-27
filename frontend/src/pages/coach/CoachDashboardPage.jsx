import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';
import { getCoachSchedule, getCoachStudents } from '../../services/bookingApi';
import { getCoachProfile, getCoachIncome } from '../../services/coachApi';
import { getMyCoachFeedbacks } from '../../services/engagementApi';
import { CardGridSkeleton } from '../../components/common/Skeleton';

const mondayOf = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const dateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function CoachDashboardPage() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [income, setIncome] = useState(null);

  const todayKey = dateKey(new Date());

  useEffect(() => {
    let active = true;
    const weekStart = mondayOf(new Date());
    const weekKey = dateKey(weekStart);

    Promise.all([
      getCoachSchedule(weekKey).catch(() => []),
      getCoachStudents().catch(() => []),
      getCoachProfile().catch(() => null),
      getMyCoachFeedbacks().catch(() => null),
      getCoachIncome().catch(() => null),
    ])
      .then(([scheduleRes, studentsRes, profileRes, feedbacksRes, incomeRes]) => {
        if (!active) return;
        setClasses(Array.isArray(scheduleRes) ? scheduleRes : []);
        setStudents(Array.isArray(studentsRes) ? studentsRes : []);
        setProfile(profileRes);
        setFeedbackStats(feedbacksRes);
        setIncome(incomeRes);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filter today's classes
  const todayClasses = useMemo(() => {
    return classes
      .filter((cls) => dateKey(cls.startTime) === todayKey && cls.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [classes, todayKey]);

  // Quick actions list for coach
  const quickActions = [
    {
      title: 'Lịch giảng dạy tuần',
      desc: 'Quản lý lịch ca dạy 7 ngày, theo dõi trùng giờ và ca kế tiếp',
      icon: 'calendar_month',
      path: '/coach/schedule',
      color: 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white',
    },
    {
      title: 'Học viên & Giáo án AI',
      desc: 'Theo dõi mục tiêu thể chất, gợi ý giáo án AI và bài tập về nhà',
      icon: 'groups',
      path: '/coach/students',
      color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      title: 'Điểm danh ca dạy',
      desc: 'Ghi nhận chuyên cần, điểm danh học viên và nhận xét buổi tập',
      icon: 'fact_check',
      path: '/coach/attendance',
      color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      title: 'Đánh giá từ học viên',
      desc: 'Xem xếp hạng sao, nhận xét đóng góp ý kiến về chất lượng dạy',
      icon: 'star',
      path: '/coach/reviews',
      color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    },
    {
      title: 'Khai báo lịch rảnh & Nghỉ',
      desc: 'Cập nhật khung giờ nhận lớp hoặc gửi đơn xin nghỉ đổi ca',
      icon: 'more_time',
      path: '/coach/schedule',
      color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    },
    {
      title: 'Hồ sơ & Thẻ số HLV',
      desc: 'Cập nhật bằng cấp, chứng chỉ thể thao và mã QR định danh HLV',
      icon: 'badge',
      path: '/coach/profile',
      color: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
  ];

  const ratingAvg = feedbackStats?.averageRating || 4.9;
  const ratingCount = feedbackStats?.totalFeedbacks || 18;

  return (
    <CoachLayout>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* =========================================
            1. PAGE HEADER (CHỈ ĐỂ "TỔNG QUAN")
           ========================================= */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tổng quan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bảng điều khiển hoạt động giảng dạy, theo dõi ca dạy hôm nay và tiến độ học viên.
          </p>
        </div>

        {/* =========================================
            2. WELCOME HERO BANNER
           ========================================= */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-6 sm:p-8 text-white shadow-md border border-slate-700">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                Huấn Luyện Viên Chuyên Nghiệp
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Xin chào, <span className="text-orange-400">{currentUser?.name || 'Coach'}</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                Hôm nay bạn có <strong>{todayClasses.length} ca dạy</strong>. Chúc bạn có một ngày làm việc hiệu quả và truyền cảm hứng tập luyện cho học viên!
              </p>

              {/* Thông tin HLV nhanh */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-orange-400">badge</span>
                  <span className="text-slate-300">Mã HLV:</span>
                  <strong className="text-white font-mono">#{currentUser?.id || '2'}</strong>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">sports</span>
                  <span className="text-slate-300">Chuyên môn:</span>
                  <strong className="text-white">
                    {profile?.specialty || 'Huấn Luyện Viên Đa Năng'}
                  </strong>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-yellow-400">star</span>
                  <span className="text-slate-300">Đánh giá:</span>
                  <strong className="text-white font-bold">
                    {ratingAvg} / 5.0 ({ratingCount} lượt)
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <Link
                to="/coach/attendance"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Điểm Danh Ca Dạy</span>
              </Link>
              <Link
                to="/coach/schedule"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Xem Lịch Tuần</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================
            3. KEY STATS CARDS
           ========================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">calendar_today</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Ca Dạy Hôm Nay
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {todayClasses.length} ca
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">date_range</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tổng Ca Trong Tuần
              </span>
              <div className="text-2xl font-black text-blue-600 mt-0.5">
                {classes.filter((c) => c.status !== 'CANCELLED').length} ca
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">groups</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Học Viên Phụ Trách
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {students.length} học viên
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">grade</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Đánh Giá Trung Bình
              </span>
              <div className="text-2xl font-black text-amber-600 mt-0.5 flex items-center gap-1">
                <span>{ratingAvg}</span>
                <span className="text-base text-amber-500">★</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            4. CA DẠY HÔM NAY (TODAY'S SCHEDULE)
           ========================================= */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lịch Ca Dạy Hôm Nay ({todayClasses.length})
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <Link
              to="/coach/schedule"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem toàn bộ tuần</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <CardGridSkeleton count={2} cols="grid gap-3 sm:grid-cols-2" />
          ) : todayClasses.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">event_available</span>
              </div>
              <p className="text-sm font-bold text-slate-700">Hôm nay bạn không có ca dạy nào</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hãy kiểm tra lịch của các ngày tiếp theo trong tuần hoặc chuẩn bị giáo án cho học viên.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayClasses.map((cls, idx) => (
                <article
                  key={cls.sessionId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Ca kế tiếp
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {cls.className}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <span className="material-symbols-outlined text-[15px] text-orange-500">sports</span>
                        {cls.sportName || 'Thể thao'}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                        {cls.facilityName || 'Cơ sở F Sport'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Sĩ số: <strong className="text-slate-900">{cls.bookedSlots ?? 0}</strong> / {cls.maxSlots ?? '—'} học viên
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/coach/attendance"
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-orange-500 hover:bg-orange-600 py-2 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    Điểm danh ca này
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* =========================================
            5. QUICK ACTIONS GRID
           ========================================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lối Tắt Chức Năng Huấn Luyện
              </h3>
              <p className="text-xs text-slate-500">
                Truy cập nhanh các công cụ nghiệp vụ của Huấn luyện viên
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.path}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${action.color}`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {action.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 self-end mt-1 group-hover:translate-x-1 transition-transform">
                  <span>Truy cập</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </CoachLayout>
  );
}
