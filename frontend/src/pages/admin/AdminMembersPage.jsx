import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import CreateUserModal from '../../components/common/CreateUserModal';
import {
  getManagerMembers,
  lockManagerMember,
  unlockManagerMember,
} from '../../services/managerApi';

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

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function AdminMembersPage() {
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

  const loadMembers = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [filterStatus, page, query]);

  useEffect(() => {
    loadMembers();
    const handleFocus = () => loadMembers();
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
      await loadMembers();
    } catch (requestError) {
      setError(requestError.message || 'Không thể thay đổi trạng thái hội viên.');
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
              onClick={loadMembers}
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
            <p className="px-5 py-12 text-center text-sm text-slate-500">Đang tải hội viên từ database...</p>
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
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Mã HV</th>
                      <th className="px-5 py-3">Họ và tên</th>
                      <th className="px-5 py-3">Liên hệ</th>
                      <th className="px-5 py-3">Ngày tạo tài khoản</th>
                      <th className="px-5 py-3">Trạng thái tài khoản</th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membersPage.content.map((member) => {
                      const status = member.status?.toUpperCase();
                      const canToggle = status === 'ACTIVE' || status === 'LOCKED';
                      const isProcessing = processingId === member.userId;
                      return (
                        <tr key={member.userId} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-mono font-bold text-slate-800">#{member.userId}</td>
                          <td className="px-5 py-4 font-bold text-slate-900">{member.fullName}</td>
                          <td className="px-5 py-4">
                            <div className="text-slate-800">{member.phone || '—'}</div>
                            <div className="mt-0.5 text-xs text-slate-400">{member.email}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{formatDate(member.createdAt)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                              STATUS_STYLES[status] || STATUS_STYLES.INACTIVE
                            }`}>
                              {STATUS_LABELS[status] || member.status || 'Không rõ'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleMemberStatus(member)}
                              disabled={!canToggle || isProcessing}
                              className={`rounded-lg border p-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                status === 'ACTIVE'
                                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              }`}
                              title={status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              aria-label={status === 'ACTIVE' ? `Khóa ${member.fullName}` : `Mở khóa ${member.fullName}`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isProcessing ? 'hourglass_top' : status === 'ACTIVE' ? 'lock' : 'lock_open'}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-500">
                  {membersPage.totalElements} hội viên trong database
                </span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0 || loading}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="px-2 text-sm text-slate-600">
                    {membersPage.totalPages === 0 ? 0 : page + 1} / {membersPage.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={page + 1 >= membersPage.totalPages || loading}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </main>
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadMembers}
      />
    </AdminLayout>
  );
}
