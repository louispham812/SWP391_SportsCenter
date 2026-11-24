import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getMemberNotifications } from '../../services/memberApi';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/engagementApi';
import { getAvatarImageUrl, getAvatarInitials } from '../../utils/avatarHelper';
import { getPortalHomePath, getRoleProfileLink } from '../../utils/portalRoute';

const ROLE_LABELS = {
  member: 'Hội viên',
  coach: 'HLV',
  receptionist: 'Lễ tân',
  admin: 'Quản trị',
};

const EXTRA_ROLE_PAGES = {
  member: [
    {
      title: 'Đặt lịch & Chọn dịch vụ',
      subtitle: 'Chọn thuê sân, lớp học hoặc HLV riêng PT 1-1',
      path: '/member/book',
      icon: 'add_circle',
    },
  ],
};

const NOTIFICATION_INBOX_ROUTES = {
  member: '/member/notifications',
  coach: '/coach/notifications',
};

const SECONDARY_DROPDOWN_LINKS = {
  member: { label: 'Hạng hội viên & Quyền lợi', path: '/member/packages', icon: 'card_membership' },
  coach: { label: 'Về trang công khai', path: '/', icon: 'public' },
  receptionist: { label: 'Về trang công khai', path: '/', icon: 'public' },
  admin: { label: 'Về trang công khai', path: '/', icon: 'public' },
};

const parseNotifications = (data) => {
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.notifications)
    ? data.notifications
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return rawList.map((item, idx) => ({
    id: item.notificationId ?? item.id ?? `notif-${idx}`,
    notificationId: item.notificationId ?? item.id,
    title: item.title || 'Thông báo hệ thống',
    message: item.message || item.content || '',
    isRead: Boolean(item.read ?? item.isRead ?? false),
    createdAt: item.createdAt || null,
    link: item.link || null,
    type: item.type || 'SYSTEM',
  }));
};

