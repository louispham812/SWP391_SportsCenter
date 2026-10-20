import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';

// Initial Mock System Policies
const INITIAL_POLICIES = {
  bookingHoldTimeoutMinutes: 10,
  cancelRefundDeadlineHours: 2,
  coachCommissionPercent: 70,
  maxAdvanceBookingDays: 14,
  guestCourtDepositPercent: 50,
  checkInGracePeriodMinutes: 15,
  autoArchiveLogsDays: 90,
  allowSplitPayment: false, // Rule: never split quota and cash
};

// Initial Mock Audit Logs
const INITIAL_AUDIT_LOGS = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userName: 'Trần Quản Lý (Admin)',
    userRole: 'MANAGER',
    action: 'APPROVE',
    entity: 'MEMBER_MEMBERSHIP',
    entityId: 'MBR-2026-089',
    description: 'Duyệt kích hoạt gói VIP All-Access 6 Tháng cho Hội viên Lê Văn Long',
    ipAddress: '118.69.182.44',
    status: 'SUCCESS',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    userName: 'Trần Quản Lý (Admin)',
    userRole: 'MANAGER',
    action: 'REASSIGN_COACH',
    entity: 'COACH_LEAVE',
    entityId: 'LV-102',
    description: 'Chấp thuận đơn nghỉ của HLV Nguyễn Văn Hùng và gán thay thế sang HLV Phạm Thị Lan (không phụ thu)',
    ipAddress: '118.69.182.44',
    status: 'SUCCESS',
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    userName: 'Nguyễn Lễ Tân (Ca 1)',
    userRole: 'RECEPTIONIST',
    action: 'RENT_EQUIPMENT',
    entity: 'EQUIPMENT_LOAN',
    entityId: 'LN-501',
    description: 'Cho mượn 2 Vợt Yonex Astrox và 1 Hộp Cầu Lông - Đặt cọc CCCD',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS',
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    userName: 'Trần Quản Lý (Admin)',
    userRole: 'MANAGER',
    action: 'CREATE',
    entity: 'VOUCHER',
    entityId: 'SUMMER2026',
    description: 'Tạo mã voucher giảm 15% cho học viên mới đăng ký bơi lội',
    ipAddress: '118.69.182.44',
    status: 'SUCCESS',
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    userName: 'Hệ thống tự động (Cron)',
    userRole: 'SYSTEM',
    action: 'EXPIRE_BOOKING',
    entity: 'COURT_BOOKING',
    entityId: 'BK-9912',
    description: 'Tự động hủy và giải phóng Sân Pickleball 02 do quá hạn 10 phút chưa thanh toán',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
  },
];

// Initial Role Permissions Matrix (MGR-02)
const INITIAL_PERMISSIONS = [
  {
    screenId: 'MEM_MGMT',
    screenName: 'Quản lý Hội viên & Hồ sơ sức khỏe',
    module: 'Hội viên',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: true, create: true, edit: true, delete: false },
      coach: { view: true, create: false, edit: false, delete: false },
      member: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    screenId: 'COURT_CLASS_BOOKING',
    screenName: 'Đặt Sân bãi & Đăng ký Lớp học',
    module: 'Booking',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: true, create: true, edit: true, delete: true },
      coach: { view: true, create: false, edit: false, delete: false },
      member: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    screenId: 'ATTENDANCE_CHECKIN',
    screenName: 'Điểm danh 3 trạng thái & Check-in RFID',
    module: 'Vận hành',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: true, create: true, edit: true, delete: false },
      coach: { view: true, create: true, edit: true, delete: false },
      member: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    screenId: 'EQUIPMENT_RENTAL',
    screenName: 'Mượn & Thuê Dụng cụ (REC-13)',
    module: 'Vận hành',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: true, create: true, edit: true, delete: false },
      coach: { view: false, create: false, edit: false, delete: false },
      member: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    screenId: 'POS_BILLING',
    screenName: 'Thu ngân POS, Hóa đơn & Bán lẻ',
    module: 'Tài chính',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: true, create: true, edit: false, delete: false },
      coach: { view: false, create: false, edit: false, delete: false },
      member: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    screenId: 'APPROVALS_REFUNDS',
    screenName: 'Duyệt Đơn nghỉ Coach & Hoàn tiền (MGR-24, MGR-16)',
    module: 'Quản trị',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: false, create: false, edit: false, delete: false },
      coach: { view: false, create: false, edit: false, delete: false },
      member: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    screenId: 'VOUCHER_PRICING',
    screenName: 'Quản lý Voucher & Bảng giá PT lẻ (MGR-18, MGR-04)',
    module: 'Cấu hình',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: true, create: false, edit: false, delete: false },
      coach: { view: true, create: false, edit: false, delete: false },
      member: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    screenId: 'SYSTEM_SETTINGS',
    screenName: 'Chính sách hệ thống & Nhật ký Audit Log',
    module: 'Hệ thống',
    roles: {
      admin: { view: true, create: true, edit: true, delete: true },
      receptionist: { view: false, create: false, edit: false, delete: false },
      coach: { view: false, create: false, edit: false, delete: false },
      member: { view: false, create: false, edit: false, delete: false },
    },
  },
];

