import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAvatarImageUrl, getAvatarInitials } from '../utils/avatarHelper';
import { getPortalHomePath, getRoleProfileLink } from '../utils/portalRoute';

export default function Navbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, currentUser, logout } = useApp();
  const isAuthenticated = Boolean(currentUser);
  const userMenuRef = useRef(null);

  const accountPath = getPortalHomePath(currentRole, '/login');
  const profileLink = getRoleProfileLink(currentRole, accountPath);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileNavOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: 'Giới thiệu', path: '/about' },
    { label: 'Bộ môn', path: '/sports' },
    { label: 'Tiện ích', path: '/facilities' },
    { label: 'Bảng giá', path: '/pricing' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* BRAND LOGO - CHỮ F CAM THỂ THAO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-md shadow-orange-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 text-white drop-shadow-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 4H19L17.5 8H11.5L10.5 11H16.5L15 15H10L8.5 20H4.5L7 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-[18px] uppercase tracking-tight text-slate-900 flex items-center gap-1 font-black">
              F SPORT <span className="text-orange-500">CENTER</span>
            </span>
            {/* Đã đổi slogan chuẩn Thương hiệu Thể thao */}
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              TRUNG TÂM THỂ THAO ĐA NĂNG
            </span>
          </div>
        </Link>

        {/* Navigation Links Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
              || location.pathname.startsWith(`${link.path}/`);
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`text-[13px] uppercase tracking-wider transition-colors py-1 font-extrabold ${
                  isActive
                    ? 'text-orange-600 border-b-2 border-orange-500'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth & CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-label="Menu tài khoản"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 p-1 sm:pr-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 transition-colors cursor-pointer"
              >
                <span className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-xs overflow-hidden shrink-0">
                  {getAvatarImageUrl(currentUser.avatar) ? (
                    <img
                      src={getAvatarImageUrl(currentUser.avatar)}
                      alt={currentUser.name || 'Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{getAvatarInitials(currentUser.name, 'US')}</span>
                  )}
                </span>
                <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[130px] truncate">
                  {currentUser.name}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="px-2.5 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser.email || currentUser.roleTitle}
                    </div>
                  </div>
                  <div className="py-1.5 flex flex-col gap-0.5">
                    <Link
                      to={accountPath}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">dashboard</span>
                      <span>Về Portal</span>
                    </Link>
                    <Link
                      to={profileLink.path}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-500">{profileLink.icon}</span>
                      <span>{profileLink.label}</span>
                    </Link>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex text-[13px] uppercase tracking-wider text-slate-700 hover:text-slate-950 font-bold px-3 py-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-orange-500 text-white text-[12px] sm:text-[13px] uppercase tracking-wider font-black shadow-md hover:bg-orange-600 transition-all"
              >
                Trở thành Hội viên
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            type="button"
            aria-label="Menu điều hướng"
            aria-expanded={mobileNavOpen}
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileNavOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileNavOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileNavOpen(false)}
              className="text-sm font-bold text-slate-800 py-2 border-b border-slate-100 uppercase tracking-wider"
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated ? (
            <Link
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="text-sm font-black text-orange-600 py-2 uppercase tracking-wider"
            >
              Đăng nhập tài khoản
            </Link>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Link
                  to={accountPath}
                  onClick={() => setMobileNavOpen(false)}
                  className="text-sm font-black text-orange-600 uppercase tracking-wider"
                >
                  Về Portal ({currentUser?.roleTitle || 'Cá nhân'})
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-600 uppercase cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
              <Link
                to={profileLink.path}
                onClick={() => setMobileNavOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
              >
                {profileLink.label}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
