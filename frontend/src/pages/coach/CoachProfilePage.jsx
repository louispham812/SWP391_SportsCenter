import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';
import QrCodeSvg from '../../components/common/QrCodeSvg';
import {
  getCoachProfile,
  updateCoachAvatar,
  updateCoachProfile,
} from '../../services/coachApi';
import { compressImageFile } from '../../utils/imageCompressor';
import { getAvatarImageUrl, getAvatarInitials } from '../../utils/avatarHelper';

export default function CoachProfilePage() {
  const { currentUser, updateProfile, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'specialty' | 'schedule_reviews'
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [coachAvatar, setCoachAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [coachData, setCoachData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'Nam',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [specialtyForm, setSpecialtyForm] = useState({
    specialty: '',
    experienceYears: 5,
    certifications: '',
    bio: '',
  });

  useEffect(() => {
    let current = true;
    getCoachProfile()
      .then((data) => {
        if (!current) return;
        setCoachData(data);
        setCoachAvatar(data.avatar || '');
        setProfileForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || 'Nam',
          address: data.address || '',
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
        });
        setSpecialtyForm({
          specialty: data.specialty || '',
          experienceYears: data.experienceYears ?? 5,
          certifications: data.certifications || '',
          bio: data.bio || '',
        });
      })
      .catch((err) => {
        if (current) setProfileError(err.message || 'Không thể tải hồ sơ huấn luyện viên từ máy chủ.');
      })
      .finally(() => {
        if (current) setProfileLoading(false);
      });

    return () => {
      current = false;
    };
  }, []);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const compressedBase64 = await compressImageFile(file, 500, 0.85);
      setCoachAvatar(compressedBase64);
      const res = await updateCoachAvatar(compressedBase64);
      const newAvatar = res?.avatar || compressedBase64;
      setCoachAvatar(newAvatar);
      updateProfile({ avatar: newAvatar });
      showToast({
        title: 'Cập nhật thành công',
        message: 'Ảnh đại diện huấn luyện viên F Sport đã được lưu.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Lỗi tải ảnh',
        message: err.message || 'Không thể cập nhật ảnh đại diện.',
        type: 'error',
      });
    } finally {
      setAvatarUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSelectPresetAvatar = async (presetUrl) => {
    try {
      setCoachAvatar(presetUrl);
      const res = await updateCoachAvatar(presetUrl);
      const newAvatar = res?.avatar || presetUrl;
      setCoachAvatar(newAvatar);
      updateProfile({ avatar: newAvatar });
      showToast({
        title: 'Thành công',
        message: 'Đã đổi ảnh đại diện huấn luyện viên.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Lỗi đổi ảnh',
        message: err.message || 'Không thể cập nhật ảnh đại diện.',
        type: 'error',
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      const saved = await updateCoachProfile({
        ...profileForm,
        ...specialtyForm,
      });
      setCoachData(saved);
      setProfileForm((current) => ({
        ...current,
        fullName: saved.fullName || '',
        phone: saved.phone || '',
        email: saved.email || '',
        dateOfBirth: saved.dateOfBirth || '',
        gender: saved.gender || 'Nam',
        address: saved.address || '',
        emergencyContactName: saved.emergencyContactName || '',
        emergencyContactPhone: saved.emergencyContactPhone || '',
      }));
      if (saved.avatar) setCoachAvatar(saved.avatar);
      updateProfile({
        fullName: saved.fullName,
        phone: saved.phone,
        avatar: saved.avatar,
      });
      showToast({
        title: 'Cập nhật thành công',
        message: 'Hồ sơ huấn luyện viên đã được lưu thành công.',
        type: 'success',
      });
    } catch (err) {
      setProfileError(err.message || 'Không thể lưu hồ sơ cá nhân.');
    }
  };

  const handleSaveSpecialty = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      const saved = await updateCoachProfile({
        ...profileForm,
        ...specialtyForm,
        experienceYears: Number(specialtyForm.experienceYears) || 0,
      });
      setCoachData(saved);
      setSpecialtyForm({
        specialty: saved.specialty || '',
        experienceYears: saved.experienceYears ?? 5,
        certifications: saved.certifications || '',
        bio: saved.bio || '',
      });
      showToast({
        title: 'Đã lưu chuyên môn',
        message: 'Thông tin năng lực và chứng chỉ HLV đã được cập nhật.',
        type: 'success',
      });
    } catch (err) {
      setProfileError(err.message || 'Không thể lưu thông tin chuyên môn.');
    }
  };

  const handleDownloadQr = () => {
    const qrText = `SPORTHUB-COACH-${currentUser?.id || coachData?.userId || 0}`;
    const svgElement = document.getElementById('coach-digital-qr-svg');
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
      showToast({
        title: 'Đã tải mã QR',
        message: 'Mã QR thẻ huấn luyện viên đã được lưu.',
        type: 'success',
      });
    }
  };

  if (profileLoading) {
    return (
      <CoachLayout>
        <p role="status" className="p-6 text-sm text-slate-500 font-medium">
          Đang tải hồ sơ huấn luyện viên...
        </p>
      </CoachLayout>
    );
  }

  const coachId = currentUser?.id || coachData?.userId || 0;
  const qrCodeText = `SPORTHUB-COACH-${coachId}`;

  return (
    <CoachLayout>
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
                HỒ SƠ HUẤN LUYỆN VIÊN CHÍNH THỨC
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              Hồ Sơ Huấn Luyện Viên &amp; Năng Lực Chuyên Môn
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý thẻ số huấn luyện viên, thông tin liên hệ, chứng chỉ đào tạo và đánh giá từ học viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/change-password"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-orange-500">lock_reset</span>
              <span>Đổi Mật Khẩu</span>
            </Link>
            <Link
              to="/coach/schedule"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-orange-500">calendar_month</span>
              <span>Lịch Giảng Dạy</span>
            </Link>
            <Link
              to="/coach/students"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">groups</span>
              <span>Học Viên Của Tôi</span>
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'profile', label: 'Thông tin cá nhân', icon: 'badge' },
            { id: 'specialty', label: 'Hồ sơ chuyên môn & Chứng chỉ', icon: 'workspace_premium' },
            { id: 'schedule_reviews', label: 'Lớp dạy & Đánh giá học viên', icon: 'star' },
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
          {/* CỘT TRÁI (5 cols): Thẻ Huấn Luyện Viên Kỹ Thuật Số & Thống kê */}
          <div className="lg:col-span-5 space-y-6">
            {/* Digital Coach Pass Card */}
            <div className="rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/80 shadow-orange-950/20">
              <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                    <span className="material-symbols-outlined text-[18px]">sports_martial_arts</span>
                  </div>
                  <div>
                    <span className="font-headline-sm text-sm font-black tracking-tight uppercase">F SPORT CENTER</span>
                    <div className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">
                      Digital Coach Pass
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider bg-orange-500/20 border-orange-400/50 text-orange-300">
                  HLV CHUYÊN NGHIỆP
                </span>
              </div>

              {/* Avatar + Coach Info */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl border-2 border-orange-500/80 overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg shrink-0">
                    {getAvatarImageUrl(coachAvatar || currentUser?.avatar) ? (
                      <img src={getAvatarImageUrl(coachAvatar || currentUser?.avatar)} alt="Coach Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg text-orange-400">
                        {getAvatarInitials(profileForm.fullName || currentUser?.name, 'HC')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Huấn Luyện Viên</div>
                    <div className="font-bold text-base uppercase text-white tracking-tight">
                      {profileForm.fullName || currentUser?.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <span className="text-orange-400 font-bold">ID:</span> #{coachId}
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-sans truncate max-w-[150px]">
                        {specialtyForm.specialty || 'HLV Thể Thao'}
                      </span>
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
                    text={qrCodeText}
                    size={130}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center justify-center sm:justify-start gap-1">
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                    <span>Mã Điểm Danh Ca Dạy</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700 break-all select-all">
                    {qrCodeText}
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
                <span>Hệ thống nhận diện F Sport Coach Check-in</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">analytics</span>
                  <h3 className="font-bold text-slate-900 text-sm uppercase">Năng Lực &amp; Hiệu Suất</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  {specialtyForm.experienceYears || 5} năm kinh nghiệm
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-semibold">Ca dạy phụ trách</span>
                    <span className="material-symbols-outlined text-[18px] text-blue-500">event_available</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {coachData?.activeClassesCount ?? 0} <span className="text-xs font-normal text-slate-500">lớp</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-semibold">Học viên đào tạo</span>
                    <span className="material-symbols-outlined text-[18px] text-emerald-500">groups</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {coachData?.totalStudentsCount ?? 0} <span className="text-xs font-normal text-slate-500">học viên</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-800 mb-1">
                    <span className="text-[11px] font-semibold">Đánh giá trung bình</span>
                    <span className="material-symbols-outlined text-[18px] text-amber-500">star</span>
                  </div>
                  <div className="text-xl font-black text-amber-900 flex items-center gap-1">
                    {coachData?.averageRating ? coachData.averageRating.toFixed(1) : '5.0'}
                    <span className="text-xs font-bold text-amber-600">/ 5.0</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-semibold">Số lượt đánh giá</span>
                    <span className="material-symbols-outlined text-[18px] text-purple-500">rate_review</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {coachData?.totalReviewsCount ?? 0} <span className="text-xs font-normal text-slate-500">lượt</span>
                  </div>
                </div>
              </div>

              {/* Bộ môn đào tạo chính */}
              {coachData?.sportsTaught && coachData.sportsTaught.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">Bộ môn đào tạo chính</span>
                  <div className="flex flex-wrap gap-1.5">
                    {coachData.sportsTaught.map((sport, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick reviews preview */}
            {coachData?.reviews && coachData.reviews.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-[20px]">reviews</span>
                    <h3 className="font-bold text-slate-900 text-sm uppercase">Nhận Xét Gần Đây</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('schedule_reviews')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Xem tất cả ({coachData.reviews.length})
                  </button>
                </div>
                <div className="space-y-2.5">
                  {coachData.reviews.slice(0, 2).map((rev) => (
                    <div key={rev.feedbackId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rev.memberName}</span>
                        <div className="flex items-center text-amber-500 text-[13px]">
                          {'★'.repeat(rev.rating || 5)}
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] italic line-clamp-2">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (7 cols): Content by Active Tab */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {/* Tab 1: Thông tin cá nhân */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                      Hồ Sơ Cá Nhân &amp; Ảnh Đại Diện
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cập nhật thông tin nhận diện huấn luyện viên và liên hệ tại F Sport Center.
                    </p>
                  </div>
                </div>

                {/* Avatar Upload Banner */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-orange-500 shadow-md flex items-center justify-center">
                      {getAvatarImageUrl(coachAvatar || currentUser?.avatar) ? (
                        <img src={getAvatarImageUrl(coachAvatar || currentUser?.avatar)} alt="Coach Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-orange-400">
                          {getAvatarInitials(profileForm.fullName || currentUser?.name, 'HC')}
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="coach-avatar-input"
                      className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                    >
                      <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                      <span className="text-[10px] font-bold mt-0.5">Thay ảnh</span>
                    </label>
                    <input
                      id="coach-avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-xs font-bold text-slate-800">Ảnh đại diện huấn luyện viên</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ JPG, PNG, WEBP (tự động tối ưu dung lượng). Hiển thị trên thẻ điện tử, lịch giảng dạy và danh sách HLV công khai.
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label
                        htmlFor="coach-avatar-input"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm shadow-orange-500/20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>{avatarUploading ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                      </label>
                      <span className="text-[11px] text-slate-400">hoặc chọn avatar thể thao:</span>
                      {[
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80',
                        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=200&q=80',
                      ].map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(presetUrl)}
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
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Email tài khoản</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Giới tính</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none bg-white font-semibold"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                    placeholder="VD: Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase text-red-600 block mb-2">
                    Liên hệ khẩn cấp (Emergency Contact)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Người thân liên hệ</label>
                      <input
                        type="text"
                        value={profileForm.emergencyContactName}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                        placeholder="Họ tên người thân"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">SĐT người thân</label>
                      <input
                        type="tel"
                        value={profileForm.emergencyContactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                        placeholder="Số điện thoại người thân"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Lưu Hồ Sơ Cá Nhân</span>
                </button>
              </form>
            )}

            {/* Tab 2: Hồ sơ chuyên môn & Chứng chỉ */}
            {activeTab === 'specialty' && (
              <form onSubmit={handleSaveSpecialty} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                      Hồ Sơ Chuyên Môn &amp; Bằng Cấp Thể Thao
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Khai báo năng lực giảng dạy, số năm thâm niên và các chứng chỉ huấn luyện thể thao chuyên nghiệp.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                      Chuyên môn huấn luyện chính
                    </label>
                    <input
                      type="text"
                      value={specialtyForm.specialty}
                      onChange={(e) => setSpecialtyForm({ ...specialtyForm, specialty: e.target.value })}
                      placeholder="VD: Tennis & Pickleball Chuyên Nghiệp, Bơi Lội Thể Thao"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                      Số năm kinh nghiệm
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={specialtyForm.experienceYears}
                      onChange={(e) => setSpecialtyForm({ ...specialtyForm, experienceYears: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Bằng cấp &amp; Chứng chỉ thể thao (Certifications)
                  </label>
                  <textarea
                    rows={4}
                    value={specialtyForm.certifications}
                    onChange={(e) => setSpecialtyForm({ ...specialtyForm, certifications: e.target.value })}
                    placeholder="VD: Chứng chỉ Huấn luyện viên ITF Level 1, Chứng nhận Sơ cấp cứu hồi sức CPR Red Cross, Bằng Cử nhân Sư phạm Thể dục Thể thao..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Tiểu sử &amp; Triết lý huấn luyện (Bio)
                  </label>
                  <textarea
                    rows={4}
                    value={specialtyForm.bio}
                    onChange={(e) => setSpecialtyForm({ ...specialtyForm, bio: e.target.value })}
                    placeholder="Mô tả phong cách đào tạo, định hướng phát triển học viên và kinh nghiệm thực chiến..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                  <span>Lưu Thông Tin Chuyên Môn</span>
                </button>
              </form>
            )}

            {/* Tab 3: Lớp dạy & Đánh giá học viên */}
            {activeTab === 'schedule_reviews' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                      Lớp Giảng Dạy &amp; Nhận Xét Học Viên
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Theo dõi phản hồi chất lượng đào tạo và sự hài lòng của học viên F Sport.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/coach/reviews"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      <span>Toàn bộ đánh giá</span>
                    </Link>
                  </div>
                </div>

                {/* Rating Highlight Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-black text-amber-600">
                      {coachData?.averageRating ? coachData.averageRating.toFixed(1) : '5.0'}
                    </div>
                    <div>
                      <div className="flex items-center text-amber-500 text-base">
                        {'★'.repeat(Math.round(coachData?.averageRating || 5))}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Dựa trên <strong>{coachData?.totalReviewsCount || 0}</strong> lượt đánh giá từ học viên
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-700 font-bold bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
                    ✓ Điểm uy tín huấn luyện: 100% Đạt Chuẩn
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Danh Sách Đánh Giá Gần Đây ({coachData?.reviews?.length || 0})
                  </h3>

                  {(!coachData?.reviews || coachData.reviews.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Chưa có phản hồi đánh giá nào từ học viên.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 space-y-3">
                      {coachData.reviews.map((rev) => (
                        <div key={rev.feedbackId} className="pt-3 first:pt-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-orange-400 flex items-center justify-center font-bold text-xs">
                                {rev.memberName?.slice(0, 2).toUpperCase() || 'HV'}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">{rev.memberName}</div>
                                <div className="text-[10px] text-slate-400">
                                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center text-amber-500 text-xs">
                              {'★'.repeat(rev.rating || 5)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Phóng To Mã QR Thẻ Huấn Luyện Viên */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">Mã QR Huấn Luyện Viên</span>
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
                id="coach-digital-qr-svg"
                text={qrCodeText}
                size={220}
              />
              <div className="mt-3 font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-300 select-all">
                {qrCodeText}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">{profileForm.fullName || currentUser?.name}</h4>
              <p className="text-xs text-slate-500">
                Đưa mã QR này vào máy quét tại quầy lễ tân hoặc sân tập để check-in ca giảng dạy tức thì.
              </p>
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
    </CoachLayout>
  );
}
