import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberDashboardPage() {
  const {
    currentUser,
    packages,
    activePlan,
    healthProfile,
    paymentHistory,
    purchasePackage,
    addCoachReview,
    createSupportTicket,
    addAuditLog,
    showToast,
    classes,
    cancelClass,
  } = useApp();

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Renew form
  const [selectedPlanId, setSelectedPlanId] = useState('pkg_01');
  const [voucherInput, setVoucherInput] = useState('');
  const [paymentGateway, setPaymentGateway] = useState('vnpay'); // 'vnpay' | 'momo' | 'vietqr'

  // Dynamic QR countdown timer
  const [qrCountdown, setQrCountdown] = useState(30);

  useEffect(() => {
    let timer;
    if (showQRModal) {
      timer = setInterval(() => {
        setQrCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQRModal]);

  // Rate Coach Form
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Support feedback form
  const [ticketContent, setTicketContent] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Dịch vụ khách hàng');

  const upcomingClasses = classes.filter((c) => c.isBooked);

  const attendanceHistory = [
    { date: '17/11/2026', class: 'Pickleball Chiến Thuật Nâng Cao', coach: 'HLV Lê Anh Tuấn', status: 'Có mặt', calories: 420, rating: 'Xuất sắc' },
    { date: '15/11/2026', class: 'Yoga Phục Hồi Thể Lực & Trị Liệu', coach: 'HLV Vũ Thu Hà', status: 'Có mặt', calories: 280, rating: 'Tốt' },
    { date: '12/11/2026', class: 'Pickleball Căn Bản & Footwork', coach: 'HLV Lê Anh Tuấn', status: 'Có mặt', calories: 390, rating: 'Xuất sắc' },
    { date: '08/11/2026', class: 'Bơi Lội Bốn Mùa Sức Bền', coach: 'HLV Nguyễn Đức Duy', status: 'Vắng', calories: 0, rating: 'Nghỉ có phép' },
  ];

  const notifications = [
    { id: 1, type: 'schedule', title: 'Lịch học sắp diễn ra', desc: 'Lớp Pickleball Chiến Thuật bắt đầu lúc 18:00 hôm nay tại Sân Pro 01.', time: '10 phút trước', unread: true },
    { id: 2, type: 'alert', title: 'Thay đổi phòng tập', desc: 'Lớp Yoga ngày 21/11 chuyển sang Studio Thiền Định 02.', time: '2 giờ trước', unread: true },
    { id: 3, type: 'expiry', title: 'Thời hạn gói thành viên', desc: `Gói ${activePlan.name} còn ${activePlan.remainingDays} ngày sử dụng.`, time: '1 ngày trước', unread: false },
  ];

  const handleRenewSubmit = (e) => {
    e.preventDefault();
    const pkg = packages.find((p) => p.id === selectedPlanId) || packages[0];
    purchasePackage(pkg, voucherInput, paymentGateway.toUpperCase());
    setShowRenewModal(false);
    setVoucherInput('');
  };

  const handleSubmitRating = (e) => {
    e.preventDefault();
    if (!showRateModal) return;
    addCoachReview({
      coachId: showRateModal.coachId || 'coa_01',
      coachName: showRateModal.coachName || showRateModal.coach || 'HLV Lê Anh Tuấn',
      className: showRateModal.title,
      rating: ratingVal,
      comment: ratingComment,
    });
    setShowRateModal(null);
    setRatingComment('');
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketContent.trim()) return;
    createSupportTicket({
      category: ticketCategory,
      content: ticketContent,
    });
    setTicketContent('');
    setShowFeedbackModal(false);
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-secondary-container/30 text-secondary text-xs uppercase font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Sẵn sàng cho buổi tập hôm nay
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">Hà Nội 26°C · Thời tiết đẹp</span>
              </div>

              <h1 className="font-headline-xl text-2xl sm:text-3xl text-primary font-bold">
                Chào mừng trở lại, <span className="text-secondary">{currentUser.name}</span>!
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-primary text-xs font-bold">
                  Hội viên #{currentUser.memberId || 'ELT-8924'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {activePlan.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
                <span className="text-xs text-slate-500">
                  Hạn thẻ: <strong className="text-slate-800">{activePlan.expireDate}</strong> (Còn {activePlan.remainingDays} ngày)
                </span>
              </div>
            </div>

            {/* Top Action CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowQRModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>Mã Check-in QR</span>
              </button>

              <button
                onClick={() => setShowRenewModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">autorenew</span>
                <span>Gia Hạn Gói</span>
              </button>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                <span>Hóa Đơn / Lịch Sử</span>
              </button>

              <button
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase shadow-sm cursor-pointer"
                title="Gửi phản ánh / khiếu nại"
              >
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vital Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gói tập & Hạng */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Gói Tập & Hạng Thẻ
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                card_membership
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-primary font-headline-sm truncate">{activePlan.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                Số buổi PT còn lại: <strong className="text-secondary font-bold">{activePlan.remainingPTSessions} buổi</strong>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Còn {activePlan.remainingDays} ngày</span>
              <button
                onClick={() => setShowRenewModal(true)}
                className="text-xs text-secondary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Mua thêm</span>
                <span className="material-symbols-outlined text-[14px]">add</span>
              </button>
            </div>
          </div>

          {/* Card 2: Lớp sắp diễn ra */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Lớp Đã Đăng Ký
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                sports_tennis
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-primary truncate">
                {upcomingClasses[0] ? upcomingClasses[0].title : 'Chưa có lớp nào'}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {upcomingClasses[0] ? `${upcomingClasses[0].day} • ${upcomingClasses[0].time}` : 'Hãy đặt chỗ ngay'}
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold">{upcomingClasses.length} lớp đã book</span>
              <Link to="/member/schedule" className="text-slate-500 hover:text-primary font-semibold">
                Xem lịch & Đặt
              </Link>
            </div>
          </div>

          {/* Card 3: Thể trạng InBody */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Chỉ Số InBody 770
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                monitor_weight
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary font-headline-sm">{healthProfile.weight}</span>
                <span className="text-xs text-slate-400 font-semibold">kg</span>
                <span className="text-xs text-emerald-600 font-bold ml-auto">PBF: {healthProfile.pbf}%</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Cơ nạc SMM: <strong className="text-slate-800">{healthProfile.smm} kg</strong> · BMI: {healthProfile.bmi}
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">Đo: {healthProfile.lastTested}</span>
              <Link to="/member/ai-assistant" className="text-secondary font-bold hover:underline">
                Phân tích AI
              </Link>
            </div>
          </div>

          {/* Card 4: Ví điện tử & Điểm tích lũy */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Ví Trả Trước & Điểm
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                savings
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 font-headline-sm">
                {(currentUser.walletBalance || 1250000).toLocaleString('vi-VN')} ₫
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Tích lũy: <strong className="text-amber-600">840 Elite Points</strong>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Giảm 10% tại quầy</span>
              <Link to="/pricing" className="text-secondary font-bold hover:underline">
                Bảng giá gói
              </Link>
            </div>
          </div>
        </div>

        {/* 2 Columns: Classes & Activity / Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Lớp sắp diễn ra */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-sm text-lg font-bold text-primary uppercase">
                    Lớp Học Bạn Đã Đặt Chỗ (Flow 2)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Vui lòng có mặt trước 10 phút. Hủy lịch trước 2 tiếng để bảo lưu vị trí.
                  </p>
                </div>
                <Link
                  to="/member/schedule"
                  className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                >
                  <span>Xem tất cả lớp</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingClasses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-[36px] text-slate-400">event_busy</span>
                    <p className="text-xs text-slate-600 font-semibold mt-1">Hiện bạn chưa đặt chỗ lớp nào.</p>
                    <Link
                      to="/member/schedule"
                      className="mt-3 inline-block px-4 py-2 rounded-xl bg-secondary-container text-primary text-xs font-bold uppercase"
                    >
                      Khám Phá Lớp Học Ngay
                    </Link>
                  </div>
                ) : (
                  upcomingClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-[20px]">sports_tennis</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-sm font-bold text-slate-900">
                              {cls.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Đã xác nhận
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">person</span>
                              {cls.coachName || cls.coach}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {cls.day} ({cls.time})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">stadium</span>
                              {cls.room}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setShowRateModal(cls)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">star</span>
                          <span>Đánh giá HLV</span>
                        </button>
                        <button
                          onClick={() => cancelClass(cls.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Hủy chỗ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lịch sử điểm danh & chuyên cần (Flow 4) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-sm text-lg font-bold text-primary uppercase">
                    Lịch Sử Điểm Danh & Chuyên Cần (Flow 4)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Theo dõi số calo tiêu hao và đánh giá kỹ thuật từ huấn luyện viên.
                  </p>
                </div>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Tỷ lệ chuyên cần: 92%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Lớp học</th>
                      <th className="py-2.5 px-3">HLV phụ trách</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Năng lượng</th>
                      <th className="py-2.5 px-3">Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendanceHistory.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.date}</td>
                        <td className="py-2.5 px-3 font-medium">{row.class}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.coach}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'Có mặt'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-secondary">
                          {row.calories > 0 ? `${row.calories} kcal` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{row.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (4 cols): Thông báo & Lối tắt AI */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Workout Assistant Widget */}
            <div className="bg-gradient-to-br from-primary via-slate-900 to-primary rounded-2xl p-6 text-white shadow-md relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded">
                  AI COACH SPECIALIST
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container animate-ping"></span>
              </div>

              <div>
                <h3 className="font-headline-sm text-lg font-bold">
                  Trợ Lý Thể Thao AI 24/7
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Nhận giáo án cá nhân hóa theo chỉ số cơ/mỡ và giải đáp quy định trung tâm tức thì.
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1 backdrop-blur-sm border border-white/10">
                <div className="font-semibold text-secondary-container">Gợi ý hôm nay:</div>
                <div className="text-[11px] text-slate-200">
                  "Bài tập bộ pháp Agility Ladder & bổ trợ cổ chân Pickleball"
                </div>
              </div>

              <Link
                to="/member/ai-assistant"
                className="w-full py-2.5 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                <span>Mở Trợ Lý Thể Thao AI</span>
              </Link>
            </div>

            {/* Thông báo tự động (MEM-25) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-sm font-bold text-primary uppercase">
                  Thông Báo Tự Động (MEM-25)
                </h3>
                <span className="text-[10px] font-bold text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                  Mới nhất
                </span>
              </div>

              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: DYNAMIC QR CODE CHECK-IN (MEM-10) */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/30 px-3 py-1 rounded-full inline-block">
              CHECK-IN TỰ ĐỘNG · DYNAMIC PASS
            </span>
            <h3 className="font-headline-sm text-xl font-bold text-primary">
              Mã Thẻ Thành Viên Số
            </h3>
            <p className="text-xs text-slate-500">
              Đưa mã này trước máy quét cổng RFID hoặc bàn Lễ tân để mở cửa & nhận tủ đồ.
            </p>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner relative">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SPORT_MEM_${currentUser.memberId || 'ELT-8924'}_COUNT_${qrCountdown}`}
                alt="Member Dynamic QR"
                className="w-48 h-48 mx-auto rounded-lg shadow-sm"
              />
              <div className="font-mono text-xs font-bold text-slate-800 mt-2">
                #{currentUser.memberId || 'ELT-8924'}
              </div>

              {/* Countdown badge */}
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-secondary font-bold">
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Mã làm mới sau: {qrCountdown}s</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              Hội viên: <strong>{currentUser.name}</strong> • Hạng: <strong>{activePlan.tier}</strong>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GIA HẠN GÓI & THANH TOÁN ONLINE (MEM-09, MEM-11) */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRenewModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">credit_card</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                  Gia Hạn & Thanh Toán Trực Tuyến
                </h3>
                <p className="text-xs text-slate-500">
                  Hội viên: {currentUser.name} (#{currentUser.memberId || 'ELT-8924'})
                </p>
              </div>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  1. Chọn gói thành viên
                </label>
                <div className="space-y-2">
                  {packages.slice(0, 4).map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedPlanId === pkg.id
                          ? 'border-secondary bg-secondary-container/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlanId === pkg.id}
                          onChange={() => setSelectedPlanId(pkg.id)}
                          className="text-primary"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{pkg.name}</div>
                          <div className="text-[11px] text-slate-500">{pkg.desc}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 shrink-0">
                        {(pkg.price || pkg.priceMonthly || 1490000).toLocaleString('vi-VN')} ₫
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mã giảm giá Voucher */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  2. Mã Voucher giảm giá (nếu có)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder="Nhập mã (VD: ELITE20, SUMMER30)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase outline-none focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (voucherInput.toUpperCase() === 'ELITE20') {
                        showToast('Áp mã thành công', 'Giảm 20% cho gói tập đã chọn!', 'success');
                      } else {
                        showToast('Mã voucher', 'Mã hợp lệ: ELITE20 (-20%) hoặc SUMMER30 (-30%)', 'info');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
                  >
                    Kiểm tra
                  </button>
                </div>
              </div>

              {/* Cổng thanh toán trực tuyến (MEM-11) */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  3. Chọn cổng thanh toán (Flow 3)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vnpay', name: 'VNPAY-QR', icon: 'qr_code' },
                    { id: 'momo', name: 'Ví MoMo', icon: 'account_balance_wallet' },
                    { id: 'vietqr', name: 'VietQR / Ngân Hàng', icon: 'payments' },
                  ].map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setPaymentGateway(gw.id)}
                      className={`p-3 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentGateway === gw.id
                          ? 'border-secondary bg-secondary-container text-primary shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{gw.icon}</span>
                      <span>{gw.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Xác Nhận & Thanh Toán Trực Tuyến</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LỊCH SỬ THANH TOÁN & HÓA ĐƠN ĐIỆN TỬ (MEM-12) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedReceipt(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">receipt</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                  Tra Cứu Lịch Sử Giao Dịch & Hóa Đơn Điện Tử (MEM-12)
                </h3>
                <p className="text-xs text-slate-500">
                  Danh sách biên lai và hóa đơn VAT đã thanh toán thành công
                </p>
              </div>
            </div>

            {selectedReceipt ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Hóa đơn điện tử</span>
                    <h4 className="font-headline-sm text-base font-bold text-primary">{selectedReceipt.invoiceId}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    ĐÃ THANH TOÁN
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Nội dung:</span>
                    <strong className="text-slate-900">{selectedReceipt.description || 'Gói Dịch Vụ'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Số tiền:</span>
                    <strong className="text-primary font-mono font-bold text-sm">
                      {selectedReceipt.amount.toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày lập:</span>
                    <span>{selectedReceipt.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phương thức:</span>
                    <span>{selectedReceipt.method}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>In / Tải Biên Lai PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Mã HĐ</th>
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Nội dung</th>
                      <th className="py-2.5 px-3">Số tiền</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paymentHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">{item.invoiceId}</td>
                        <td className="py-2.5 px-3">{item.date}</td>
                        <td className="py-2.5 px-3 font-medium max-w-[200px] truncate">{item.description}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.amount.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {item.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(item)}
                            className="px-2.5 py-1 rounded bg-secondary-container text-primary font-bold text-[11px] hover:bg-secondary-fixed-dim cursor-pointer"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: ĐÁNH GIÁ HUẤN LUYỆN VIÊN (MEM-27) */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowRateModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Đánh Giá Huấn Luyện Viên / Buổi Học (MEM-27)
            </h3>
            <p className="text-xs text-slate-500">
              Lớp: <strong>{showRateModal.title}</strong> • HLV: <strong>{showRateModal.coachName || showRateModal.coach}</strong>
            </p>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Đánh giá mức độ hài lòng (1 - 5 Sao)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer ${
                        ratingVal >= star
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Nhận xét & Góp ý kỹ thuật
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="HLV hướng dẫn rất nhiệt tình, bài tập phù hợp..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Gửi Đánh Giá Ngay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: GỬI PHẢN HỒI / KHIẾU NẠI (MEM-26) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Gửi Phản Ánh / Khiếu Nại (MEM-26)
            </h3>
            <p className="text-xs text-slate-500">
              Ý kiến của bạn sẽ được chuyển thẳng đến Ban Quản Lý Trung Tâm để hỗ trợ ngay lập tức.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Phân loại yêu cầu
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none bg-white font-semibold"
                >
                  <option value="Dịch vụ khách hàng">Dịch vụ khách hàng & Lễ tân</option>
                  <option value="Thiết bị & Tủ đồ">Thiết bị & Tủ đồ Locker</option>
                  <option value="Chất lượng sân bãi">Chất lượng sân bãi / Nhiệt độ phòng</option>
                  <option value="Khiếu nại ca tập">Khiếu nại ca tập & Huấn luyện viên</option>
                  <option value="Thanh toán / Thẻ">Thanh toán & Hạn mức thẻ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Chi tiết nội dung phản ánh
                </label>
                <textarea
                  rows={4}
                  value={ticketContent}
                  onChange={(e) => setTicketContent(e.target.value)}
                  placeholder="Mô tả cụ thể sự cố hoặc đề xuất của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all cursor-pointer"
              >
                Gửi Đến Ban Quản Lý
              </button>
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
