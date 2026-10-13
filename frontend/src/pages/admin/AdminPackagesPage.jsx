import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  createManagerPackage,
  getManagerPackages,
  getManagerSports,
  updateManagerPackage,
  updateManagerPackageStatus,
} from '../../services/managerApi';

const EMPTY_FORM = {
  name: '',
  sportId: '',
  price: '',
  durationDays: '30',
  accessType: 'ALL_DAY',
  description: '',
  status: 'ACTIVE',
};

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value);

const formatDuration = (days) => {
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} tháng`;
  }
  return `${days} ngày`;
};

const ACCESS_LABELS = {
  ALL_DAY: 'Cả ngày',
  PEAK: 'Giờ cao điểm',
  OFF_PEAK: 'Giờ thấp điểm',
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [sports, setSports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [packageData, sportData] = await Promise.all([
        getManagerPackages(),
        getManagerSports(),
      ]);
      setPackages(packageData);
      setSports(sportData);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu gói tập từ database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const filteredPackages = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    return packages.filter((membershipPackage) => {
      const matchesStatus = !statusFilter
        || membershipPackage.status?.toUpperCase() === statusFilter;
      const matchesSearch = !normalizedSearch
        || membershipPackage.name.toLocaleLowerCase('vi').includes(normalizedSearch)
        || String(membershipPackage.packageId).includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [packages, search, statusFilter]);

  const openCreateForm = () => {
    setEditingPackage(null);
    setForm(EMPTY_FORM);
    setError('');
    setIsDrawerOpen(true);
  };

  const openEditForm = (membershipPackage) => {
    setEditingPackage(membershipPackage);
    setForm({
      name: membershipPackage.name || '',
      sportId: membershipPackage.sportId ? String(membershipPackage.sportId) : '',
      price: String(membershipPackage.price ?? ''),
      durationDays: String(membershipPackage.durationDays ?? 30),
      accessType: membershipPackage.accessType || 'ALL_DAY',
      description: membershipPackage.description || '',
      status: membershipPackage.status || 'ACTIVE',
    });
    setError('');
    setIsDrawerOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      sportId: form.sportId ? Number(form.sportId) : null,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      accessType: form.accessType,
      description: form.description.trim() || null,
      status: form.status,
    };

    try {
      if (editingPackage) {
        await updateManagerPackage(editingPackage.packageId, payload);
      } else {
        await createManagerPackage(payload);
      }
      setIsDrawerOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu gói tập.');
    } finally {
      setSaving(false);
    }
  };

  const togglePackageStatus = async (membershipPackage) => {
    setProcessingId(membershipPackage.packageId);
    setError('');
    const nextStatus = membershipPackage.status?.toUpperCase() === 'ACTIVE'
      ? 'INACTIVE'
      : 'ACTIVE';
    try {
      await updateManagerPackageStatus(membershipPackage.packageId, nextStatus);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'Không thể thay đổi trạng thái gói tập.');
    } finally {
      setProcessingId(null);
    }
  };

  const sportName = (sportId) => {
    if (!sportId) return 'Tất cả bộ môn';
    return sports.find((sport) => sport.sportId === sportId)?.name || `Bộ môn #${sportId}`;
  };

  const activeCount = packages.filter((item) => item.status?.toUpperCase() === 'ACTIVE').length;

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
              QUẢN LÝ SẢN PHẨM HỘI VIÊN
            </p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Gói tập & Dịch vụ</h1>
            <p className="mt-1 text-sm text-slate-500">
              Danh mục, giá và trạng thái được đồng bộ trực tiếp với database.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Làm mới
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c3f400] px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-[#abd600]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Thêm gói mới
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tổng số gói</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{packages.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Đang mở bán</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tạm ngưng</p>
            <p className="mt-2 text-2xl font-bold text-slate-700">{packages.length - activeCount}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Tìm gói theo tên hoặc mã</span>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc mã gói..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-500"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Lọc theo trạng thái gói"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang mở bán</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>

          {error && (
            <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">Đang tải gói tập từ database...</p>
          ) : filteredPackages.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
              <p className="mt-2 font-semibold text-slate-800">Chưa có gói tập phù hợp</p>
              <p className="mt-1 text-sm text-slate-500">Thay đổi bộ lọc hoặc tạo gói tập mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tên gói</th>
                    <th className="px-5 py-3">Bộ môn</th>
                    <th className="px-5 py-3">Giá</th>
                    <th className="px-5 py-3">Thời hạn</th>
                    <th className="px-5 py-3">Khung giờ</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPackages.map((membershipPackage) => {
                    const active = membershipPackage.status?.toUpperCase() === 'ACTIVE';
                    const processing = processingId === membershipPackage.packageId;
                    return (
                      <tr key={membershipPackage.packageId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{membershipPackage.name}</p>
                          <p className="mt-0.5 text-xs text-slate-400">Mã gói: {membershipPackage.packageId}</p>
                          {membershipPackage.description && (
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {membershipPackage.description}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">{sportName(membershipPackage.sportId)}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{formatPrice(membershipPackage.price)}</td>
                        <td className="px-5 py-4 text-slate-700">{formatDuration(membershipPackage.durationDays)}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {ACCESS_LABELS[membershipPackage.accessType] || membershipPackage.accessType}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {active ? 'Đang mở bán' : 'Tạm ngưng'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(membershipPackage)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                              title="Chỉnh sửa gói"
                              aria-label={`Chỉnh sửa ${membershipPackage.name}`}
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePackageStatus(membershipPackage)}
                              disabled={processing}
                              className={`rounded-lg border p-2 disabled:opacity-50 ${
                                active
                                  ? 'border-amber-200 text-amber-800 hover:bg-amber-50'
                                  : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title={active ? 'Tạm ngưng bán' : 'Kích hoạt bán'}
                              aria-label={active ? `Tạm ngưng ${membershipPackage.name}` : `Kích hoạt ${membershipPackage.name}`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {processing ? 'hourglass_top' : active ? 'pause' : 'play_arrow'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && (
            <footer className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              Hiển thị {filteredPackages.length} / {packages.length} gói trong database
            </footer>
          )}
        </section>

        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
            <button
              type="button"
              aria-label="Đóng biểu mẫu"
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 cursor-default"
            />
            <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
              <header className="flex items-start justify-between border-b border-slate-100 p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-lime-700">
                    {editingPackage ? 'Cập nhật gói' : 'Tạo gói mới'}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {editingPackage ? editingPackage.name : 'Thông tin gói tập'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>
              <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4 p-6">
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Tên gói tập
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                    Giá (VNĐ)
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={(event) => setForm({ ...form, price: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                    Thời hạn (ngày)
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={form.durationDays}
                      onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                    />
                  </label>
                </div>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Bộ môn
                  <select
                    value={form.sportId}
                    onChange={(event) => setForm({ ...form, sportId: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                  >
                    <option value="">Tất cả bộ môn</option>
                    {sports.map((sport) => (
                      <option key={sport.sportId} value={sport.sportId}>{sport.name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                    Khung giờ
                    <select
                      value={form.accessType}
                      onChange={(event) => setForm({ ...form, accessType: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                    >
                      <option value="ALL_DAY">Cả ngày</option>
                      <option value="PEAK">Giờ cao điểm</option>
                      <option value="OFF_PEAK">Giờ thấp điểm</option>
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                    Trạng thái
                    <select
                      value={form.status}
                      onChange={(event) => setForm({ ...form, status: event.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                    >
                      <option value="ACTIVE">Đang mở bán</option>
                      <option value="INACTIVE">Tạm ngưng</option>
                    </select>
                  </label>
                </div>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Mô tả / quyền lợi
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-slate-600"
                  />
                </label>
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                <div className="mt-auto flex gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-[#00132b] px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu vào database'}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
