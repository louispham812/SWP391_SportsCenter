import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import CreateUserModal from '../../components/common/CreateUserModal';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import {
  deleteManagerUser,
  getManagerMembers,
  lockManagerMember,
  unlockManagerMember,
  updateManagerUser,
} from '../../services/managerApi';
import { useApp } from '../../context/AppContext';

const PAGE_SIZE = 12;
const STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  PENDING: 'Chờ duyệt',
  LOCKED: 'Đã khóa',
  INACTIVE: 'Ngừng hoạt động',
};

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  LOCKED: 'bg-red-50 text-red-800 border-red-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ACTION_BTN_BASE =
  'inline-flex h-8 w-full shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-1.5 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function AdminMembersPage() {
  const { showToast } = useApp();
  const [membersPage, setMembersPage] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);

  const loadMembers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const data = await getManagerMembers({
        query,
        status: filterStatus,
        page,
        size: PAGE_SIZE,
      });
      setMembersPage(data);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách hội viên.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filterStatus, page, query]);

  useEffect(() => {
    loadMembers();
    const handleFocus = () => loadMembers({ silent: true });
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadMembers]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setQuery(searchInput.trim());
  };

  const changeStatusFilter = (event) => {
    setPage(0);
    setFilterStatus(event.target.value);
  };

  const toggleMemberStatus = async (member) => {
    setProcessingId(member.userId);
    setError('');
    try {
      if (member.status?.toUpperCase() === 'ACTIVE') {
        await lockManagerMember(member.userId);
      } else if (member.status?.toUpperCase() === 'LOCKED') {
        await unlockManagerMember(member.userId);
      } else {
        return;
      }
      await loadMembers({ silent: true });
    } catch (requestError) {
      setError(requestError.message || 'Không thể thay đổi trạng thái hội viên.');
    } finally {
      setProcessingId(null);
    }
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setEditForm({ fullName: member.fullName || '', phone: member.phone || '' });
    setEditError('');
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editForm.fullName.trim()) {
      setEditError('Họ tên không được để trống.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      await updateManagerUser(editingMember.userId, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        role: 'MEMBER',
      });
      showToast('Thành công', `Đã cập nhật thông tin hội viên ${editForm.fullName.trim()}.`, 'success');
      setEditingMember(null);
      await loadMembers({ silent: true });
    } catch (err) {
      setEditError(err.message || 'Không thể cập nhật thông tin hội viên.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setProcessingId(deletingMember.userId);
    try {
      const res = await deleteManagerUser(deletingMember.userId);
      showToast('Đã xóa hội viên', res?.message || `Đã xóa tài khoản ${deletingMember.fullName}.`, 'success');
      setDeletingMember(null);
      await loadMembers({ silent: true });
    } catch (err) {
      showToast('Không thể xóa', err.message || 'Không thể xóa tài khoản hội viên.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · QUẢN LÝ HỘI VIÊN
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quản lý danh sách hội viên</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tra cứu hồ sơ thành viên, thông tin gói thẻ và trạng thái kích hoạt tài khoản.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Thêm người dùng mới
            </button>
            <button
              type="button"
              onClick={() => loadMembers()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Làm mới
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">Tìm theo tên, email, số điện thoại hoặc mã hội viên</span>
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                search
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại hoặc mã..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <select
              value={filterStatus}
              onChange={changeStatusFilter}
              aria-label="Lọc theo trạng thái tài khoản"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-orange-500"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              Tìm kiếm
            </button>
          </form>

          {error && (
            <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : membersPage.content.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
              <p className="mt-2 font-semibold text-slate-800">Không tìm thấy hội viên</p>
              <p className="mt-1 text-sm text-slate-500">Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    <tr>
                      <th className="pl-4 pr-2 py-3">Mã HV</th>
                      <th className="px-2 py-3">Họ và tên</th>
                      <th className="px-2 py-3">Liên hệ</th>
                      <th className="px-2 py-3">Ngày tạo tài khoản</th>
                      <th className="px-2 py-3">Trạng thái tài khoản</th>
                      <th className="pl-2 pr-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membersPage.content.map((member) => {
                      const status = member.status?.toUpperCase();
                      const canToggle = status === 'ACTIVE' || status === 'LOCKED';
                      const isProcessing = processingId === member.userId;
                      return (
                        <tr key={member.userId} className="transition-colors hover:bg-slate-50/70">
                          <td className="pl-4 pr-2 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">#{member.userId}</td>
                          <td className="px-2 py-4 font-bold text-slate-900 whitespace-nowrap">{member.fullName}</td>
                          <td className="px-2 py-4">
                            <div className="text-slate-800 whitespace-nowrap">{member.phone || '—'}</div>
                            <div className="mt-0.5 text-xs text-slate-400">{member.email}</div>
                          </td>
                          <td className="px-2 py-4 text-slate-600 whitespace-nowrap">{formatDate(member.createdAt)}</td>
                          <td className="px-2 py-4 whitespace-nowrap">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase whitespace-nowrap ${
                              STATUS_STYLES[status] || STATUS_STYLES.INACTIVE
                            }`}>
                              {STATUS_LABELS[status] || member.status || 'Không rõ'}
                            </span>
                          </td>
                          <td className="pl-2 pr-4 py-4 text-center">
                            <div className="inline-grid grid-cols-[3.625rem_5.25rem_3.625rem] items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditMember(member)}
                                disabled={isProcessing}
                                className={`${ACTION_BTN_BASE} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                                title="Sửa thông tin"
                              >
                                <span className="material-symbols-outlined text-[15px] leading-none">edit</span>
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleMemberStatus(member)}
                                disabled={!canToggle || isProcessing}
                                className={`${ACTION_BTN_BASE} ${
                                  status === 'ACTIVE'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                                title={status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                aria-label={status === 'ACTIVE' ? `Khóa ${member.fullName}` : `Mở khóa ${member.fullName}`}
                              >
                                <span className="material-symbols-outlined text-[15px] leading-none">
                                  {isProcessing ? 'hourglass_top' : status === 'ACTIVE' ? 'lock' : 'lock_open'}
                                </span>
                                {status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingMember(member)}
                                disabled={isProcessing || status === 'INACTIVE'}
                                className={`${ACTION_BTN_BASE} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                                title="Xóa tài khoản"
                              >
                                <span className="material-symbols-outlined text-[15px] leading-none">delete</span>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-500 font-medium">
                  {membersPage.totalElements} hội viên
                </span>
                {membersPage.totalPages > 1 && (
                  <Pagination
                    currentPage={page + 1}
                    totalPages={membersPage.totalPages}
                    onPageChange={(p) => setPage(p - 1)}
                  />
                )}
              </footer>
            </>
          )}
        </section>
      </main>
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => loadMembers({ silent: true })}
        memberOnly
      />

      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs !m-0">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Sửa thông tin hội viên</h2>
                <p className="text-xs text-slate-500">{editingMember.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              {editError && (
                <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
                  {editError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs !m-0">
          <div className="relative w-full max-w-sm overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Xác nhận xóa hội viên</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bạn có chắc muốn xóa tài khoản <strong>{deletingMember.fullName}</strong> ({deletingMember.email})?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={processingId === deletingMember.userId}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={processingId === deletingMember.userId}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {processingId === deletingMember.userId ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
