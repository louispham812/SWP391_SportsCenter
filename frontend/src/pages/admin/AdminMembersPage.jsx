import React, { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminMembersPage() {
  const { members, addMember, toggleMemberStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'Silver',
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.phone) return;

    addMember(newMemberForm);
    setShowAddModal(false);
    setNewMemberForm({ name: '', phone: '', email: '', tier: 'Silver' });
  };

  const filtered = members.filter((m) => {
    if (filterTier !== 'all' && m.tier !== filterTier) return false;
    if (
      searchTerm &&
      !m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !m.phone.includes(searchTerm) &&
      !m.memberId.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 1: USER & MEMBERSHIP MANAGEMENT
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Quản Lý Danh Sách Hội Viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Theo dõi tình trạng gói tập, thời hạn sử dụng và phân quyền tài khoản hội viên.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-md self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Thêm Hội Viên Mới</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo Tên, SĐT hoặc Mã #ELT..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white outline-none w-full sm:w-auto"
            >
              <option value="all">Tất cả hạng thẻ</option>
              <option value="Silver">Hạng Bạc (Silver)</option>
              <option value="Gold">Hạng Vàng (Gold)</option>
              <option value="Diamond">Hạng Kim Cương (Diamond)</option>
            </select>
          </div>
        </div>

        {/* Members Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Mã HV</th>
                  <th className="p-4">Họ và Tên</th>
                  <th className="p-4">Liên Hệ</th>
                  <th className="p-4">Hạng Thẻ</th>
                  <th className="p-4">Ngày Hết Hạn</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-800">#{m.memberId}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400">Tham gia: {m.joined}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{m.phone}</div>
                      <div className="text-[11px] text-slate-400">{m.email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          m.tier === 'Diamond'
                            ? 'bg-primary text-secondary-container'
                            : m.tier === 'Gold'
                            ? 'bg-secondary-container text-primary'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.tier}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{m.expires}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : m.status === 'expired'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            m.status === 'active'
                              ? 'bg-emerald-600'
                              : m.status === 'expired'
                              ? 'bg-red-600'
                              : 'bg-slate-400'
                          }`}
                        ></span>
                        {m.status === 'active'
                          ? 'Đang hoạt động'
                          : m.status === 'expired'
                          ? 'Hết hạn'
                          : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleMemberStatus(m.id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                          m.status === 'active'
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                        title={m.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {m.status === 'active' ? 'lock' : 'lock_open'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Thêm Hội Viên */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Thêm Hội Viên Mới Tại Quầy
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  required
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  placeholder="0987 654 321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Hạng thẻ thành viên
                </label>
                <select
                  value={newMemberForm.tier}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, tier: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none"
                >
                  <option value="Silver">Silver (Hạng Bạc)</option>
                  <option value="Gold">Gold (Hạng Vàng)</option>
                  <option value="Diamond">Diamond (Hạng Kim Cương)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Xác Nhận Tạo Thẻ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
