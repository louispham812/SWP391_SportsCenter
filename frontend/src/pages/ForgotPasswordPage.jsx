import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email đã đăng ký.');
      return;
    }

    if (!cleanEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMessage('Địa chỉ email không đúng định dạng (Ví dụ: name@example.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // ===== XỬ LÝ PENDING_VERIFICATION (tái sử dụng pattern từ AuthPage) =====
        if (data.error === 'PENDING_VERIFICATION') {
          // Hiển thị thông báo từ backend
          setInfoMessage(data.message || 'Tài khoản đang chờ xác thực. Vui lòng kiểm tra email để lấy mã OTP đăng ký.');
          if (showToast) {
            showToast('Tài khoản chưa kích hoạt', 'Vui lòng xác thực OTP đăng ký trước.');
          }
          
          // Chuyển hướng đến trang verify OTP registration (KHÔNG phải verify-code reset password)
          setTimeout(() => {
            navigate('/verify-otp', {
              state: { 
                email: cleanEmail, // Dùng email user đã nhập (nhất quán với success case)
                fromForgot: true, // Đánh dấu là từ forgot password
              }
            });
          }, 1500);
          
          return; // Dừng xử lý, không throw error
        }
        // ===== KẾT THÚC XỬ LÝ PENDING_VERIFICATION =====
        
        // Nếu không phải PENDING_VERIFICATION, xử lý lỗi bình thường
        throw new Error(data.message || 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.');
      }

      const msg = data.message || 'Mã xác thực OTP gồm 6 chữ số đã được gửi qua email.';
      setInfoMessage(msg);
      if (showToast) {
        showToast('Đã gửi mã OTP', 'Vui lòng kiểm tra hộp thư email của bạn.');
      }

      // Điều hướng ngay sang màn hình /verify-code kèm email đã nhập (for password reset)
      setTimeout(() => {
        navigate('/verify-code', {
          state: { email: cleanEmail, fromForgot: true },
        });
      }, 700);

    } catch (err) {
      setErrorMessage(err.message || 'Lỗi kết nối tới máy chủ F Sport Center. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      {/* Top Header Navigation */}
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
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Về Đăng nhập</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/register"
            className="text-xs uppercase tracking-wider text-slate-600 hover:text-slate-900 font-extrabold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Đăng ký mới</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Banner với phong cách thể thao F Sport */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-lg mb-4">
              <span className="material-symbols-outlined text-3xl">lock_reset</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/90 text-white text-[10px] font-black uppercase tracking-wider mb-2 shadow-xs">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Khôi Phục Mật Khẩu Hội Viên</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Quên Mật Khẩu?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed font-medium">
              Nhập email đã đăng ký tài khoản F Sport Center để nhận mã OTP xác thực khôi phục mật khẩu.
            </p>
          </div>

          {/* Stepper Tiến trình 3 Bước */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {/* Step 1: Active */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  1
                </div>
                <span className="text-xs font-black text-orange-600 uppercase tracking-tight">Gửi mã</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Nhập OTP</span>
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

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {infoMessage && (
              <div role="status" className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-600">check_circle</span>
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
                  <span>Địa chỉ Email tài khoản</span>
                  <span className="text-[11px] text-slate-400 font-normal lowercase tracking-normal">Ví dụ: hoidongvien@fsport.vn</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50/50 text-slate-900 placeholder:text-slate-400 pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">info</span>
                  <span>Để bảo mật, hệ thống sẽ gửi mã OTP 6 số (hiệu lực 5 phút) đến email này.</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>ĐANG GỬI MÃ OTP...</span>
                  </>
                ) : (
                  <>
                    <span>GỬI MÃ XÁC THỰC</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>
            </form>

            {/* Sub Info & Back Link */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <Link
                to="/login"
                className="text-slate-600 hover:text-orange-600 font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Nhớ mật khẩu? Đăng nhập</span>
              </Link>

              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-orange-500">support_agent</span>
                <span>Hỗ trợ: 1900 8899</span>
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
