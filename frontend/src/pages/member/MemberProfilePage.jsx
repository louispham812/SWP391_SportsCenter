import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import QrCodeSvg from '../../components/common/QrCodeSvg';
import {
  getMemberDigitalCard,
  getMemberHealthProfile,
  getMemberMemberships,
  getMemberProfile,
  updateMemberAvatar,
  updateMemberHealthProfile,
  updateMemberProfile,
} from '../../services/memberApi';
import { compressImageFile } from '../../utils/imageCompressor';
import { getAvatarImageUrl, getAvatarInitials } from '../../utils/avatarHelper';

export default function MemberProfilePage() {
  const { currentUser, updateProfile, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'health' | 'inbody'
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [membership, setMembership] = useState(null);
  const [digitalCard, setDigitalCard] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [memberAvatar, setMemberAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({});
  const [healthForm, setHealthForm] = useState({});
  const [inbodyForm, setInbodyForm] = useState({});

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const compressedBase64 = await compressImageFile(file, 500, 0.85);
      setMemberAvatar(compressedBase64);
      const updated = await updateMemberAvatar(compressedBase64);
      const finalAvatar = updated?.avatar || compressedBase64;
      setMemberAvatar(finalAvatar);
      updateProfile({ avatar: finalAvatar });
      showToast({
        title: 'Cập nhật thành công',
        message: 'Ảnh đại diện hội viên F Sport đã được lưu.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Lỗi lưu ảnh',
        message: err.message || 'Không thể cập nhật ảnh đại diện.',
        type: 'error',
      });
    } finally {
      setAvatarUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    let current = true;
    Promise.all([
      getMemberProfile(),
      getMemberHealthProfile(),
      getMemberMemberships(),
      getMemberDigitalCard().catch(() => null),
    ])
      .then(([profile, health, memberships, card]) => {
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
        if (card) {
          setDigitalCard(card);
        }
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
      showToast('Cập nhật thành công', 'Hồ sơ đã được lưu thành công.');
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
      const weight = changes.weightKg !== undefined ? changes.weightKg : (Number(inbodyForm.weight) || null);
      const height = changes.heightCm !== undefined ? changes.heightCm : (Number(inbodyForm.height) || null);
      let bmi = changes.bmi !== undefined ? changes.bmi : (Number(inbodyForm.bmi) || null);
      if (!bmi && weight && height && height > 0) {
        bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(1));
      }

      const saved = await updateMemberHealthProfile({
        fitnessLevel: healthForm.fitnessLevel ? healthForm.fitnessLevel.toUpperCase() : null,
        fitnessGoals: healthForm.fitnessGoals || null,
        injuryHistory: healthForm.injuryHistory || null,
        weightKg: weight,
        heightCm: height,
        smmKg: changes.smmKg !== undefined ? changes.smmKg : (Number(inbodyForm.smm) || null),
        pbfPercent: changes.pbfPercent !== undefined ? changes.pbfPercent : (Number(inbodyForm.pbf) || null),
        bmi,
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
      showToast('Đã lưu hồ sơ', 'Thông tin sức khỏe đã được cập nhật thành công.');
    } catch (requestError) {
      setProfileError(requestError.message || 'Không thể lưu hồ sơ sức khỏe.');
    }
  };

  const handleDownloadQr = () => {
    const qrText = digitalCard?.qrToken || `SPORTHUB-MEMBER-${currentUser.memberId || currentUser.id}`;
    const svgElement = document.getElementById('member-digital-qr-svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `QR-${qrText}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
      showToast({ title: 'Đã tải mã QR', message: 'Mã QR thẻ hội viên đã được lưu.', type: 'success' });
    }
  };

  if (profileLoading) {
    return <MemberLayout><p role="status" className="p-6">Đang tải hồ sơ...</p></MemberLayout>;
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full">
                Hồ sơ hội viên
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hồ sơ hội viên &amp; Sức khỏe thể chất
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý thẻ số cá nhân, lưu ý thể lực và các chỉ số thể trạng InBody.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/change-password"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-orange-500">lock_reset</span>
              <span>Đổi Mật Khẩu</span>
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-all shadow-sm shadow-orange-500/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upgrade</span>
              <span>Nâng Cấp Hạng Thẻ (Gold/Diamond)</span>
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'profile', label: 'Thông tin cá nhân', icon: 'badge' },
            { id: 'health', label: 'Hồ sơ sức khỏe & Thể lực', icon: 'health_and_safety' },
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
          {/* CỘT TRÁI (5 cols): Thẻ Hội Viên Kỹ Thuật Số & QR Check-in */}
          <div className="lg:col-span-5 space-y-6">
            {/* Digital Card Pass */}
            <div className={`rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border transition-all ${
              digitalCard?.tier === 'VIP'
                ? 'bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 border-amber-500/40 shadow-amber-900/20'
                : digitalCard?.tier === 'STANDARD'
                ? 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border-emerald-500/40 shadow-emerald-900/20'
                : 'bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/80 border-slate-800 shadow-orange-950/20'
            }`}>
              <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <span className="font-headline-sm text-sm font-black tracking-tight uppercase">F SPORT CENTER</span>
                    <div className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">
                      Digital Member Pass
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                  digitalCard?.tier === 'VIP'
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : digitalCard?.tier === 'STANDARD'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-slate-800/90 border-slate-700 text-orange-400'
                }`}>
                  {digitalCard?.tierBadge || (membership?.packageName ? 'HỘI VIÊN STANDARD' : 'HỘI VIÊN CHÍNH THỨC')}
                </span>
              </div>

              {/* Avatar + Member Info */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl border-2 border-orange-500/80 overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg shrink-0">
                    {getAvatarImageUrl(memberAvatar || currentUser.avatar) ? (
                      <img src={getAvatarImageUrl(memberAvatar || currentUser.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg text-orange-400">
                        {getAvatarInitials(profileForm.fullName || currentUser.name, 'US')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Chủ thẻ hội viên</div>
                    <div className="font-bold text-base uppercase text-white tracking-tight">{profileForm.fullName || currentUser.name}</div>
                    <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <span className="text-orange-400 font-bold">ID:</span> #{currentUser.memberId || currentUser.id}
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">RFID:</span>
                      <span className="font-semibold text-emerald-400">{digitalCard?.rfidCode || 'Chưa gán thẻ'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-[32px] text-orange-400 animate-pulse">
                    contactless
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NFC / RFID</span>
                </div>
              </div>

              {/* QR Code Section inside Card */}
              <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
                  <QrCodeSvg
                    text={digitalCard?.qrToken || `SPORTHUB-MEMBER-${currentUser.memberId || currentUser.id}`}
                    size={130}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center justify-center sm:justify-start gap-1">
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                    <span>Mã Check-in Cá Nhân</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700 break-all select-all">
                    {digitalCard?.qrToken || `SPORTHUB-MEMBER-${currentUser.memberId || currentUser.id}`}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold uppercase tracking-wider transition shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">fullscreen</span>
                      <span>Phóng to</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold uppercase tracking-wider transition border border-slate-700 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>Tải QR</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trạng thái: <strong className="text-emerald-400">HOẠT ĐỘNG</strong></span>
                <span>Hệ thống nhận diện F Sport Check-in</span>
              </div>
            </div>

            {/* Active Packages List Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">card_membership</span>
                  <h3 className="font-bold text-slate-900 text-sm uppercase">Gói Tập Đang Kích Hoạt</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {digitalCard?.activePackages?.length || (membership ? 1 : 0)} gói
                </span>
              </div>

              {digitalCard?.activePackages?.length ? (
                <div className="space-y-2.5">
                  {digitalCard.activePackages.map((pkg) => (
                    <div key={pkg.membershipId} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{pkg.packageName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pkg.startDate} &rarr; {pkg.endDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black px-2 py-1 rounded-md ${
                          pkg.remainingDays > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Còn {pkg.remainingDays} ngày
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : membership ? (
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{membership.packageName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Hạn: {membership.endDate || '—'}
                    </div>
                  </div>
                  <span className="text-xs font-black px-2 py-1 rounded-md bg-emerald-100 text-emerald-800">
                    Đang kích hoạt
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-2 text-center">Chưa có gói tập nào đang kích hoạt.</p>
              )}
            </div>

            {/* Today Bookings Card */}
            {digitalCard?.todayBookings && digitalCard.todayBookings.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">calendar_today</span>
                  <h3 className="font-bold text-blue-950 text-sm uppercase">Lịch Đặt Chỗ & Tập Luyện Hôm Nay</h3>
                </div>
                <div className="space-y-2">
                  {digitalCard.todayBookings.map((b) => (
                    <div key={b.bookingId} className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{b.courtName || b.activity}</div>
                        <div className="text-[11px] text-slate-500">{b.startTime} - {b.endTime}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (7 cols): Content by Active Tab */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                      Hồ Sơ Cá Nhân & Ảnh Đại Diện
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin nhận diện thẻ hội viên và liên hệ tại F Sport Center.</p>
                  </div>
                </div>

                {/* Avatar Upload Banner */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-orange-500 shadow-md flex items-center justify-center">
                      {getAvatarImageUrl(memberAvatar || currentUser.avatar) ? (
                        <img src={getAvatarImageUrl(memberAvatar || currentUser.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-orange-400">
                          {getAvatarInitials(profileForm.fullName || currentUser.name, 'US')}
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="avatar-file-input"
                      className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                    >
                      <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                      <span className="text-[10px] font-bold mt-0.5">Thay ảnh</span>
                    </label>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-xs font-bold text-slate-800">Ảnh đại diện thẻ hội viên</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Hỗ trợ JPG, PNG, WEBP (tối đa 2MB). Hiển thị trên thẻ điện tử F Sport và hồ sơ điểm danh.</p>
                    <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label
                        htmlFor="avatar-file-input"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm shadow-orange-500/20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>{avatarUploading ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                      </label>
                      <span className="text-[11px] text-slate-400">hoặc chọn avatar thể thao:</span>
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80',
                        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=200&q=80',
                      ].map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={async () => {
                            try {
                              setMemberAvatar(presetUrl);
                              const updated = await updateMemberAvatar(presetUrl);
                              const finalAvatar = updated?.avatar || presetUrl;
                              setMemberAvatar(finalAvatar);
                              updateProfile({ avatar: finalAvatar });
                              showToast({ title: 'Thành công', message: 'Đã đổi ảnh đại diện.', type: 'success' });
                            } catch (err) {
                              showToast({ title: 'Lỗi', message: err.message || 'Không thể đổi ảnh đại diện.', type: 'error' });
                            }
                          }}
                          className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 hover:border-orange-500 hover:scale-110 transition shadow-xs cursor-pointer"
                        >
                          <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

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
                  <span>Lưu Hồ Sơ Cá Nhân</span>
                </button>
              </form>
            )}

            {activeTab === 'health' && (
              <form onSubmit={handleSaveHealth} className="space-y-4">
                <h2 className="font-headline-sm text-lg font-bold text-primary uppercase mb-2">
                  Thiết Lập Hồ Sơ Sức Khỏe & Thể Thao
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
                  Theo Dõi Tiến Độ Cơ Thể & InBody
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

      {/* Modal Phóng to QR Thẻ Hội Viên */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">Mã QR Check-In Quầy</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <QrCodeSvg
                id="member-digital-qr-svg"
                text={digitalCard?.qrToken || `SPORTHUB-MEMBER-${currentUser.memberId || currentUser.id}`}
                size={220}
              />
              <div className="mt-3 font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-300 select-all">
                {digitalCard?.qrToken || `SPORTHUB-MEMBER-${currentUser.memberId || currentUser.id}`}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">{profileForm.fullName || currentUser.name}</h4>
              <p className="text-xs text-slate-500">
                Đưa mã QR này vào máy quét tại quầy lễ tân để ghi nhận vào phòng tập tức thì.
              </p>
              {digitalCard?.rfidCode && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold mt-2">
                  <span className="material-symbols-outlined text-[14px]">contactless</span>
                  <span>Thẻ từ: {digitalCard.rfidCode}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Tải Mã QR</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
