import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getMemberNotifications } from '../../services/memberApi';

export default function PortalLayout({
  role = 'member', // 'member' | 'receptionist' | 'coach' | 'admin'
  menuItems = [],
  roleBadge = 'F SPORT PORTAL',
  currentUser = {},
  quickAction = null,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useApp();

  const searchInputRef = useRef(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (role === 'member') {
      getMemberNotifications()
        .then((data) => {
          if (Array.isArray(data)) setLiveNotifications(data);
        })
        .catch(() => {});
    }
  }, [role]);

  // System pages directory for quick jump
  const systemPages = [
    { title: 'Tổng quan Hội viên', subtitle: 'Bảng điều khiển cá nhân, lịch tập hôm nay', path: '/member', icon: 'dashboard', roleName: 'Hội viên' },
    { title: 'Gói tập & Quyền lợi', subtitle: 'Xem gói tập, gia hạn và nâng cấp thẻ', path: '/member/packages', icon: 'card_membership', roleName: 'Hội viên' },
    { title: 'Đăng ký lớp học', subtitle: 'Đăng ký và hủy lịch lớp học thể thao theo kỳ', path: '/member/classes', icon: 'school', roleName: 'Hội viên' },
    { title: 'Đặt sân chơi', subtitle: 'Chọn môn thể thao, sân, khung giờ và thanh toán', path: '/member/book/court/sports', icon: 'sports_tennis', roleName: 'Hội viên' },
    { title: 'Thời khóa biểu của tôi', subtitle: 'Lịch sân và lịch lớp đã thanh toán', path: '/member/schedule', icon: 'calendar_month', roleName: 'Hội viên' },
    { title: 'Lịch sử điểm danh', subtitle: 'Chuyên cần buổi học và lượt quét cổng RFID', path: '/member/attendance', icon: 'fact_check', roleName: 'Hội viên' },
    { title: 'Kế hoạch & Nhận xét HLV', subtitle: 'Chỉ số InBody, mục tiêu và phản hồi HLV', path: '/member/workout-plans', icon: 'monitor_weight', roleName: 'Hội viên' },
    { title: 'Tiến độ & Trợ lý AI', subtitle: 'Gợi ý bài tập AI, phân tích InBody', path: '/member/ai-assistant', icon: 'smart_toy', roleName: 'Hội viên' },
    { title: 'Thông báo & Nhắc nhở', subtitle: 'Lịch học sắp tới, hạn gói thẻ, nhận xét', path: '/member/notifications', icon: 'notifications', roleName: 'Hội viên' },
    { title: 'Lịch sử giao dịch', subtitle: 'Biên lai điện tử, hoàn tiền và chi tiêu', path: '/member/transactions', icon: 'account_balance_wallet', roleName: 'Hội viên' },
    { title: 'Hồ sơ & Thẻ số cá nhân', subtitle: 'Mã QR check-in, thông tin cá nhân', path: '/member/profile', icon: 'badge', roleName: 'Hội viên' },
    { title: 'Check-in Lễ tân tại quầy', subtitle: 'Quét thẻ RFID, tìm kiếm hội viên, mở tủ đồ', path: '/receptionist', icon: 'how_to_reg', roleName: 'Lễ tân' },
    { title: 'Bán hàng POS & Thu ngân', subtitle: 'Bán gói tập, nước uống, thiết bị thể thao', path: '/receptionist/pos', icon: 'point_of_sale', roleName: 'Lễ tân' },
    { title: 'Lịch dạy HLV trong tuần', subtitle: 'Lịch ca dạy, phòng tập, số lượng học viên', path: '/coach', icon: 'calendar_today', roleName: 'HLV' },
    { title: 'Học viên của tôi', subtitle: 'Hồ sơ học viên, mục tiêu thể chất PAR-Q', path: '/coach/students', icon: 'groups', roleName: 'HLV' },
    { title: 'Điểm danh & Đánh giá buổi tập', subtitle: 'Ghi nhận chuyên cần, gửi bài tập về nhà', path: '/coach/attendance', icon: 'fact_check', roleName: 'HLV' },
    { title: 'Tổng quan Quản lý Trung tâm', subtitle: 'Doanh thu, tỉ lệ lấp đầy sân, báo cáo vận hành', path: '/admin', icon: 'grid_view', roleName: 'Admin' },
    { title: 'Quản lý Gói tập & Dịch vụ', subtitle: 'Cấu hình giá thẻ, thời hạn, quyền lợi', path: '/admin/packages', icon: 'card_membership', roleName: 'Admin' },
    { title: 'Quản lý Lịch & Sân bãi', subtitle: 'Lịch đặt cụm sân Pickleball, Tennis, Bể bơi', path: '/admin/facilities', icon: 'stadium', roleName: 'Admin' },
    { title: 'Quản lý Nhân sự & Khách', subtitle: 'Danh sách HLV, lễ tân, tài khoản người dùng', path: '/admin/staff', icon: 'group', roleName: 'Admin' },
    { title: 'Duyệt đăng ký nhân viên', subtitle: 'Duyệt hoặc từ chối đăng ký Coach và Lễ tân', path: '/admin/staff-approvals', icon: 'how_to_reg', roleName: 'Admin' },
    { title: 'Bảng giá hội viên công khai', subtitle: 'Trang bảng giá gói Diamond, Gold, Silver', path: '/pricing', icon: 'receipt_long', roleName: 'Public' },
  ];

  // Search Results Filtering
  const cleanQuery = searchQuery.trim().toLowerCase();
  const matchedPages = systemPages.filter(
    (p) =>
      p.title.toLowerCase().includes(cleanQuery) ||
      p.subtitle.toLowerCase().includes(cleanQuery) ||
      p.roleName.toLowerCase().includes(cleanQuery)
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-slate-800 antialiased flex flex-col pb-16 lg:pb-0">
      {/* =========================================
          1. FIXED LEFT SIDEBAR (Unified Width w-72)
         ========================================= */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white z-50 flex flex-col justify-between border-r border-slate-200 shadow-sm transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="px-6 pt-6 pb-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-md shadow-orange-500/25 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4H19L17.5 8H11.5L10.5 11H16.5L15 15H10L8.5 20H4.5L7 4Z" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-[16px] text-slate-900 tracking-tight font-black leading-tight">
                  F SPORT <span className="text-orange-500">CENTER</span>
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                  ATHLETIC SANCTUARY
                </span>
              </div>
            </Link>

            {/* Role Context Pill */}
            <div className="mt-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></span>
                <span className="font-label-sm uppercase tracking-wider font-bold text-[10px] text-slate-800">
                  {roleBadge}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 mt-2">
            <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Menu Chức Năng
            </span>

            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== `/${role}` && location.pathname.startsWith(`${item.path}/`));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white font-headline-sm font-bold shadow-sm shadow-orange-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isActive ? 'text-white font-bold' : 'text-slate-500'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {currentUser.avatar || 'US'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {currentUser.name || 'Người dùng'}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                {currentUser.roleTitle || role.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              title="Đăng xuất"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      {/* =========================================
          2. FIXED TOP HEADER (Synchronized Across Roles)
         ========================================= */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 h-16 bg-white/95 backdrop-blur-xl z-40 border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex items-center justify-between px-4 lg:px-8">
          {/* Left: Mobile Toggle + Search Trigger Button */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
              type="button"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            {/* Clickable Quick Search Bar that opens Command Palette */}
            <div
              onClick={() => setSearchOpen(true)}
              className="relative flex items-center w-full h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 text-xs cursor-pointer transition-all shadow-inner select-none"
            >
              <span className="material-symbols-outlined text-slate-400 text-[18px] mr-2.5">
                search
              </span>
              <span className="truncate text-slate-400">
                Tìm kiếm thông tin, lịch học, hội viên...
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-300 rounded shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Status Chip + Quick Action Button + Notifications + Profile */}
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold uppercase tracking-wider text-[10px]">
                HỆ THỐNG TRỰC TUYẾN
              </span>
            </div>

            {/* Quick Action Button per Role */}
            {quickAction && (
              <button
                onClick={quickAction.onClick}
                type="button"
                className="h-9 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-orange-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">{quickAction.icon}</span>
                <span className="hidden sm:inline">{quickAction.label}</span>
              </button>
            )}

            {/* Notification Trigger & Flyout */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                type="button"
                className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors relative cursor-pointer"
                title="Thông báo"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                {liveNotifications.some((n) => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Flyout Menu */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-headline-sm text-sm font-bold text-slate-900">Thông báo</h3>
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/member/notifications');
                      }}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  {liveNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Chưa có thông báo từ hệ thống.
                    </div>
                  ) : (
                    <div className="py-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {liveNotifications.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            if (item.link) navigate(item.link);
                            else navigate('/member/notifications');
                          }}
                          className="py-2.5 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {item.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar Trigger & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                type="button"
                className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs shadow-sm hover:bg-orange-100 hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer"
              >
                {currentUser.avatar || 'US'}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-slate-100">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      {currentUser.roleTitle}
                    </div>
                  </div>

                  <div className="py-2 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        navigate('/member/profile');
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-500">
                        account_circle
                      </span>
                      <span>Hồ sơ & Thẻ số cá nhân</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/pricing');
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-500">
                        card_membership
                      </span>
                      <span>Bảng giá & Gói hội viên</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =========================================
            3. MAIN CONTENT CANVAS
           ========================================= */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 bg-[#f7f9fb]">
          {children}
        </main>
      </div>

      {/* =========================================
          4. MOBILE BOTTOM NAVIGATION (Thanh điều hướng nhanh trên điện thoại)
         ========================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {menuItems.slice(0, 4).map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== `/${role}` && location.pathname.startsWith(`${item.path}/`));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-orange-500 text-white' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}

        {/* More Menu on Mobile */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          type="button"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <div className="w-9 h-7 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </div>
          <span className="text-[10px] mt-0.5">Thêm</span>
        </button>
      </nav>

      {/* =========================================
          5. COMMAND PALETTE MODAL (Cmd + K / Ctrl + K)
         ========================================= */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
              <span className="material-symbols-outlined text-slate-400 text-[22px] mr-3">
                search
              </span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trang chức năng (gõ để lọc)"
                className="w-full py-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[18px]">clear</span>
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200 rounded ml-2">
                ESC
              </kbd>
            </div>

            {/* Quick Filter Categories / Results */}
            <div className="overflow-y-auto p-3 flex flex-col gap-4">
              {/* 1. Pages & Features */}
              <div>
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trang Chức Năng Hệ Thống ({matchedPages.length})
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {matchedPages.slice(0, 6).map((page) => (
                    <button
                      key={page.path}
                      onClick={() => {
                        navigate(page.path);
                        setSearchOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-orange-500 text-slate-700 group-hover:text-white flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[18px]">{page.icon}</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{page.title}</div>
                          <div className="text-[11px] text-slate-500">{page.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {page.roleName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Micro Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Sử dụng phím <strong>ESC</strong> để đóng</span>
              <span>F Sport Command Palette v2.0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