const getActiveMenuPath = (pathname, menuItems, role) => {
  const matches = menuItems.filter(
    (item) => pathname === item.path || (item.path !== `/${role}` && pathname.startsWith(`${item.path}/`)),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.path.length > best.path.length ? item : best)).path;
};

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, logout } = useApp();
  const portalHomePath = getPortalHomePath(role, getPortalHomePath(currentRole, '/'));

  const searchInputRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShowNotifications(false);
        setShowUserMenu(false);
        setMobileMenuOpen(false);
      }
    };
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const fetchLiveNotifications = useCallback(async () => {
    let generalList = [];
    try {
      const data = await getNotifications();
      generalList = parseNotifications(data);
    } catch {
      // ignore if endpoint fails for role
    }

    if (role === 'member') {
      try {
        const memberData = await getMemberNotifications();
        const memberList = parseNotifications(memberData);
        const byId = new Map();
        [...memberList, ...generalList].forEach((n) => {
          const key = n.id ?? `${n.title}-${n.createdAt}`;
          if (!byId.has(key)) byId.set(key, n);
        });
        const merged = Array.from(byId.values()).sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setLiveNotifications(merged);
        return;
      } catch {
        // fallback to generalList below
      }
    }

    if (generalList.length > 0) {
      setLiveNotifications(generalList);
    }
  }, [role]);

  useEffect(() => {
    fetchLiveNotifications();
    const onNotificationsUpdated = () => fetchLiveNotifications();
    window.addEventListener('sporthub:notifications-updated', onNotificationsUpdated);
    return () => window.removeEventListener('sporthub:notifications-updated', onNotificationsUpdated);
  }, [fetchLiveNotifications]);

  const roleName = ROLE_LABELS[role] || 'Hệ thống';
  const existingPaths = new Set(menuItems.map((item) => item.path));
  const searchablePages = [
    ...menuItems.map((item) => ({
      title: item.label,
      subtitle: item.subtitle || item.section || 'Trang chức năng hệ thống',
      path: item.path,
      icon: item.icon,
      roleName,
    })),
    ...(EXTRA_ROLE_PAGES[role] || [])
      .filter((item) => !existingPaths.has(item.path))
      .map((item) => ({ ...item, roleName })),
  ];

  // Search Results Filtering
  const cleanQuery = searchQuery.trim().toLowerCase();
  const matchedPages = searchablePages.filter(
    (p) =>
      p.title.toLowerCase().includes(cleanQuery) ||
      p.subtitle.toLowerCase().includes(cleanQuery) ||
      p.path.toLowerCase().includes(cleanQuery) ||
      p.roleName.toLowerCase().includes(cleanQuery)
  );

  const hasSections = menuItems.some((item) => Boolean(item.section));
  const pinnedMobileItems = menuItems.filter((item) => item.mobilePin);
  const mobileBottomItems = (pinnedMobileItems.length > 0 ? pinnedMobileItems : menuItems).slice(0, 4);
  const inboxRoute = NOTIFICATION_INBOX_ROUTES[role] || null;
  const primaryProfileLink = getRoleProfileLink(role, portalHomePath);
  const secondaryDropdownLink = SECONDARY_DROPDOWN_LINKS[role] || {
    label: 'Về trang công khai',
    path: '/',
    icon: 'public',
  };

  const handleMarkAllNotificationsRead = async () => {
    if (liveNotifications.some((n) => !n.isRead)) {
      await markAllNotificationsRead().catch(() => {});
      setLiveNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
    setShowNotifications(false);
  };

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
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto pb-3">
          {/* Brand Header */}
          <div className="px-5 pt-4 pb-3">
            <Link
              to={portalHomePath}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-md shadow-orange-500/25 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4H19L17.5 8H11.5L10.5 11H16.5L15 15H10L8.5 20H4.5L7 4Z" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-[15px] text-slate-900 tracking-tight font-black leading-tight">
                  F SPORT <span className="text-orange-500">CENTER</span>
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                  TRUNG TÂM THỂ THAO ĐA NĂNG
                </span>
              </div>
            </Link>

            {/* Role Context Pill */}
            <div className="mt-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></span>
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
          <div className="px-3 mt-1">
            {!hasSections && (
              <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Menu Chức Năng
              </span>
            )}

            <nav className="flex flex-col gap-1">
              {(() => {
                const activeMenuPath = getActiveMenuPath(location.pathname, menuItems, role);
                return menuItems.map((item, idx) => {
                  const isActive = item.path === activeMenuPath;
                const showSectionHeader =
                  Boolean(item.section) && (idx === 0 || item.section !== menuItems[idx - 1]?.section);

                return (
                  <React.Fragment key={item.path}>
                    {showSectionHeader && (
                      <div
                        className={`px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${
                          idx === 0 ? 'pt-1 pb-1' : 'pt-3 pb-1'
                        }`}
                      >
                        {item.section}
                      </div>
                    )}
                    <Link
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
                  </React.Fragment>
                );
              });
              })()}
            </nav>
          </div>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm overflow-hidden">
              {getAvatarImageUrl(currentUser?.avatar) ? (
                <img src={getAvatarImageUrl(currentUser.avatar)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{getAvatarInitials(currentUser?.name, 'US')}</span>
              )}
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden !m-0"
        ></div>
      )}

      {/* =========================================
          2. FIXED TOP HEADER (Synchronized Across Roles)
         ========================================= */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 h-14 bg-white/95 backdrop-blur-xl z-40 border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex items-center justify-between px-4 lg:px-6">
          {/* Left: Mobile Toggle + Search Trigger Button */}
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer shrink-0"
              type="button"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* Clickable Quick Search Bar that opens Command Palette */}
            <div
              onClick={() => setSearchOpen(true)}
              className="relative flex items-center w-full min-w-0 h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 text-xs cursor-pointer transition-all shadow-inner select-none"
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
              <span className="font-semibold text-[11px]">
                Hệ thống trực tuyến
              </span>
            </div>

            {/* Quick Action Button per Role */}
            {quickAction && (
              <button
                onClick={quickAction.onClick}
                type="button"
                disabled={quickAction.disabled}
                title={quickAction.label}
                aria-label={quickAction.label}
                className="h-9 px-2.5 sm:px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-orange-500/20 cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">{quickAction.icon}</span>
                <span className="hidden sm:inline">{quickAction.label}</span>
              </button>
            )}

            {/* Notification Trigger & Flyout */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => {
                  const nextOpen = !showNotifications;
                  setShowNotifications(nextOpen);
                  setShowUserMenu(false);
                  if (nextOpen) {
                    fetchLiveNotifications();
                  }
                }}
                type="button"
                className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors relative cursor-pointer"
                title="Thông báo"
                aria-label="Thông báo"
                aria-expanded={showNotifications}
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                {liveNotifications.some((n) => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Flyout Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-headline-sm text-sm font-bold text-slate-900">Thông báo</h3>
                    {inboxRoute ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(inboxRoute);
                        }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                      >
                        Xem tất cả
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  {liveNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Chưa có thông báo từ hệ thống.
                    </div>
                  ) : (
                    <div className="py-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {liveNotifications.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={async () => {
                            setShowNotifications(false);
                            if (!item.isRead && item.notificationId) {
                              await markNotificationRead(item.notificationId).catch(() => {});
                              setLiveNotifications((prev) =>
                                prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                              );
                            }
                            if (item.link) {
                              navigate(item.link);
                            } else if (role === 'member' && String(item.type || '').toUpperCase() === 'SUPPORT') {
                              navigate('/member/tickets');
                            } else if (inboxRoute) {
                              navigate(inboxRoute);
                            }
                          }}
                          className="py-2.5 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.createdAt && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {!item.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                              )}
                            </div>
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
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => {
                  setShowUserMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
                type="button"
                title="Menu tài khoản"
                aria-label="Menu tài khoản"
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs shadow-sm hover:bg-orange-100 hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer overflow-hidden p-0"
              >
                {getAvatarImageUrl(currentUser?.avatar) ? (
                  <img src={getAvatarImageUrl(currentUser.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{getAvatarInitials(currentUser?.name, 'US')}</span>
                )}
              </button>

              {showUserMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="p-2 border-b border-slate-100">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {currentUser?.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{currentUser?.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      {currentUser?.roleTitle}
                    </div>
                  </div>

                  <div className="py-2 flex flex-col gap-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        navigate(primaryProfileLink.path);
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-500">
                        {primaryProfileLink.icon}
                      </span>
                      <span>{primaryProfileLink.label}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        navigate(secondaryDropdownLink.path);
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-500">
                        {secondaryDropdownLink.icon}
                      </span>
                      <span>{secondaryDropdownLink.label}</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowUserMenu(false);
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
        <main className="p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6 flex-1 bg-[#f7f9fb]">
          {children}
        </main>
      </div>

      {/* =========================================
          4. MOBILE BOTTOM NAVIGATION (Thanh điều hướng nhanh trên điện thoại)
         ========================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {(() => {
          const activeMenuPath = getActiveMenuPath(location.pathname, menuItems, role);
          return mobileBottomItems.map((item) => {
            const isActive = item.path === activeMenuPath;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-colors min-w-0 ${
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
              <span className="text-[10px] leading-tight mt-0.5 truncate max-w-[68px]">
                {item.mobileLabel || item.label}
              </span>
            </Link>
          );
        });
        })()}

        {/* More Menu on Mobile */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          type="button"
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <div className="w-9 h-7 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Thêm</span>
        </button>
      </nav>

      {/* =========================================
          5. COMMAND PALETTE MODAL (Cmd + K / Ctrl + K)
         ========================================= */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200 !m-0"
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
                  Trang Chức Năng ({matchedPages.length})
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {matchedPages.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-slate-500">
                      Không tìm thấy trang chức năng phù hợp.
                    </div>
                  ) : (
                    matchedPages.map((page) => (
                      <button
                        key={page.path}
                        type="button"
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
                    ))
                  )}
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
