import { useEffect, useState } from 'react';
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
const REGISTRATION_ROLES = [
  {
    value: 'MEMBER',
    label: 'Hội viên',
    hint: 'Xác thực OTP email',
    icon: 'person',
  },
  {
    value: 'COACH',
    label: 'Huấn luyện viên',
    hint: 'Chờ Quản lý duyệt',
    icon: 'sports',
  },
  {
    value: 'RECEPTIONIST',
    label: 'Lễ tân',
    hint: 'Chờ Quản lý duyệt',
    icon: 'support_agent',
  },
];

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticateUser, currentUser, currentRole } = useApp();
  const redirectFrom = typeof location.state?.from === 'string'
    ? location.state.from
    : location.state?.from?.pathname
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : '';

  useEffect(() => {
    if (currentUser) {
      navigate(ROLE_HOME_PATHS[currentRole] || '/', { replace: true });
    }
  }, [currentUser, currentRole, navigate]);

  // Active Tab: derived from route URL ('/register' -> 'register', otherwise 'login')
  const activeTab = location.pathname === '/register' ? 'register' : 'login';
  const setActiveTab = (tab, keepNotice = false) => {
    setAuthError('');
    if (!keepNotice) setAuthNotice('');
    navigate(tab === 'register' ? '/register' : '/login');
  };

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState(
    location.state?.notice || location.state?.message || '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoDialog, setInfoDialog] = useState(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(location.state?.email || '');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (hỗ trợ MEMBER tự xác thực OTP và COACH/RECEPTIONIST chờ Quản lý phê duyệt)
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    role: 'MEMBER',
    agreeTerms: true,
  });

  const handleRoleSelect = (roleValue) => {
    setAuthError('');
    setRegForm((prev) => ({
      ...prev,
      role: roleValue,
    }));
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
    const allowedPrefix = destination.path;
    const targetUrl = redirectFrom && (redirectFrom.startsWith(allowedPrefix) || redirectFrom === '/pricing')
      ? redirectFrom
      : destination.path;
    navigate(targetUrl, { replace: true });
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
        const rawBody = await response.text();
        let errorData = null;
        try {
          errorData = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          throw new Error(rawBody || `Đăng nhập thất bại (${response.status})`);
        }

        // Check nếu là lỗi PENDING_VERIFICATION
        if (errorData && errorData.error === 'PENDING_VERIFICATION') {
          setAuthNotice(errorData.message);
          setTimeout(() => {
            navigate('/verify-otp', {
              state: {
                email: errorData.email,
                fromLogin: true,
              }
            });
          }, 2000);
          return;
        }

        // Xử lý lỗi bình thường (user not found, wrong password, etc.)
        const errorMessage = errorData?.message || errorData?.error || 'Đăng nhập thất bại';
        throw new Error(errorMessage);
      }

      const user = await response.json();

      // ✅ CHECK requirePasswordChange flag (Staff cần đổi password lần đầu)
      if (user.requirePasswordChange === true) {
        // Lưu token tạm để /change-password dùng
        localStorage.setItem('authToken', user.token);
        localStorage.setItem('tempUserEmail', user.email);

        navigate('/change-password', {
          state: {
            email: user.email,
            fullName: user.fullName,
            fromLogin: true,
            message: 'Bạn cần đổi mật khẩu tạm thời để tiếp tục sử dụng hệ thống.'
          }
        });
        return;
      }

      // Normal flow: authenticate user
      authenticate(user);

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
          role: regForm.role,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      const user = await response.json();
      const registeredRole = (user.role || regForm.role || 'MEMBER').toUpperCase();
      if (regForm.role !== 'MEMBER' && registeredRole === 'MEMBER') {
        throw new Error('Máy chủ chưa ghi nhận đúng vai trò nhân sự. Vui lòng thử lại sau.');
      }
      if (registeredRole !== 'MEMBER') {
        setRegForm({
          fullName: '',
          phone: '',
          email: '',
          password: '',
          role: 'MEMBER',
          agreeTerms: true,
        });
        setAuthNotice(
          user.message ||
            'Đăng ký tài khoản nhân sự thành công. Tài khoản của bạn đang chờ Quản lý phê duyệt trước khi đăng nhập.',
        );
        setActiveTab('login', true);
        return;
      }
      // Điều hướng trực tiếp sang trang OTP Screen đối với Hội viên
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

  return (
    <div className="min-h-dvh lg:h-dvh bg-[#f7f9fb] font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <main className="w-full min-h-dvh lg:h-full">
        <div className="flex flex-col lg:flex-row w-full min-h-dvh lg:h-full">

          {/* =========================================
              CỘT TRÁI (50% WIDTH, FULL HEIGHT ON DESKTOP)
             ========================================= */}
          <div className="relative w-full lg:w-1/2 lg:h-full lg:overflow-y-auto overflow-x-clip flex flex-col justify-between gap-4 p-5 sm:p-8 lg:p-8 xl:p-10 bg-slate-900">
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
                }}
              ></div>

              {/* Gradient Scrim Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-white/5"></div>

              {/* Ambient Glow Accent (Cam F) */}
              <div className="absolute top-1/3 -left-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* Top Branding Meta (Đã thông thoáng không bị ô nổi đè lên) */}
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316] animate-pulse"></div>
                <span className="font-headline-sm text-xl tracking-wider text-white font-black drop-shadow-sm uppercase">
                  F SPORT <span className="text-orange-500">CENTER</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] uppercase tracking-wider font-semibold shadow-xs">
                  TRUNG TÂM THỂ THAO ĐA NĂNG
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span className="text-[11px] text-orange-400 font-bold tracking-wider">
                  HÀ NỘI • SÀI GÒN
                </span>
              </div>
            </div>

            {/* Central Kinetic Content Cluster */}
            <div className="relative z-10 flex flex-col gap-4 my-auto py-2">
              {/* Glassmorphic Panel */}
              <div className="bg-white/95 backdrop-blur-xl p-5 sm:p-6 xl:p-7 rounded-2xl lg:rounded-3xl shadow-2xl border border-white/70 space-y-3 text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] uppercase tracking-wider font-black">
                    Đặc quyền gia nhập
                  </span>
                  <span aria-hidden="true" className="material-symbols-outlined text-orange-600 font-bold text-[22px]">
                    verified
                  </span>
                </div>

                <h2
                  className="font-headline-lg text-xl sm:text-2xl xl:text-[1.65rem] text-slate-900 tracking-normal font-black uppercase leading-[1.3]"
                  style={{ lineHeight: 1.32 }}
                >
                  Bứt Phá Giới Hạn Cùng Hệ Sinh Thái Đẳng Cấp
                </h2>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-orange-600">
                      sports_tennis
                    </span>
                    <span>Đặt sân trực tuyến 24/7</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-orange-600">
                      military_tech
                    </span>
                    <span>Đội ngũ HLV chuẩn NASM & PPR</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-orange-600">
                      vital_signs
                    </span>
                    <span>Đo chỉ số InBody 770 & PAR-Q miễn phí</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
                <div className="bg-white/90 backdrop-blur-md p-3 lg:p-3.5 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-lg sm:text-xl text-slate-900 font-black tracking-tight">
                    5.200+
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5 font-bold">
                    Hội viên hoạt động
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-3 lg:p-3.5 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-lg sm:text-xl text-slate-900 font-black tracking-tight">
                    30+ SÂN
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5 font-bold">
                    Pickleball & Tennis
                  </span>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-3 lg:p-3.5 rounded-2xl flex flex-col border border-white/60 shadow-md">
                  <span className="font-headline-md text-lg sm:text-xl text-slate-900 font-black tracking-tight">
                    50 HLV
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5 font-bold">
                    HLV Chuyên nghiệp
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Footer */}
            <div className="relative z-10 flex items-center justify-between text-slate-300 text-xs">
              <span className="text-[10px] tracking-wider uppercase text-white/80 font-bold">
                © 2026 F SPORT CENTER • BẢN QUYỀN ĐƯỢC BẢO LƯU
              </span>
              <span className="text-[10px] tracking-widest text-orange-400 font-black flex items-center gap-1.5 drop-shadow-sm uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> HỆ THỐNG SẴN SÀNG
              </span>
            </div>
          </div>

          {/* =========================================
              CỘT PHẢI (50% WIDTH, FULL-HEIGHT BALANCED AUTH FORM)
             ========================================= */}
          <div className="w-full lg:w-1/2 lg:h-full lg:overflow-y-auto flex flex-col justify-between gap-3 [@media(min-height:760px)]:gap-4 [@media(min-height:840px)]:gap-6 bg-[#f7f9fb] px-5 sm:px-10 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-4 [@media(min-height:760px)]:py-6 [@media(min-height:840px)]:py-8">
            {/* Header Navigation Cột Phải (Pinned Top) */}
            <div className="w-full max-w-xl mx-auto flex items-center justify-between gap-2 shrink-0">
              <Link
                to="/"
                className="group flex items-center gap-1.5 text-slate-600 hover:text-orange-600 transition-colors py-1.5 px-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs font-bold uppercase tracking-wider"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[17px] group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <span>Về trang chủ</span>
              </Link>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 border border-slate-300/70 text-slate-700 text-[10px] font-bold tracking-wider">
                <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-orange-600">
                  shield_lock
                </span>
                <span>CỔNG HỘI VIÊN BẢO MẬT SSL 256-BIT</span>
              </div>
            </div>

            {/* Center Form Container */}
            <div className="w-full max-w-xl mx-auto my-auto flex flex-col gap-2.5 [@media(min-height:760px)]:gap-3.5 [@media(min-height:840px)]:gap-5">
              {/* Headline Context */}
              <div className="flex flex-col gap-1">
                <h1
                  className="font-headline-xl text-2xl sm:text-[1.75rem] [@media(min-height:840px)]:text-3xl text-slate-900 font-black uppercase tracking-normal leading-[1.3]"
                  style={{ lineHeight: 1.3 }}
                >
                  {activeTab === 'login' ? 'Đăng Nhập Tài Khoản' : 'Chào Mừng Đến Với F Sport'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-snug">
                  {activeTab === 'login'
                    ? 'Chào mừng bạn quay trở lại với F Sport Center. Vui lòng nhập thông tin để truy cập lịch tập, thẻ hội viên và các dịch vụ thể thao.'
                    : 'Đăng ký tài khoản hội viên để bắt đầu lịch trình tập luyện, giữ chỗ cụm sân và nhận hỗ trợ từ huấn luyện viên chuyên nghiệp.'}
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-200/70 border border-slate-300/60 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center justify-center gap-2 py-2 [@media(min-height:840px)]:py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-orange-600 shadow-xs border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">login</span>
                  <span>ĐĂNG NHẬP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex items-center justify-center gap-2 py-2 [@media(min-height:840px)]:py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-white text-orange-600 shadow-xs border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>ĐĂNG KÝ MỚI</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase leading-none">
                    Ưu đãi
                  </span>
                </button>
              </div>

              {/* =========================================
                  TAB 1: ĐĂNG NHẬP (LOGIN VIEW)
                 ========================================= */}
              {activeTab === 'login' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5 [@media(min-height:840px)]:gap-4">
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
                      <label htmlFor="login-identifier" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                        Địa chỉ Email hoặc Số điện thoại
                      </label>
                      <div className="relative flex items-center">
                        <span aria-hidden="true" className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                          account_circle
                        </span>
                        <input
                          id="login-identifier"
                          name="username"
                          type="text"
                          autoComplete="username"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          enterKeyHint="next"
                          required
                          value={loginIdentifier}
                          onChange={(e) => {
                            setLoginIdentifier(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="name@example.com / 0912..."
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-2.5 [@media(min-height:840px)]:py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="login-password" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Mật khẩu
                        </label>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-bold cursor-pointer"
                        >
                          Quên mật khẩu?
                        </Link>
                      </div>
                      <div className="relative flex items-center">
                        <span aria-hidden="true" className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                          lock
                        </span>
                        <input
                          id="login-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          enterKeyHint="done"
                          required
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setAuthError('');
                          }}
                          placeholder="••••••••"
                          className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-10 pr-11 py-2.5 [@media(min-height:840px)]:py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                        />
                        <button
                          type="button"
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 [@media(min-height:840px)]:py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs sm:text-sm uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP NGAY'}</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 pt-1 text-xs sm:text-sm text-slate-600 font-medium">
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
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-2.5 [@media(min-height:840px)]:gap-3.5">
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
                    <div className="flex flex-col gap-2.5 [@media(min-height:840px)]:gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-black">
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

                      {/* Vai trò đăng ký */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                          Vai trò tài khoản *
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {REGISTRATION_ROLES.map((item) => {
                            const selected = regForm.role === item.value;
                            return (
                              <button
                                key={item.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => handleRoleSelect(item.value)}
                                className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                                  selected
                                    ? 'border-orange-500 bg-orange-50/90 text-orange-950 ring-1 ring-orange-500 shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 text-xs font-extrabold leading-tight">
                                  <span
                                    aria-hidden="true"
                                    className={`material-symbols-outlined text-[16px] ${
                                      selected ? 'text-orange-600' : 'text-slate-400'
                                    }`}
                                  >
                                    {item.icon}
                                  </span>
                                  {item.label}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                                  {item.hint}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 [@media(min-height:840px)]:gap-3">
                        {/* Họ và tên */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <label htmlFor="register-fullname" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                            Họ và tên *
                          </label>
                          <div className="relative flex items-center">
                            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                              person
                            </span>
                            <input
                              id="register-fullname"
                              name="fullName"
                              type="text"
                              autoComplete="name"
                              enterKeyHint="next"
                              required
                              maxLength={100}
                              value={regForm.fullName}
                              onChange={(e) => {
                                setRegForm((prev) => ({ ...prev, fullName: e.target.value }));
                                setAuthError('');
                              }}
                              placeholder="Nguyễn Văn A"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 [@media(min-height:840px)]:py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Số điện thoại */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <label htmlFor="register-phone" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                            Số điện thoại *
                          </label>
                          <div className="relative flex items-center">
                            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                              phone
                            </span>
                            <input
                              id="register-phone"
                              name="phone"
                              type="tel"
                              autoComplete="tel"
                              enterKeyHint="next"
                              required
                              maxLength={15}
                              value={regForm.phone}
                              onChange={(e) => {
                                setRegForm((prev) => ({ ...prev, phone: e.target.value }));
                                setAuthError('');
                              }}
                              placeholder="0912 345 678"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 [@media(min-height:840px)]:py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 [@media(min-height:840px)]:gap-3 items-start">
                        {/* Email */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <label htmlFor="register-email" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                            Địa chỉ Email *
                          </label>
                          <div className="relative flex items-center">
                            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                              mail
                            </span>
                            <input
                              id="register-email"
                              name="email"
                              type="email"
                              autoComplete="username"
                              spellCheck={false}
                              enterKeyHint="next"
                              required
                              maxLength={100}
                              value={regForm.email}
                              onChange={(e) => {
                                setRegForm((prev) => ({ ...prev, email: e.target.value }));
                                setAuthError('');
                              }}
                              placeholder="name@example.com"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 [@media(min-height:840px)]:py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <label htmlFor="register-password" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                            Mật khẩu bảo mật *
                          </label>
                          <div className="relative flex items-center">
                            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                              lock
                            </span>
                            <input
                              id="register-password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              enterKeyHint="done"
                              aria-describedby="register-password-hint"
                              required
                              minLength={8}
                              value={regForm.password}
                              onChange={(e) => {
                                setRegForm((prev) => ({ ...prev, password: e.target.value }));
                                setAuthError('');
                              }}
                              placeholder="••••••••"
                              className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-10 py-2 [@media(min-height:840px)]:py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-2xs"
                            />
                            <button
                              type="button"
                              aria-pressed={showPassword}
                              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                {showPassword ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          </div>
                          <span id="register-password-hint" className="text-[11px] text-slate-500 font-medium">
                            Mật khẩu cần tối thiểu 8 ký tự.
                          </span>
                        </div>
                      </div>

                      {regForm.role !== 'MEMBER' && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
                          {regForm.role === 'COACH'
                            ? 'Tài khoản Huấn luyện viên sẽ chờ Quản lý phê duyệt và phân công bộ môn giảng dạy trước khi đăng nhập.'
                            : 'Tài khoản Lễ tân sẽ chờ Quản lý phê duyệt trước khi đăng nhập.'}
                        </p>
                      )}
                    </div>

                    {/* Agree Terms Checkbox */}
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        required
                        checked={regForm.agreeTerms}
                        onChange={(e) => setRegForm((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 font-medium leading-snug">
                        Tôi đồng ý với{' '}
                        <button
                          type="button"
                          onClick={() => setInfoDialog({
                            title: 'Điều khoản dịch vụ',
                            content: 'Hội viên tuân thủ nội quy an toàn tập luyện, đặt lịch trước và check-in đúng giờ tại quầy hoặc cổng tự động RFID/QR của F Sport Center.',
                          })}
                          className="text-slate-900 font-bold hover:underline cursor-pointer"
                        >
                          Điều khoản dịch vụ
                        </button>{' '}
                        và{' '}
                        <button
                          type="button"
                          onClick={() => setInfoDialog({
                            title: 'Chính sách bảo mật',
                            content: 'Thông tin cá nhân, chỉ số sức khỏe PAR-Q/InBody và lịch sử giao dịch của bạn chỉ được sử dụng cho vận hành hội viên tại F Sport Center và bảo mật theo quy định hiện hành.',
                          })}
                          className="text-slate-900 font-bold hover:underline cursor-pointer"
                        >
                          Chính sách bảo mật
                        </button>{' '}
                        của F Sport Center.
                      </span>
                    </label>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 [@media(min-height:840px)]:py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs sm:text-sm uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ TÀI KHOẢN NGAY'}</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>

                  </form>
                </div>
              )}
            </div>

            {/* Sticky Support Micro Footer (Pinned Bottom) */}
            <div className="w-full max-w-xl mx-auto pt-2.5 [@media(min-height:760px)]:pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-200 shrink-0">
              <div className="flex items-center gap-1.5 font-medium">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-orange-600">
                  support_agent
                </span>
                <span>
                  Hotline 24/7: <strong className="text-slate-900 font-bold">1900 8899</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 font-medium">
                <button
                  type="button"
                  onClick={() => setInfoDialog({
                    title: 'Trung tâm trợ giúp',
                    content: 'Cần hỗ trợ đăng nhập, xác thực OTP hoặc cấp lại mật khẩu, vui lòng gọi hotline 1900 8899 hoặc liên hệ trực tiếp bộ phận Lễ tân tại trung tâm.',
                  })}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Trợ giúp
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setInfoDialog({
                    title: 'Nội quy sân đấu',
                    content: 'Vui lòng mang giày thể thao chuyên dụng, không mang thức ăn có mùi vào khu vực sân tập và đến check-in trước giờ đặt từ 10–15 phút.',
                  })}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Nội quy sân đấu
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {infoDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-info-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs !m-0"
          onClick={() => setInfoDialog(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="auth-info-dialog-title" className="text-base font-black text-slate-900 uppercase tracking-tight">
                {infoDialog.title}
              </h3>
              <button
                type="button"
                aria-label="Đóng hộp thoại"
                onClick={() => setInfoDialog(null)}
                className="w-8 h-8 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {infoDialog.content}
            </p>
            <button
              type="button"
              onClick={() => setInfoDialog(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
