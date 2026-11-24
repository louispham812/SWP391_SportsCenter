import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import CreateUserModal from '../../components/common/CreateUserModal';
import CoachSportSelector from '../../components/common/CoachSportSelector';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { apiRequest } from '../../services/apiClient';
import {
  deleteManagerUser,
  getManagerDomainSports,
  getStaffPerformance,
  lockManagerUser,
  unlockManagerUser,
  updateManagerCoachSports,
  updateManagerUser,
} from '../../services/managerApi';
import { useApp } from '../../context/AppContext';
import { resolveCoachSportIds } from '../../utils/coachSport';

const PAGE_SIZE = 12;
const ROLE_LABELS = {
  COACH: 'Coach',
  RECEPTIONIST: 'Lễ tân',
  MANAGER: 'Quản lý',
};

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  INACTIVE: 'bg-slate-100 text-slate-700',
  LOCKED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  PENDING: 'Chờ duyệt',
  INACTIVE: 'Ngừng hoạt động',
  LOCKED: 'Đã khóa',
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

export default function AdminStaffPage() {
  const { showToast } = useApp();
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

  // Tab & Performance State (MGR-11)
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'performance'
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState('');

  // Edit Coach Sports Modal State
  const [sports, setSports] = useState([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [editSportIds, setEditSportIds] = useState([]);
  const [editSportError, setEditSportError] = useState('');
  const [savingCoachSports, setSavingCoachSports] = useState(false);

  // Edit / Lock / Delete Staff State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', role: 'COACH', sportIds: [] });
  const [editStaffError, setEditStaffError] = useState('');
  const [savingStaff, setSavingStaff] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [busyUserId, setBusyUserId] = useState(null);

  const openEditCoachSports = async (coachUser) => {
    setEditingCoach(coachUser);
    setEditSportError('');
    let loadedSports = sports;
    if (loadedSports.length === 0) {
      setSportsLoading(true);
      try {
        loadedSports = await getManagerDomainSports();
        setSports(Array.isArray(loadedSports) ? loadedSports : []);
      } catch (err) {
        loadedSports = [];
        setEditSportError(err.message || 'Không thể tải danh sách bộ môn.');
      } finally {
        setSportsLoading(false);
      }
    }
    setEditSportIds(resolveCoachSportIds(coachUser, loadedSports));
  };

  const handleSaveCoachSports = async (e) => {
    e.preventDefault();
    if (!editingCoach) return;
    if (editSportIds.length === 0) {
      setEditSportError('Vui lòng chọn ít nhất một bộ môn giảng dạy cho Huấn luyện viên.');
      return;
    }
    setSavingCoachSports(true);
    setEditSportError('');
    try {
      await updateManagerCoachSports(editingCoach.userId, {
        sportIds: editSportIds.map(Number),
      });
      showToast(
        'Cập nhật bộ môn thành công',
        `Đã cập nhật bộ môn giảng dạy cho HLV "${editingCoach.fullName}".`,
        'success'
      );
      setEditingCoach(null);
      await loadUsers({ silent: true });
      if (performanceData) loadPerformance();
    } catch (err) {
      setEditSportError(err.message || 'Không thể cập nhật bộ môn của Huấn luyện viên.');
    } finally {
      setSavingCoachSports(false);
    }
  };

  const loadPerformance = useCallback(async () => {
    setPerformanceLoading(true);
    setPerformanceError('');
    try {
      const data = await getStaffPerformance();
      setPerformanceData(data);
    } catch (err) {
      setPerformanceError(err.message || 'Không thể tải báo cáo hiệu suất & hoa hồng.');
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'performance') {
      loadPerformance();
    }
  }, [activeTab, loadPerformance]);

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const params = new URLSearchParams({
        query,
        staffOnly: 'true',
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (role) params.set('role', role);
      const data = await apiRequest(`/manager/users?${params}`);
      setUsersPage(data);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách nhân sự.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [page, query, role]);

  const openEditStaff = async (user) => {
    const normalizedRole = user.role?.toUpperCase() === 'ADMIN' ? 'MANAGER' : user.role?.toUpperCase() || 'COACH';
    let loadedSports = sports;
    if (loadedSports.length === 0) {
      setSportsLoading(true);
      try {
        loadedSports = await getManagerDomainSports();
        setSports(Array.isArray(loadedSports) ? loadedSports : []);
      } catch {
        loadedSports = [];
      } finally {
        setSportsLoading(false);
      }
    }
    setEditingStaff(user);
    setEditForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: normalizedRole,
      sportIds: normalizedRole === 'COACH' ? resolveCoachSportIds(user, loadedSports) : [],
    });
    setEditStaffError('');
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editForm.fullName.trim()) {
      setEditStaffError('Họ tên không được để trống.');
      return;
    }
    if (editForm.role === 'COACH' && (!editForm.sportIds || editForm.sportIds.length === 0)) {
      setEditStaffError('Vui lòng chọn ít nhất một bộ môn giảng dạy cho Huấn luyện viên.');
      return;
    }
    setSavingStaff(true);
    setEditStaffError('');
    try {
      await updateManagerUser(editingStaff.userId, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        sportIds: editForm.role === 'COACH' ? editForm.sportIds.map(Number) : [],
      });
      showToast('Thành công', `Đã cập nhật thông tin cho ${editForm.fullName.trim()}.`, 'success');
      setEditingStaff(null);
      await loadUsers({ silent: true });
    } catch (err) {
      setEditStaffError(err.message || 'Không thể cập nhật thông tin nhân sự.');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleToggleLock = async (user) => {
    const isLocked = user.status?.toUpperCase() === 'LOCKED';
    setBusyUserId(user.userId);
    try {
      if (isLocked) {
        await unlockManagerUser(user.userId);
        showToast('Đã mở khóa', `Tài khoản ${user.fullName} đã được kích hoạt lại.`, 'success');
      } else {
        await lockManagerUser(user.userId);
        showToast('Đã khóa tài khoản', `Tài khoản ${user.fullName} đã bị khóa.`, 'success');
      }
      await loadUsers({ silent: true });
    } catch (err) {
      showToast('Thao tác thất bại', err.message || 'Không thể thay đổi trạng thái tài khoản.', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setBusyUserId(deletingStaff.userId);
    try {
      const res = await deleteManagerUser(deletingStaff.userId);
      showToast('Đã xóa nhân sự', res?.message || `Đã xóa tài khoản ${deletingStaff.fullName}.`, 'success');
      setDeletingStaff(null);
      await loadUsers({ silent: true });
    } catch (err) {
      showToast('Không thể xóa', err.message || 'Không thể xóa tài khoản nhân sự.', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  useEffect(() => {
    loadUsers();
    const handleWindowFocus = () => loadUsers({ silent: true });
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

  const staffRows = usersPage.content || [];
  const hasCoachRow = staffRows.some((u) => u.role?.toUpperCase() === 'COACH');
  const hasManageableRow = staffRows.some(
    (u) => !['MANAGER', 'ADMIN'].includes(u.role?.toUpperCase()),
  );
  const actionGridCols = [
    hasCoachRow ? '4.5rem' : null,
    '3.625rem',
    hasManageableRow ? '5.25rem 3.625rem' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · NHÂN SỰ &amp; NGƯỜI DÙNG
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quản lý nhân sự</h1>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách nhân sự được tải trực tiếp từ cơ sở dữ liệu F Sport.
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
              onClick={() => loadUsers()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Làm mới
            </button>
          </div>
        </header>

        {/* Navigation Tabs (MGR-11) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Danh Sách Nhân Sự ({usersPage.totalElements})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
            <span>Báo Cáo Hiệu Suất &amp; Hoa Hồng</span>
          </button>
        </div>

        {activeTab === 'users' && (
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
            <div className="p-4">
              <TableSkeleton rows={6} cols={6} />
            </div>
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
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    <tr>
                      <th className="pl-4 pr-2 py-3 font-semibold">Tài khoản</th>
                      <th className="px-2 py-3 font-semibold">Vai trò &amp; Bộ môn</th>
                      <th className="px-2 py-3 font-semibold">Số điện thoại</th>
                      <th className="px-2 py-3 font-semibold">Trạng thái</th>
                      <th className="px-2 py-3 font-semibold">Ngày tạo</th>
                      <th className="pl-2 pr-4 py-3 font-semibold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersPage.content.map((user) => {
                      const normalizedRole = user.role?.toUpperCase();
                      const normalizedStatus = user.status?.toUpperCase();
                      const isCoach = normalizedRole === 'COACH';
                      const isManageable = !['MANAGER', 'ADMIN'].includes(normalizedRole);
                      const isLocked = normalizedStatus === 'LOCKED';
                      const canToggleLock = ['ACTIVE', 'LOCKED'].includes(normalizedStatus);
                      const isBusy = busyUserId === user.userId;
                      return (
                      <tr key={user.userId} className="hover:bg-slate-50/70">
                        <td className="pl-4 pr-2 py-4">
                          <p className="font-semibold text-slate-900">{user.fullName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
                          <p className="mt-0.5 text-xs text-slate-400">Mã tài khoản: {user.userId}</p>
                        </td>
                        <td className="px-2 py-4 text-slate-700">
                          <span className="font-medium block whitespace-nowrap">
                            {ROLE_LABELS[normalizedRole === 'ADMIN' ? 'MANAGER' : normalizedRole] || user.role}
                          </span>
                          {isCoach && (
                            <span className={`mt-1 inline-block max-w-[155px] rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              user.specialty
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {user.specialty || 'Chưa gán bộ môn'}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-4 text-xs text-slate-600 whitespace-nowrap tabular-nums">{user.phone || '—'}</td>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            STATUS_STYLES[normalizedStatus] || 'bg-slate-100 text-slate-700'
                          }`}>
                            {STATUS_LABELS[normalizedStatus] || user.status || 'Không rõ'}
                          </span>
                        </td>
                        <td className="px-2 py-4 text-xs text-slate-600 max-w-[92px] tabular-nums">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="pl-2 pr-4 py-4 text-right whitespace-nowrap">
                          <div
                            className="inline-grid items-center gap-1"
                            style={{ gridTemplateColumns: actionGridCols }}
                          >
                            {hasCoachRow && (
                              isCoach ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => openEditCoachSports(user)}
                                  title="Gán bộ môn"
                                  className={`${ACTION_BTN_BASE} border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100`}
                                >
                                  <span className="material-symbols-outlined text-[15px] leading-none">sports</span>
                                  Bộ môn
                                </button>
                              ) : (
                                <span aria-hidden="true" />
                              )
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openEditStaff(user)}
                              title="Sửa thông tin"
                              className={`${ACTION_BTN_BASE} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                            >
                              <span className="material-symbols-outlined text-[15px] leading-none">edit</span>
                              Sửa
                            </button>
                            {hasManageableRow && (
                              isManageable ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy || !canToggleLock}
                                    onClick={() => handleToggleLock(user)}
                                    title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                    className={`${ACTION_BTN_BASE} ${
                                      isLocked
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                        : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[15px] leading-none">
                                      {isBusy ? 'hourglass_top' : isLocked ? 'lock_open' : 'lock'}
                                    </span>
                                    {isLocked ? 'Mở khóa' : 'Khóa'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => setDeletingStaff(user)}
                                    title="Xóa tài khoản"
                                    className={`${ACTION_BTN_BASE} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                                  >
                                    <span className="material-symbols-outlined text-[15px] leading-none">delete</span>
                                    Xóa
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span aria-hidden="true" />
                                  <span aria-hidden="true" />
                                </>
                              )
                            )}
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
                  {usersPage.totalElements} tài khoản
                </span>
                {usersPage.totalPages > 1 && (
                  <Pagination
                    currentPage={page + 1}
                    totalPages={usersPage.totalPages}
                    onPageChange={(p) => setPage(p - 1)}
                  />
                )}
              </footer>
            </>
          )}
        </section>
        )}

        {/* Tab 2: Hiệu suất & Hoa hồng Nhân sự (MGR-11) */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {performanceError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
                {performanceError}
              </div>
            )}

            {/* Metric KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>HLV Đang Giảng Dạy</span>
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">sports</span>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                  {performanceLoading ? '...' : `${performanceData?.coaches?.length || 0} HLV`}
                </div>
                <div className="mt-1 text-xs text-slate-500">Chính sách hoa hồng 40%</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Tổng Hoa Hồng HLV (40%)</span>
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">payments</span>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
                  {performanceLoading
                    ? '...'
                    : `${(
                        performanceData?.coaches?.reduce((sum, c) => sum + Number(c.commissionAmount ?? c.totalCommission ?? 0), 0) || 0
                      ).toLocaleString()}₫`}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>Tự động đối soát ca dạy</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Lượt Check-in Cổng Lễ Tân</span>
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">door_front</span>
                </div>
                <div className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
                  {performanceLoading
                    ? '...'
                    : `${
                        performanceData?.receptionists?.reduce((sum, r) => sum + Number(r.checkInsCount ?? r.checkInCount ?? 0), 0) || 0
                      } lượt`}
                </div>
                <div className="mt-1 text-xs text-slate-500">Quét thẻ Turnstile &amp; quầy</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                  <span>Doanh Số Gói Lễ Tân Bán</span>
                  <span className="material-symbols-outlined text-purple-500 text-[20px]">point_of_sale</span>
                </div>
                <div className="mt-2 text-2xl font-black text-purple-600 tracking-tight">
                  {performanceLoading
                    ? '...'
                    : `${(
                        performanceData?.receptionists?.reduce((sum, r) => sum + Number(r.totalSalesAmount ?? r.packageSalesRevenue ?? 0), 0) || 0
                      ).toLocaleString()}₫`}
                </div>
                <div className="mt-1 text-xs text-slate-500">Bán gói &amp; thanh toán POS</div>
              </div>
            </div>

            {/* Table 1: Coach Performance */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <h2 className="text-base font-bold text-slate-900">KPI &amp; Hoa Hồng Huấn Luyện Viên</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hiệu suất lớp học, số học viên đào tạo, điểm rating và mức hoa hồng 40% phải thanh toán cho Coach
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadPerformance}
                  disabled={performanceLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Cập nhật số liệu</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                {performanceLoading ? (
                  <div className="p-4">
                    <TableSkeleton rows={4} cols={7} />
                  </div>
                ) : !performanceData?.coaches || performanceData.coaches.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">Chưa có dữ liệu HLV nào trong hệ thống.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Huấn Luyện Viên</th>
                        <th className="px-5 py-3.5">Chuyên môn &amp; Thâm niên</th>
                        <th className="px-5 py-3.5 text-center">Số Ca Dạy</th>
                        <th className="px-5 py-3.5 text-center">Tổng Học Viên</th>
                        <th className="px-5 py-3.5 text-center">Đánh Giá TB</th>
                        <th className="px-5 py-3.5 text-right">Doanh Thu Lớp</th>
                        <th className="px-5 py-3.5 text-right">Hoa Hồng HLV (40%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {performanceData.coaches.map((c) => (
                        <tr key={c.userId ?? c.coachId} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900 block">{c.fullName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: #{c.userId ?? c.coachId}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-slate-800 block">{c.specialty || 'Đa môn thể thao'}</span>
                            <span className="text-[11px] text-slate-500">{c.experienceYears || 0} năm kinh nghiệm</span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                            {c.sessionsCount ?? c.totalSessions ?? 0} ca
                          </td>
                          <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                            {c.studentsCount ?? c.totalStudents ?? 0} người
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {c.averageRating > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                {Number(c.averageRating).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa có</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                            {Number(c.totalRevenue || 0).toLocaleString()}₫
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-orange-600 text-sm">
                            {Number(c.commissionAmount ?? c.totalCommission ?? 0).toLocaleString()}₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Table 2: Receptionist Performance */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h2 className="text-base font-bold text-slate-900">KPI Hiệu Suất Nhân Viên Lễ Tân &amp; Bán Hàng</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thống kê số lượt kiểm soát check-in, số giao dịch POS và doanh số bán gói thành viên trực tiếp
                </p>
              </div>

              <div className="overflow-x-auto">
                {performanceLoading ? (
                  <div className="p-4">
                    <TableSkeleton rows={4} cols={5} />
                  </div>
                ) : !performanceData?.receptionists || performanceData.receptionists.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">Chưa có nhân viên lễ tân nào được ghi nhận.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Nhân Viên Lễ Tân</th>
                        <th className="px-5 py-3.5 text-center">Lượt Check-in Cổng</th>
                        <th className="px-5 py-3.5 text-center">Giao Dịch Quầy POS</th>
                        <th className="px-5 py-3.5 text-right">Doanh Số Bán Gói Hội Viên</th>
                        <th className="px-5 py-3.5 text-center">Đánh Giá Hiệu Suất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {performanceData.receptionists.map((r) => (
                        <tr key={r.userId ?? r.staffId} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <span>{r.fullName}</span>
                            <span className="text-[11px] text-slate-400 font-mono block font-normal">ID: #{r.userId ?? r.staffId}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-blue-700">
                            {r.checkInsCount ?? r.checkInCount ?? 0} lượt
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-purple-700">
                            {r.posTransactionsCount || 0} đơn
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-600 text-sm">
                            {Number(r.totalSalesAmount ?? r.packageSalesRevenue ?? 0).toLocaleString()}₫
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              TỐT (ĐẠT CHỈ TIÊU)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => loadUsers({ silent: true })}
        staffOnly
      />

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs !m-0">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Sửa thông tin nhân sự</h2>
                <p className="text-xs text-slate-500">{editingStaff.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {editStaffError && (
                <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
                  {editStaffError}
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vai trò</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({
                    ...f,
                    role: e.target.value,
                    sportIds: e.target.value === 'COACH' ? f.sportIds : [],
                  }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500"
                >
                  <option value="COACH">Huấn luyện viên (COACH)</option>
                  <option value="RECEPTIONIST">Nhân viên lễ tân (RECEPTIONIST)</option>
                  <option value="MANAGER">Quản lý hệ thống (MANAGER)</option>
                </select>
              </div>
              {editForm.role === 'COACH' && (
                <CoachSportSelector
                  sports={sports}
                  selectedIds={editForm.sportIds}
                  onChange={(ids) => setEditForm((f) => ({ ...f, sportIds: ids }))}
                  loading={sportsLoading}
                />
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  disabled={savingStaff}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingStaff ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs !m-0">
          <div className="relative w-full max-w-sm overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Xác nhận xóa nhân sự</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bạn có chắc muốn xóa tài khoản <strong>{deletingStaff.fullName}</strong> ({deletingStaff.email})?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                disabled={busyUserId === deletingStaff.userId}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={busyUserId === deletingStaff.userId}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {busyUserId === deletingStaff.userId ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs !m-0">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Gán bộ môn cho HLV</h2>
                <p className="text-xs text-slate-500">
                  {editingCoach.fullName} ({editingCoach.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoach(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCoachSports} className="p-6 space-y-4">
              {editSportError && (
                <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
                  {editSportError}
                </div>
              )}

              <CoachSportSelector
                sports={sports}
                selectedIds={editSportIds}
                onChange={setEditSportIds}
                loading={sportsLoading}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCoach(null)}
                  disabled={savingCoachSports}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingCoachSports || sportsLoading}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingCoachSports ? 'Đang lưu...' : 'Lưu bộ môn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
