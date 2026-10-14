import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';

export default function CoachDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [selectedDay, setSelectedDay] = useState('Thứ Ba');

  const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  const todayClasses = [
    {
      id: 'c1',
      day: 'Thứ Ba',
      time: '07:00 - 08:30',
      title: 'Pickleball Căn Bản & Footwork (Lớp A1)',
      room: 'Sân Mái Che Pro 01',
      studentCount: 12,
      maxStudents: 12,
      status: 'COMPLETED',
      type: 'CLASS',
    },
    {
      id: 'c2',
      day: 'Thứ Ba',
      time: '18:00 - 19:30',
      title: 'Pickleball Chiến Thuật Nâng Cao (Lớp B2)',
      room: 'Sân Mái Che Pro 02',
      studentCount: 8,
      maxStudents: 10,
      status: 'IN_PROGRESS',
      type: 'CLASS',
    },
    {
      id: 'c3',
      day: 'Thứ Ba',
      time: '19:45 - 20:45',
      title: 'PT 1:1 Phục Hồi Cổ Chân - Võ Tấn Triều',
      room: 'Studio PT 03',
      studentCount: 1,
      maxStudents: 1,
      status: 'UPCOMING',
      type: 'PRIVATE',
    },
  ];

  const featuredStudents = [
    {
      id: 's1',
      name: 'Võ Tấn Triều',
      code: 'SE170123',
      class: 'PT 1:1 Phục Hồi',
      goal: 'Củng cố khớp cổ chân & Phản xạ điều bóng lưới',
      attendance: '95%',
      statusBadge: 'Cần cập nhật bài tập',
    },
    {
      id: 's2',
      name: 'Nguyễn Văn An',
      code: 'SE170888',
      class: 'Pickleball Căn Bản A1',
      goal: 'Nắm vững kỹ thuật cầm vợt & Dink bóng',
      attendance: '85%',
      statusBadge: 'Nghỉ 1 buổi tuần trước',
    },
  ];

  return (
    <CoachLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Tổng Quan HLV Có Avatar Bấm Đến Trang Cá Nhân */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Cụm Avatar + Tên HLV */}
            <div className="flex items-center gap-4">
              <Link to="/coach/profile" title="Xem thông tin cá nhân HLV" className="relative group shrink-0">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={currentUser?.name || 'Coach Avatar'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-md group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </Link>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                    FPT MASTER COACH
                  </span>
                  <span className="text-xs text-amber-400 font-bold">★ 4.9 (82 đánh giá)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {currentUser?.name || 'HLV Lê Anh Tuấn'}
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  Bạn có <strong>3 ca dạy</strong> hôm nay. Click vào avatar để xem thông tin cá nhân.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/coach/attendance')}
                className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Điểm Danh Ca Dạy</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/coach/profile')}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Thông Tin Cá Nhân</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Thẻ KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Tổng ca dạy tuần này</span>
              <span className="material-symbols-outlined text-orange-500 text-[20px]">calendar_month</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">14 Ca</div>
            <div className="text-[11px] text-slate-500 font-medium">Đã hoàn thành 6 ca</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Học viên phụ trách</span>
              <span className="material-symbols-outlined text-blue-500 text-[20px]">groups</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">36 Học viên</div>
            <div className="text-[11px] text-slate-500 font-medium">3 Lớp nhóm • 4 Lớp PT 1:1</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Chuyên cần trung bình</span>
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">94.5%</div>
            <div className="text-[11px] text-slate-500 font-medium">+2.1% so với tuần trước</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Đánh giá từ học viên</span>
              <span className="material-symbols-outlined text-amber-500 text-[20px]">star</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">4.9 / 5.0</div>
            <div className="text-[11px] text-slate-500 font-medium">Từ 82 lượt đánh giá</div>
          </div>
        </div>

        {/* Bố cục 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Lịch Huấn Luyện Trong Tuần
                </h2>

                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedDay === day
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {todayClasses.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                        <span className="material-symbols-outlined text-[22px]">
                          {item.type === 'PRIVATE' ? 'person' : 'sports_tennis'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                            {item.time}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                            {item.type === 'PRIVATE' ? 'PT 1:1' : 'Lớp Nhóm'}
                          </span>
                          {item.status === 'IN_PROGRESS' && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 animate-pulse">
                              ⚡ Đang diễn ra
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-slate-900">{item.title}</h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                          <span>Địa điểm: <strong className="text-slate-800">{item.room}</strong></span>
                          <span>•</span>
                          <span>Sĩ số: <strong className="text-slate-800">{item.studentCount}/{item.maxStudents} Học viên</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/coach/attendance')}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer transition-all shrink-0 self-end sm:self-center"
                    >
                      Điểm Danh
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  AI WORKOUT CREATOR
                </span>
                <span className="material-symbols-outlined text-purple-400 text-[20px]">smart_toy</span>
              </div>

              <div>
                <h3 className="text-sm font-black">Tạo Bài Tập AI Nhanh</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Sử dụng AI phân tích InBody học viên để đề xuất giáo án tập bổ trợ phù hợp nhất.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/coach/students')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-500/20"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Tạo Giáo Án Với AI</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Học Viên Cần Lưu Ý
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/coach/students')}
                  className="text-[10px] font-bold text-orange-600 hover:underline"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-3">
                {featuredStudents.map((std) => (
                  <div key={std.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{std.name}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {std.statusBadge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Mục tiêu: {std.goal}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-200/60">
                      <span>Lớp: <strong>{std.class}</strong></span>
                      <span>Chuyên cần: <strong className="text-emerald-600">{std.attendance}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CoachLayout>
  );
}