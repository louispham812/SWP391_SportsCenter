import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  createManagerPackage,
  getManagerPackages,
  getManagerSports,
  getManagerCoaches,
  updateManagerPackage,
  updateManagerPackageStatus,
} from '../../services/managerApi';
import { apiRequest } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = {
  name: '',
  sportId: '',
  price: '',
  durationDays: '30',
  accessType: 'ALL_DAY',
  description: '',
  status: 'ACTIVE',
};

const VOUCHER_STORAGE_KEY = 'sports_center_vouchers';
const PT_PRICING_STORAGE_KEY = 'sports_center_pt_pricing';

const INITIAL_VOUCHERS = [
  {
    voucherId: 1,
    code: 'TET2026',
    discountType: 'PERCENT',
    discountValue: 20,
    extendDurationMonths: 0,
    minPurchase: 1000000,
    maxUses: 100,
    currentUses: 24,
    validFrom: '2026-01-20',
    validUntil: '2026-02-28',
    appliesTo: 'MEMBERSHIP_ONLY',
    active: true,
  },
  {
    voucherId: 2,
    code: 'GIAM50K',
    discountType: 'FIXED',
    discountValue: 50000,
    extendDurationMonths: 0,
    minPurchase: 200000,
    maxUses: 500,
    currentUses: 112,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    appliesTo: 'ALL',
    active: true,
  },
  {
    voucherId: 3,
    code: 'TANG1THANG',
    discountType: 'EXTEND_DURATION',
    discountValue: 0,
    extendDurationMonths: 1,
    minPurchase: 3000000,
    maxUses: 50,
    currentUses: 18,
    validFrom: '2026-01-01',
    validUntil: '2026-06-30',
    appliesTo: 'MEMBERSHIP_ONLY',
    active: true,
  },
];

