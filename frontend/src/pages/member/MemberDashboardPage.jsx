import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberDashboardPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    activePlan,
    classes = [],
    cancelClass,
    showToast,
  } = useApp();

  // Modal QR Check-in
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCountdown] = useState(30);

  // Tab chuyển đổi nội dung chính
  const [activeTab, setActiveTab] = useState('upcoming');

  const user = useMemo(() => currentUser || {
    name: 'Hội viên',
    id: 'MEM001',
    memberId: 'MEM001',
    email: 'member@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  }, [currentUser]);

  const plan = useMemo(() => activePlan || {
    name: 'Gold Member (Hội Viên Vàng)',
    status: 'active',
    expireDate: '31/12/2026',
    remainingDays: 45,
    remainingPTSessions: 6,
    tier: 'Gold',
  }, [activePlan]);

  const upcomingClasses = useMemo(() => {
    return classes.filter((c) => c?.isBooked);
  }, [classes]);

  const coachFeedback = useMemo(() => [
    {
      id: 1,
      coachName: 'HLV Lê Anh Tuấn',
      coachRole: 'Master Coach Pickleball',
      date: '17/10/2026',
      content: 'Đòn Forehand Drive của Triều đã ổn định hơn. Cần chú ý hạ thấp trọng tâm bộ chân khi di chuyển về phía lưới.',
      workoutPlanTip: 'Tập bổ trợ 3 buổi/tuần: Agility Ladder (bộ pháp) + Squat nhảy (sức bật).',
    },
  ], []);

  const attendanceHistory = useMemo(() => [
    { date: '17/10/2026', class: 'Pickleball Chiến Thuật Nâng Cao', coach: 'HLV Lê Anh Tuấn', status: 'Có mặt', calories: 420 },
    { date: '15/10/2026', class: 'Yoga Phục Hồi & Trị Liệu', coach: 'HLV Vũ Thu Hà', status: 'Có mặt', calories: 280 },
    { date: '12/10/2026', class: 'Pickleball Căn Bản & Footwork', coach: 'HLV Lê Anh Tuấn', status: 'Có mặt', calories: 390 },
  ], []);

  const notifications = useMemo(() => [
    { id: 1, type: 'schedule', title: 'Lịch học hôm nay', desc: 'Lớp Pickleball Chiến Thuật diễn ra lúc 18:00 tại Sân Pro 01.', time: '15 phút trước' },
    { id: 2, type: 'alert', title: 'Đổi phòng tập', desc: 'Lớp Yoga ngày 21/10 chuyển sang Studio 02.', time: '2 giờ trước' },
    { id: 3, type: 'expiry', title: 'Hạn gói tập', desc: `Gói ${plan.name} còn ${plan.remainingDays} ngày sử dụng.`, time: '1 ngày trước' },
  ], [plan]);

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* 1. WELCOME HERO & QUẢN LÝ THẺ HỘI VIÊN */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Thông tin hội viên */}
            <div className="flex items-center gap-4">
              <Link to="/member/profile" title="Xem thông tin cá nhân" className="relative group">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={user.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-md group-hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </Link>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] uppercase font-black tracking-wider">
                    {plan.tier} MEMBER
                  </span>
                  <span className="text-xs text-slate-400">ID: #{user.memberId || user.id}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user.name}
                </h1>

                <p className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                  <span>Gói: <strong className="text-orange-400">{plan.name}</strong></span>
                  <span>•</span>
                  <span>Còn <strong className="text-white">{plan.remainingDays} ngày</strong></span>
                </p>
              </div>
            </div>

            {/* Các hành động chính */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>Mã Check-in QR</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/member/membership')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">autorenew</span>
                <span>Gia Hạn Gói</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. THANH THAO TÁC NHANH */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/member/schedule"
            className="p-3.5 bg-white hover:bg-orange-50 rounded-2xl border border-slate-200 hover:border-orange-200 transition-all text-center flex flex-col items-center gap-2 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Lịch Tập & Đặt Lớp</span>
          </Link>

          <Link
            to="/member/workout-plan"
            className="p-3.5 bg-white hover:bg-orange-50 rounded-2xl border border-slate-200 hover:border-orange-200 transition-all text-center flex flex-col items-center gap-2 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">fitness_center</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Kế Hoạch & Lời Khuyên</span>
          </Link>

          <Link
            to="/member/membership"
            className="p-3.5 bg-white hover:bg-orange-50 rounded-2xl border border-slate-200 hover:border-orange-200 transition-all text-center flex flex-col items-center gap-2 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">card_membership</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Gói Tập & Gia Hạn</span>
          </Link>

          <Link
            to="/member/ai-assistant"
            className="p-3.5 bg-white hover:bg-orange-50 rounded-2xl border border-slate-200 hover:border-orange-200 transition-all text-center flex flex-col items-center gap-2 group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Hỏi Trợ Lý AI</span>
          </Link>

          <Link
            to="/member/profile"
            className="p-3.5 bg-white hover:bg-orange-50 rounded-2xl border border-slate-200 hover:border-orange-200 transition-all text-center flex flex-col items-center gap-2 group shadow-sm col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Thông Tin Cá Nhân</span>
          </Link>
        </div>

        {/* 3. KHU VỰC NỘI DUNG CHÍNH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'upcoming'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">event_available</span>
                <span>Lớp Đã Đặt Chỗ ({upcomingClasses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('plan')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'plan'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                <span>Lời Khuyên & Nhận Xét HLV</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span>Lịch Sử Điểm Danh</span>
              </button>
            </div>

            {/* TAB 1 */}
            {activeTab === 'upcoming' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    Lớp Học Sắp Diễn Ra
                  </h2>
                  <Link to="/member/schedule" className="text-xs font-bold text-orange-600 hover:underline">
                    + Đặt thêm lớp mới
                  </Link>
                </div>

                {upcomingClasses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <span className="material-symbols-outlined text-[40px] text-slate-400">event_busy</span>
                    <p className="text-xs text-slate-600 font-semibold">Bạn chưa đăng ký lịch học nào trong tuần này.</p>
                    <Link
                      to="/member/schedule"
                      className="inline-block px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold uppercase shadow-md hover:bg-orange-600 transition-colors"
                    >
                      Xem Lịch & Đặt Chỗ Ngay
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">sports_tennis</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">{cls.title}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                                Đã Giữ Chỗ
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                              <span>HLV: <strong className="text-slate-800">{cls.coachName || cls.coach}</strong></span>
                              <span>•</span>
                              <span>Thời gian: <strong className="text-slate-800">{cls.day} ({cls.time})</strong></span>
                              <span>•</span>
                              <span>Địa điểm: <strong className="text-slate-800">{cls.room || 'Sân Pro 01'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            cancelClass?.(cls.id);
                            showToast?.('Đã hủy lịch', `Đã hủy chỗ lớp ${cls.title}`, 'info');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors shrink-0 self-end sm:self-center cursor-pointer"
                        >
                          Hủy Chỗ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 */}
            {activeTab === 'plan' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    Nhận Xét Kỹ Thuật Từ Huấn Luyện Viên
                  </h2>
                  <span className="text-xs text-slate-400">Cập nhật gần nhất: {coachFeedback[0]?.date}</span>
                </div>

                {coachFeedback.map((fb) => (
                  <div key={fb.id} className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-600 text-[22px]">record_voice_over</span>
                        <div>
                          <h3 className="text-xs font-black text-slate-900">{fb.coachName}</h3>
                          <p className="text-[10px] text-slate-500">{fb.coachRole}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full">
                        Đánh giá kỹ thuật
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      "{fb.content}"
                    </p>

                    <div className="pt-2 border-t border-orange-200/60 text-xs text-orange-900 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-orange-600">lightbulb</span>
                      <span>Gợi ý bài tập: {fb.workoutPlanTip}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3 */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Nhật Ký Chuyên Cần & Calo Tiêu Hao
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Ngày</th>
                        <th className="py-2.5 px-3">Nội dung tập</th>
                        <th className="py-2.5 px-3">HLV phụ trách</th>
                        <th className="py-2.5 px-3">Điểm danh</th>
                        <th className="py-2.5 px-3 text-right">Calo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {attendanceHistory.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.date}</td>
                          <td className="py-2.5 px-3 font-medium">{row.class}</td>
                          <td className="py-2.5 px-3 text-slate-500">{row.coach}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-orange-600">
                            {row.calories} kcal
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  AI ASSISTANT
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>

              <div>
                <h3 className="text-base font-black">Hỏi Đáp Cùng Trợ Lý AI</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Giải đáp thắc mắc về kỹ thuật thi đấu, quy định đặt sân và thực đơn dinh dưỡng.
                </p>
              </div>

              <Link
                to="/member/ai-assistant"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-500/20"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Bắt Đầu Trò Chuyện</span>
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Thông Báo Tự Động
                </h3>
                <span className="text-[10px] font-bold text-slate-400">3 Mới</span>
              </div>

              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL CHECK-IN QR */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative animate-in zoom-in-95 border border-slate-200">
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block">
                DYNAMIC CHECK-IN PASS
              </span>
              <h3 className="text-lg font-black text-slate-900">Mã Thẻ Thành Viên Số</h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MEMBER_${user.memberId}_${qrCountdown}`}
                  alt="Member QR"
                  className="w-44 h-48 mx-auto rounded-lg shadow-sm"
                />
                <p className="font-mono text-xs font-bold text-slate-800 mt-2">#{user.memberId}</p>
              </div>

              <p className="text-xs text-slate-500">Đưa mã trước máy quét tại cổng RFID để vào tập.</p>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}