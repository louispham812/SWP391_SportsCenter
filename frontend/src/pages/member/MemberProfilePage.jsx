import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberProfilePage() {
  const { showToast, addAuditLog } = useApp();
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Minh Anh',
    phone: '0987 654 321',
    email: 'minhanh.nguyen@example.com',
    dob: '1998-05-15',
    gender: 'Nữ',
    membershipId: 'ELT-8924',
    tier: 'Silver Member',
    joinDate: '15/12/2023',
    expireDate: '15/12/2026',
    goal: 'Tăng cường sức bền, giảm mỡ & hoàn thiện kỹ thuật Pickleball',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    addAuditLog('Cập nhật hồ sơ', 'Hội viên đã lưu thay đổi thông tin cá nhân');
    showToast('Cập nhật hồ sơ thành công', 'Thông tin cá nhân và mục tiêu thể chất đã được lưu trữ!', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-primary">
              Hồ Sơ Hội Viên & Thẻ Thành Viên Số
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý thông tin cá nhân, định danh điện tử và nâng cấp hạng thẻ đặc quyền.
            </p>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-sm self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">upgrade</span>
            <span>Nâng Cấp Hạng Thẻ (Gold/Diamond)</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (5 cols): Thẻ Hội Viên Kỹ Thuật Số */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Digital Card */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-primary to-slate-950 p-6 text-white shadow-2xl relative overflow-hidden border border-slate-700">
              <div className="absolute top-0 right-0 w-36 h-36 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary-container text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <span className="font-headline-sm text-sm font-bold tracking-tight">ELITE SPORTS</span>
                    <div className="text-[9px] uppercase tracking-widest text-secondary-container font-semibold">
                      Digital Pass
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {profile.tier}
                </span>
              </div>

              {/* Card Chip & RFID icon */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="w-10 h-7 rounded bg-amber-400/90 border border-amber-300/60 shadow-inner flex items-center justify-center">
                  <span className="w-6 h-4 border border-amber-600/40 rounded-xs"></span>
                </div>
                <span className="material-symbols-outlined text-[24px] text-slate-400">
                  contactless
                </span>
              </div>

              {/* Member Info */}
              <div className="relative z-10 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">Họ & Tên Hội Viên</div>
                <div className="font-headline-sm text-lg font-bold text-white tracking-wide uppercase">
                  {profile.fullName}
                </div>
                <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-300">
                  <span>ID: #{profile.membershipId}</span>
                  <span>HẠN: {profile.expireDate}</span>
                </div>
              </div>
            </div>

            {/* Thông tin gói đang sử dụng */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-headline-sm text-base font-bold text-primary">
                Tình Trạng Gói Đang Kích Hoạt
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Loại thẻ:</span>
                  <strong className="text-slate-900 font-bold">{profile.tier}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Ngày gia nhập:</span>
                  <span>{profile.joinDate}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Ngày hết hạn:</span>
                  <strong className="text-emerald-700 font-bold">{profile.expireDate}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Trạng thái:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    HOẠT ĐỘNG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7 cols): Form Cập Nhật Hồ Sơ */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-headline-sm text-lg font-bold text-primary uppercase mb-4">
              Cập Nhật Thông Tin Cá Nhân
            </h2>

            {isSaved && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Hồ sơ đã được cập nhật thành công trên hệ thống!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Mục tiêu rèn luyện cá nhân
                </label>
                <textarea
                  rows={3}
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Lưu Thay Đổi Hồ Sơ</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