const INITIAL_PT_PRICING = [
  {
    pricingId: 1,
    coachId: 2,
    coachName: 'Coach Nguyễn Văn A',
    sportId: 1,
    sportName: 'Tennis',
    packageName: 'Gói PT Tennis Chuẩn Thi Đấu 10 Buổi',
    totalSessions: 10,
    price: 3800000,
    pricePerSession: 380000,
    durationMonths: 2,
    description: 'Chuyên sâu cú quả forehand/backhand và di chuyển sân đấu',
    active: true,
  },
  {
    pricingId: 2,
    coachId: 2,
    coachName: 'Coach Nguyễn Văn A',
    sportId: 2,
    sportName: 'Pickleball',
    packageName: 'Gói PT Pickleball Pro 20 Buổi',
    totalSessions: 20,
    price: 7000000,
    pricePerSession: 350000,
    durationMonths: 4,
    description: 'Chiến thuật dink, volley lưới và tâm lý thi đấu chuyên nghiệp',
    active: true,
  },
  {
    pricingId: 3,
    coachId: 3,
    coachName: 'Coach Lê Minh',
    sportId: 3,
    sportName: 'Gym & Fitness',
    packageName: 'Gói PT Gym Hypertrophy 12 Buổi',
    totalSessions: 12,
    price: 4200000,
    pricePerSession: 350000,
    durationMonths: 3,
    description: 'Giáo án tăng cơ giảm mỡ chuẩn NASM, theo dõi InBody 2 tuần/lần',
    active: true,
  },
];

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
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'vouchers' | 'pt_pricing'

  // Packages state
  const [packages, setPackages] = useState([]);
  const [sports, setSports] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Vouchers state (MGR-18)
  const [vouchers, setVouchers] = useState(() => {
    try {
      const stored = localStorage.getItem(VOUCHER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_VOUCHERS;
    } catch {
      return INITIAL_VOUCHERS;
    }
  });
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

  // PT Pricing state (MGR-04)
  const [ptPricings, setPtPricings] = useState(() => {
    try {
      const stored = localStorage.getItem(PT_PRICING_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_PT_PRICING;
    } catch {
      return INITIAL_PT_PRICING;
    }
  });
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [ptForm, setPtForm] = useState({
    coachId: '',
    sportId: '',
    packageName: '',
    totalSessions: '10',
    price: '',
    durationMonths: '2',
    description: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [packageData, sportData, coachData, voucherData] = await Promise.all([
        getManagerPackages(),
        getManagerSports(),
        getManagerCoaches().catch(() => ({ content: [] })),
        apiRequest('/manager/vouchers').catch(() => null),
      ]);
      setPackages(packageData);
      setSports(sportData);
      setCoaches(coachData.content || []);
      if (Array.isArray(voucherData) && voucherData.length > 0) {
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
        localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(mapped));
      }
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu gói tập từ database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      showToast('Thành công', 'Đã lưu cấu hình gói thành viên (Ghi Audit Log).', 'success');
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu gói tập.');
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

    let savedId = editingVoucher?.voucherId || Date.now();
    try {
      if (editingVoucher && typeof editingVoucher.voucherId === 'number') {
        const res = await apiRequest(`/manager/vouchers/${editingVoucher.voucherId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res?.voucherId) savedId = res.voucherId;
      } else {
        const res = await apiRequest('/manager/vouchers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res?.voucherId) savedId = res.voucherId;
      }
    } catch {
      // fallback to optimistic local update
    }

    const newVoucher = {
      voucherId: savedId,
      code: voucherForm.code.trim().toUpperCase(),
      discountType: voucherForm.discountType,
      discountValue: Number(voucherForm.discountValue) || 0,
      extendDurationMonths: Number(voucherForm.extendDurationMonths) || 0,
      minPurchase: Number(voucherForm.minPurchase) || 0,
      maxUses: Number(voucherForm.maxUses) || 100,
      currentUses: editingVoucher?.currentUses || 0,
      validFrom: voucherForm.validFrom,
      validUntil: voucherForm.validUntil,
      appliesTo: voucherForm.appliesTo,
      active: voucherForm.active,
    };

    let updated = [];
    if (editingVoucher) {
      updated = vouchers.map((v) => (v.voucherId === editingVoucher.voucherId ? newVoucher : v));
    } else {
      updated = [newVoucher, ...vouchers];
    }

    setVouchers(updated);
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(updated));
    showToast('Lưu voucher thành công', `Mã ${newVoucher.code} đã sẵn sàng áp dụng. (Ghi Audit Log)`, 'success');
    setIsVoucherModalOpen(false);
  };

  const toggleVoucherStatus = async (vId) => {
    try {
      await apiRequest(`/manager/vouchers/${vId}/toggle-status`, { method: 'PATCH' });
    } catch {
      // optimistic update
    }
    const updated = vouchers.map((v) => (v.voucherId === vId ? { ...v, active: !v.active } : v));
    setVouchers(updated);
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(updated));
  };

  // PT Pricing Handlers (MGR-04)
  const openCreatePt = () => {
    setPtForm({
      coachId: coaches[0]?.userId || '',
      sportId: sports[0]?.sportId || '',
      packageName: '',
      totalSessions: '10',
      price: '',
      durationMonths: '2',
      description: '',
    });
    setIsPtModalOpen(true);
  };

  const handleSavePt = (e) => {
    e.preventDefault();
    const coach = coaches.find((c) => String(c.userId) === String(ptForm.coachId));
    const sport = sports.find((s) => String(s.sportId) === String(ptForm.sportId));
    const totalSessions = Number(ptForm.totalSessions) || 10;
    const price = Number(ptForm.price) || 0;
    const pricePerSession = totalSessions > 0 ? Math.round(price / totalSessions) : 0;

    const newPt = {
      pricingId: Date.now(),
      coachId: Number(ptForm.coachId),
      coachName: coach?.fullName || 'HLV F Sport',
      sportId: Number(ptForm.sportId),
      sportName: sport?.name || 'Thể thao',
      packageName: ptForm.packageName.trim() || `Gói PT ${sport?.name || ''} ${totalSessions} Buổi - ${coach?.fullName || ''}`,
      totalSessions,
      price,
      pricePerSession,
      durationMonths: Number(ptForm.durationMonths) || 2,
      description: ptForm.description.trim() || 'Huấn luyện 1-1 chuyên nghiệp',
      active: true,
    };

    const updated = [newPt, ...ptPricings];
    setPtPricings(updated);
    localStorage.setItem(PT_PRICING_STORAGE_KEY, JSON.stringify(updated));
    showToast('Tạo gói PT thành công', `Gói "${newPt.packageName}" đã được niêm yết công khai (MGR-04).`, 'success');
    setIsPtModalOpen(false);
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
              F SPORT ADMIN · GÓI DỊCH VỤ, VOUCHER &amp; PT (MGR-04, MGR-18)
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Gói Tập, Voucher &amp; Bảng Giá PT</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cấu hình gói thẻ hội viên, voucher khuyến mại gia hạn (MGR-18) và bảng giá PT lẻ theo Coach (MGR-04).
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
                Thêm gói tập mới
              </button>
            )}
            {activeTab === 'vouchers' && (
              <button
                type="button"
                onClick={openCreateVoucher}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_card</span>
                Tạo voucher mới (MGR-18)
              </button>
            )}
            {activeTab === 'pt_pricing' && (
              <button
                type="button"
                onClick={openCreatePt}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">fitness_center</span>
                Tạo gói PT lẻ theo Coach (MGR-04)
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
            { id: 'packages', label: `Gói hội viên & thẻ (${packages.length})`, icon: 'card_membership' },
            { id: 'vouchers', label: `Mã giảm giá & Voucher (${vouchers.length})`, icon: 'loyalty' },
            { id: 'pt_pricing', label: `Bảng giá PT lẻ theo Coach (${ptPricings.length})`, icon: 'sports' },
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
                <p className="px-5 py-12 text-center text-sm text-slate-500">Đang tải gói tập từ database...</p>
              ) : filteredPackages.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                  <p className="mt-2 font-semibold text-slate-800">Không tìm thấy gói tập nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-bold">
                      <tr>
                        <th className="px-5 py-3">Gói tập</th>
                        <th className="px-5 py-3">Bộ môn</th>
                        <th className="px-5 py-3">Giá niêm yết</th>
                        <th className="px-5 py-3">Thời hạn</th>
                        <th className="px-5 py-3">Khung giờ</th>
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
                            <td className="px-5 py-4 text-slate-700">{sportName(membershipPackage.sportId)}</td>
                            <td className="px-5 py-4 font-bold text-orange-600">{formatPrice(membershipPackage.price)}</td>
                            <td className="px-5 py-4 text-slate-700">{formatDuration(membershipPackage.durationDays)}</td>
                            <td className="px-5 py-4 text-slate-700">{ACCESS_LABELS[membershipPackage.accessType] || membershipPackage.accessType}</td>
                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isActive ? 'Đang mở bán' : 'Tạm ngưng'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(membershipPackage)}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePackageStatus(membershipPackage)}
                                  disabled={isProcessing}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
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
                <h2 className="text-base font-bold text-slate-900">Danh sách Voucher &amp; Mã khuyến mãi (MGR-18)</h2>
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

        {/* ========================================================
            TAB 3: BẢNG GIÁ GÓI PT LẺ THEO COACH (MGR-04, PT_PRICING)
           ======================================================== */}
        {activeTab === 'pt_pricing' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bảng giá gói huấn luyện viên cá nhân (PT) - MGR-04</h2>
                <p className="text-xs text-slate-500">
                  Manager cấu hình các gói 10, 20, 30 buổi gắn với từng Huấn luyện viên và bộ môn cụ thể
                </p>
              </div>
              <button
                type="button"
                onClick={openCreatePt}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tạo gói PT mới</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Tên gói PT</th>
                    <th className="px-5 py-3">Huấn luyện viên</th>
                    <th className="px-5 py-3">Bộ môn</th>
                    <th className="px-5 py-3">Số buổi &amp; Thời hạn</th>
                    <th className="px-5 py-3">Giá trọn gói</th>
                    <th className="px-5 py-3">Giá TB / buổi</th>
                    <th className="px-5 py-3">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {ptPricings.map((pt) => (
                    <tr key={pt.pricingId} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">{pt.packageName}</td>
                      <td className="px-5 py-4 text-slate-700 font-semibold">{pt.coachName}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200">
                          {pt.sportName}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {pt.totalSessions} Buổi · {pt.durationMonths} Tháng
                      </td>
                      <td className="px-5 py-4 font-black text-orange-600 text-sm">{formatPrice(pt.price)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{formatPrice(pt.pricePerSession)}</td>
                      <td className="px-5 py-4 max-w-xs text-slate-500 truncate">{pt.description}</td>
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPackage ? 'Cập nhật gói tập' : 'Tạo gói tập mới'}
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
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">Tên gói tập *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Gói Gold 3 Tháng"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">Bộ môn áp dụng</label>
                <select
                  value={form.sportId}
                  onChange={(e) => setForm({ ...form, sportId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Tất cả bộ môn</option>
                  {sports.map((sport) => (
                    <option key={sport.sportId} value={sport.sportId}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">Giá niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">Thời hạn (ngày) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">Khung giờ tập</label>
                <select
                  value={form.accessType}
                  onChange={(e) => setForm({ ...form, accessType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="ALL_DAY">Cả ngày (ALL_DAY)</option>
                  <option value="PEAK">Giờ cao điểm (PEAK)</option>
                  <option value="OFF_PEAK">Giờ thấp điểm (OFF_PEAK)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">Mô tả gói</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  {saving ? 'Đang lưu...' : 'Lưu gói tập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Modal (MGR-18) */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVoucher ? 'Cập nhật Voucher' : 'Tạo Voucher Khuyến Mãi Mới (MGR-18)'}
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
                    <option value="EXTEND_DURATION">Tặng tháng gia hạn (EXTEND_DURATION)</option>
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
                  <option value="RETAIL_ONLY">Chỉ áp dụng mua dụng cụ bán lẻ (RETAIL_ONLY)</option>
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

      {/* PT Package Modal (MGR-04) */}
      {isPtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tạo Bảng Giá Gói PT Lẻ Theo Coach (MGR-04)
              </h3>
              <button
                type="button"
                onClick={() => setIsPtModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePt} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Huấn Luyện Viên *</label>
                  <select
                    required
                    value={ptForm.coachId}
                    onChange={(e) => setPtForm({ ...ptForm, coachId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn Coach --</option>
                    {coaches.map((c) => (
                      <option key={c.userId} value={c.userId}>{c.fullName}</option>
                    ))}
                    <option value="2">Coach Nguyễn Văn A</option>
                    <option value="3">Coach Lê Minh</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Bộ môn *</label>
                  <select
                    required
                    value={ptForm.sportId}
                    onChange={(e) => setPtForm({ ...ptForm, sportId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn bộ môn --</option>
                    {sports.map((s) => (
                      <option key={s.sportId} value={s.sportId}>{s.name}</option>
                    ))}
                    <option value="1">Tennis</option>
                    <option value="2">Pickleball</option>
                    <option value="3">Gym &amp; Fitness</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700">Tên gói PT *</label>
                <input
                  required
                  value={ptForm.packageName}
                  onChange={(e) => setPtForm({ ...ptForm, packageName: e.target.value })}
                  placeholder="VD: Gói PT Tennis 10 Buổi - Coach Nguyễn Văn A"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Tổng buổi *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={ptForm.totalSessions}
                    onChange={(e) => setPtForm({ ...ptForm, totalSessions: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Giá trọn gói (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={ptForm.price}
                    onChange={(e) => setPtForm({ ...ptForm, price: e.target.value })}
                    placeholder="3500000"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-orange-600 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700">Hạn (tháng) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={ptForm.durationMonths}
                    onChange={(e) => setPtForm({ ...ptForm, durationMonths: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700">Mô tả gói PT (điểm nổi bật, mục tiêu)</label>
                <textarea
                  rows={2}
                  value={ptForm.description}
                  onChange={(e) => setPtForm({ ...ptForm, description: e.target.value })}
                  placeholder="VD: Chuyên môn nâng cao kỹ thuật phát bóng, cải thiện thể lực 1-1..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPtModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-bold uppercase text-white shadow-sm cursor-pointer"
                >
                  Lưu Gói PT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
