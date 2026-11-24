import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  createManagerPackage,
  getManagerPackages,
  getManagerSports,
  updateManagerPackage,
  updateManagerPackageStatus,
} from '../../services/managerApi';
import { apiRequest } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = {
  membershipTier: '',
  name: '',
  sportId: '',
  price: '',
  durationDays: '30',
  accessType: 'ALL_DAY',
  quotaSessions: '0',
  quotaCourts: '0',
  description: '',
  status: 'ACTIVE',
};

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

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
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('packages');

  // Packages state
  const [packages, setPackages] = useState([]);
  const [sports, setSports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Vouchers state (MGR-18)
  const [vouchers, setVouchers] = useState([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: '',
    extendDurationMonths: '1',
    minPurchase: '0',
    maxUses: '100',
    validFrom: '',
    validUntil: '',
    appliesTo: 'ALL',
    active: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [packageData, sportData, voucherData] = await Promise.all([
        getManagerPackages(),
        getManagerSports(),
        apiRequest('/manager/vouchers'),
      ]);
      const pkgList = Array.isArray(packageData) ? packageData : [];
      const sptList = Array.isArray(sportData) ? sportData : [];
      setPackages(pkgList);
      setSports(sptList);

      if (Array.isArray(voucherData)) {
        const mapped = voucherData.map((v) => ({
          voucherId: v.voucherId,
          code: v.code,
          discountType: v.discountType || 'PERCENT',
          discountValue: v.discountValue || v.discountPercent || 0,
          extendDurationMonths: 0,
          minPurchase: v.minPurchase || 0,
          maxUses: v.usageLimit || 100,
          currentUses: v.usedCount || 0,
          validFrom: v.validFrom || '',
          validUntil: v.validUntil || '',
          appliesTo: v.appliesTo || 'ALL',
          active: v.status === 'ACTIVE',
        }));
        setVouchers(mapped);
      }
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách gói tập.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsVoucherModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredPackages = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    return packages.filter((membershipPackage) => {
      const matchesStatus =
        !statusFilter || membershipPackage.status?.toUpperCase() === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        membershipPackage.name.toLocaleLowerCase('vi').includes(normalizedSearch) ||
        String(membershipPackage.packageId).includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [packages, search, statusFilter]);

  const openCreateForm = () => {
    setEditingPackage(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openEditForm = (membershipPackage) => {
    setEditingPackage(membershipPackage);
    setForm({
      membershipTier: membershipPackage.membershipTier || '',
      name: membershipPackage.name || '',
      sportId: membershipPackage.sportId ? String(membershipPackage.sportId) : '',
      price: String(membershipPackage.price ?? ''),
      durationDays: String(membershipPackage.durationDays ?? 30),
      accessType: membershipPackage.accessType || 'ALL_DAY',
      quotaSessions: String(membershipPackage.quotaSessions ?? 0),
      quotaCourts: String(membershipPackage.quotaCourts ?? 0),
      description: membershipPackage.description || '',
      status: membershipPackage.status || 'ACTIVE',
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const trimmedName = form.name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setFormError('Tên hạng hội viên là bắt buộc và tối đa 100 ký tự.');
      setSaving(false);
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Giá niêm yết phải lớn hơn 0.');
      setSaving(false);
      return;
    }
    const durationDays = Number(form.durationDays);
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      setFormError('Thời hạn phải là số nguyên lớn hơn 0 ngày.');
      setSaving(false);
      return;
    }
    const quotaSessions = form.quotaSessions === '' ? 0 : Number(form.quotaSessions);
    const quotaCourts = form.quotaCourts === '' ? 0 : Number(form.quotaCourts);
    if (!Number.isInteger(quotaSessions) || quotaSessions < 0 || !Number.isInteger(quotaCourts) || quotaCourts < 0) {
      setFormError('Số buổi tập và số giờ sân phải là số nguyên không âm.');
      setSaving(false);
      return;
    }

    const normalizedTier = form.membershipTier?.trim() || '';
    const isPresetTier = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'].includes(normalizedTier.toUpperCase());

    const payload = {
      membershipTier: isPresetTier ? normalizedTier.toUpperCase() : trimmedName,
      name: trimmedName,
      sportId: form.sportId ? Number(form.sportId) : null,
      price,
      durationDays,
      accessType: form.accessType,
      quotaSessions,
      quotaCourts,
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
      showToast('Thành công', 'Đã lưu cấu hình gói thành viên (Ghi Audit Log).', 'success');
    } catch (requestError) {
      setFormError(requestError.message || 'Không thể lưu gói tập.');
    } finally {
      setSaving(false);
    }
  };

  const togglePackageStatus = async (membershipPackage) => {
    setProcessingId(membershipPackage.packageId);
    setError('');
    const nextStatus =
      membershipPackage.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateManagerPackageStatus(membershipPackage.packageId, nextStatus);
      await loadData();
      showToast('Cập nhật trạng thái', `Gói "${membershipPackage.name}" đã chuyển sang ${nextStatus}.`, 'info');
    } catch (requestError) {
      setError(requestError.message || 'Không thể thay đổi trạng thái gói tập.');
    } finally {
      setProcessingId(null);
    }
  };

  // Voucher Handlers (MGR-18)
  const openCreateVoucher = () => {
    setEditingVoucher(null);
    setVoucherForm({
      code: '',
      discountType: 'PERCENT',
      discountValue: '',
      extendDurationMonths: '1',
      minPurchase: '0',
      maxUses: '100',
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: '2026-12-31',
      appliesTo: 'ALL',
      active: true,
    });
    setIsVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!voucherForm.code.trim()) {
      showToast('Lỗi', 'Vui lòng nhập mã voucher.', 'warning');
      return;
    }

    const payload = {
      code: voucherForm.code.trim().toUpperCase(),
      discountType: voucherForm.discountType,
      discountValue: Number(voucherForm.discountValue) || 0,
      minPurchase: Number(voucherForm.minPurchase) || 0,
      usageLimit: Number(voucherForm.maxUses) || 100,
      validFrom: voucherForm.validFrom || new Date().toISOString().slice(0, 10),
      validUntil: voucherForm.validUntil || '2026-12-31',
      appliesTo: voucherForm.appliesTo,
      status: voucherForm.active ? 'ACTIVE' : 'INACTIVE',
    };

    try {
      if (editingVoucher && typeof editingVoucher.voucherId === 'number') {
        await apiRequest(`/manager/vouchers/${editingVoucher.voucherId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/manager/vouchers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      showToast('Lưu voucher thành công', `Mã ${payload.code} đã được lưu vào hệ thống.`, 'success');
      setIsVoucherModalOpen(false);
      await loadData();
    } catch (err) {
      showToast('Lỗi lưu voucher', err.message || 'Không thể lưu voucher.', 'error');
    }
  };

  const toggleVoucherStatus = async (vId) => {
    try {
      await apiRequest(`/manager/vouchers/${vId}/toggle-status`, { method: 'PATCH' });
      await loadData();
    } catch (err) {
      showToast('Lỗi', err.message || 'Không thể thay đổi trạng thái voucher.', 'error');
    }
  };

  const sportName = (sportId) => {
    if (!sportId) return 'Tất cả bộ môn';
    return sports.find((sport) => sport.sportId === sportId)?.name || `Bộ môn #${sportId}`;
  };

  const activeCount = packages.filter(
    (item) => item.status?.toUpperCase() === 'ACTIVE'
  ).length;

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · HẠNG HỘI VIÊN &amp; VOUCHER
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Hạng Hội Viên &amp; Quyền Lợi</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý các hạng hội viên, quyền lợi và mã ưu đãi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'packages' && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Thêm hạng hội viên
              </button>
            )}
            {activeTab === 'vouchers' && (
              <button
                type="button"
                onClick={openCreateVoucher}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_card</span>
                Tạo voucher mới
              </button>
            )}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Làm mới
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'packages', label: `Hạng hội viên (${packages.length})`, icon: 'card_membership' },
            { id: 'vouchers', label: `Mã giảm giá & Voucher (${vouchers.length})`, icon: 'loyalty' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================
            TAB 1: GÓI HỘI VIÊN & THẺ (PACKAGES)
           ======================================================== */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Tổng số gói tập</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{packages.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Đang mở bán</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Tạm ngưng</p>
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
                <div className="p-4">
                  <TableSkeleton rows={6} cols={8} />
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                  <p className="mt-2 font-semibold text-slate-800">Không tìm thấy gói tập nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-bold whitespace-nowrap">
                      <tr>
                        <th className="px-5 py-3">Gói tập</th>
                        <th className="px-5 py-3">Bộ môn</th>
                        <th className="px-5 py-3">Giá niêm yết</th>
                        <th className="px-5 py-3">Thời hạn</th>
                        <th className="px-5 py-3">Khung giờ</th>
                        <th className="px-5 py-3">Quyền lợi</th>
                        <th className="px-5 py-3">Trạng thái</th>
                        <th className="px-5 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredPackages.map((membershipPackage) => {
                        const isActive = membershipPackage.status?.toUpperCase() === 'ACTIVE';
                        const isProcessing = processingId === membershipPackage.packageId;
                        return (
                          <tr key={membershipPackage.packageId} className="hover:bg-slate-50">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">{membershipPackage.name}</p>
                              <p className="mt-0.5 text-xs text-slate-400">Mã gói: #{membershipPackage.packageId}</p>
                            </td>
                            <td className="px-5 py-4 text-slate-700 whitespace-nowrap">{sportName(membershipPackage.sportId)}</td>
                            <td className="px-5 py-4 font-bold text-orange-600 whitespace-nowrap">{formatPrice(membershipPackage.price)}</td>
                            <td className="px-5 py-4 text-slate-700 whitespace-nowrap">{formatDuration(membershipPackage.durationDays)}</td>
                            <td className="px-5 py-4 text-slate-700 whitespace-nowrap">{ACCESS_LABELS[membershipPackage.accessType] || membershipPackage.accessType}</td>
                            <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                              <div className="flex flex-col text-xs">
                                <span className="font-semibold text-slate-800">
                                  {membershipPackage.quotaSessions ?? 0} buổi tập
                                </span>
                                <span className="text-slate-500">
                                  {membershipPackage.quotaCourts ?? 0} giờ sân
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isActive ? 'Đang mở bán' : 'Tạm ngưng'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(membershipPackage)}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePackageStatus(membershipPackage)}
                                  disabled={isProcessing}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                                    isActive
                                      ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                >
                                  {isProcessing ? 'Đang lưu...' : isActive ? 'Tạm ngưng' : 'Mở bán'}
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
            </section>
          </div>
        )}

        {/* ========================================================
            TAB 2: QUẢN LÝ VOUCHER & MÃ GIẢM GIÁ (MGR-18)
           ======================================================== */}
        {activeTab === 'vouchers' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Danh sách Voucher &amp; Mã khuyến mãi</h2>
                <p className="text-xs text-slate-500">
                  Hỗ trợ giảm tiền trực tiếp (FIXED), giảm theo % (PERCENT) và tặng thêm tháng gia hạn (EXTEND_DURATION)
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateVoucher}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tạo voucher</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Mã Voucher</th>
                    <th className="px-5 py-3">Loại giảm</th>
                    <th className="px-5 py-3">Giá trị ưu đãi</th>
                    <th className="px-5 py-3">Đơn tối thiểu</th>
                    <th className="px-5 py-3">Lượt dùng</th>
                    <th className="px-5 py-3">Thời hạn hiệu lực</th>
                    <th className="px-5 py-3">Áp dụng cho</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {vouchers.map((v) => (
                    <tr key={v.voucherId} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-sm text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                          {v.code}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800">
                          {v.discountType === 'FIXED'
                            ? 'Giảm tiền cố định'
                            : v.discountType === 'PERCENT'
                            ? 'Giảm theo phần trăm'
                            : 'Tặng tháng gia hạn'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {v.discountType === 'FIXED'
                          ? formatPrice(v.discountValue)
                          : v.discountType === 'PERCENT'
                          ? `${v.discountValue}%`
                          : `+${v.extendDurationMonths} Tháng`}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatPrice(v.minPurchase)}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {v.currentUses} / {v.maxUses} lượt
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {v.validFrom} → {v.validUntil}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {v.appliesTo === 'MEMBERSHIP_ONLY' ? 'Gói thẻ' : v.appliesTo === 'BOOKING_ONLY' ? 'Đặt sân/lớp' : 'Tất cả'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            v.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {v.active ? 'Kích hoạt' : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleVoucherStatus(v.voucherId)}
                          className="text-xs text-orange-600 hover:underline font-bold cursor-pointer"
                        >
                          {v.active ? 'Tắt' : 'Bật'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>

      {/* Package Drawer */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs !m-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDrawerOpen(false);
          }}
        >
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPackage ? 'Cập nhật hạng hội viên' : 'Tạo hạng hội viên'}
              </h2>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-semibold">
                  {formError}
                </div>
              )}
              <div>
                <label htmlFor="packageName" className="block text-xs font-bold uppercase text-slate-700">
                  Tên hạng hội viên *
                </label>
                <input
                  id="packageName"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  aria-label="Tên hạng hội viên"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Ví dụ: Hạng Bạch Kim, Hạng Đồng, Gói VIP..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Nhập tên hạng hội viên tùy ý (tối đa 100 ký tự). Áp dụng mọi bộ môn theo khung giờ và quyền lợi đã cấu hình.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">Giá niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    id="packagePrice"
                    name="price"
                    aria-label="Giá niêm yết"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Giá niêm yết (VNĐ)"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">Thời hạn (ngày) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    id="packageDuration"
                    name="durationDays"
                    aria-label="Thời hạn ngày"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    placeholder="Thời hạn (ngày)"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">Khung giờ tập</label>
                <select
                  id="packageAccessType"
                  name="accessType"
                  aria-label="Khung giờ tập"
                  value={form.accessType}
                  onChange={(e) => setForm({ ...form, accessType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="ALL_DAY">Cả ngày (ALL_DAY)</option>
                  <option value="PEAK">Giờ cao điểm (PEAK)</option>
                  <option value="OFF_PEAK">Giờ thấp điểm (OFF_PEAK)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="packageQuotaSessions" className="block text-xs font-bold uppercase text-slate-700">
                    Số buổi tập (buổi)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    id="packageQuotaSessions"
                    name="quotaSessions"
                    aria-label="Số buổi tập"
                    value={form.quotaSessions}
                    onChange={(e) => setForm({ ...form, quotaSessions: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="packageQuotaCourts" className="block text-xs font-bold uppercase text-slate-700">
                    Số giờ sân (giờ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    id="packageQuotaCourts"
                    name="quotaCourts"
                    aria-label="Số giờ sân"
                    value={form.quotaCourts}
                    onChange={(e) => setForm({ ...form, quotaCourts: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">Mô tả gói</label>
                <textarea
                  id="packageDescription"
                  name="description"
                  aria-label="Mô tả gói"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả quyền lợi gói..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-bold uppercase text-white shadow-sm cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : 'Lưu hạng hội viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Modal (MGR-18) */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 !m-0">
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVoucher ? 'Cập nhật Voucher' : 'Tạo Voucher Khuyến Mãi Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Mã Voucher (Code) *</label>
                  <input
                    required
                    maxLength={50}
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: TET2026"
                    className="mt-1 w-full uppercase font-mono font-bold rounded-xl border border-slate-300 p-2.5 text-xs text-orange-600 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Loại giảm giá *</label>
                  <select
                    value={voucherForm.discountType}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="PERCENT">Giảm theo % (PERCENT)</option>
                    <option value="FIXED">Giảm tiền mặt VNĐ (FIXED)</option>
                    <option value="EXTEND_DURATION" disabled>Tặng tháng gia hạn (chưa hỗ trợ)</option>
                  </select>
                </div>
              </div>

              {voucherForm.discountType === 'EXTEND_DURATION' ? (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Số tháng gia hạn thêm *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={voucherForm.extendDurationMonths}
                    onChange={(e) => setVoucherForm({ ...voucherForm, extendDurationMonths: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">
                    Giá trị giảm ({voucherForm.discountType === 'PERCENT' ? '%' : 'VNĐ'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={voucherForm.discountValue}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={voucherForm.minPurchase}
                    onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Số lượt tối đa</label>
                  <input
                    type="number"
                    min={1}
                    value={voucherForm.maxUses}
                    onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Hiệu lực từ ngày *</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.validFrom}
                    onChange={(e) => setVoucherForm({ ...voucherForm, validFrom: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Đến ngày *</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.validUntil}
                    onChange={(e) => setVoucherForm({ ...voucherForm, validUntil: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700">Phạm vi áp dụng</label>
                <select
                  value={voucherForm.appliesTo}
                  onChange={(e) => setVoucherForm({ ...voucherForm, appliesTo: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả dịch vụ (ALL)</option>
                  <option value="MEMBERSHIP_ONLY">Chỉ áp dụng mua gói thẻ (MEMBERSHIP_ONLY)</option>
                  <option value="BOOKING_ONLY">Chỉ áp dụng đặt sân &amp; lớp (BOOKING_ONLY)</option>

                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-bold uppercase text-white shadow-sm cursor-pointer"
                >
                  Lưu Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
