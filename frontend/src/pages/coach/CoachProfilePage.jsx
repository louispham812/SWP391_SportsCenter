import React, { useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { useApp } from '../../context/AppContext';

export default function CoachProfilePage() {
  const { currentUser, showToast } = useApp();

  // State thông tin cá nhân HLV
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || 'HLV Lê Anh Tuấn',
    code: 'COACH_892',
    email: currentUser?.email || 'anhtuan.le@fpt.edu.vn',
    phone: '0905 333 444',
    gender: 'Nam',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    specialty: 'Pickleball PPR Level 2 Pro & Phục Hồi Thể Lực (Biomechanics)',
    experience: '6 năm kinh nghiệm huấn luyện thi đấu chuyên nghiệp',
    bio: 'Chuyên gia huấn luyện bộ môn Pickleball & Tennis. Đã đào tạo thành công hơn 200+ học viên đạt giải phong trào FPT Sports Cup.',
    rating: 4.9,
    reviewsCount: 82,
    certifications: [
      'Chứng chỉ PPR Level 2 Pro Certified Pickleball Coach',
      'NASM Personal Trainer (PT Quốc tế)',
      'Cử nhân Đại học Thể dục Thể thao',
      'Chứng chỉ sơ cấp cứu Y tế Thể thao (Red Cross)',
    ],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profileData });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfileData({ ...formData });
    setIsEditing(false);
    showToast?.('Cập nhật thành công', 'Thông tin cá nhân HLV đã được lưu.', 'success');
  };

  return (
    <CoachLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Online"></span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                    MASTER COACH
                  </span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    ★ {profileData.rating} ({profileData.reviewsCount} đánh giá)
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {profileData.name}
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  Mã HLV: <strong className="text-white font-mono">#{profileData.code}</strong> • {profileData.experience}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  setFormData({ ...profileData });
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                isEditing
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isEditing ? 'close' : 'edit'}
              </span>
              <span>{isEditing ? 'Hủy Thay Đổi' : 'Chỉnh Sửa Hồ Sơ'}</span>
            </button>
          </div>
        </div>

        {/* Bố cục Thông tin Chi tiết */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI (8 cols): Form thông tin & Tiểu sử */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 uppercase">
                Hồ Sơ Huấn Luyện Viên
              </h2>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                FPT Sports Center Faculty
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên HLV:</label>
                  <input
                    type="text"
                    name="name"
                    disabled={!isEditing}
                    value={isEditing ? formData.name : profileData.name}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50 outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    name="phone"
                    disabled={!isEditing}
                    value={isEditing ? formData.phone : profileData.phone}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50 outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email trường (FPT.EDU.VN):</label>
                  <input
                    type="email"
                    name="email"
                    disabled={!isEditing}
                    value={isEditing ? formData.email : profileData.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50 outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đường dẫn Avatar (URL):</label>
                  <input
                    type="text"
                    name="avatar"
                    disabled={!isEditing}
                    value={isEditing ? formData.avatar : profileData.avatar}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-900 disabled:bg-slate-50 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chuyên môn phụ trách:</label>
                <input
                  type="text"
                  name="specialty"
                  disabled={!isEditing}
                  value={isEditing ? formData.specialty : profileData.specialty}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiểu sử & Phương pháp huấn luyện:</label>
                <textarea
                  rows={4}
                  name="bio"
                  disabled={!isEditing}
                  value={isEditing ? formData.bio : profileData.bio}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-900 leading-relaxed disabled:bg-slate-50 outline-none focus:border-orange-500"
                ></textarea>
              </div>

              {isEditing && (
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  Lưu Thay Đổi Hồ Sơ
                </button>
              )}
            </form>
          </div>

          {/* CỘT PHẢI (4 cols): Bằng cấp & Chứng chỉ */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">
                  <span className="material-symbols-outlined text-[22px]">verified</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase">Chứng Chỉ & Bằng Cấp</h3>
                  <p className="text-[10px] text-slate-400">Đã xác minh bởi FPT Sports Board</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {profileData.certifications.map((cert, index) => (
                  <div key={index} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-2.5 text-xs">
                    <span className="material-symbols-outlined text-orange-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                    <span className="text-slate-200 font-bold leading-snug">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chỉ số uy tín HLV */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase border-b border-slate-100 pb-2">
                Thống Kê Uy Tín
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Số giờ dạy</span>
                  <strong className="text-lg font-black text-slate-900 font-mono">1,240+ h</strong>
                </div>
                <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
                  <span className="text-[10px] text-orange-600 font-bold block uppercase">Học viên hài lòng</span>
                  <strong className="text-lg font-black text-orange-600 font-mono">99.2%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CoachLayout>
  );
}