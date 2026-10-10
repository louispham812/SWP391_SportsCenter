import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberDashboardPage() {
  const { currentUser, packages, addAuditLog, showToast } = useApp();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pkg_01');

  const upcomingClasses = [
    {
      id: 1,
      title: 'Pickleball Chiến Thuật Nâng Cao',
      coach: 'HLV Lê Anh Tuấn',
      time: '18:00 - 19:30',
      date: 'Hôm nay, 19/11',
      room: 'Sân Mái Che Pro 01',
      status: 'Đã xác nhận',
      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 2,
      title: 'Yoga Phục Hồi Thể Lực & Khớp',
      coach: 'HLV Vũ Thu Hà',
      time: '07:00 - 08:30',
      date: 'Thứ Năm, 21/11',
      room: 'Studio Thiền Định 02',
      status: 'Đã xác nhận',
      statusColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  const attendanceHistory = [
    { date: '17/11/2026', class: 'Pickleball Chiến Thuật Nâng Cao', coach: 'HLV Lê Anh Tuấn', status: 'Có mặt', calories: 420, rating: 'Xuất sắc' },
    { date: '15/11/2026', class: 'Yoga Phục Hồi Thể Lực & Trị Liệu', coach: 'HLV Vũ Thu Hà', status: 'Có mặt', calories: 280, rating: 'Tốt' },
    { date: '12/11/2026', class: 'Pickleball Căn Bản & Footwork', coach: 'HLV Lê Anh Tuấn', status: 'Có mặt', calories: 390, rating: 'Xuất sắc' },
    { date: '08/11/2026', class: 'Bơi Lội Bốn Mùa Sức Bền', coach: 'HLV Nguyễn Đức Duy', status: 'Vắng', calories: 0, rating: 'Nghỉ có phép' },
  ];

  const notifications = [
    { id: 1, type: 'schedule', title: 'Lịch học sắp diễn ra', desc: 'Lớp Pickleball Chiến Thuật bắt đầu lúc 18:00 hôm nay tại Sân Pro 01.', time: '10 phút trước', unread: true },
    { id: 2, type: 'alert', title: 'Thay đổi phòng tập', desc: 'Lớp Yoga ngày 21/11 chuyển sang Studio Thiền Định 02.', time: '2 giờ trước', unread: true },
    { id: 3, type: 'expiry', title: 'Thời hạn gói thành viên', desc: 'Thẻ Silver của bạn còn 26 ngày trước khi đến hạn gia hạn.', time: '1 ngày trước', unread: false },
  ];

  const handleRenewSubmit = (e) => {
    e.preventDefault();
    const pkg = packages.find((p) => p.id === selectedPlan) || packages[0];
    addAuditLog('Gia hạn gói tập', `Hội viên ${currentUser.name} đã gia hạn gói ${pkg.name}`);
    showToast('Gia hạn thành công', `Gói ${pkg.name} đã được kích hoạt! Thẻ hội viên của bạn được cộng thêm 12 tháng.`, 'success');
    setShowRenewModal(false);
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
                Chào mừng trở lại, <span className="text-secondary">Nguyễn Minh Anh</span>!
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-primary text-xs font-bold">
                  Hội viên Silver #ELT-8924
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Đang hoạt động
                </span>
                <span className="text-xs text-slate-500">
                  Hạn thẻ: <strong className="text-slate-800">15/12/2026</strong>
                </span>
              </div>
            </div>

            {/* Top Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowQRModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-primary text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>Mã Check-in QR</span>
              </button>

              <Link
                to="/member/schedule"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Đặt Lịch Lớp Mới</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Vital Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Hạng Thẻ & Ví Tiền
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                account_balance_wallet
              </span>
            </div>
            <div>
              <div className="text-xl font-bold text-primary font-headline-sm">Hạng Bạc (Silver)</div>
              <div className="text-xs text-slate-500 mt-1">
                Số dư ví: <strong className="text-slate-900 font-bold">1.250.000 ₫</strong>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowRenewModal(true)}
                className="text-xs text-secondary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Gia hạn / Nâng hạng</span>
                <span className="material-symbols-outlined text-[14px]">upgrade</span>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Lớp Sắp Diễn Ra
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                sports_tennis
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-primary truncate">Pickleball Pro 01</div>
              <div className="text-xs text-slate-600 mt-1">
                Hôm nay: <strong className="text-primary font-bold">18:00 - 19:30</strong>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold">Còn 2 giờ nữa</span>
              <Link to="/member/schedule" className="text-slate-500 hover:text-primary font-semibold">
                Xem phòng
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Tiến Độ Rèn Luyện
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                fitness_center
              </span>
            </div>
            <div>
              <div className="text-xl font-bold text-primary font-headline-sm">14 / 20 Buổi</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-secondary-container h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
              Đạt 70% mục tiêu tháng 11
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Trợ Lý AI Thể Thao
              </span>
              <span className="material-symbols-outlined text-secondary text-[22px]">
                smart_toy
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-primary mb-1">Gợi ý bài tập hôm nay:</div>
              <p className="text-xs text-slate-600 line-clamp-2">
                Bài tập Footwork & Phục hồi cơ đùi trước buổi đánh Pickleball lúc 18h.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100">
              <Link to="/member/ai-assistant" className="text-xs text-secondary font-bold hover:underline flex items-center gap-1">
                <span>Hỏi trợ lý AI ngay</span>
                <span className="material-symbols-outlined text-[14px]">chat</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Lịch tập hôm nay & Thông báo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột 1 & 2: Buổi tập đã đăng ký */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-lg uppercase text-primary font-bold">
                Lịch Học Đã Đặt Chỗ (Upcoming Schedule)
              </h2>
              <Link to="/member/schedule" className="text-xs text-secondary font-bold hover:underline">
                Xem tất cả lịch →
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingClasses.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary text-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">calendar_today</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-base font-bold text-primary">
                        {item.title}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                        <span>{item.date}</span>
                        <span>•</span>
                        <strong className="text-slate-800">{item.time}</strong>
                        <span>•</span>
                        <span>{item.room}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">
                        Phụ trách: <strong>{item.coach}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${item.statusColor}`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => alert(`Đã kích hoạt nhắc nhở cho lớp: ${item.title}`)}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
                      title="Nhắc nhở"
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột 3: Huấn luyện viên & Lời khuyên */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-headline-sm text-lg uppercase text-primary font-bold">
              Nhận Xét Từ HLV (Coach Notes)
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-primary font-bold flex items-center justify-center text-xs">
                  LA
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">HLV Lê Anh Tuấn</div>
                  <div className="text-[10px] text-slate-500">Sau buổi tập ngày 17/11</div>
                </div>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "Minh Anh di chuyển bộ pháp Forehand hôm nay tiến bộ rõ rệt! Chú ý duỗi thẳng tay khi vung vợt và uống đủ 2.5 lít nước sau buổi tập nhé."
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/member/ai-assistant"
                className="w-full py-3 rounded-xl bg-secondary-container text-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>Tạo Kế Hoạch Bằng AI</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Lịch Sử Điểm Danh & Thông Báo Từ Trung Tâm */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (7 cols): Lịch Sử Điểm Danh & Kết Quả Rèn Luyện */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-base uppercase text-primary font-bold">
                  Lịch Sử Điểm Danh & Kết Quả Buổi Tập
                </h2>
                <p className="text-xs text-slate-500">
                  Ghi nhận sự có mặt, calo tiêu thụ và đánh giá thực tế từ HLV
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Chuyên cần 90%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Ngày</th>
                    <th className="py-2.5 px-3">Lớp học & HLV</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-center">Calo</th>
                    <th className="py-2.5 px-3 text-right">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{row.date}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{row.class}</div>
                        <div className="text-[11px] text-slate-400">{row.coach}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'Có mặt'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600">
                        {row.calories > 0 ? `${row.calories} kcal` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {row.rating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CỘT PHẢI (5 cols): Thông Báo Từ Trung Tâm (Notifications Center) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-base uppercase text-primary font-bold">
                Thông Báo Trung Tâm (Notifications)
              </h2>
              <span className="text-[11px] text-secondary font-bold bg-secondary-container/30 px-2 py-0.5 rounded">
                2 Mới
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 transition-all ${
                    n.unread
                      ? 'bg-slate-50 border-slate-300 shadow-xs'
                      : 'bg-white border-slate-100 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          n.type === 'schedule'
                            ? 'bg-emerald-500'
                            : n.type === 'alert'
                            ? 'bg-amber-500'
                            : 'bg-secondary'
                        }`}
                      ></span>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Renew & Upgrade Membership Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowRenewModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">card_membership</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                  Đăng Ký & Gia Hạn Gói Tập
                </h3>
                <p className="text-xs text-slate-500">
                  Hội viên: {currentUser.name} (#{currentUser.memberId})
                </p>
              </div>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Chọn gói thành viên muốn gia hạn / nâng cấp
                </label>
                <div className="space-y-2">
                  {packages.filter((p) => p.type === 'tier').map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedPlan === pkg.id
                          ? 'border-secondary bg-secondary-container/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan === pkg.id}
                          onChange={() => setSelectedPlan(pkg.id)}
                          className="text-primary"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{pkg.name}</div>
                          <div className="text-[11px] text-slate-500">{pkg.desc}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 shrink-0">
                        {pkg.priceMonthly.toLocaleString('vi-VN')} ₫/tháng
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
                <div className="flex justify-between">
                  <span>Thời hạn gia hạn:</span>
                  <strong>12 Tháng (+ 2 tháng tặng kèm)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Phương thức:</span>
                  <strong>Trừ số dư ví / Thẻ ngân hàng</strong>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Xác Nhận Thanh Toán & Gia Hạn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Check-in Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/30 px-3 py-1 rounded-full inline-block">
              CHECK-IN TỰ ĐỘNG
            </span>
            <h3 className="font-headline-sm text-xl font-bold text-primary">
              Mã Thẻ Thành Viên Số
            </h3>
            <p className="text-xs text-slate-500">
              Đưa mã này trước máy quét tại quầy Lễ tân hoặc cổng ra vào để nhận tủ đồ.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MEMBER_ELT8924_NGUYEN_MINH_ANH"
                alt="Member QR Code"
                className="w-48 h-48 mx-auto rounded-lg shadow-sm"
              />
              <div className="font-mono text-xs font-bold text-slate-700 mt-2">#ELT-8924</div>
            </div>

            <div className="text-xs text-slate-600">
              Hội viên: <strong>Nguyễn Minh Anh</strong> (Hạng Silver)
            </div>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