export default function AdminSettingsPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' | 'audit' | 'permissions'

  // System Policies State
  const [policies, setPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('sports_center_system_policies');
      return saved ? JSON.parse(saved) : INITIAL_POLICIES;
    } catch {
      return INITIAL_POLICIES;
    }
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('sports_center_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Permissions Matrix State
  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('sports_center_role_permissions');
      return saved ? JSON.parse(saved) : INITIAL_PERMISSIONS;
    } catch {
      return INITIAL_PERMISSIONS;
    }
  });

  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  const savePolicies = (e) => {
    e.preventDefault();
    localStorage.setItem('sports_center_system_policies', JSON.stringify(policies));
    showToast('Thành công', 'Đã lưu cấu hình chính sách vận hành toàn hệ thống.', 'success');
  };

  const savePermissions = () => {
    localStorage.setItem('sports_center_role_permissions', JSON.stringify(permissions));
    showToast('Thành công', 'Đã cập nhật Ma trận Phân quyền các phân hệ (MGR-02).', 'success');
  };

  const togglePermission = (screenIndex, roleKey, permKey) => {
    const updated = [...permissions];
    const currentVal = updated[screenIndex].roles[roleKey][permKey];
    updated[screenIndex].roles[roleKey][permKey] = !currentVal;
    setPermissions(updated);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter !== 'ALL' && log.action !== auditFilter && log.entity !== auditFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Cấu hình & Quản trị Tối cao
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cài Đặt Hệ Thống, Phân Quyền & Audit Logs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Thiết lập quy chế vận hành trung tâm, ma trận truy cập đa vai trò (MGR-02) và tra cứu nhật ký kiểm toán hệ thống.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-3 gap-2 overflow-x-auto shadow-sm">
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'policies'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">policy</span>
            Chính Sách Vận Hành (System Policies)
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">security</span>
            Ma Trận Phân Quyền (MGR-02)
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">manage_history</span>
            Nhật Ký Kiểm Toán (Audit Logs)
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SYSTEM POLICIES */}
        {activeTab === 'policies' && (
          <form onSubmit={savePolicies} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Thông Số Thời Gian & Quy Định Hủy/Hoàn</h2>
              <p className="text-xs text-slate-500 mt-1">Các giá trị này được áp dụng trực tiếp cho tiến trình giữ chỗ và hoàn tiền tự động.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-orange-500">timer</span>
                  Thời gian giữ chỗ booking chờ thanh toán (Phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={policies.bookingHoldTimeoutMinutes}
                  onChange={(e) => setPolicies({ ...policies, bookingHoldTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[11px] text-slate-500">Hết thời gian này, slot sân/lớp sẽ tự động mở lại cho hội viên khác.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-indigo-500">history_toggle_off</span>
                  Thời hạn hủy booking hoàn tiền 100% (Giờ trước giờ chơi)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={policies.cancelRefundDeadlineHours}
                  onChange={(e) => setPolicies({ ...policies, cancelRefundDeadlineHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[11px] text-slate-500">Hội viên hủy trước mốc này được hoàn 100%. Hủy sau mốc này không hoàn tiền.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-500">percent</span>
                  Tỷ lệ hoa hồng chia cho HLV (Personal Trainer %)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={policies.coachCommissionPercent}
                  onChange={(e) => setPolicies({ ...policies, coachCommissionPercent: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[11px] text-slate-500">Phần trăm thù lao HLV nhận được từ các gói dạy PT lẻ (MGR-04).</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-500">calendar_month</span>
                  Số ngày cho phép đặt sân trước tối đa (Ngày)
                </label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={policies.maxAdvanceBookingDays}
                  onChange={(e) => setPolicies({ ...policies, maxAdvanceBookingDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[11px] text-slate-500">Giới hạn thời gian mở lịch đặt sân cho hội viên xem trước.</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Quy Tắc Nghiệp Vụ Nghiêm Ngặt</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-amber-50/60">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">block</span>
                      Quy tắc Không Tách Thanh toán Quota và Tiền mặt (No Split-Payment)
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Khi số buổi trong gói còn thiếu (ví dụ cần 2 buổi nhưng chỉ còn 1), hệ thống bắt buộc thanh toán toàn bộ theo giá bán lẻ hoặc nạp thêm gói. Không cho phép cấn trừ 1 buổi + bù tiền mặt.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    Luôn Kích Hoạt
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Lưu Thay Đổi Chính Sách
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ROLE PERMISSION MATRIX (MGR-02) */}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ma Trận Quyền Truy Cập Màn Hình & Tính Năng</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kiểm soát quyền Xem (View), Tạo mới (Create), Chỉnh sửa (Edit) và Xóa/Duyệt (Delete/Approve) theo vai trò.
                </p>
              </div>
              <button
                onClick={savePermissions}
                type="button"
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Lưu Ma Trận Phân Quyền
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 border-r border-slate-200">Phân Hệ / Tính Năng</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 bg-red-50/50 text-red-900">
                      ADMIN / MANAGER
                    </th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 bg-blue-50/50 text-blue-900">
                      LỄ TÂN (RECEPTIONIST)
                    </th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 bg-emerald-50/50 text-emerald-900">
                      HLV (COACH)
                    </th>
                    <th className="py-3 px-3 text-center bg-purple-50/50 text-purple-900">
                      HỘI VIÊN (MEMBER)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {permissions.map((item, idx) => (
                    <tr key={item.screenId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 border-r border-slate-200">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold mr-2">
                          {item.module}
                        </span>
                        <span className="font-bold text-slate-900">{item.screenName}</span>
                      </td>

                      {/* Admin column */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 bg-red-50/20">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
                          {['view', 'create', 'edit', 'delete'].map((pKey) => (
                            <label key={pKey} className="inline-flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.roles.admin[pKey]}
                                onChange={() => togglePermission(idx, 'admin', pKey)}
                                className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-0"
                              />
                              <span className="uppercase text-[9px] font-bold text-slate-400">
                                {pKey[0]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>

                      {/* Receptionist column */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 bg-blue-50/20">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
                          {['view', 'create', 'edit', 'delete'].map((pKey) => (
                            <label key={pKey} className="inline-flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.roles.receptionist[pKey]}
                                onChange={() => togglePermission(idx, 'receptionist', pKey)}
                                className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-0"
                              />
                              <span className="uppercase text-[9px] font-bold text-slate-400">
                                {pKey[0]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>

                      {/* Coach column */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50/20">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
                          {['view', 'create', 'edit', 'delete'].map((pKey) => (
                            <label key={pKey} className="inline-flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.roles.coach[pKey]}
                                onChange={() => togglePermission(idx, 'coach', pKey)}
                                className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-0"
                              />
                              <span className="uppercase text-[9px] font-bold text-slate-400">
                                {pKey[0]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>

                      {/* Member column */}
                      <td className="py-2 px-2 text-center bg-purple-50/20">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
                          {['view', 'create', 'edit', 'delete'].map((pKey) => (
                            <label key={pKey} className="inline-flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.roles.member[pKey]}
                                onChange={() => togglePermission(idx, 'member', pKey)}
                                className="w-3.5 h-3.5 rounded text-purple-500 focus:ring-0"
                              />
                              <span className="uppercase text-[9px] font-bold text-slate-400">
                                {pKey[0]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-slate-400 text-right">
                * Ký hiệu viết tắt: <strong>V</strong> = Xem (View), <strong>C</strong> = Thêm mới (Create), <strong>E</strong> = Chỉnh sửa (Edit), <strong>D</strong> = Xóa/Duyệt (Delete/Approve).
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS (audit_logs) */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Nhật Ký Kiểm Toán Toàn Hệ Thống (Audit Trail)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghi nhận mọi thao tác nhạy cảm: duyệt tài khoản, cấn trừ tiền, phê duyệt đơn nghỉ, hoàn tiền.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm theo user, mã đối tượng..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 focus:ring-1 focus:ring-orange-500"
                />
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-bold"
                >
                  <option value="ALL">Tất cả hành động</option>
                  <option value="APPROVE">Duyệt (APPROVE)</option>
                  <option value="REASSIGN_COACH">Đổi Coach (REASSIGN_COACH)</option>
                  <option value="RENT_EQUIPMENT">Mượn dụng cụ</option>
                  <option value="CREATE">Tạo mới</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3">Người thực hiện</th>
                    <th className="py-3 px-3">Hành động</th>
                    <th className="py-3 px-3">Đối tượng</th>
                    <th className="py-3 px-3">Mô tả chi tiết</th>
                    <th className="py-3 px-3">IP / Nguồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-orange-600">
                        {log.entity} / {log.entityId}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs">{log.description}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
