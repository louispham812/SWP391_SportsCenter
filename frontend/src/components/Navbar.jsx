import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Giới thiệu', path: '/#gioi-thieu' },
    { label: 'Bộ môn', path: '/#bo-mon' },
    { label: 'Tiện ích', path: '/#tien-ich' },
    { label: 'Bảng giá', path: '/pricing' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#00132b] text-[#c1f100] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-[18px] uppercase tracking-tight text-slate-900 flex items-center gap-1 font-bold">
              ELITE SPORTS <span className="text-emerald-700">CENTER</span>
            </span>
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
              Athletic Performance Sanctuary
            </span>
          </div>
        </Link>

        {/* Navigation Links Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`text-[13px] uppercase tracking-wider transition-colors py-1 font-bold ${
                  isActive
                    ? 'text-slate-950 border-b-2 border-slate-950'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth & CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex text-[13px] uppercase tracking-wider text-slate-700 hover:text-slate-950 transition-colors px-3 py-2 font-bold"
          >
            Đăng nhập
          </Link>

          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-[#c1f100] text-slate-950 text-[12px] sm:text-[13px] uppercase tracking-wider font-bold shadow-md hover:bg-[#abd600] transition-all border border-[#a7d400]"
          >
            Trở thành Hội viên
          </Link>

          <Link
            to="/member"
            title="Khu vực Hội viên"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </Link>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800"
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
              className="text-sm font-bold text-slate-800 py-2 border-b border-slate-100 uppercase tracking-wider"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="text-xs uppercase font-bold text-slate-800"
            >
              Đăng nhập tài khoản
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileNavOpen(false)}
              className="text-xs uppercase font-bold text-emerald-800"
            >
              Đăng ký mới →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
