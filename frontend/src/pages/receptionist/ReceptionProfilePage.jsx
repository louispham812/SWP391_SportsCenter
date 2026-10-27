import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { useApp } from '../../context/AppContext';
import QrCodeSvg from '../../components/common/QrCodeSvg';
import {
  getReceptionistProfile,
  updateReceptionistProfile,
  updateReceptionistAvatar,
  changeReceptionistPassword,
} from '../../services/receptionistApi';
import { compressImageFile } from '../../utils/imageCompressor';
import { getAvatarImageUrl, getAvatarInitials } from '../../utils/avatarHelper';

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function ReceptionProfilePage() {
  const { currentUser, updateProfile, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'avatar' | 'security'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Nam',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getReceptionistProfile();
      setProfileData(data);
      setProfileForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || 'Nam',
        address: data.address || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
      });
    } catch (err) {
      showToast({
        title: 'Lỗi tải hồ sơ',
        message: err.message || 'Không thể tải thông tin nhân viên lễ tân.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateReceptionistProfile(profileForm);
      setProfileData(updated);
      updateProfile({
        name: updated.fullName,
        fullName: updated.fullName,
        phone: updated.phone,
      });
      showToast({
        title: 'Cập nhật thành công',
        message: 'Thông tin hồ sơ nhân viên lễ tân đã được lưu.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Lỗi cập nhật',
        message: err.message || 'Không thể lưu thông tin hồ sơ.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Avatar Upload File
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      const compressedBase64 = await compressImageFile(file, 500, 0.85);
      const res = await updateReceptionistAvatar(compressedBase64);
      const newAvatar = res?.avatar || compressedBase64;
      setProfileData((prev) => ({ ...prev, avatar: newAvatar }));
      updateProfile({ avatar: newAvatar });
      showToast({
        title: 'Cập nhật thành công',
        message: 'Ảnh đại diện nhân viên đã được thay đổi.',
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

  // Handle Preset Avatar Selection
  const handleSelectPresetAvatar = async (presetUrl) => {
    try {
      setAvatarUploading(true);
      const res = await updateReceptionistAvatar(presetUrl);
      const newAvatar = res?.avatar || presetUrl;
      setProfileData((prev) => ({ ...prev, avatar: newAvatar }));
      updateProfile({ avatar: newAvatar });
      showToast({
        title: 'Thành công',
        message: 'Đã đổi ảnh đại diện nhân viên.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Lỗi',
        message: err.message || 'Không thể chọn ảnh này.',
        type: 'error',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast({ title: 'Cảnh báo', message: 'Vui lòng nhập mật khẩu hiện tại.', type: 'warning' });
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      showToast({ title: 'Cảnh báo', message: 'Mật khẩu mới phải có ít nhất 8 ký tự.', type: 'warning' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({ title: 'Cảnh báo', message: 'Xác nhận mật khẩu mới không khớp.', type: 'warning' });
      return;
    }

    try {
      setPasswordSaving(true);
      await changeReceptionistPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast({
        title: 'Đổi mật khẩu thành công',
        message: 'Mật khẩu của bạn đã được cập nhật an toàn.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Đổi mật khẩu thất bại',
        message: err.message || 'Mật khẩu hiện tại không chính xác.',
        type: 'error',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const currentAvatarUrl = getAvatarImageUrl(profileData?.avatar || currentUser?.avatar);
  const staffCode = profileData?.staffCode || `F-STAFF-${currentUser?.id || '002'}`;
  const rfidCode = profileData?.rfidCode || `RFID-REC-${currentUser?.id || '002'}`;
  const qrToken = `SPORTHUB-STAFF-${currentUser?.id || '002'}`;

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                <span className="material-symbols-outlined text-[14px]">badge</span>
                THẺ ĐỊNH DANH NHÂN SỰ F SPORT
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hồ sơ cá nhân</h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Quản lý thông tin định danh lễ tân, ca trực quầy và bảo mật tài khoản cá nhân.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white transition shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code</span>
              <span>Mã QR Nhân Viên</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Left Digital Card + Right Form Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Digital Staff ID Card & Performance Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* F Sport Digital Staff Card */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white border-2 border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-orange-500/15 rounded-full blur-2xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-xs shadow-md shadow-orange-500/30">
                    F
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-orange-400 font-extrabold">F SPORT CENTER</div>
                    <div className="text-[11px] font-bold text-slate-300">THẺ NHÂN VIÊN LỄ TÂN</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 text-[20px]">contactless</span>
              </div>

              {/* Avatar + Main Identity */}
              <div className="py-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-orange-500/80 bg-slate-800 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                  {currentAvatarUrl ? (
                    <img src={currentAvatarUrl} alt="Staff Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-xl text-orange-400">
                      {getAvatarInitials(profileForm.fullName || currentUser?.name, 'LT')}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Nhân sự quầy</div>
                  <div className="font-black text-base uppercase text-white truncate">
                    {profileForm.fullName || currentUser?.name || 'Nhân viên Lễ tân'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-1.5">
                    <span className="text-orange-400 font-bold">MÃ:</span>
                    <span>{staffCode}</span>
                  </div>
                </div>
              </div>

              {/* RFID + QR Code Preview */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">RFID CARD:</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">{rfidCode}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Đang hoạt động
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 bg-white rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer"
                  title="Bấm để xem mã QR lớn"
                >
                  <QrCodeSvg text={qrToken} size={48} fgColor="#0f172a" bgColor="#ffffff" />
                </button>
              </div>
            </div>

            {/* Shift Performance Summary */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="material-symbols-outlined text-orange-500 text-[18px]">monitoring</span>
                Thống kê hiệu suất ca trực
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Lượt check-in đã xử lý:</span>
                  <span className="text-sm font-black text-slate-900">
                    {profileData?.shiftStats?.totalCheckInsHandled ?? 0} lượt
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Giao dịch quầy hoàn tất:</span>
                  <span className="text-sm font-black text-slate-900">
                    {profileData?.shiftStats?.totalSalesHandled ?? 0} GD
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Doanh thu đã thu ngân:</span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatMoney(profileData?.shiftStats?.totalRevenueCollected ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Main Details & Settings Tabs (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 px-6 pt-4 gap-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'profile'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Thông tin cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'avatar'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>Ảnh đại diện</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Bảo mật & Mật khẩu</span>
              </button>
            </div>

            <div className="p-6">
              {/* TAB 1: Profile Info Form */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Họ và tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số điện thoại liên hệ
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                        placeholder="0912 345 678"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email tài khoản (không thể thay đổi)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profileData?.email || currentUser?.email || ''}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chức vụ / Vai trò
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Nhân viên Lễ tân (Front Desk Receptionist)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs cursor-not-allowed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Giới tính
                      </label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden bg-white"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Địa chỉ thường trú / tạm trú
                      </label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, TP..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Người liên hệ khẩn cấp
                      </label>
                      <input
                        type="text"
                        value={profileForm.emergencyContactName}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                        placeholder="Tên người thân / bạn bè"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        SĐT liên hệ khẩn cấp
                      </label>
                      <input
                        type="tel"
                        value={profileForm.emergencyContactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                        placeholder="0988 888 888"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Avatar Upload & Preset */}
              {activeTab === 'avatar' && (
                <div className="space-y-6">
                  {/* Current Avatar & Upload Action */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border-2 border-orange-500 shadow-lg flex items-center justify-center">
                        {currentAvatarUrl ? (
                          <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-orange-400">
                            {getAvatarInitials(profileForm.fullName || currentUser?.name, 'LT')}
                          </span>
                        )}
                      </div>
                      <label
                        htmlFor="reception-avatar-input"
                        className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                      >
                        <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                        <span className="text-[10px] font-bold mt-0.5">Thay ảnh</span>
                      </label>
                      <input
                        id="reception-avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-bold text-sm text-slate-900">Ảnh đại diện nhân viên lễ tân</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ định dạng JPG, PNG hoặc WEBP (tối đa 5MB). Ảnh sẽ tự động được nén sắc nét và hiển thị trên thẻ nhân sự, thanh điều hướng và nhật ký ca trực.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <label
                          htmlFor="reception-avatar-input"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">upload</span>
                          <span>{avatarUploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatar Selection */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Hoặc chọn ảnh đại diện nhân sự mẫu:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          name: 'Nhân viên 01',
                          url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                        },
                        {
                          name: 'Nhân viên 02',
                          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                        },
                        {
                          name: 'Nhân viên 03',
                          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                        },
                        {
                          name: 'Nhân viên 04',
                          url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
                        },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(preset.url)}
                          className="p-2 rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition text-center group cursor-pointer"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-24 rounded-xl object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="text-[11px] font-bold text-slate-700 mt-2 block group-hover:text-orange-600">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Security & Password */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                      <span>{passwordSaving ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Staff QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-200">
                F SPORT STAFF QR
              </span>
              <h3 className="font-black text-slate-900 text-base">{profileForm.fullName || currentUser?.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{staffCode} · {rfidCode}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QrCodeSvg text={qrToken} size={180} fgColor="#0f172a" bgColor="#f8fafc" />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dùng mã QR này để xác thực ca trực nội bộ, điểm danh nhân viên hoặc quét qua đầu đọc cảm ứng tại trung tâm thể thao.
            </p>
          </div>
        </div>
      )}
    </ReceptionistLayout>
  );
}
