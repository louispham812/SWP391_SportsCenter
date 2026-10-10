import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { switchRole, addAuditLog } = useApp();

  // Active Tab: derived from route URL ('/register' -> 'register', otherwise 'login')
  const activeTab = location.pathname === '/register' ? 'register' : 'login';
  const setActiveTab = (tab) => {
    navigate(tab === 'register' ? '/register' : '/login');
  };

  // Demo Role Selector for Testing
  const [selectedRole, setSelectedRole] = useState('member'); // 'member' | 'receptionist' | 'coach' | 'admin'

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('0987 654 321');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regForm, setRegForm] = useState({
    fullName: 'Nguyễn Văn A',
    phone: '0912 345 678',
    email: 'nguyenvana@example.com',
    password: '',
    fitnessLevel: 'intermediate',
    primaryGoal: 'skills',
    medicalHistory: '',
    agreeTerms: true,
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    switchRole(selectedRole);
    addAuditLog('Đăng nhập hệ thống', `Người dùng đăng nhập thành công vào vai trò: ${selectedRole.toUpperCase()}`);

    if (selectedRole === 'admin') navigate('/admin');
    else if (selectedRole === 'coach') navigate('/coach');
    else if (selectedRole === 'receptionist') navigate('/receptionist');
    else navigate('/member');
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regForm.agreeTerms) {
      alert('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!');
      return;
    }

    switchRole('member');
    addAuditLog('Đăng ký hội viên', `Hội viên mới đăng ký tài khoản: ${regForm.fullName} (${regForm.phone})`);
    alert(`Chào mừng ${regForm.fullName} gia nhập Elite Sports Center! Đang chuyển hướng đến cổng Hội viên...`);
    navigate('/member');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-slate-800 antialiased selection:bg-[#c1f100] selection:text-[#00132b]">
      {/* =========================================
          TOP FLOATING NAVIGATION
         ========================================= */}
      <header className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between pointer-events-auto">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 px-4 py-2 rounded-full bg-white/85 shadow-sm border border-slate-200/80 backdrop-blur-xl transition-all hover:border-slate-300 font-semibold text-xs uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Trang chủ</span>
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 shadow-sm border border-slate-200/80 backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-[#506600] animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest text-[#00132b] font-bold">
              ESC ATHLETICS
            </span>
          </div>
        </div>
      </header>

      <main className="w-full min-h-screen">
        <div className="flex flex-col lg:flex-row w-full min-h-screen">
          {/* =========================================
              CỘT TRÁI (50% WIDTH, FULL HEIGHT, STICKY)
             ========================================= */}
          <div className="relative w-full lg:w-1/2 min-h-[580px] lg:min-h-screen lg:sticky lg:top-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-900 overflow-hidden">
            {/* Background Image with Light Scrim Gradients */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-85"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>

            {/* Gradient Scrim Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-white/5"></div>

            {/* Subtle Ambient Glow Accent */}
            <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#c1f100]/25 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Branding Meta */}
            <div className="relative z-10 flex flex-col gap-2 pt-16 lg:pt-0">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#c1f100] shadow-[0_0_12px_#c1f100] animate-pulse"></div>
                <span className="font-headline-sm text-xl tracking-wider text-white font-bold drop-shadow-sm">
                  ELITE SPORTS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] uppercase tracking-widest font-bold shadow-sm">
                  ATHLETIC PERFORMANCE SANCTUARY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#c1f100]"></span>
                <span className="text-[11px] text-lime-300 font-semibold tracking-wider">
                  HANOI • SAIGON
                </span>
              </div>
            </div>

            {/* Central Kinetic Content Cluster */}
            <div className="relative z-10 flex flex-col gap-6 my-auto pt-10 pb-8">
              {/* Glassmorphic Panel */}
              <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/70 space-y-4 text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#c1f100] text-[#00132b] text-[10px] uppercase tracking-wider font-bold">
                    Đặc quyền gia nhập
                  </span>
                  <span className="material-symbols-outlined text-emerald-600 font-semibold text-[22px]">
                    verified
                  </span>
                </div>

                <h2 className="font-headline-lg text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight font-bold">
                  Bứt Phá Giới Hạn Cùng Hệ Sinh Thái Đẳng Cấp
                </h2>

                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-slate-800 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      sports_tennis
                    </span>
                    <span>Đặt sân trực tuyến 24/7</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-slate-800 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      military_tech
                    </span>
                    <span>Đội ngũ HLV chuẩn NASM & CSCS</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-slate-800 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">
                      vital_signs
                    </span>
                    <span>Đo chỉ số InBody & PAR-Q miễn phí</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Metrics Grid (3 Crisp Cards) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-xl sm:text-2xl text-slate-900 font-bold tracking-tight">
                    5.200+
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-semibold">
                    Hội viên kích hoạt
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-xl sm:text-2xl text-slate-900 font-bold tracking-tight">
                    18 SÂN
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-semibold">
                    Pickleball & Tennis
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-xl sm:text-2xl text-slate-900 font-bold tracking-tight">
                    40 HLV
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-semibold">
                    Master Trainer Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Footer */}
            <div className="relative z-10 flex items-center justify-between text-slate-300 text-xs">
              <span className="text-[10px] tracking-wider uppercase text-white/80">
                © 2026 ELITE SPORTS SANCTUARY
              </span>
              <span className="text-[10px] tracking-widest text-[#c1f100] font-semibold flex items-center gap-1.5 drop-shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c1f100]"></span> LIVE SYSTEM READY
              </span>
            </div>
          </div>

          {/* =========================================
              CỘT PHẢI (50% WIDTH, AUTH FORM LIGHT MODE)
             ========================================= */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start bg-[#f7f9fb] px-6 sm:px-12 lg:px-16 py-12 pt-20">
            <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
              {/* Header Utility Navigation */}
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="group flex items-center gap-1.5 text-slate-600 hover:text-slate-950 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-200/60 text-xs font-semibold uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                    arrow_back
                  </span>
                  <span>Về trang chủ</span>
                </Link>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 border border-slate-300/70 text-slate-700 text-[10px] font-bold tracking-wider">
                  <span className="material-symbols-outlined text-[15px] text-emerald-700">
                    shield_lock
                  </span>
                  <span>CỔNG HỘI VIÊN BẢO MẬT SSL 256-BIT</span>
                </div>
              </div>

              {/* Headline Context */}
              <div className="flex flex-col gap-1">
                <h1 className="font-headline-xl text-3xl sm:text-4xl text-slate-900 font-bold tracking-tight">
                  {activeTab === 'login' ? 'Đăng nhập tài khoản' : 'Welcome to Elite Sports'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeTab === 'login'
                    ? 'Chào mừng bạn quay trở lại với Elite Sports Center. Vui lòng nhập thông tin để truy cập lịch tập, thẻ hội viên và các dịch vụ thể thao.'
                    : 'Đăng nhập hoặc đăng ký tài khoản để bắt đầu lịch trình tập luyện, giữ chỗ cụm sân và kết nối với huấn luyện viên chuyên biệt.'}
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-200/70 border border-slate-300/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-700">login</span>
                  <span>ĐĂNG NHẬP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>ĐĂNG KÝ MỚI</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#c1f100] text-slate-950 text-[10px] font-bold">
                    Ưu đãi
                  </span>
                </button>
              </div>

              {/* =========================================
                  TAB 1: ĐĂNG NHẬP (LOGIN VIEW)
                 ========================================= */}
              {activeTab === 'login' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  {/* Demo Role Selector Bar */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Chọn vai trò truy cập demo (1-chạm vào đúng portal):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'member', label: 'Hội viên', icon: 'person' },
                        { id: 'receptionist', label: 'Lễ tân', icon: 'support_agent' },
                        { id: 'coach', label: 'HLV', icon: 'fitness_center' },
                        { id: 'admin', label: 'Quản lý', icon: 'admin_panel_settings' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRole(r.id)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            selectedRole === r.id
                              ? 'bg-[#00132b] text-[#c3f400] border-[#00132b] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{r.icon}</span>
                          <span>{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                    {/* Identifier */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                        Địa chỉ Email hoặc Số điện thoại
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                          account_circle
                        </span>
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="name@example.com / 0912..."
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                          Mật khẩu
                        </label>
                        <button
                          type="button"
                          onClick={() => alert('Vui lòng liên hệ quầy Lễ tân hoặc hotline 1900 8899 để cấp lại mật khẩu.')}
                          className="text-xs text-emerald-800 hover:underline font-bold"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                          lock
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Remember me & QR */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="flex items-center gap-1.5 text-xs text-emerald-800 hover:underline font-bold"
                      >
                        <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                        <span>Đăng nhập mã QR</span>
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#c1f100] hover:bg-[#abd600] text-slate-950 font-headline-sm text-sm uppercase tracking-wider font-bold shadow-[0_4px_24px_rgba(193,241,0,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-[#a7d400] mt-2 cursor-pointer"
                    >
                      <span>ĐĂNG NHẬP NGAY</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>

                    {/* Social Auth Divider */}
                    <div className="relative flex items-center justify-center my-2">
                      <div className="w-full h-px bg-slate-200"></div>
                      <span className="absolute px-3 bg-[#f7f9fb] text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                        Hoặc đăng nhập nhanh qua
                      </span>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          switchRole('member');
                          navigate('/member');
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"></path>
                        </svg>
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole('member');
                          navigate('/member');
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.82 1.44-.58.67-1.1 1.76-.96 2.82 1.11.09 2.18-.55 2.82-1.31"></path>
                        </svg>
                        <span>Apple ID</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-600">
                      <span>Chưa có tài khoản hội viên?</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        Đăng ký ngay
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =========================================
                  TAB 2: ĐĂNG KÝ (REGISTER VIEW - PAR-Q)
                 ========================================= */}
              {activeTab === 'register' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-6">
                    {/* NHÓM 1: THÔNG TIN CƠ BẢN */}
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#c1f100] text-slate-950 text-xs flex items-center justify-center font-bold">
                            1
                          </span>
                          <span className="font-headline-sm text-sm text-slate-900 uppercase font-bold">
                            THÔNG TIN CƠ BẢN
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                          * Bắt buộc điền
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Họ và tên */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                            Họ và tên *
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                              person
                            </span>
                            <input
                              type="text"
                              required
                              value={regForm.fullName}
                              onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                              placeholder="Nguyễn Văn A"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Số điện thoại */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                            Số điện thoại *
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                              phone
                            </span>
                            <input
                              type="tel"
                              required
                              value={regForm.phone}
                              onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                              placeholder="0912 345 678"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                          Địa chỉ Email *
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                            mail
                          </span>
                          <input
                            type="email"
                            required
                            value={regForm.email}
                            onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                            placeholder="name@example.com"
                            className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                          Mật khẩu bảo mật *
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                            lock
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={regForm.password}
                            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                        </span>
                      </div>
                    </div>

                    {/* NHÓM 2: HỒ SƠ SỨC KHỎE (PAR-Q) & MỤC TIÊU */}
                    <div className="p-5 bg-white rounded-2xl flex flex-col gap-3.5 relative overflow-hidden border border-slate-200 shadow-sm">
                      <div className="absolute -right-16 -top-16 w-44 h-44 bg-[#c1f100]/15 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#c1f100] text-slate-950 text-xs flex items-center justify-center font-bold">
                            2
                          </span>
                          <span className="font-headline-sm text-sm text-slate-900 uppercase font-bold">
                            HỒ SƠ SỨC KHỎE (PAR-Q) & MỤC TIÊU
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-lime-100 text-slate-900 border border-lime-300 rounded-full text-[10px] font-bold uppercase">
                          <span className="material-symbols-outlined text-[15px] text-emerald-800">
                            medical_services
                          </span>
                          <span>CHUẨN Y HỌC THỂ THAO</span>
                        </div>
                      </div>

                      {/* Trình độ hiện tại */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                          Trình độ thể thao hiện tại
                        </label>
                        <div className="relative">
                          <select
                            value={regForm.fitnessLevel}
                            onChange={(e) => setRegForm({ ...regForm, fitnessLevel: e.target.value })}
                            className="w-full bg-slate-50 text-slate-900 py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-300 text-xs outline-none appearance-none cursor-pointer focus:bg-white focus:border-slate-900"
                          >
                            <option value="beginner">Người mới bắt đầu (Beginner - Dưới 6 tháng)</option>
                            <option value="intermediate">Phong trào / Bán chuyên (Intermediate - 6 tháng đến 2 năm)</option>
                            <option value="advanced">Vận động viên thi đấu (Advanced / Pro)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[18px]">
                            expand_more
                          </span>
                        </div>
                      </div>

                      {/* Mục tiêu ưu tiên */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                          Mục tiêu ưu tiên hàng đầu
                        </label>
                        <div className="relative">
                          <select
                            value={regForm.primaryGoal}
                            onChange={(e) => setRegForm({ ...regForm, primaryGoal: e.target.value })}
                            className="w-full bg-slate-50 text-slate-900 py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-300 text-xs outline-none appearance-none cursor-pointer focus:bg-white focus:border-slate-900"
                          >
                            <option value="weight">Tăng cơ & Giảm mỡ (Hypertrophy / Fat Loss)</option>
                            <option value="skills">Cải thiện kỹ thuật & Tốc độ sân Pickleball / Tennis</option>
                            <option value="rehab">Phục hồi chức năng & Dẻo dai cột sống (Pilates/Yoga)</option>
                            <option value="endurance">Nâng cao sức bền thể lực toàn diện</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[18px]">
                            expand_more
                          </span>
                        </div>
                      </div>

                      {/* Lịch sử chấn thương */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-bold">
                          Lịch sử chấn thương & lưu ý y tế
                        </label>
                        <textarea
                          rows={3}
                          value={regForm.medicalHistory}
                          onChange={(e) => setRegForm({ ...regForm, medicalHistory: e.target.value })}
                          placeholder="Ví dụ: Đã từng mổ dây chằng gối, đau lưng dưới, huyết áp cao... (Để trống nếu không có)"
                          className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 p-3 rounded-xl border border-slate-300 text-xs outline-none focus:bg-white focus:border-slate-900 resize-none"
                        ></textarea>
                      </div>

                      {/* Advisory Notice */}
                      <div className="flex items-start gap-2 p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs leading-relaxed">
                        <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">
                          health_and_safety
                        </span>
                        <span>
                          Thông tin giúp đội ngũ Huấn luyện viên trưởng thiết lập giáo án an toàn và phòng ngừa rủi ro vận động tối ưu cho bạn.
                        </span>
                      </div>
                    </div>

                    {/* Agree Terms Checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        required
                        checked={regForm.agreeTerms}
                        onChange={(e) => setRegForm({ ...regForm, agreeTerms: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600">
                        Tôi đồng ý với{' '}
                        <button type="button" onClick={() => alert('Điều khoản dịch vụ bảo mật của Elite Sports Center.')} className="text-slate-900 font-bold hover:underline">
                          Điều khoản dịch vụ
                        </button>{' '}
                        và{' '}
                        <button type="button" onClick={() => alert('Chính sách bảo mật chuẩn y tế PAR-Q của Elite Sports Center.')} className="text-slate-900 font-bold hover:underline">
                          Chính sách bảo mật
                        </button>{' '}
                        của Elite Sports Center.
                      </span>
                    </label>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#c1f100] hover:bg-[#abd600] text-slate-950 font-headline-sm text-sm uppercase tracking-wider font-bold shadow-[0_4px_24px_rgba(193,241,0,0.4)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-[#a7d400] cursor-pointer"
                    >
                      <span>ĐĂNG KÝ TÀI KHOẢN NGAY</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>

                    {/* Social Divider */}
                    <div className="relative flex items-center justify-center my-2">
                      <div className="w-full h-px bg-slate-200"></div>
                      <span className="absolute px-3 bg-[#f7f9fb] text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                        Hoặc đăng ký nhanh qua
                      </span>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          switchRole('member');
                          navigate('/member');
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"></path>
                        </svg>
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchRole('member');
                          navigate('/member');
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.82 1.44-.58.67-1.1 1.76-.96 2.82 1.11.09 2.18-.55 2.82-1.31"></path>
                        </svg>
                        <span>Apple ID</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sticky Support Micro Footer */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">
                    support_agent
                  </span>
                  <span>
                    Hotline 24/7: <strong className="text-slate-900 font-bold">1900 8899</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => alert('Trung tâm trợ giúp: Vui lòng gọi 1900 8899 hoặc gặp bộ phận Lễ tân.')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Trung tâm trợ giúp
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => alert('Nội quy: Tuân thủ quy định trang phục thể thao và giờ check-in.')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Nội quy sân đấu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Login Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
              QUÉT MÃ ĐĂNG NHẬP NHANH
            </span>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900">
              Đăng Nhập Qua Ứng Dụng Elite
            </h3>
            <p className="text-xs text-slate-500">
              Mở camera hoặc ứng dụng di động Elite Sports trên điện thoại và quét mã QR này để đăng nhập ngay.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ELITE_SPORTS_FAST_AUTH_TOKEN_998877"
                alt="Auth QR Code"
                className="w-48 h-48 mx-auto rounded-lg shadow-sm"
              />
              <div className="font-mono text-[11px] font-bold text-slate-600 mt-2">
                Hết hạn sau 59s
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                switchRole(selectedRole);
                navigate(selectedRole === 'admin' ? '/admin' : selectedRole === 'coach' ? '/coach' : selectedRole === 'receptionist' ? '/receptionist' : '/member');
              }}
              className="w-full py-2.5 rounded-xl bg-[#c1f100] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#abd600] transition-colors shadow-sm"
            >
              Giả lập Quét mã Thành Công →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
