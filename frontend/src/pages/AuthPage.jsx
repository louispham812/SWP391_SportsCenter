import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');
const ROLE_HOME_PATHS = {
  member: '/member',
  receptionist: '/receptionist',
  coach: '/coach',
  admin: '/admin',
};

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticateUser, currentUser, currentRole } = useApp();

  useEffect(() => {
    if (currentUser) {
      navigate(ROLE_HOME_PATHS[currentRole] || '/', { replace: true });
    }
  }, [currentUser, currentRole, navigate]);

  // Active Tab: derived from route URL ('/register' -> 'register', otherwise 'login')
  const activeTab = location.pathname === '/register' ? 'register' : 'login';
  const setActiveTab = (tab) => {
    setAuthError('');
    setAuthNotice('');
    navigate(tab === 'register' ? '/register' : '/login');
  };

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (4 fields required only according to spec)
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    agreeTerms: true,
  });

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    email: '',
    pendingUser: null,
    otpCode: '',
    timer: 600, // 10 minutes (expires_at)
  });

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (otpModal.isOpen && otpModal.timer > 0) {
      interval = setInterval(() => {
        setOtpModal((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpModal.isOpen, otpModal.timer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const authenticate = (user) => {
    const roleMap = {
      MEMBER: { key: 'member', path: '/member' },
      RECEPTIONIST: { key: 'receptionist', path: '/receptionist' },
      COACH: { key: 'coach', path: '/coach' },
      MANAGER: { key: 'admin', path: '/admin' },
      ADMIN: { key: 'admin', path: '/admin' },
    };
    const destination = roleMap[user.role?.toUpperCase()];
    if (!destination) {
      throw new Error('Vai trò tài khoản không được hỗ trợ.');
    }
    authenticateUser(user, destination.key, user.token);
    navigate(destination.path);
  };

  const getErrorMessage = async (response) => {
    const body = await response.text();
    if (!body) return 'Không thể kết nối tới máy chủ. Vui lòng thử lại.';
    try {
      const parsed = JSON.parse(body);
      return parsed.message || parsed.error || body;
    } catch {
      return body;
    }
  };

  const getRequestErrorMessage = (error, action) => {
    if (error instanceof TypeError) {
      return 'Không thể kết nối tới backend. Hãy kiểm tra dịch vụ máy chủ Backend đang chạy.';
    }
    return error.message || `${action} thất bại. Vui lòng thử lại.`;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      authenticate(await response.json());
    } catch (error) {
      setAuthError(getRequestErrorMessage(error, 'Đăng nhập'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.agreeTerms) {
      setAuthError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!');
      return;
    }
    setAuthError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regForm.fullName.trim(),
          phone: regForm.phone.trim(),
          email: regForm.email.trim(),
          password: regForm.password,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      const user = await response.json();
      // Điều hướng trực tiếp sang trang OTP Screen theo yêu cầu của team backend
      navigate('/verify-otp', {
        state: {
          email: regForm.email.trim(),
          fullName: regForm.fullName.trim(),
          pendingUser: user,
        },
      });
    } catch (error) {
      setAuthError(getRequestErrorMessage(error, 'Đăng ký'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpModal.otpCode.trim().length !== 6) {
      setAuthError('Mã xác thực OTP gồm 6 chữ số.');
      return;
    }
    if (otpModal.timer <= 0) {
      setAuthError('Mã OTP đã hết hạn 10 phút. Vui lòng bấm gửi lại mã.');
      return;
    }
    // Verify success: activate account and authenticate
    const activeUser = {
      ...(otpModal.pendingUser || {}),
      status: 'ACTIVE',
    };
    setOtpModal({ isOpen: false, email: '', pendingUser: null, otpCode: '', timer: 600 });
    authenticate(activeUser);
  };

  const handleResendOtp = () => {
    setOtpModal((prev) => ({
      ...prev,
      timer: 600,
      otpCode: '',
    }));
    setAuthNotice(`Mã OTP mới đã được gửi lại tới ${otpModal.email}. Có hiệu lực trong 10 phút.`);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <main className="w-full min-h-screen">
        <div className="flex flex-col lg:flex-row w-full min-h-screen">
          
          {/* =========================================
              CỘT TRÁI (50% WIDTH, FULL HEIGHT, STICKY)
             ========================================= */}
          <div className="relative w-full lg:w-1/2 min-h-[580px] lg:min-h-screen lg:sticky lg:top-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-900 overflow-hidden">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-80"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>

            {/* Gradient Scrim Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-white/5"></div>

            {/* Ambient Glow Accent (Cam F) */}
            <div className="absolute top-1/3 -left-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Branding Meta (Đã thông thoáng không bị ô nổi đè lên) */}
            <div className="relative z-10 flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316] animate-pulse"></div>
                <span className="font-headline-sm text-xl tracking-wider text-white font-black drop-shadow-sm uppercase">
                  F SPORT <span className="text-orange-500">CENTER</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] uppercase tracking-widest font-black shadow-xs">
                  ATHLETIC PERFORMANCE SANCTUARY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span className="text-[11px] text-orange-400 font-bold tracking-wider">
                  HÀ NỘI • SAIGON
                </span>
              </div>
            </div>

            {/* Central Kinetic Content Cluster */}
            <div className="relative z-10 flex flex-col gap-6 my-auto pt-8 pb-8">
              {/* Glassmorphic Panel */}
              <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/70 space-y-4 text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] uppercase tracking-wider font-black">
                    Đặc quyền gia nhập
                  </span>
                  <span className="material-symbols-outlined text-orange-600 font-bold text-[22px]">
                    verified
                  </span>
                </div>

                <h2 className="font-headline-lg text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight font-black uppercase">
                  Bứt Phá Giới Hạn Cùng Hệ Sinh Thái Đẳng Cấp
                </h2>

                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px] text-orange-600">
                      sports_tennis
                    </span>
                    <span>Đặt sân trực tuyến 24/7</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px] text-orange-600">
                      military_tech
                    </span>
                    <span>Đội ngũ HLV chuẩn NASM & PPR</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px] text-orange-600">
                      vital_signs
                    </span>
                    <span>Đo chỉ số InBody 770 & PAR-Q miễn phí</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                    5.200+
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-bold">
                    Hội viên hoạt động
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                    30+ SÂN
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-bold">
                    Pickleball & Tennis
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                    50 HLV
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-bold">
                    Master Trainer Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Footer */}
            <div className="relative z-10 flex items-center justify-between text-slate-300 text-xs">
              <span className="text-[10px] tracking-wider uppercase text-white/80 font-bold">
                © 2026 F SPORT CENTER • ALL RIGHTS RESERVED
              </span>
              <span className="text-[10px] tracking-widest text-orange-400 font-black flex items-center gap-1.5 drop-shadow-sm uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> LIVE SYSTEM READY
              </span>
            </div>
          </div>

          {/* =========================================
              CỘT PHẢI (50% WIDTH, AUTH FORM LIGHT MODE)
             ========================================= */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start bg-[#f7f9fb] px-6 sm:px-12 lg:px-16 py-10">
            <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
              
              {/* Header Navigation Cột Phải */}
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="group flex items-center gap-1.5 text-slate-600 hover:text-orange-600 transition-colors py-1.5 px-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs font-bold uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                    arrow_back
                  </span>
                  <span>Về trang chủ</span>
                </Link>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 border border-slate-300/70 text-slate-700 text-[10px] font-bold tracking-wider">
                  <span className="material-symbols-outlined text-[15px] text-orange-600">
                    shield_lock
                  </span>
                  <span>CỔNG HỘI VIÊN BẢO MẬT SSL 256-BIT</span>
                </div>
              </div>

              {/* Headline Context */}
              <div className="flex flex-col gap-1">
                <h1 className="font-headline-xl text-3xl sm:text-4xl text-slate-900 font-black uppercase tracking-tight">
                  {activeTab === 'login' ? 'Đăng Nhập Tài Khoản' : 'Chào Mừng Đến Với F Sport'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {activeTab === 'login'
                    ? 'Chào mừng bạn quay trở lại với F Sport Center. Vui lòng nhập thông tin để truy cập lịch tập, thẻ hội viên và các dịch vụ thể thao.'
                    : 'Đăng ký tài khoản hội viên để bắt đầu lịch trình tập luyện, giữ chỗ cụm sân và nhận hỗ trợ từ huấn luyện viên chuyên nghiệp.'}
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-200/70 border border-slate-300/60 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-orange-600 shadow-xs border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>ĐĂNG NHẬP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-white text-orange-600 shadow-xs border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>ĐĂNG KÝ MỚI</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase">
                    Ưu đãi
                  </span>
                </button>
              </div>

              {/* =========================================
                  TAB 1: ĐĂNG NHẬP (LOGIN VIEW)
                 ========================================= */}
              {activeTab === 'login' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                    {authError && (
                      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                        {authError}
                      </p>
                    )}
                    {authNotice && (
                      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                        {authNotice}
                      </p>
                    )}


                    {/* Identifier */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
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
                          onChange={(e) => {
                            setLoginIdentifier(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="name@example.com / 0912..."
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Mật khẩu
                        </label>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/change-password"
                            className="text-xs text-orange-600 hover:underline font-bold cursor-pointer"
                          >
                            Đổi mật khẩu tạm?
                          </Link>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => alert('Vui lòng liên hệ quầy Lễ tân hoặc hotline 1900 8899 để cấp lại mật khẩu.')}
                            className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-medium cursor-pointer"
                          >
                            Quên mật khẩu?
                          </button>
                        </div>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                          lock
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="••••••••"
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP NGAY'}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-600 font-medium">
                      <span>Chưa có tài khoản hội viên?</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="font-bold text-orange-600 hover:underline cursor-pointer uppercase"
                      >
                        Đăng ký ngay
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =========================================
                  TAB 2: ĐĂNG KÝ (REGISTER VIEW)
                 ========================================= */}
              {activeTab === 'register' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-6">
                    {authError && (
                      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                        {authError}
                      </p>
                    )}
                    {authNotice && (
                      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                        {authNotice}
                      </p>
                    )}
                    
                    {/* NHÓM 1: THÔNG TIN CƠ BẢN */}
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-black">
                            1
                          </span>
                          <span className="text-xs text-slate-900 uppercase font-black tracking-wider">
                            THÔNG TIN CƠ BẢN
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                          * Bắt buộc điền
                        </span>
                      </div>


                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Họ và tên */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                            Họ và tên *
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                              person
                            </span>
                            <input
                              type="text"
                              required
                              maxLength={100}
                              value={regForm.fullName}
                              onChange={(e) => {
                                setRegForm({ ...regForm, fullName: e.target.value });
                                setAuthError('');
                              }}
                              placeholder="Nguyễn Văn A"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Số điện thoại */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                            Số điện thoại *
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                              phone
                            </span>
                            <input
                              type="tel"
                              required
                              maxLength={15}
                              value={regForm.phone}
                              onChange={(e) => {
                                setRegForm({ ...regForm, phone: e.target.value });
                                setAuthError('');
                              }}
                              placeholder="0912 345 678"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Địa chỉ Email *
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                            mail
                          </span>
                          <input
                            type="email"
                            required
                            maxLength={100}
                            value={regForm.email}
                            onChange={(e) => {
                              setRegForm({ ...regForm, email: e.target.value });
                              setAuthError('');
                            }}
                            placeholder="name@example.com"
                            className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Mật khẩu bảo mật *
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                            lock
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={regForm.password}
                            onChange={(e) => {
                              setRegForm({ ...regForm, password: e.target.value });
                              setAuthError('');
                            }}
                            placeholder="••••••••"
                            className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Mật khẩu cần tối thiểu 8 ký tự.
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
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 font-medium">
                        Tôi đồng ý với{' '}
                        <button type="button" onClick={() => alert('Điều khoản dịch vụ bảo mật của F Sport Center.')} className="text-slate-900 font-bold hover:underline">
                          Điều khoản dịch vụ
                        </button>{' '}
                        và{' '}
                        <button type="button" onClick={() => alert('Chính sách bảo mật chuẩn y tế PAR-Q của F Sport Center.')} className="text-slate-900 font-bold hover:underline">
                          Chính sách bảo mật
                        </button>{' '}
                        của F Sport Center.
                      </span>
                    </label>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ TÀI KHOẢN NGAY'}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>

                  </form>
                </div>
              )}

              {/* Sticky Support Micro Footer */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-orange-600">
                    support_agent
                  </span>
                  <span>
                    Hotline 24/7: <strong className="text-slate-900 font-bold">1900 8899</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 font-medium">
                  <button
                    type="button"
                    onClick={() => alert('Trung tâm trợ giúp: Vui lòng gọi 1900 8899 hoặc gặp bộ phận Lễ tân.')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Trợ giúp
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

      {/* OTP Verification Modal Dialog (Workflow Đăng Ký - Section 2.1 & 2.2) */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Xác Thực Tài Khoản Email
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mã xác thực OTP gồm 6 chữ số đã được gửi tới{' '}
                <strong className="text-slate-900 font-bold">{otpModal.email}</strong>.
                Vui lòng nhập mã để kích hoạt tài khoản hội viên F Sport.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="otp-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mã Xác Thực OTP (6 số)
                </label>
                <input
                  id="otp-input"
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otpModal.otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpModal((prev) => ({ ...prev, otpCode: val }));
                    setAuthError('');
                  }}
                  placeholder="123456"
                  className="w-48 text-center text-2xl font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-orange-500 bg-orange-50/40 text-slate-900 outline-none shadow-sm focus:ring-4 focus:ring-orange-500/20"
                />
              </div>

              {/* Countdown timer */}
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <span className="material-symbols-outlined text-[16px] text-orange-600">timer</span>
                <span className="text-slate-500 font-medium">Mã hết hạn sau:</span>
                <span className={`font-mono font-bold ${otpModal.timer < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                  {formatTimer(otpModal.timer)}
                </span>
              </div>

              {authError && (
                <p role="alert" className="p-2.5 rounded-xl border border-red-200 bg-red-50 text-center text-xs font-bold text-red-700">
                  {authError}
                </p>
              )}

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={otpModal.otpCode.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>XÁC THỰC & KÍCH HOẠT NGAY</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpModal({ isOpen: false, email: '', pendingUser: null, otpCode: '', timer: 600 })}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs text-orange-600 hover:underline font-bold cursor-pointer"
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}