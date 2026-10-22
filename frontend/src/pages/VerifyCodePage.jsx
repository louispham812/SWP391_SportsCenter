import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useApp();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || queryParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);

  // 6 ô số OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Countdown timer 5 phút (300 giây) theo đúng quy định backend
  const [timer, setTimer] = useState(300);
  // Cooldown gửi lại mã: 60 giây
  const [resendCooldown, setResendCooldown] = useState(60);

  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState(
    initialEmail
      ? `Mã xác thực OTP gồm 6 chữ số đã được gửi tới ${initialEmail}. Vui lòng kiểm tra hộp thư.`
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Bộ đếm thời gian 5 phút cho OTP
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

  // Bộ đếm thời gian cooldown 60 giây gửi lại mã
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

  // Tự động focus ô đầu tiên
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
    if (isLocked) return;
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const char = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMessage('');

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
    if (isLocked) return;
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

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Vui lòng nhập email tài khoản cần xác thực.');
      setIsEditingEmail(true);
      return;
    }

    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    if (timer <= 0) {
      setErrorMessage('Mã OTP đã hết hiệu lực 5 phút. Vui lòng bấm "Gửi lại mã".');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: fullOtp,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorText = data.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
        if (errorText.includes('bị khóa') || errorText.includes('5 lần')) {
          setIsLocked(true);
        }
        throw new Error(errorText);
      }

      if (!data.resetToken) {
        throw new Error('Không nhận được mã xác thực resetToken từ hệ thống.');
      }

      if (showToast) {
        showToast('Xác thực OTP thành công', 'Vui lòng thiết lập mật khẩu mới cho tài khoản.');
      }

      // Chuyển sang màn hình /reset-password kèm resetToken và email
      navigate('/reset-password', {
        state: {
          email: cleanEmail,
          resetToken: data.resetToken,
        },
      });

    } catch (err) {
      setErrorMessage(err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email để nhận mã OTP.');
      setIsEditingEmail(true);
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setInfoNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã OTP lúc này.');
      }

      setTimer(300); // Đặt lại bộ đếm 5 phút
      setResendCooldown(60); // 60s cooldown
      setOtpDigits(['', '', '', '', '', '']);
      setIsLocked(false);
      setInfoNotice(`Mã OTP mới đã được gửi tới ${cleanEmail}. Hiệu lực 5 phút.`);

      if (showToast) {
        showToast('Đã gửi lại OTP', `Mã xác nhận mới đã được gửi tới ${cleanEmail}`);
      }

      if (inputRefs.current[0]) inputRefs.current[0].focus();

    } catch (err) {
      setErrorMessage(err.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.');
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
            <span className="material-symbols-outlined text-[20px]">fitness_center</span>
          </div>
          <span className="font-headline-sm text-lg uppercase tracking-tight text-slate-900 font-black">
            F SPORT <span className="text-orange-500">CENTER</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/forgot-password"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-orange-600 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Đổi email khác</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/login"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-slate-900 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Đăng nhập</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Banner phong cách thể thao F Sport */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-lg mb-4">
              <span className="material-symbols-outlined text-3xl">sms</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/90 text-white text-[10px] font-black uppercase tracking-wider mb-2 shadow-xs">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>Thời Gian Hiệu Lực: 5 Phút</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Nhập Mã OTP Xác Nhận
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed font-medium">
              Vui lòng nhập 6 chữ số OTP vừa được gửi về hòm thư của bạn. Mã chỉ sử dụng được 1 lần duy nhất.
            </p>
          </div>

          {/* Stepper Tiến trình 3 Bước */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {/* Step 1: Done */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">Gửi mã</span>
              </div>
              <div className="flex-1 h-0.5 bg-orange-500 mx-2"></div>

              {/* Step 2: Active */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  2
                </div>
                <span className="text-xs font-black text-orange-600 uppercase tracking-tight">Nhập OTP</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Mật khẩu mới</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Email Identification Info Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Email nhận mã</p>
                  {isEditingEmail ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="text-xs font-black text-slate-900 border-b border-orange-500 outline-none bg-transparent pt-0.5"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      {email || 'Chưa có email'}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
              >
                {isEditingEmail ? 'Lưu' : 'Thay đổi'}
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Info Notice */}
            {infoNotice && (
              <div role="status" className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-600">info</span>
                <span>{infoNotice}</span>
              </div>
            )}

            {/* 6 Ô Nhập OTP (PIN Code Style) */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Nhập mã 6 chữ số
                </label>
                
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={isLocked}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-xl border outline-none transition-all shadow-2xs ${
                        isLocked
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : digit
                          ? 'border-orange-500 bg-orange-50/30 text-orange-600 ring-2 ring-orange-500/20'
                          : 'border-slate-300 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Expiration Timer Indicator */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                  <span className="text-xs text-slate-500 font-medium">Mã hết hạn trong:</span>
                  <span className={`text-xs font-black tracking-wider ${timer <= 60 ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                    {formatTimer(timer)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || fullOtp.length !== 6 || isLocked || timer <= 0}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>ĐANG XÁC NHẬN MÃ...</span>
                  </>
                ) : (
                  <>
                    <span>XÁC NHẬN MÃ OTP</span>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Code Link with 60s cooldown */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Chưa nhận được mã?</span>
                {resendCooldown > 0 ? (
                  <span className="text-slate-400 font-bold">
                    Gửi lại mã sau ({resendCooldown}s)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-orange-600 hover:text-orange-700 font-black underline cursor-pointer disabled:opacity-50"
                  >
                    {isResending ? 'Đang gửi lại...' : 'Gửi lại mã'}
                  </button>
                )}
              </div>

              <Link
                to="/forgot-password"
                className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                <span>Quay lại</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        © 2026 F SPORT CENTER • HỆ THỐNG TRUNG TÂM THỂ THAO ĐẲNG CẤP
      </footer>
    </div>
  );
}
