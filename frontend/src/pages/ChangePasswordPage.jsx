import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, authSession, showToast, logout } = useApp();

  // Email: lấy từ currentUser, location.state, hoặc query param
  const queryParams = new URLSearchParams(location.search);
  const initialEmail = currentUser?.email || location.state?.email || queryParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [oldPassword, setOldPassword] = useState(location.state?.tempPassword || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Khá mạnh', color: 'bg-blue-500' };
    return { score: 4, label: 'Rất mạnh', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);
  const isMatch = confirmPassword && newPassword === confirmPassword;
  const isMismatch = confirmPassword && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của tài khoản.');
      return;
    }
    if (!oldPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu cũ (mật khẩu tạm từ email).');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp với mật khẩu mới.');
      return;
    }
    if (newPassword === oldPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu cũ hoặc mật khẩu tạm thời.');
      return;
    }

    setIsSubmitting(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authSession?.token) {
        headers['Authorization'] = `Bearer ${authSession.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: email.trim(),
          oldPassword: oldPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let parsedMessage = text;
        try {
          const json = JSON.parse(text);
          parsedMessage = json.message || json.error || text;
        } catch {
          // keep text
        }
        throw new Error(parsedMessage || 'Đổi mật khẩu không thành công.');
      }

      setSuccessMessage('Đổi mật khẩu thành công! Tài khoản của bạn đã được cập nhật bảo mật.');
      showToast('Thành công', 'Đã đổi mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.');

      // Nếu đang đăng nhập, logout phiên cũ và chuyển về login
      setTimeout(() => {
        if (currentUser) {
          logout();
        }
        navigate('/login', { state: { email: email.trim(), message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' } });
      }, 1500);

    } catch (err) {
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      
      {/* Top Simple Header */}
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
            to="/"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-slate-900 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">lock_reset</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">
                    Bảo Mật Tài Khoản
                  </span>
                  <span className="text-xs text-orange-400 font-medium">Bắt buộc lần đầu</span>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                  Đổi Mật Khẩu
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Áp dụng cho tài khoản nhận mật khẩu tạm từ email hoặc người dùng muốn cập nhật mật khẩu mới bảo mật.
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Alert Messages */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-red-600">error</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-emerald-600">check_circle</span>
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
                <span>Địa chỉ Email tài khoản *</span>
                {currentUser && (
                  <span className="text-[11px] text-emerald-600 font-bold lowercase">
                    (đang đăng nhập)
                  </span>
                )}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={Boolean(currentUser?.email)}
                  placeholder="name@example.com"
                  className={`w-full ${
                    currentUser?.email ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'
                  } pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs`}
                />
              </div>
            </div>

            {/* Field 1: Old Password (mật khẩu tạm từ email) */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
                <span>Old Password (mật khẩu tạm từ email) *</span>
                <span className="text-[11px] text-orange-600 font-semibold lowercase">
                  từ hộp thư đến
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                  key
                </span>
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu tạm từ email (vd: 12 ký tự) hoặc mật khẩu cũ"
                  className="w-full bg-white text-slate-900 pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showOld ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-orange-500">info</span>
                <span>Nếu được cấp bởi Lễ tân / Quản lý, hãy dán chính xác mật khẩu tạm được gửi qua email.</span>
              </p>
            </div>

            <div className="border-t border-slate-100 my-2"></div>

            {/* Field 2: New Password */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
                <span>New Password *</span>
                <span className={`text-[11px] font-bold ${strength.score >= 3 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  Độ mạnh: {strength.label}
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                  lock
                </span>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự (chữ hoa, chữ thường, số)"
                  className="w-full bg-white text-slate-900 pl-11 pr-11 py-3 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password strength meter bar */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`}></div>
                    <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`}></div>
                    <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`}></div>
                    <div className={`h-full flex-1 transition-all ${strength.score >= 4 ? strength.color : 'bg-slate-200'}`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 3: Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
                <span>Confirm New Password *</span>
                {isMatch && (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Mật khẩu khớp
                  </span>
                )}
                {isMismatch && (
                  <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                    Chưa khớp
                  </span>
                )}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                  lock_clock
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới vừa đặt"
                  className={`w-full bg-white text-slate-900 pl-11 pr-11 py-3 rounded-xl border text-xs font-bold outline-none transition-all shadow-2xs ${
                    isMismatch
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : isMatch
                      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200'
                      : 'border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Note box */}
            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/60 text-slate-700 text-xs space-y-1">
              <div className="flex items-center gap-2 text-orange-700 font-bold">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Yêu cầu mật khẩu chuẩn hệ thống SportHub:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1 font-medium">
                <li>Tối thiểu 8 ký tự.</li>
                <li>Khác với mật khẩu tạm nhận qua email.</li>
                <li>Nên kết hợp chữ cái và số để đạt độ an toàn cao nhất.</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>ĐANG CẬP NHẬT MẬT KHẨU...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span>XÁC NHẬN ĐỔI MẬT KHẨU</span>
                </>
              )}
            </button>

            {/* Navigation links */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <Link
                to="/login"
                className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Quay lại Đăng nhập</span>
              </Link>
              <Link
                to="/verify-otp"
                className="text-orange-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Xác thực OTP Email</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        © 2026 F SPORT CENTER • Trung Tâm Thể Thao Đa Năng. Hotline hỗ trợ: 1900 8899
      </footer>
    </div>
  );
}
