import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticateUser, showToast } = useApp();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || queryParams.get('email') || '';
  const initialFullName = location.state?.fullName || queryParams.get('fullName') || 'Hội viên';

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);

  // 6 digits array
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // 10 minutes (600s) countdown timer per spec
  const [timer, setTimer] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState(
    initialEmail
      ? `Mã OTP xác thực 6 số đã được gửi tới email ${initialEmail}. Vui lòng kiểm tra hộp thư.`
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Main countdown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !isEditingEmail) {
      inputRefs.current[0].focus();
    }
  }, [isEditingEmail]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Single digit entry
    const char = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMessage('');

    // Advance to next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);
    setErrorMessage('');

    const nextIndex = Math.min(pasteData.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  const fullOtp = otpDigits.join('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setInfoNotice('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email cần xác thực.');
      setIsEditingEmail(true);
      return;
    }

    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    if (timer <= 0) {
      setErrorMessage('Mã OTP đã hết thời hạn 10 phút. Vui lòng bấm "Gửi lại mã OTP".');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: fullOtp,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let parsed = text;
        try {
          const json = JSON.parse(text);
          parsed = json.message || json.error || text;
        } catch {
          // keep text
        }
        throw new Error(parsed || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }

      const authData = await response.json();
      showToast('Kích hoạt thành công', 'Tài khoản của bạn đã được kích hoạt ACTIVE thành công!');

      // Tự động authenticate hoặc điều hướng
      const roleMap = {
        MEMBER: { key: 'member', path: '/member' },
        RECEPTIONIST: { key: 'receptionist', path: '/receptionist' },
        COACH: { key: 'coach', path: '/coach' },
        MANAGER: { key: 'admin', path: '/admin' },
        ADMIN: { key: 'admin', path: '/admin' },
      };
      const dest = roleMap[authData.role?.toUpperCase()] || { key: 'member', path: '/member' };

      if (authData.token) {
        authenticateUser(authData, dest.key, authData.token);
        navigate(dest.path, { replace: true });
      } else {
        navigate('/login', {
          state: {
            email: email.trim(),
            message: 'Tài khoản đã được kích hoạt thành công! Vui lòng đăng nhập.',
          },
        });
      }

    } catch (err) {
      setErrorMessage(err.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại mã.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email để nhận mã OTP.');
      setIsEditingEmail(true);
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setInfoNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Không thể gửi lại mã OTP lúc này.');
      }

      setTimer(600); // Reset timer 10 phút
      setResendCooldown(60); // 60s cooldown
      setOtpDigits(['', '', '', '', '', '']);
      setInfoNotice(`Mã OTP mới đã được gửi thành công đến ${email.trim()}. Có hiệu lực trong 10 phút.`);
      showToast('Đã gửi OTP', `Mã xác thực mới đã được gửi tới ${email.trim()}`);
      if (inputRefs.current[0]) inputRefs.current[0].focus();

    } catch (err) {
      setErrorMessage(err.message || 'Không thể gửi lại mã. Vui lòng thử lại sau giây lát.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 4H19L17.5 8H11.5L10.5 11H16.5L15 15H10L8.5 20H4.5L7 4Z" fill="currentColor" />
            </svg>
          </div>
          <span className="font-headline-sm text-lg uppercase tracking-tight text-slate-900 font-black">
            F SPORT <span className="text-orange-500">CENTER</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-orange-600 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Đăng nhập</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/register"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-slate-900 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Đăng ký</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 mx-auto rounded-3xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-lg mb-4">
              <span className="material-symbols-outlined text-3xl">mark_email_read</span>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider mb-2">
              Xác Thực Tài Khoản Email
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Nhập Mã OTP Xác Thực
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
              Theo quy chuẩn bảo mật backend, mã OTP gồm 6 chữ số có hiệu lực trong 10 phút.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Email Identification Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-orange-500">mail</span>
                  <span>Email nhận mã:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(!isEditingEmail)}
                  className="text-orange-600 hover:underline font-extrabold cursor-pointer"
                >
                  {isEditingEmail ? 'Xong' : 'Thay đổi'}
                </button>
              </div>

              {isEditingEmail ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(false)}
                    className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900 break-all">
                    {email || '(Chưa nhập email)'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[14px]">check</span> Đã gửi mã
                  </span>
                </div>
              )}
            </div>

            {/* Alert & Notice */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-red-600">error</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {infoNotice && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs font-medium animate-in fade-in">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-amber-600">info</span>
                <span className="leading-relaxed">{infoNotice}</span>
              </div>
            )}

            {/* 6 Digits OTP Inputs */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                    Mã xác thực 6 số (OTP Code) *
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Hỗ trợ dán (Paste)</span>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-black rounded-2xl border-2 transition-all outline-none shadow-sm ${
                        digit
                          ? 'border-orange-500 bg-orange-50/50 text-slate-900 shadow-orange-500/10'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown Timer Display */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="material-symbols-outlined text-[18px] text-orange-600">timer</span>
                  <span>Thời gian hiệu lực còn lại:</span>
                  <span
                    className={`font-mono text-sm font-black px-2 py-0.5 rounded-md ${
                      timer <= 60
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {formatTimer(timer)}
                  </span>
                </div>
                {timer === 0 && (
                  <span className="text-[11px] text-red-600 font-bold">
                    Mã xác thực đã hết hạn (quá 10 phút). Vui lòng nhấn &quot;Gửi lại mã OTP&quot;.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={fullOtp.length !== 6 || isSubmitting || timer === 0}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>ĐANG XÁC THỰC MÃ...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                      <span>XÁC THỰC & KÍCH HOẠT TÀI KHOẢN</span>
                    </>
                  )}
                </button>

                {/* Resend button */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 disabled:text-slate-400 hover:underline transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isResending ? 'hourglass_top' : 'refresh'}
                    </span>
                    <span>
                      {resendCooldown > 0
                        ? `Gửi lại mã OTP sau (${resendCooldown}s)`
                        : isResending
                        ? 'Đang gửi lại mã...'
                        : 'Chưa nhận được mã? Gửi lại mã OTP'}
                    </span>
                  </button>
                </div>
              </div>
            </form>

            {/* Backend Spec Information Footnote */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="material-symbols-outlined text-[16px] text-orange-500">info</span>
                <span>Thông tin kiểm tra từ hệ thống:</span>
              </div>
              <p className="leading-relaxed">
                • Người gửi: <strong className="text-slate-900">Admin &lt;dieuminh9102005@gmail.com&gt;</strong>
              </p>
              <p className="leading-relaxed">
                • Tiêu đề email: <strong className="text-slate-900">Mã xác thực tài khoản SportHub</strong>
              </p>
              <p className="leading-relaxed">
                • Nếu không tìm thấy trong Hộp thư đến, vui lòng kiểm tra thư mục <strong className="text-slate-900">Spam / Thư rác</strong> hoặc bấm gửi lại.
              </p>
            </div>

            {/* Bottom Links */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <Link
                to="/register"
                className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Đăng ký tài khoản khác</span>
              </Link>
              <Link
                to="/change-password"
                className="text-orange-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Đổi mật khẩu tạm</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        © 2026 F SPORT CENTER • Trung Tâm Thể Thao Đa Năng. Hotline hỗ trợ: 1900 8899
      </footer>
    </div>
  );
}
