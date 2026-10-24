import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { createManagerUser } from '../../services/managerApi';
import { createReceptionistUser } from '../../services/receptionistApi';

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const { currentUser, currentRole, showToast } = useApp();

  const isManager =
    currentRole === 'admin' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.role === 'ADMIN';

  const [role, setRole] = useState('MEMBER');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('SportHub@123');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Optional fields per specification (Section 2.1 - B. Thông tin bổ sung)
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [rfidCode, setRfidCode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setError('Vui lòng điền đầy đủ tất cả các trường thông tin bắt buộc.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu khởi tạo phải có ít nhất 8 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        address: address.trim() || null,
        rfidCode: rfidCode.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
      };

      if (currentRole === 'receptionist') {
        await createReceptionistUser(payload);
      } else {
        await createManagerUser(payload);
      }

      showToast(
        'Tạo tài khoản thành công',
        `Tài khoản "${fullName}" (${role}) đã được tạo và kích hoạt.`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể tạo tài khoản người dùng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Thêm người dùng mới</h2>
              <p className="text-xs text-slate-500">
                Khởi tạo tài khoản trực tiếp trên hệ thống quản trị F Sport
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Vai trò Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-user-role" className="text-xs uppercase tracking-wider text-slate-700 font-extrabold flex items-center justify-between">
              <span>ĐĂNG KÝ VỚI VAI TRÒ *</span>
              <span className="text-[10px] text-slate-400 font-semibold normal-case">
                {isManager ? 'Quyền Manager (4 vai trò)' : 'Quyền Lễ tân (3 vai trò)'}
              </span>
            </label>
            <div className="relative">
              <select
                id="create-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white text-slate-900 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs appearance-none cursor-pointer"
              >
                <option value="MEMBER">Khách hàng / Hội viên (MEMBER)</option>
                <option value="COACH">Huấn luyện viên (COACH)</option>
                <option value="RECEPTIONIST">Nhân viên lễ tân (RECEPTIONIST)</option>
                {isManager && (
                  <option value="MANAGER">Quản lý hệ thống (MANAGER)</option>
                )}
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Họ và tên */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
              Họ và tên *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Trần Văn Nam"
              className="w-full bg-white text-slate-900 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Số điện thoại */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                Địa chỉ Email *
              </label>
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Mật khẩu khởi tạo */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                Mật khẩu khởi tạo *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Tối thiểu 8 ký tự</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors flex items-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible Optional Information Section (Section 2.1 - B. Thông tin bổ sung) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-[18px]">badge</span>
                <span>Thông tin bổ sung (Ngày sinh, Giới tính, Địa chỉ, RFID, Liên hệ khẩn cấp)</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-slate-400">
                {showOptionalFields ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showOptionalFields && (
              <div className="p-4 space-y-3 bg-white border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ngày sinh */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">Ngày sinh</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:bg-white focus:border-orange-500"
                    />
                  </div>

                  {/* Giới tính */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:bg-white focus:border-orange-500 cursor-pointer"
                    >
                      <option value="">-- Chọn giới tính --</option>
                      <option value="MALE">Nam (MALE)</option>
                      <option value="FEMALE">Nữ (FEMALE)</option>
                      <option value="OTHER">Khác (OTHER)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mã thẻ RFID */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">Mã thẻ RFID / Vòng tay</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={rfidCode}
                      onChange={(e) => setRfidCode(e.target.value)}
                      placeholder="Quẹt thẻ hoặc nhập mã RFID..."
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:bg-white focus:border-orange-500"
                    />
                  </div>

                  {/* Địa chỉ */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">Địa chỉ cư trú</label>
                    <input
                      type="text"
                      maxLength={500}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, quận/huyện..."
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:bg-white focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Người liên hệ khẩn cấp */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">Người liên hệ khẩn cấp</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Tên người thân / bạn bè"
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:bg-white focus:border-orange-500"
                    />
                  </div>

                  {/* SĐT khẩn cấp */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600">SĐT người liên hệ khẩn cấp</label>
                    <input
                      type="tel"
                      maxLength={15}
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="0912 999 888"
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:bg-white focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-orange-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>{submitting ? 'ĐANG TẠO...' : 'TẠO TÀI KHOẢN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
