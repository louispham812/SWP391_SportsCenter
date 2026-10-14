import React, { useEffect, useState } from 'react';
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
  const { currentUser, updateProfile, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'health' | 'inbody'
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [membership, setMembership] = useState(null);
  const [memberAvatar, setMemberAvatar] = useState('');

  const [profileForm, setProfileForm] = useState({});
  const [healthForm, setHealthForm] = useState({});
  const [inbodyForm, setInbodyForm] = useState({});

  useEffect(() => {
    let current = true;
    Promise.all([getMemberProfile(), getMemberHealthProfile(), getMemberMemberships()])
      .then(([profile, health, memberships]) => {
        if (!current) return;
        setProfileForm({
          fullName: profile.fullName || '',
          phone: profile.phone || '',
          email: profile.email || '',
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || '',
          address: profile.address || '',
          emergencyContactName: profile.emergencyContactName || '',
          emergencyContactPhone: profile.emergencyContactPhone || '',
        });
        setMemberAvatar(profile.avatar || '');
        setHealthForm({
          fitnessLevel: (health.fitnessLevel || '').toLowerCase(),
          fitnessGoals: health.fitnessGoals || '',
          injuryHistory: health.injuryHistory || '',
        });
        setInbodyForm({
          weight: health.weightKg ?? '',
          height: health.heightCm ?? '',
          smm: health.smmKg ?? '',
          pbf: health.pbfPercent ?? '',
          bmi: health.bmi ?? '',
        });
        setMembership(memberships.find((item) => item.status === 'ACTIVE') || null);
      })
      .catch((requestError) => {
        if (current) setProfileError(requestError.message || 'Không thể tải hồ sơ từ cơ sở dữ liệu.');
      })
      .finally(() => {
        if (current) setProfileLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      const saved = await updateMemberProfile({
        ...profileForm,
        fullName: profileForm.fullName,
      });
      setProfileForm((current) => ({ ...current, ...saved }));
      setMemberAvatar(saved.avatar || '');
      updateProfile(saved);
      showToast('Cập nhật thành công', 'Hồ sơ đã được lưu vào cơ sở dữ liệu.');
    } catch (requestError) {
      setProfileError(requestError.message || 'Không thể lưu hồ sơ.');
    }
  };

  const handleSaveHealth = async (e) => {
    e.preventDefault();
    await saveHealth({
      fitnessLevel: healthForm.fitnessLevel.toUpperCase(),
      fitnessGoals: healthForm.fitnessGoals,
      injuryHistory: healthForm.injuryHistory,
    });
  };

  const handleSaveInBody = async (e) => {
    e.preventDefault();
    const weight = Number(inbodyForm.weight) || null;
    const height = Number(inbodyForm.height) || null;
    const bmi = weight && height ? Number((weight / Math.pow(height / 100, 2)).toFixed(1)) : null;
    await saveHealth({
      weightKg: weight,
      heightCm: height,
      smmKg: Number(inbodyForm.smm) || null,
      pbfPercent: Number(inbodyForm.pbf) || null,
      bmi,
    });
  };

  const saveHealth = async (changes) => {
    setProfileError('');
    try {
      const saved = await updateMemberHealthProfile({
        fitnessLevel: healthForm.fitnessLevel.toUpperCase() || null,
        fitnessGoals: healthForm.fitnessGoals || null,
        injuryHistory: healthForm.injuryHistory || null,
        weightKg: Number(inbodyForm.weight) || null,
        heightCm: Number(inbodyForm.height) || null,
        smmKg: Number(inbodyForm.smm) || null,
        pbfPercent: Number(inbodyForm.pbf) || null,
        bmi: Number(inbodyForm.bmi) || null,
        ...changes,
      });
      setHealthForm({
        fitnessLevel: (saved.fitnessLevel || '').toLowerCase(),
        fitnessGoals: saved.fitnessGoals || '',
        injuryHistory: saved.injuryHistory || '',
      });
      setInbodyForm({
        weight: saved.weightKg ?? '',
        height: saved.heightCm ?? '',
        smm: saved.smmKg ?? '',
        pbf: saved.pbfPercent ?? '',
        bmi: saved.bmi ?? '',
      });
      showToast('Đã lưu hồ sơ', 'Thông tin sức khỏe đã được lưu vào cơ sở dữ liệu.');
    } catch (requestError) {
      setProfileError(requestError.message || 'Không thể lưu hồ sơ sức khỏe.');
    }
  };

  if (profileLoading) {
    return <MemberLayout><p role="status" className="p-6">Đang tải hồ sơ từ cơ sở dữ liệu...</p></MemberLayout>;
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        {profileError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {profileError}
          </p>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                HỒ SƠ HỘI VIÊN CHÍNH THỨC
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              Hồ Sơ Hội Viên &amp; Sức Khỏe Thể Chất
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý thẻ số cá nhân, tiền sử chấn thương PAR-Q và các chỉ số thể trạng InBody.
            </p>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upgrade</span>
            <span>Nâng Cấp Hạng Thẻ (Gold/Diamond)</span>
          </Link>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'profile', label: 'Thông tin cá nhân', icon: 'badge' },
            { id: 'health', label: 'Hồ sơ sức khỏe & PAR-Q', icon: 'health_and_safety' },
            { id: 'inbody', label: 'Chỉ số thể trạng InBody', icon: 'monitor_weight' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (5 cols): Thẻ Hội Viên Kỹ Thuật Số */}
          <div className="lg:col-span-5 space-y-6">
            {/* Digital Card Preview */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/80 p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <span className="font-headline-sm text-sm font-black tracking-tight uppercase">F SPORT CENTER</span>
                    <div className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">
                      Digital Pass
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  {membership?.packageName || 'Chưa có gói hội viên'}
                </span>
              </div>

              {/* Avatar + Chip */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-2 border-orange-500 overflow-hidden bg-slate-800 flex items-center justify-center shadow-md">
                    {memberAvatar ? (
                      <img src={memberAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg text-orange-400">
                        {currentUser.avatar || currentUser.name?.slice(0, 2).toUpperCase() || 'US'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Hội viên chính thức</div>
                    <div className="font-bold text-sm uppercase text-white">{profileForm.fullName}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[28px] text-orange-400">
                  contactless
                </span>
              </div>

              {/* Member Details */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-300">
                  <span>ID: #{currentUser.memberId || currentUser.id || ''}</span>
                  <span>HẠN: {membership?.endDate || '—'}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Mã thẻ: {membership?.membershipId || currentUser.id}
                </div>
              </div>
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
                      value={profileForm.fullName || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
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
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Giới tính</label>
                    <select
                      value={profileForm.gender || ''}
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
                    value={profileForm.address || ''}
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
                        value={profileForm.emergencyContactName || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">SĐT người thân</label>
                      <input
                        type="tel"
                        value={profileForm.emergencyContactPhone || ''}
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
                            ? 'border-orange-500 bg-orange-50 text-orange-950 ring-1 ring-orange-500 shadow-sm'
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Lưu Hồ Sơ Sức Khỏe</span>
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
                      onChange={(e) => setInbodyForm({ ...inbodyForm, weight: e.target.value })}
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
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base font-bold outline-none text-orange-600"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-800 font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-orange-600">insights</span>
                  <span>Chỉ số BMI tính toán tự động: {(inbodyForm.weight / Math.pow(inbodyForm.height / 100, 2)).toFixed(1)} (Bình thường / Thể hình)</span>
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Cập Nhật Chỉ Số InBody</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
