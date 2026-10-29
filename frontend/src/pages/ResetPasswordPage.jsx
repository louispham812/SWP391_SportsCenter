import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useApp();

  const queryParams = new URLSearchParams(location.search);
  const resetToken = location.state?.resetToken || queryParams.get('token') || '';
  const email = location.state?.email || queryParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kiểm tra độ mạnh mật khẩu theo thời gian thực
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200', width: '0%' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-red-500', width: '25%' };
    if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500', width: '50%' };
    if (score === 3) return { score: 3, label: 'Khá mạnh', color: 'bg-blue-500', width: '75%' };
    return { score: 4, label: 'Rất mạnh (Tối ưu)', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  // Kiểm tra các tiêu chuẩn bắt buộc
  const criteria = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[@$!%*?&#]/.test(newPassword), // Special char requirement
  };

  const isAllValid = criteria.length && criteria.upper && criteria.lower && criteria.number && criteria.special;
  const isMatch = confirmPassword && newPassword === confirmPassword;
  const isMismatch = confirmPassword && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!resetToken) {
      setErrorMessage('Mã phiên resetToken bị thiếu hoặc đã hết hạn. Vui lòng thực hiện lại từ bước đầu.');
      return;
    }

    if (!isAllValid) {
      setErrorMessage('Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt @$!%*?&#).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: resetToken.trim(),
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }

      setIsSuccess(true);
      if (showToast) {
        showToast('Đặt lại mật khẩu thành công', 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.');
      }

      // Tự động chuyển hướng về trang đăng nhập sau 2.5s
      setTimeout(() => {
        navigate('/login', {
          state: {
            email: email,
            message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.',
          },
        });
      }, 2500);

    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi cập nhật mật khẩu. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
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
            to="/login"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-orange-600 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Trang đăng nhập</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-lg mb-4">
              <span className="material-symbols-outlined text-3xl">key</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/90 text-white text-[10px] font-black uppercase tracking-wider mb-2 shadow-xs">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span>Bước Cuối Cùng</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Tạo Mật Khẩu Mới
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed font-medium">
              Vui lòng thiết lập mật khẩu mới có độ bảo mật cao để bảo vệ tài khoản hội viên F Sport Center.
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
              <div className="flex-1 h-0.5 bg-emerald-500 mx-2"></div>

              {/* Step 2: Done */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">Nhập OTP</span>
              </div>
              <div className="flex-1 h-0.5 bg-orange-500 mx-2"></div>

              {/* Step 3: Active */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  3
                </div>
                <span className="text-xs font-black text-orange-600 uppercase tracking-tight">Mật khẩu mới</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Warning if no resetToken */}
            {!resetToken && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
                  <span>Phiên xác thực bị thiếu hoặc đã hết hạn 10 phút.</span>
                </div>
                <p className="text-[11px] font-normal text-amber-700">
                  Bạn cần xác nhận mã OTP trước khi thực hiện bước đặt lại mật khẩu mới.
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-1 text-orange-600 hover:underline font-black mt-1"
                >
                  <span>Bắt đầu lại quá trình khôi phục mật khẩu</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Card */}
            {isSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                </div>
                <h3 className="text-lg font-black uppercase text-emerald-900 tracking-tight">
                  Đổi Mật Khẩu Thành Công!
                </h3>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  Mật khẩu tài khoản F Sport Center đã được cập nhật thành công. Đang tự động chuyển hướng về trang đăng nhập...
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <span>ĐĂNG NHẬP NGAY</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                    Mật khẩu mới
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                      lock
                    </span>
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Nhập mật khẩu mới..."
                      className="w-full bg-slate-50/50 text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-3.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showNew ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-bold">Độ mạnh mật khẩu:</span>
                        <span className="font-black text-slate-800">{strength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: strength.width }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                      Xác nhận mật khẩu mới
                    </label>
                    {confirmPassword && (
                      <span className={`text-[11px] font-bold ${isMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isMatch ? '✓ Khớp mật khẩu' : '✕ Chưa khớp'}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                      lock_clock
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Nhập lại mật khẩu mới..."
                      className={`w-full bg-slate-50/50 text-slate-900 placeholder:text-slate-400 pl-11 pr-11 py-3.5 rounded-xl border text-xs font-bold outline-none focus:bg-white focus:ring-2 transition-all shadow-2xs ${
                        isMismatch
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                          : isMatch
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Criteria Checklist */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <p className="text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    Tiêu chuẩn bảo mật mật khẩu F Sport:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className={`flex items-center gap-1.5 font-bold ${criteria.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {criteria.length ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Ít nhất 8 ký tự</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold ${criteria.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {criteria.upper ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Chữ cái in hoa (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold ${criteria.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {criteria.lower ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Chữ cái thường (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold ${criteria.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {criteria.number ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Có ít nhất 1 chữ số (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold col-span-2 ${criteria.special ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {criteria.special ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Ký tự đặc biệt (@$!%*?&#)</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isAllValid || !isMatch || !resetToken}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG CẬP NHẬT MẬT KHẨU...</span>
                    </>
                  ) : (
                    <>
                      <span>CẬP NHẬT MẬT KHẨU MỚI</span>
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back link */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                to="/login"
                className="text-slate-500 hover:text-orange-600 font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Quay lại Đăng nhập</span>
              </Link>

              <span className="text-slate-400 text-[11px]">
                Mã hóa bảo mật SSL 256-bit
              </span>
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
