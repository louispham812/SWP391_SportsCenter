import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import CreateUserModal from '../../components/common/CreateUserModal';
import { apiRequest } from '../../services/apiClient';

const PAGE_SIZE = 12;
const ROLE_LABELS = {
  MANAGER: 'Quản lý',
  ADMIN: 'Quản trị viên',
  COACH: 'Coach',
  RECEPTIONIST: 'Lễ tân',
  MEMBER: 'Hội viên',
};

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  INACTIVE: 'bg-slate-100 text-slate-700',
  LOCKED: 'bg-red-100 text-red-800',
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function AdminStaffPage() {
  const [usersPage, setUsersPage] = useState({
    content: [],
    number: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (role) params.set('role', role);
      const data = await apiRequest(`/manager/users?${params}`);
      setUsersPage(data);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  }, [page, query, role]);

  useEffect(() => {
    loadUsers();
    const handleWindowFocus = () => loadUsers();
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [loadUsers]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setQuery(searchInput.trim());
  };

  const changeRole = (event) => {
    setPage(0);
    setRole(event.target.value);
  };

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · NHÂN SỰ &amp; NGƯỜI DÙNG
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Nhân sự &amp; Khách</h1>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách nhân viên và hội viên được tải trực tiếp từ cơ sở dữ liệu F Sport.
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
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Làm mới
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">Tìm theo tên, email, số điện thoại hoặc mã</span>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                search
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm tên, email, số điện thoại hoặc mã..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <select
              value={role}
              onChange={changeRole}
              aria-label="Lọc theo vai trò"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-500"
            >
              <option value="">Tất cả vai trò</option>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
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
            <p className="px-5 py-12 text-center text-sm text-slate-500">Đang tải dữ liệu từ database...</p>
          ) : usersPage.content.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
              <p className="mt-2 font-semibold text-slate-800">Không tìm thấy tài khoản</p>
              <p className="mt-1 text-sm text-slate-500">Thử thay đổi nội dung tìm kiếm hoặc bộ lọc vai trò.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tài khoản</th>
                      <th className="px-5 py-3 font-semibold">Vai trò</th>
                      <th className="px-5 py-3 font-semibold">Số điện thoại</th>
                      <th className="px-5 py-3 font-semibold">Trạng thái</th>
                      <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersPage.content.map((user) => (
                      <tr key={user.userId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{user.fullName}</p>
                          <p className="mt-0.5 text-slate-500">{user.email}</p>
                          <p className="mt-0.5 text-xs text-slate-400">Mã tài khoản: {user.userId}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {ROLE_LABELS[user.role?.toUpperCase()] || user.role}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{user.phone || '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            STATUS_STYLES[user.status?.toUpperCase()] || 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.status || 'Không rõ'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-500">
                  {usersPage.totalElements} tài khoản trong database
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
                    {usersPage.totalPages === 0 ? 0 : page + 1} / {usersPage.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={page + 1 >= usersPage.totalPages || loading}
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
        onSuccess={loadUsers}
      />
    </AdminLayout>
  );
}
