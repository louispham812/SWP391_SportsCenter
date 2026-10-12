import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

export default function MemberProfilePage() {
  const { currentUser, updateProfile, healthProfile, updateHealthProfile, activePlan, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'health' | 'inbody'

  // Personal Info Form State (MEM-03)
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || 'Nguyễn Minh Anh',
    phone: currentUser.phone || '0987 654 321',
    email: currentUser.email || 'minhanh.nguyen@example.com',
    dob: '1998-05-15',
    gender: 'Nữ',
    address: 'Căn 1204 Tòa Park 2, Times City, Hà Nội',
    emergencyContactName: 'Nguyễn Văn Hùng (Bố)',
    emergencyContactPhone: '0903 123 456',
  });

  // Health Profile Form State (MEM-05)
  const [healthForm, setHealthForm] = useState({
    fitnessLevel: healthProfile.fitnessLevel || 'intermediate',
    fitnessGoals: healthProfile.fitnessGoals || 'Tăng phản xạ, giảm mỡ & hoàn thiện kỹ thuật Pickleball',
    injuryHistory: healthProfile.injuryHistory || 'Bong gân cổ chân phải (2024), đã phục hồi 95%',
  });

  // InBody Form State (MEM-21)
  const [inbodyForm, setInbodyForm] = useState({
    weight: healthProfile.weight || 64.2,
    height: healthProfile.height || 168,
    smm: healthProfile.smm || 32.5,
    pbf: healthProfile.pbf || 17.8,
    bmi: healthProfile.bmi || 21.4,
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
  };

  const handleSaveHealth = (e) => {
    e.preventDefault();
    updateHealthProfile(healthForm);
  };

  const handleSaveInBody = (e) => {
    e.preventDefault();
    updateHealthProfile(inbodyForm);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      showToast('Tải ảnh chân dung thành công', 'Ảnh đại diện đã cập nhật để xác thực tại cổng check-in (MEM-04)!');
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 1: USER PROFILE & HEALTH CREDENTIALS
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-primary">
              Hồ Sơ Hội Viên & Sức Khỏe Thể Chất
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý định danh điện tử, tiền sử chấn thương PAR-Q và các chỉ số đo lường cơ thể.
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

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'profile', label: 'Thông tin cá nhân (MEM-03)', icon: 'badge' },
            { id: 'health', label: 'Hồ sơ sức khỏe & PAR-Q (MEM-05)', icon: 'health_and_safety' },
            { id: 'inbody', label: 'Chỉ số thể trạng InBody (MEM-21)', icon: 'monitor_weight' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (5 cols): Thẻ Hội Viên Kỹ Thuật Số (MEM-10) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Digital Card Preview */}
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
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-[10px] font-bold uppercase tracking-wider text-secondary-container">
                  {activePlan.tier}
                </span>
              </div>

              {/* Avatar + Chip */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-2 border-secondary-container overflow-hidden bg-slate-800 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg text-secondary-container">MA</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">Hội viên chính thức</div>
                    <div className="font-bold text-sm uppercase">{profileForm.name}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[28px] text-secondary-container">
                  contactless
                </span>
              </div>

              {/* Member Details */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-300">
                  <span>ID: #{currentUser.memberId || 'ELT-8924'}</span>
                  <span>HẠN: {activePlan.expireDate}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Mã vạch RFID: {activePlan.barcode}
                </div>
              </div>
            </div>

            {/* Avatar Upload (MEM-04) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-headline-sm text-sm font-bold text-primary uppercase">
                Tải Ảnh Chân Dung (MEM-04)
              </h3>
              <p className="text-xs text-slate-500">
                Cập nhật ảnh khuôn mặt rõ nét để hệ thống tự động nhận diện tại cửa check-in.
              </p>
              <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-300 hover:border-primary text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                <span>Chọn ảnh từ máy tính / Camera</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* CỘT PHẢI (7 cols): Content by Active Tab */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h2 className="font-headline-sm text-lg font-bold text-primary uppercase mb-2">
                  Cập Nhật Thông Tin Cá Nhân (MEM-03)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Họ và tên</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Giới tính</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none bg-white font-semibold"
                    >
                      <option value="Nữ">Nữ</option>
                      <option value="Nam">Nam</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase text-red-600 block mb-2">Liên hệ khẩn cấp (Emergency Contact)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Người thân liên hệ</label>
                      <input
                        type="text"
                        value={profileForm.emergencyContactName}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">SĐT người thân</label>
                      <input
                        type="tel"
                        value={profileForm.emergencyContactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Lưu Hồ Sơ Cá Nhân (MEM-03)</span>
                </button>
              </form>
            )}

            {activeTab === 'health' && (
              <form onSubmit={handleSaveHealth} className="space-y-4">
                <h2 className="font-headline-sm text-lg font-bold text-primary uppercase mb-2">
                  Thiết Lập Hồ Sơ Sức Khỏe & Thể Thao (MEM-05)
                </h2>
                <p className="text-xs text-slate-500">
                  Khai báo trung thực để Huấn Luyện Viên và Trợ Lý AI thiết kế giáo án phù hợp, tránh chấn thương.
                </p>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Trình độ thể thao hiện tại
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'beginner', title: 'Người mới (Beginner)', desc: 'Tập < 6 tháng' },
                      { id: 'intermediate', title: 'Phong trào (Amateur)', desc: 'Tập 1 - 3 năm' },
                      { id: 'advanced', title: 'Nâng cao / VĐV', desc: 'Thi đấu giải' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setHealthForm({ ...healthForm, fitnessLevel: lvl.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          healthForm.fitnessLevel === lvl.id
                            ? 'border-secondary bg-secondary-container/20 text-primary shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{lvl.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Mục tiêu tập luyện ưu tiên
                  </label>
                  <textarea
                    rows={3}
                    value={healthForm.fitnessGoals}
                    onChange={(e) => setHealthForm({ ...healthForm, fitnessGoals: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Tiền sử chấn thương thể thao & Bệnh lý (PAR-Q)
                  </label>
                  <textarea
                    rows={3}
                    value={healthForm.injuryHistory}
                    onChange={(e) => setHealthForm({ ...healthForm, injuryHistory: e.target.value })}
                    placeholder="VD: Thoát vị đĩa đệm L4-L5, từng mổ dây chằng chéo trước, đau khớp vai..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-secondary-container text-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Lưu Hồ Sơ Sức Khỏe (MEM-05)</span>
                </button>
              </form>
            )}

            {activeTab === 'inbody' && (
              <form onSubmit={handleSaveInBody} className="space-y-4">
                <h2 className="font-headline-sm text-lg font-bold text-primary uppercase mb-2">
                  Theo Dõi Tiến Độ Cơ Thể & InBody (MEM-21)
                </h2>
                <p className="text-xs text-slate-500">
                  Cập nhật các chỉ số từ phiếu đo InBody 770 để vẽ biểu đồ và đánh giá tiến độ rèn luyện.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Cân nặng (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={inbodyForm.weight}
                      onChange={(e) => setInbodyForm({ ...inbodyForm, weight: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Chiều cao (cm)</label>
                    <input
                      type="number"
                      value={inbodyForm.height}
                      onChange={(e) => setInbodyForm({ ...inbodyForm, height: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Khối lượng cơ nạc SMM (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={inbodyForm.smm}
                      onChange={(e) => setInbodyForm({ ...inbodyForm, smm: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none text-emerald-700"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Tỷ lệ mỡ PBF (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={inbodyForm.pbf}
                      onChange={(e) => setInbodyForm({ ...inbodyForm, pbf: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none text-secondary"
                    />
                  </div>
                </div>

                <div className="p-3 bg-secondary-container/20 rounded-xl text-xs text-secondary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">insights</span>
                  <span>Chỉ số BMI tính toán tự động: {(inbodyForm.weight / Math.pow(inbodyForm.height / 100, 2)).toFixed(1)} (Bình thường / Vận động viên)</span>
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Cập Nhật Chỉ Số InBody (MEM-21)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
