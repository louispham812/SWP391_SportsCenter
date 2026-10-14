import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import {
  getMemberHealthProfile,
  getMemberMemberships,
  getMemberProfile,
  updateMemberHealthProfile,
  updateMemberProfile,
} from '../../services/memberApi';

export default function MemberProfilePage() {
  const {
    currentUser,
    updateProfile,
    healthProfile,
    updateHealthProfile,
    activePlan,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('profile');

  const user = useMemo(() => currentUser || {
    name: 'Member Võ Tấn Triều',
    phone: '0912345678',
    email: 'member@gmail.com',
    memberId: 'MEM001',
    avatar: '',
  }, [currentUser]);

  const plan = useMemo(() => activePlan || {
    tier: 'Diamond VIP',
    expireDate: '15/12/2026',
    barcode: 'RF-893850129841',
  }, [activePlan]);

  // KIỂM TRA XEM HỘI VIÊN ĐÃ Ở HẠNG VIP CAO NHẤT HAY CHƯA
  const isHighestTier = plan.tier?.toUpperCase().includes('DIAMOND');

  const health = useMemo(() => healthProfile || {
    fitnessLevel: 'intermediate',
    fitnessGoals: 'Tăng phản xạ, giảm mỡ & hoàn thiện kỹ thuật Pickleball',
    injuryHistory: 'Bong gân cổ chân phải (2024), đã phục hồi 95%',
    weight: 68.5,
    height: 172,
    smm: 32.5,
    pbf: 17.8,
    bmi: 23.2,
  }, [healthProfile]);

  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    dob: user.dob || '1998-05-15',
    gender: user.gender || 'Nam',
    address: user.address || 'KĐT FPT City, Ngũ Hành Sơn, Đà Nẵng',
    emergencyContactName: user.emergencyContactName || 'Nguyễn Văn Hùng (Bố)',
    emergencyContactPhone: user.emergencyContactPhone || '0903 123 456',
    avatar: user.avatar || '',
  });

  const [healthForm, setHealthForm] = useState({
    fitnessLevel: health.fitnessLevel || 'intermediate',
    fitnessGoals: health.fitnessGoals || '',
    injuryHistory: health.injuryHistory || '',
  });

  const [inbodyForm, setInbodyForm] = useState({
    weight: health.weight || 68.5,
    height: health.height || 172,
    smm: health.smm || 32.5,
    pbf: health.pbf || 17.8,
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        setProfileForm((prev) => ({ ...prev, avatar: base64Url }));
        updateProfile?.({ avatar: base64Url });
        showToast?.('Cập nhật thành công', 'Ảnh đại diện mới đã được lưu!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    updateProfile?.(profileForm);
    showToast?.('Lưu thành công', 'Thông tin cá nhân đã được cập nhật!', 'success');
  };

  const handleSaveHealth = (e) => {
    e.preventDefault();
    updateHealthProfile?.(healthForm);
    showToast?.('Lưu thành công', 'Hồ sơ sức khỏe PAR-Q đã được cập nhật!', 'success');
  };

  const handleSaveInBody = async (e) => {
    e.preventDefault();
    const computedBmi = Number((inbodyForm.weight / Math.pow(inbodyForm.height / 100, 2)).toFixed(1));
    updateHealthProfile?.({ ...inbodyForm, bmi: computedBmi });
    showToast?.('Lưu thành công', 'Chỉ số đo InBody 770 đã được lưu!', 'success');
  };

  if (profileLoading) {
    return <MemberLayout><p role="status" className="p-6">Đang tải hồ sơ từ cơ sở dữ liệu...</p></MemberLayout>;
  }

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        {/* Header Trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                PROFILE & HEALTH CREDENTIALS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase">
              Hồ Sơ Hội Viên & Sức Khỏe
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Quản lý thông tin định danh cá nhân, hồ sơ sức khỏe PAR-Q và chỉ số đo InBody.
            </p>
          </div>

          {/* SỬA NÚT NÂNG CẤP HẠNG THẺ DỰA TRÊN HẠNG TÀI KHOẢN */}
          {isHighestTier ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300 font-extrabold text-xs uppercase tracking-wider self-start sm:self-auto">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              <span>Đang sở hữu gói VIP cao nhất</span>
            </div>
          ) : (
            <Link
              to="/member/membership"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">upgrade</span>
              <span>Nâng Cấp Hạng Thẻ</span>
            </Link>
          )}
        </div>

        {/* Thanh Chuyển Tab */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'profile', label: 'Thông tin cá nhân', icon: 'badge' },
            { id: 'health', label: 'Hồ sơ sức khỏe & PAR-Q', icon: 'health_and_safety' },
            { id: 'inbody', label: 'Chỉ số thể trạng InBody 770', icon: 'monitor_weight' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: Thẻ Hội Viên & Avatar */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800 space-y-6">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">⚡</div>
                  <div>
                    <span className="text-sm font-black tracking-tight uppercase">FPT SPORTS</span>
                    <div className="text-[9px] uppercase tracking-widest text-orange-400 font-extrabold">DIGITAL MEMBER PASS</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                  {plan.tier}
                </span>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl border-2 border-orange-500 overflow-hidden bg-slate-800 shadow-md">
                    {profileForm.avatar ? (
                      <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-xl text-orange-400">
                        {profileForm.name?.slice(0, 2).toUpperCase() || 'TT'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Hội viên chính thức</div>
                    <div className="font-black text-base uppercase text-white tracking-tight">{profileForm.name}</div>
                    <div className="text-[11px] text-slate-300 font-mono mt-0.5">{user.phone}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[32px] text-orange-400">contactless</span>
              </div>

              <div className="relative z-10 pt-4 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>ID: #{user.memberId || user.id}</span>
                  <span>HẠN: {plan.expireDate}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">RFID: {plan.barcode}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Tải Ảnh Đại Diện / FaceID Check-in</h3>
              <p className="text-xs text-slate-500 font-medium">Cập nhật ảnh khuôn mặt rõ nét để nhận diện tự động tại cổng xoay check-in.</p>
              <label className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 text-xs font-extrabold text-slate-700 bg-slate-50 hover:bg-orange-50/50 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[20px] text-orange-500">add_a_photo</span>
                <span>Tải ảnh từ máy tính / Camera</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* CỘT PHẢI: Các Form chỉnh sửa */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h2 className="text-base font-black text-slate-900 uppercase mb-2">Cập Nhật Thông Tin Cá Nhân</h2>

                <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase">
                    <span className="material-symbols-outlined text-[18px] text-slate-500">lock</span>
                    <span>Định danh tài khoản đăng nhập (Không thể tự thay đổi)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Địa chỉ Email đăng nhập</label>
                      <input type="email" value={user.email} disabled readOnly className="w-full px-3.5 py-2 rounded-xl bg-slate-200/70 border border-slate-300 text-xs font-bold text-slate-600 cursor-not-allowed select-none" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Số điện thoại đăng nhập</label>
                      <input type="text" value={user.phone} disabled readOnly className="w-full px-3.5 py-2 rounded-xl bg-slate-200/70 border border-slate-300 text-xs font-bold text-slate-600 cursor-not-allowed select-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Họ và tên *</label>
                    <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Ngày sinh</label>
                      <input type="date" value={profileForm.dob} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Giới tính</label>
                      <select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none bg-white">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Địa chỉ liên hệ</label>
                    <input type="text" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500" />
                  </div>
                </div>

                <button type="submit" className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer">
                  Lưu Thay Đổi Thông Tin
                </button>
              </form>
            )}

            {activeTab === 'health' && (
              <form onSubmit={handleSaveHealth} className="space-y-4">
                <h2 className="text-base font-black text-slate-900 uppercase mb-2">Thiết Lập Hồ Sơ Sức Khỏe & Thể Thao</h2>
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Mục tiêu tập luyện</label>
                  <textarea rows={3} value={healthForm.fitnessGoals} onChange={(e) => setHealthForm({ ...healthForm, fitnessGoals: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-orange-500" />
                </div>
                <button type="submit" className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer">
                  Lưu Hồ Sơ Sức Khỏe
                </button>
              </form>
            )}

            {activeTab === 'inbody' && (
              <form onSubmit={handleSaveInBody} className="space-y-4">
                <h2 className="text-base font-black text-slate-900 uppercase mb-2">Theo Dõi Tiến Độ Cơ Thể InBody 770</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Cân nặng (kg)</label>
                    <input type="number" step="0.1" value={inbodyForm.weight} onChange={(e) => setInbodyForm({ ...inbodyForm, weight: Number(e.target.value) })} className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">Chiều cao (cm)</label>
                    <input type="number" value={inbodyForm.height} onChange={(e) => setInbodyForm({ ...inbodyForm, height: Number(e.target.value) })} className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none" />
                  </div>
                </div>
                <button type="submit" className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer">
                  Cập Nhật Chỉ Số InBody
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}