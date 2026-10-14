import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function MemberLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State quản lý Popover Thông Báo
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Lịch học sắp diễn ra', desc: 'Lớp Pickleball Chiến Thuật bắt đầu lúc 18:00 hôm nay.', time: '10 phút trước', unread: true },
    { id: 2, title: 'Đổi phòng tập', desc: 'Lớp Yoga ngày 21/10 chuyển sang Studio 02.', time: '2 giờ trước', unread: true },
    { id: 3, title: 'Gia hạn gói tập', desc: 'Thẻ Diamond VIP còn 320 ngày sử dụng.', time: '1 ngày trước', unread: false },
  ];

  // Danh sách Menu Sidebar Đầy Đủ (Đã đổi cụm từ "Thông tin cá nhân")
  const memberNavItems = [
    { path: '/member', label: 'Trang chủ Tổng quan', icon: 'dashboard' },
    { path: '/member/schedule', label: 'Lịch tập cá nhân', icon: 'event_available' },
    { path: '/member/attendance', label: 'Lịch sử điểm danh & Kết quả', icon: 'fact_check' },
    { path: '/member/classes', label: 'Đăng ký lớp học', icon: 'sports_tennis' },
    { path: '/member/court-booking', label: 'Đặt sân tự do', icon: 'stadium' },
    { path: '/member/orders', label: 'Đơn đăng ký & Hóa đơn', icon: 'receipt_long' },
    { path: '/member/wallet', label: 'Ví FPT Pay & F-Points', icon: 'account_balance_wallet' },
    { path: '/member/matchmaking', label: 'Ghép đội & Giải đấu', icon: 'groups' },
    { path: '/member/analytics', label: 'Thống kê & InBody', icon: 'analytics' },
    { path: '/member/workout-plan', label: 'Kế hoạch tập luyện & Nhận xét HLV', icon: 'fitness_center' },
    { path: '/member/reviews', label: 'Đánh giá HLV & Lớp', icon: 'star' },
    { path: '/member/membership', label: 'Gói tập & Gia hạn', icon: 'card_membership' },
    { path: '/member/ai-assistant', label: 'Trợ lý Thể thao AI', icon: 'smart_toy' },
    { path: '/member/profile', label: 'Thông tin cá nhân', icon: 'person' }, // ĐÃ ĐỔI CỤM TỪ
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-body-md text-slate-800 antialiased">
      {/* SIDEBAR BÊN TRÁI */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-4 flex-1 flex flex-col min-h-0">
          <div className="space-y-2 shrink-0">
            <Link to="/member" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/30">
                ⚡
              </div>
              <div>
                <div className="font-black text-sm text-slate-900 leading-tight uppercase tracking-wide">
                  FPT SPORTS CENTER
                </div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  FPT UNIVERSITY SANCTUARY
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-between pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-wider">
                • FPT MEMBER
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </span>
            </div>
          </div>

          {/* Nav Items cuộn êm mượt */}
          <nav className="space-y-1 overflow-y-auto pr-1 flex-1 custom-scrollbar">
            <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2 sticky top-0 bg-white py-1">
              MENU HỌC VIÊN
            </div>
            {memberNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/member/profile" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-orange-600 transition-colors">
                {currentUser?.name ? currentUser.name.charAt(0) : 'M'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                  {currentUser?.name || 'Member Võ Tấn Triều'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">Hội viên Thể thao FPT</div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout?.();
                navigate('/login');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT HEADER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm lớp học, sân tập, HLV..."
                className="w-full bg-slate-100 placeholder:text-slate-400 pl-9 pr-4 py-2 rounded-xl text-xs font-medium outline-none border border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/member/classes"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>ĐẶT LỚP HỌC MỚI</span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotiOpen(!isNotiOpen)}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
              </button>

              {isNotiOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase">Thông Báo Học Viên</h4>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">2 Chưa đọc</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs space-y-0.5 ${n.unread ? 'bg-orange-50/60 border border-orange-100' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{n.title}</span>
                          <span className="text-[9px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AVATAR TRÊN HEADER CÓ THỂ BẤM DẪN TỚI THÔNG TIN CÁ NHÂN */}
            <Link
              to="/member/profile"
              title="Thông tin cá nhân"
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-md transition-colors cursor-pointer"
            >
              {currentUser?.name
                ? currentUser.name
                    .split(/\s+/)
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase()
                : 'TT'}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}