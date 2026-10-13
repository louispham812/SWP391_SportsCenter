import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

// DANH SÁCH 4 TÀI KHOẢN MOCK DATA DÙNG KHI CHƯA CÓ DATABASE
const MOCK_USERS = [
  {
    id: 1,
    email: 'member@gmail.com',
    password: '123',
    fullName: 'Member Võ Tấn Triều',
    role: 'MEMBER',
    token: 'mock-token-member-123',
  },
  {
    id: 2,
    email: 'coach@fpt.edu.vn',
    password: '123',
    fullName: 'HLV Nguyễn Anh Khoa',
    role: 'COACH',
    token: 'mock-token-coach-456',
  },
  {
    id: 3,
    email: 'letan@fpt.edu.vn',
    password: '123',
    fullName: 'Lễ Tân Trọng Tuấn',
    role: 'RECEPTIONIST',
    token: 'mock-token-receptionist-789',
  },
  {
    id: 4,
    email: 'admin@fpt.edu.vn',
    password: '123',
    fullName: 'Admin Phạm Minh Hoàng',
    role: 'MANAGER',
    token: 'mock-token-admin-999',
  },
];

const ROLE_MAP = {
  MEMBER: { key: 'member', path: '/member' },
  RECEPTIONIST: { key: 'receptionist', path: '/receptionist' },
  COACH: { key: 'coach', path: '/coach' },
  MANAGER: { key: 'admin', path: '/admin' },
  ADMIN: { key: 'admin', path: '/admin' },
};

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

  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (currentUser) {
      navigate(ROLE_HOME_PATHS[currentRole] || '/', { replace: true });
    }
  }, [currentUser, currentRole, navigate]);

  // Tab hiện tại ('/register' -> 'register', ngược lại 'login')
  const activeTab = location.pathname === '/register' ? 'register' : 'login';

  const setActiveTab = (tab) => {
    setAuthError('');
    setAuthNotice('');
    navigate(tab === 'register' ? '/register' : '/login');
  };

  // State thông báo & loading
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form Đăng Nhập
  const [loginRole, setLoginRole] = useState('MEMBER');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State Form Đăng Ký
  const [regForm, setRegForm] = useState({
    role: 'MEMBER',
    fullName: '',
    phone: '',
    email: '',
    password: '',
    fitnessLevel: 'intermediate',
    primaryGoal: 'skills',
    medicalHistory: '',
    agreeTerms: true,
  });

  const updateRegForm = (field, value) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
    setAuthError('');
    setAuthNotice('');
  };

  const authenticate = (user) => {
    const roleKey = user.role?.toUpperCase();
    const destination = ROLE_MAP[roleKey];
    if (!destination) {
      throw new Error('Vai trò tài khoản không được hỗ trợ trên hệ thống.');
    }
    authenticateUser(user, destination.key, user.token);
    navigate(destination.path);
  };

  // HÀM TỰ ĐỘNG ĐIỀN VÀ ĐĂNG NHẬP NHANH BẰNG MOCK DATA
  const handleQuickLogin = (mockRole) => {
    const found = MOCK_USERS.find((u) => u.role === mockRole);
    if (found) {
      setLoginRole(found.role);
      setLoginIdentifier(found.email);
      setLoginPassword(found.password);
      setAuthError('');
      setAuthNotice(`Đã chọn tài khoản mẫu [${found.fullName}]`);
    }
  };

  // XỬ LÝ ĐĂNG NHẬP (ƯU TIÊN BACKEND -> NẾU LỖI HOẶC CHƯA CÓ DB SẼ KHỜI CHẠY MOCK DATA)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      // 1. Thử gọi API Backend thực tế
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginIdentifier.trim(),
          password: loginPassword,
          role: loginRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        authenticate(data);
        return;
      }
    } catch {
      // Backend chưa chạy / chưa có Database -> Chuyển sang chế độ MOCK DATA
    }

    // 2. Kiểm tra bằng Mock Data Offline
    const matchedUser = MOCK_USERS.find(
      (u) =>
        (u.email.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
          u.role.toLowerCase() === loginRole.toLowerCase()) &&
        u.password === loginPassword
    );

    if (matchedUser) {
      authenticate(matchedUser);
    } else {
      setAuthError('Email/Số điện thoại hoặc mật khẩu không chính xác! (Gợi ý: Mật khẩu mặc định là 12345678)');
    }

    setIsSubmitting(false);
  };

  // XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.agreeTerms) {
      setAuthError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!');
      return;
    }

    setAuthError('');
    setIsSubmitting(true);

    // Giả lập tạo tài khoản mới nếu chưa có backend
    const newUser = {
      id: Date.now(),
      email: regForm.email.trim(),
      fullName: regForm.fullName.trim(),
      role: regForm.role,
      token: `mock-token-${Date.now()}`,
      status: regForm.role === 'MEMBER' ? 'APPROVED' : 'PENDING',
    };

    if (newUser.status === 'PENDING') {
      setAuthNotice('Đăng ký tài khoản nhân viên đã gửi thành công. Tài khoản sẽ hoạt động sau khi Quản lý phê duyệt.');
      setIsSubmitting(false);
      return;
    }

    authenticate(newUser);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <main className="w-full min-h-screen">
        <div className="flex flex-col lg:flex-row w-full min-h-screen">
          {/* CỘT TRÁI - HERO BRANDING BANNER */}
          <div className="relative w-full lg:w-1/2 min-h-[480px] lg:min-h-screen lg:sticky lg:top-0 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-900 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 opacity-80"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/40"></div>
            <div className="absolute top-1/3 -left-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Branding Meta */}
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-[0_0_12px_#f27023] animate-pulse"></div>
                <span className="text-xl tracking-wider text-white font-black drop-shadow-sm uppercase">
                  FPT SPORTS CENTER
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] uppercase tracking-widest font-extrabold shadow-sm">
                  SIÊU TỔ HỢP THỂ THAO ĐA NĂNG
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span className="text-[11px] text-orange-300 font-bold tracking-wider">
                  QUY MÔ CHUẨN OLYMPIC
                </span>
              </div>
            </div>

            {/* Center Information Cards */}
            <div className="relative z-10 flex flex-col gap-6 my-auto pt-8 pb-6">
              <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/70 space-y-4 text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] uppercase tracking-wider font-black shadow-sm">
                    Đặc quyền hội viên
                  </span>
                  <span className="material-symbols-outlined text-orange-500 font-bold text-[24px]">
                    verified
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight font-black uppercase">
                  Bứt Phá Giới Hạn Cùng Hệ Sinh Thái 30+ Bộ Môn
                </h2>

                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px] text-orange-500">
                      sports_tennis
                    </span>
                    <span>Đặt sân trực tuyến 24/7</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px] text-orange-500">
                      military_tech
                    </span>
                    <span>HLV Bằng Quốc Tế</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px] text-orange-500">
                      vital_signs
                    </span>
                    <span>Đo InBody 770 Miễn Phí</span>
                  </div>
                </div>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                    30+
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-bold">
                    Bộ Môn Thể Thao
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                    50.000m²
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-bold">
                    Diện Tích Tổ Hợp
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                    4.0 AI
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 font-bold">
                    FaceID Check-in
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Copy */}
            <div className="relative z-10 flex items-center justify-between text-slate-300 text-xs">
              <span className="text-[10px] tracking-wider uppercase text-white/80 font-bold">
                © 2026 FPT SPORTS CENTER
              </span>
              <span className="text-[10px] tracking-widest text-orange-400 font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span> MOCK DB MODE
              </span>
            </div>
          </div>

          {/* CỘT PHẢI - FORM AUTHENTICATION */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start bg-slate-50 px-6 sm:px-12 lg:px-16 py-10">
            <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
              {/* Header Navigator */}
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="group flex items-center gap-1.5 text-slate-600 hover:text-orange-600 transition-colors py-1 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                    arrow_back
                  </span>
                  <span>Về trang chủ</span>
                </Link>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-extrabold tracking-wider">
                  <span className="material-symbols-outlined text-[15px]">
                    shield_lock
                  </span>
                  <span>MOCK DEMO MODE</span>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl sm:text-4xl text-slate-900 font-black tracking-tight uppercase">
                  {activeTab === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký hội viên mới'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {activeTab === 'login'
                    ? 'Chọn vai trò và sử dụng nút bấm nhanh bên dưới để trải nghiệm ngay các giao diện quản trị.'
                    : 'Tạo tài khoản để đăng ký các gói tập luyện, giữ chỗ cụm sân và kết nối với Huấn luyện viên.'}
                </p>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-200/80 border border-slate-300/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-orange-500">login</span>
                  <span>ĐĂNG NHẬP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-orange-500">person_add</span>
                  <span>ĐĂNG KÝ MỚI</span>
                </button>
              </div>

              {/* THANH BẤM ĐĂNG NHẬP NHANH DEMO DÀNH CHO 4 VAI TRÒ */}
              {activeTab === 'login' && (
                <div className="p-4 bg-orange-500/10 border border-orange-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-800">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      <span>CHỌN TÀI KHOẢN MẪU ĐỂ TEST:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Pass: 12345678</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('MEMBER')}
                      className="py-2 px-2 bg-white hover:bg-orange-500 hover:text-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 shadow-sm transition-all"
                    >
                      👤 Member
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('COACH')}
                      className="py-2 px-2 bg-white hover:bg-orange-500 hover:text-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 shadow-sm transition-all"
                    >
                      🏋️ Coach
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('RECEPTIONIST')}
                      className="py-2 px-2 bg-white hover:bg-orange-500 hover:text-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 shadow-sm transition-all"
                    >
                      📋 Lễ Tân
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('MANAGER')}
                      className="py-2 px-2 bg-white hover:bg-orange-500 hover:text-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 shadow-sm transition-all"
                    >
                      👑 Admin
                    </button>
                  </div>
                </div>
              )}

              {/* FORM TAB 1: ĐĂNG NHẬP */}
              {activeTab === 'login' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                    {authError && (
                      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                        {authError}
                      </p>
                    )}
                    {authNotice && (
                      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                        {authNotice}
                      </p>
                    )}

                    {/* Role Selection */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-role" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                        Đăng nhập với vai trò
                      </label>
                      <select
                        id="login-role"
                        required
                        value={loginRole}
                        onChange={(e) => {
                          setLoginRole(e.target.value);
                          setAuthError('');
                        }}
                        className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm transition-all"
                      >
                        <option value="MEMBER">Hội viên / Khách hàng</option>
                        <option value="COACH">Huấn luyện viên (Coach)</option>
                        <option value="RECEPTIONIST">Nhân viên Lễ tân</option>
                        <option value="MANAGER">Quản lý trung tâm (Admin)</option>
                      </select>
                    </div>

                    {/* Email / Identifier */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                        Địa chỉ Email / Số điện thoại
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
                          placeholder="member@fpt.edu.vn / admin@fpt.edu.vn..."
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Mật khẩu
                        </label>
                        <button
                          type="button"
                          onClick={() => alert('Vui lòng liên hệ Lễ tân hoặc Hotline 1900 8899.')}
                          className="text-xs text-orange-600 hover:underline font-bold"
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
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="••••••••"
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm transition-all"
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
                      className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP NGAY'}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  </form>
                </div>
              )}

              {/* FORM TAB 2: ĐĂNG KÝ MỚI */}
              {activeTab === 'register' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
                    {authError && (
                      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                        {authError}
                      </p>
                    )}
                    {authNotice && (
                      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                        {authNotice}
                      </p>
                    )}

                    {/* THÔNG TIN CƠ BẢN */}
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] flex items-center justify-center font-black">
                            1
                          </span>
                          <span className="text-xs text-slate-900 uppercase font-black tracking-wider">
                            THÔNG TIN CƠ BẢN
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          * Bắt buộc
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="register-role" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Đăng ký vai trò *
                        </label>
                        <select
                          id="register-role"
                          required
                          value={regForm.role}
                          onChange={(e) => updateRegForm('role', e.target.value)}
                          className="w-full bg-white text-slate-900 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                        >
                          <option value="MEMBER">Hội viên / Khách hàng</option>
                          <option value="COACH">Huấn luyện viên (Coach) — Chờ Quản lý duyệt</option>
                          <option value="RECEPTIONIST">Nhân viên Lễ tân — Chờ Quản lý duyệt</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                              onChange={(e) => updateRegForm('fullName', e.target.value)}
                              placeholder="Nguyễn Văn A"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                            />
                          </div>
                        </div>

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
                              onChange={(e) => updateRegForm('phone', e.target.value)}
                              placeholder="0912 345 678"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

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
                            onChange={(e) => updateRegForm('email', e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                          />
                        </div>
                      </div>

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
                            onChange={(e) => updateRegForm('password', e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
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
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        required
                        checked={regForm.agreeTerms}
                        onChange={(e) => updateRegForm('agreeTerms', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 font-medium">
                        Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'ĐANG KHỞI TẠO...' : 'ĐĂNG KÝ MỚI NGAY'}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Bottom Support Footer */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-orange-500">
                    support_agent
                  </span>
                  <span>
                    Hotline 24/7: <strong className="text-slate-900 font-extrabold">1900 8899</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}