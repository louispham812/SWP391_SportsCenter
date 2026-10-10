import React, { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminStaffPage() {
  const { addAuditLog, showToast } = useApp();
  const [staffList, setStaffList] = useState([
    {
      id: 1,
      name: 'Trần Hoàng Long',
      role: 'Quản Lý Trung Tâm (Center Manager)',
      roleKey: 'admin',
      roleBadge: 'bg-primary text-secondary-container',
      phone: '0901 111 222',
      email: 'hoanglong@elitesports.vn',
      specialty: 'Điều hành tổng thể & Kế hoạch chiến lược',
      status: 'active',
    },
    {
      id: 2,
      name: 'Lê Anh Tuấn',
      role: 'Huấn Luyện Viên (Master Coach)',
      roleKey: 'coach',
      roleBadge: 'bg-secondary-container text-primary',
      phone: '0905 333 444',
      email: 'anhtuan.le@elitesports.vn',
      specialty: 'Pickleball PPR & Phục hồi chức năng (NASM)',
      status: 'active',
    },
    {
      id: 3,
      name: 'Vũ Thu Hà',
      role: 'Huấn Luyện Viên (Coach)',
      roleKey: 'coach',
      roleBadge: 'bg-secondary-container text-primary',
      phone: '0908 555 666',
      email: 'thuha.vu@elitesports.vn',
      specialty: 'Yoga & Pilates Reformer Allegro 2',
      status: 'active',
    },
    {
      id: 4,
      name: 'Hoàng Thu Trang',
      role: 'Nhân Viên Lễ Tân (Receptionist)',
      roleKey: 'receptionist',
      roleBadge: 'bg-slate-100 text-slate-800',
      phone: '0919 777 888',
      email: 'thutrang@elitesports.vn',
      specialty: 'Quầy tiếp đón ca sáng & Thu ngân POS',
      status: 'active',
    },
  ]);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showRbacModal, setShowRbacModal] = useState(false);

  // New staff form
  const [newStaff, setNewStaff] = useState({
    name: '',
    roleKey: 'coach',
    phone: '',
    email: '',
    specialty: '',
  });

  // RBAC Matrix State
  const [permissions, setPermissions] = useState([
    {
      id: 'p1',
      feature: 'Quản lý Hội viên & Khóa thẻ (Flow 1)',
      manager: true,
      coach: false,
      receptionist: true,
      member: false,
    },
    {
      id: 'p2',
      feature: 'Xem Báo cáo Tài chính & Doanh thu (Flow 3)',
      manager: true,
      coach: false,
      receptionist: false,
      member: false,
    },
    {
      id: 'p3',
      feature: 'Quản lý Gói tập, Học phí & Hạn dùng (Flow 1, 3)',
      manager: true,
      coach: false,
      receptionist: false,
      member: false,
    },
    {
      id: 'p4',
      feature: 'Phân công HLV & Xếp lịch lớp học (Flow 2)',
      manager: true,
      coach: false,
      receptionist: false,
      member: false,
    },
    {
      id: 'p5',
      feature: 'Điểm danh học viên & Đánh giá kết quả (Flow 4)',
      manager: true,
      coach: true,
      receptionist: false,
      member: false,
    },
    {
      id: 'p6',
      feature: 'Sử dụng AI tạo bài tập & Gửi thông báo (Flow 5)',
      manager: true,
      coach: true,
      receptionist: false,
      member: false,
    },
    {
      id: 'p7',
      feature: 'Check-in tại quầy, cấp tủ Locker & POS (Flow 1, 3)',
      manager: true,
      coach: false,
      receptionist: true,
      member: false,
    },
    {
      id: 'p8',
      feature: 'Đặt / Hủy lịch lớp học & Chat AI Assistant (Flow 2, 6)',
      manager: true,
      coach: false,
      receptionist: true,
      member: true,
    },
  ]);

  const handleTogglePermission = (id, roleKey) => {
    setPermissions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [roleKey]: !item[roleKey] } : item
      )
    );
  };

  const handleSaveRbac = () => {
    addAuditLog('Phân quyền truy cập', 'Quản lý đã cập nhật ma trận phân quyền hệ thống (RBAC)');
    showToast('Đã lưu phân quyền RBAC', 'Ma trận phân quyền hệ thống đã được đồng bộ hóa!', 'success');
    setShowRbacModal(false);
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.phone) return;

    let roleTitle = 'Huấn Luyện Viên (Coach)';
    let roleBadge = 'bg-[#c1f100] text-slate-950 font-bold';
    if (newStaff.roleKey === 'admin') {
      roleTitle = 'Quản Lý Trung Tâm (Center Manager)';
      roleBadge = 'bg-[#00132b] text-[#c1f100] font-bold';
    } else if (newStaff.roleKey === 'receptionist') {
      roleTitle = 'Nhân Viên Lễ Tân (Receptionist)';
      roleBadge = 'bg-slate-100 text-slate-800 font-bold';
    }

    const created = {
      id: Date.now(),
      name: newStaff.name,
      role: roleTitle,
      roleKey: newStaff.roleKey,
      roleBadge,
      phone: newStaff.phone,
      email: newStaff.email || `${newStaff.phone}@elitesports.vn`,
      specialty: newStaff.specialty || 'Chuyên viên đào tạo',
      status: 'active',
    };

    setStaffList([...staffList, created]);
    addAuditLog('Thêm nhân sự mới', `Đã thêm ${created.name} vào vai trò ${roleTitle}`);
    showToast('Thêm nhân sự thành công', `Đã cấp tài khoản cho ${created.name} (${roleTitle})!`, 'success');
    setShowAddStaffModal(false);
    setNewStaff({ name: '', roleKey: 'coach', phone: '', email: '', specialty: '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 1: STAFF & ROLE MANAGEMENT (RBAC)
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Quản Lý Nhân Sự & Huấn Luyện Viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Phân quyền truy cập 4 vai trò, quản lý thông tin nhân viên và phân công chuyên môn.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowRbacModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>Ma Trận Phân Quyền (RBAC)</span>
            </button>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Thêm Nhân Viên</span>
            </button>
          </div>
        </div>

        {/* Staff Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {staffList.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-base font-bold text-slate-900">
                        {st.name}
                      </h3>
                      <div className="text-xs text-slate-500">{st.email}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${st.roleBadge}`}>
                    {st.role.split('(')[1]?.replace(')', '') || 'STAFF'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 mb-4 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chức vụ:</span>
                    <strong className="text-slate-900">{st.role}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số điện thoại:</span>
                    <strong className="text-slate-800">{st.phone}</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Chuyên môn & Phụ trách:</span>
                    <span className="text-slate-800 font-semibold">{st.specialty}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đang hoạt động
                </span>
                <button
                  onClick={() => setShowRbacModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-100 font-bold uppercase transition-colors"
                >
                  Phân Quyền
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Ma Trận Phân Quyền (RBAC) */}
      {showRbacModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRbacModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                  Ma Trận Phân Quyền Truy Cập Hệ Thống (RBAC)
                </h3>
                <p className="text-xs text-slate-500">
                  Cấu hình quyền hạn cho từng vai trò người dùng trong hệ thống trung tâm thể thao.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tính năng hệ thống</th>
                    <th className="py-3 px-2 text-center text-primary">Quản lý</th>
                    <th className="py-3 px-2 text-center text-secondary">HLV</th>
                    <th className="py-3 px-2 text-center text-slate-700">Lễ tân</th>
                    <th className="py-3 px-2 text-center text-emerald-700">Hội viên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-800">{p.feature}</td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={p.manager}
                          onChange={() => handleTogglePermission(p.id, 'manager')}
                          className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={p.coach}
                          onChange={() => handleTogglePermission(p.id, 'coach')}
                          className="w-4 h-4 rounded text-secondary focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={p.receptionist}
                          onChange={() => handleTogglePermission(p.id, 'receptionist')}
                          className="w-4 h-4 rounded text-slate-700 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={p.member}
                          onChange={() => handleTogglePermission(p.id, 'member')}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleSaveRbac}
                className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Lưu Cấu Hình Phân Quyền</span>
              </button>
              <button
                onClick={() => setShowRbacModal(false)}
                className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm Nhân Viên Mới */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowAddStaffModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Thêm Nhân Viên / Huấn Luyện Viên Mới
            </h3>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="Ví dụ: Hoàng Văn Nam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Vai trò
                  </label>
                  <select
                    value={newStaff.roleKey}
                    onChange={(e) => setNewStaff({ ...newStaff, roleKey: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="coach">Huấn Luyện Viên</option>
                    <option value="receptionist">Nhân Viên Lễ Tân</option>
                    <option value="admin">Quản Lý Trung Tâm</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="0912 333 444"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Chuyên môn / Bộ môn phụ trách
                </label>
                <input
                  type="text"
                  value={newStaff.specialty}
                  onChange={(e) => setNewStaff({ ...newStaff, specialty: e.target.value })}
                  placeholder="Ví dụ: Tennis Căn Bản & Nâng Cao, USPTA Certified"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Lưu & Cấp Tài Khoản
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
