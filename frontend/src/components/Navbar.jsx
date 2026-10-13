import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, currentUser, logout } = useApp();
  const isAuthenticated = Boolean(currentUser);

  const roleHomePaths = {
    member: '/member',
    receptionist: '/receptionist',
    coach: '/coach',
    admin: '/admin',
  };
  const accountPath = roleHomePaths[currentRole] || '/login';

  const handleLogout = () => {
    logout();
    setMobileNavOpen(false);
    navigate('/');
  };

  // Cập nhật đường dẫn 'Giới thiệu' dẫn thẳng đến trang /about
  const navLinks = [
    { label: 'Giới thiệu', path: '/about' },
    { label: 'Bộ môn', path: '/sports' },
    { label: 'Tiện ích', path: '/facilities' },
    { label: 'Bảng giá', path: '/pricing' },
  ];

  // Logic kiểm tra trang đang chọn (Active link)
  const isLinkActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 group-hover:bg-orange-600 transition-all">
            <span className="material-symbols-outlined text-[24px]">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-[18px] uppercase tracking-tight text-slate-900 flex items-center gap-1 font-bold">
              FPT SPORTS <span className="text-orange-500">CENTER</span>
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
              FPT University Sanctuary
            </span>
          </div>
        </Link>

        {/* Navigation Links Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = isLinkActive(link.path);
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`text-[13px] uppercase tracking-wider transition-all py-1 font-bold ${
                  active
                    ? 'text-orange-600 border-b-2 border-orange-500'
                    : 'text-slate-600 hover:text-orange-600'
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
            <>
              <span className="hidden xl:inline text-sm font-semibold text-slate-700">
                Xin chào, {currentUser.name}
              </span>
              <Link
                to={accountPath}
                title={`Khu vực ${currentUser.roleTitle || 'Tài khoản'}`}
                aria-label={`Mở khu vực ${currentUser.roleTitle || 'Tài khoản'}`}
                className="w-9 h-9 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm transition-colors font-bold text-xs"
              >
                {currentUser.avatar || <span className="material-symbols-outlined text-[20px]">person</span>}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex text-[12px] uppercase tracking-wider text-red-600 hover:text-red-800 px-2 py-2 font-bold transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex text-[13px] uppercase tracking-wider text-slate-700 hover:text-orange-600 transition-colors px-3 py-2 font-bold"
              >
                Đăng nhập
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-orange-500 text-white text-[12px] sm:text-[13px] uppercase tracking-wider font-bold shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-all border border-orange-500"
              >
                Trở thành Hội viên
              </Link>
              <Link
                to="/login"
                title="Đăng nhập"
                className="sm:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
              </Link>
            </>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition-colors"
            type="button"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileNavOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileNavOpen(false)}
              className="text-sm font-bold text-slate-800 hover:text-orange-600 py-2 border-b border-slate-100 uppercase tracking-wider transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={accountPath}
                  onClick={() => setMobileNavOpen(false)}
                  className="text-xs uppercase font-bold text-slate-800 hover:text-orange-600"
                >
                  Tài khoản của tôi
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs uppercase font-bold text-red-600 hover:text-red-800"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-xs uppercase font-bold text-slate-800 hover:text-orange-600"
                >
                  Đăng nhập tài khoản
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-xs uppercase font-bold text-orange-600 hover:text-orange-700"
                >
                  Đăng ký mới →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}