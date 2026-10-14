import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
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

  const navLinks = [
    { label: 'Giới thiệu', path: '/#gioi-thieu' },
    { label: 'Bộ môn', path: '/sports' },
    { label: 'Tiện ích', path: '/facilities' },
    { label: 'Bảng giá', path: '/pricing' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo - ĐỒNG BỘ FPT SPORTS CENTER */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform font-black">
            <span className="material-symbols-outlined text-[24px]">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-[18px] uppercase tracking-tight text-slate-900 flex items-center gap-1 font-black">
              FPT SPORTS <span className="text-orange-500">CENTER</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              FPT University Sanctuary
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
            <>
              <span className="hidden xl:inline text-xs font-bold text-slate-700">
                Xin chào, <strong>{currentUser.name}</strong>
              </span>
              <Link
                to={accountPath}
                title={`Khu vực ${currentUser.roleTitle}`}
                className="w-9 h-9 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-xs transition-colors"
              >
                {currentUser.avatar || <span className="material-symbols-outlined text-[20px]">person</span>}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex text-[12px] uppercase tracking-wider text-red-600 hover:text-red-800 px-2 py-2 font-bold cursor-pointer"
              >
                Đăng xuất
              </button>
            </>
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
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileNavOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
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
        </div>
      )}
    </header>
  );
}