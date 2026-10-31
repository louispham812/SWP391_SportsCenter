import React, { useEffect, useMemo, useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import { getPublicPackages } from '../../services/publicContentApi';
import { getMemberMemberships, purchaseMembership } from '../../services/memberApi';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function MemberPackagesPage() {
  const { showToast } = useApp();
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checkout modal
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [actionType, setActionType] = useState('register'); // 'register' | 'renew' | 'upgrade'
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgs, mems] = await Promise.all([getPublicPackages(), getMemberMemberships()]);
      setPackages(pkgs || []);
      setMemberships(mems || []);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin gói tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tìm gói đang kích hoạt (ACTIVE và chưa hết hạn)
  const currentMembership = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return memberships.find(
      (m) =>
        m.status === 'ACTIVE' &&
        (!m.endDate || m.endDate >= today)
    ) || null;
  }, [memberships]);

  const currentPackage = useMemo(() => {
    if (!currentMembership) return null;
    return (
      packages.find((p) => p.packageName === currentMembership.packageName || p.name === currentMembership.packageName) ||
      null
    );
  }, [currentMembership, packages]);

  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleOpenCheckout = (pkg, type) => {
    setSelectedPackage(pkg);
    setActionType(type);
    setPaymentMethod('VIETQR');
  };

  // QR Modal & Polling State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Cleanup polling khi unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Polling payment status từ backend
  const startPollingPayment = (paymentId) => {
    setPollingPayment(true);
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/payments/${paymentId}`);
        const payment = await response.json();
        
        if (payment.paymentStatus === 'PAID') {
          // Thanh toán thành công
          clearInterval(interval);
          setPollingInterval(null);
          setPollingPayment(false);
          setShowQrModal(false);
          
          // Show success popup
          const title = actionType === 'renew' ? 'Gia hạn thành công' : actionType === 'upgrade' ? 'Nâng cấp thành công' : 'Đăng ký thành công';
          showToast(title, `Gói ${selectedPackage.name} đã được kích hoạt!`, 'success');
          
          // Close modal and reload data
          setSelectedPackage(null);
          await loadData();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll mỗi 3 giây
    
    setPollingInterval(interval);
    
    // Timeout sau 5 phút (300s)
    setTimeout(() => {
      clearInterval(interval);
      setPollingInterval(null);
      setPollingPayment(false);
    }, 300000);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;
    setSubmitting(true);
    try {
      const result = await purchaseMembership(selectedPackage.packageId, paymentMethod);
      
      console.log('[PACKAGE QR] Purchase result:', result);

      // Nếu chọn VIETQR → Generate QR Code và polling
      if (paymentMethod === 'VIETQR' && result.paymentId) {
        setSubmitting(false); // Cho phép user cancel trong khi chờ
        
        try {
          console.log('[PACKAGE QR] Starting QR flow...');
          
          // Gọi API generate QR với paymentId
          const token = localStorage.getItem('authToken');
          const qrResponse = await fetch(
            `/api/v1/payment/generate-qr?paymentId=${result.paymentId}&amount=${selectedPackage.price}`,
            {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            }
          );
          
          if (!qrResponse.ok) {
            const errorText = await qrResponse.text();
            console.error('[PACKAGE QR] generate-qr API error:', errorText);
            showToast('Lỗi tạo mã QR', `Không thể tạo mã QR: ${errorText}`, 'error');
            return;
          }
          
          const qrResult = await qrResponse.json();
          console.log('[PACKAGE QR] QR data received:', qrResult);
          
          // Hiển thị QR Modal
          setQrData(qrResult);
          setShowQrModal(true);
          console.log('[PACKAGE QR] Modal should show now');
          
          // Start polling payment status
          startPollingPayment(result.paymentId);
          return;
        } catch (qrError) {
          console.error('[PACKAGE QR] Exception:', qrError);
          showToast('Lỗi hiển thị QR', 'Không thể hiển thị mã QR. Vui lòng thử lại.', 'error');
          return;
        }
      }

      // Các phương thức khác (CASH_COUNTER, VNPAY, SANDBOX) hoặc không có paymentId
      const title = actionType === 'renew' ? 'Gia hạn thành công' : actionType === 'upgrade' ? 'Nâng cấp thành công' : 'Đăng ký thành công';
      const message = `Gói ${selectedPackage.name} đang chờ Quản lý phê duyệt. Mã GD: ${result?.referenceCode || 'VQR-PKG'}`;
      showToast(title, message, 'success');
      setSelectedPackage(null);
      await loadData();
    } catch (err) {
      console.error('[PACKAGE] Purchase error:', err);
      showToast('Thao tác không thành công', err.message || 'Không thể thực hiện giao dịch gói tập.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
              Gói Thành Viên & Quyền Lợi Hội Viên
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý gói tập đang hoạt động, gia hạn thời gian hoặc nâng cấp gói thành viên tại F Sport Center.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Làm mới
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Current Active Membership Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-[#00132b] to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  {currentMembership ? 'Gói Tập Đang Kích Hoạt' : 'Chưa Có Gói Hoạt Động'}
                </span>
                {currentMembership && (
                  <span className="text-xs text-slate-400">
                    Mã thẻ: #{currentMembership.membershipId}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentMembership ? currentMembership.packageName : 'Hội Viên Cơ Bản F Sport'}
              </h2>

              {currentMembership ? (
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-orange-400">calendar_today</span>
                    <span>Hiệu lực từ: <strong className="text-white">{currentMembership.startDate || 'Hôm nay'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-orange-400">event_available</span>
                    <span>Hết hạn ngày: <strong className="text-white">{currentMembership.endDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-400">hourglass_bottom</span>
                    <span>Còn lại: <strong className="text-emerald-400 font-bold">{calculateDaysRemaining(currentMembership.endDate)} ngày</strong></span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 max-w-xl">
                  Bạn đang sử dụng quyền lợi cơ bản. Hãy chọn một gói thành viên bên dưới để tập luyện không giới hạn cùng các dịch vụ cao cấp của chúng tôi.
                </p>
              )}
            </div>

            {currentMembership && currentPackage && (
              <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout(currentPackage, 'renew')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/30 transition hover:scale-105 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">autorenew</span>
                  <span>Gia hạn gói này</span>
                </button>
                <span className="text-[11px] text-slate-400">Gia hạn thêm {currentPackage.durationDays} ngày</span>
              </div>
            )}
          </div>
        </section>

        {/* Business Rule Notice Callout */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0 mt-0.5">info</span>
          <div className="space-y-1">
            <div className="font-bold">Quy tắc đăng ký & gia hạn gói thành viên:</div>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>Bạn có thể <strong>Gia hạn</strong> gói tập đang sử dụng bất kỳ lúc nào để cộng dồn thêm ngày hiệu lực.</li>
              <li>Bạn có thể <strong>Nâng cấp</strong> lên các gói cao hơn (Silver, Gold, VIP) để mở rộng tiện ích.</li>
              <li>Hệ thống <strong>không hỗ trợ hạ cấp</strong> xuống các gói thấp hơn gói hiện tại đang kích hoạt để đảm bảo tính liên tục của thẻ hội viên.</li>
            </ul>
          </div>
        </div>

        {/* Packages Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-lg font-bold text-slate-900">
              Danh Sách Các Gói Tập F Sport Center
            </h3>
            <span className="text-xs text-slate-500">{packages.length} gói đang mở bán</span>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="h-6 w-1/2 bg-slate-100 rounded" />
                  <div className="h-10 w-3/4 bg-slate-100 rounded" />
                  <div className="h-24 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Chưa có gói tập nào được cấu hình từ hệ thống.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const pkgPrice = Number(pkg.price || 0);
                const currentPrice = currentPackage ? Number(currentPackage.price || 0) : 0;
                const isCurrent = currentMembership && (pkg.packageName === currentMembership.packageName || pkg.name === currentMembership.packageName);
                const isLower = currentMembership && !isCurrent && pkgPrice < currentPrice;
                const isSamePriceDiffPkg = currentMembership && !isCurrent && pkgPrice === currentPrice;
                const isHigher = currentMembership && !isCurrent && pkgPrice > currentPrice;

                return (
                  <div
                    key={pkg.packageId}
                    className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 transition-all duration-300 shadow-sm ${
                      isCurrent
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                        : isLower
                        ? 'border-slate-200 opacity-60 bg-slate-50/50'
                        : 'border-slate-200 hover:border-orange-400 hover:shadow-lg'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                          {pkg.accessType === 'ALL_DAY' ? 'Toàn Thời Gian (24/7)' : 'Khung Giờ Tiêu Chuẩn'}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                            Gói đang dùng
                          </span>
                        )}
                        {isHigher && (
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Nâng cấp VIP
                          </span>
                        )}
                      </div>

                      <h4 className="text-xl font-bold text-slate-900">{pkg.name}</h4>
                      <p className="mt-1 text-xs text-slate-500 min-h-[36px] line-clamp-2">
                        {pkg.description || `Gói tập thể thao chất lượng cao tại F Sport Center, thời hạn ${pkg.durationDays} ngày.`}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-extrabold text-orange-600">
                            {formatMoney(pkgPrice)}
                          </span>
                          <span className="text-xs text-slate-400">/ {pkg.durationDays} ngày</span>
                        </div>
                      </div>

                      {/* Features list */}
                      <ul className="mt-5 space-y-2 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          <span>Tập luyện không giới hạn các sân tập tiêu chuẩn</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          <span>Đo chỉ số InBody 770 định kỳ hàng tháng</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          <span>Tủ đồ thông minh & phòng tắm nước nóng 5 sao</span>
                        </li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {isCurrent ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(pkg, 'renew')}
                          className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 transition cursor-pointer"
                        >
                          Gia Hạn Gói Này (+{pkg.durationDays} ngày)
                        </button>
                      ) : isLower ? (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-xl bg-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-not-allowed"
                          title="Không thể đăng ký gói thấp hơn gói hiện tại"
                        >
                          Không Thể Hạ Cấp
                        </button>
                      ) : isSamePriceDiffPkg ? (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-xl bg-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-not-allowed"
                        >
                          Đang Dùng Gói Tương Đương
                        </button>
                      ) : isHigher ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(pkg, 'upgrade')}
                          className="w-full rounded-xl bg-slate-900 hover:bg-orange-500 py-3 text-xs font-bold uppercase tracking-wider text-white transition shadow-sm cursor-pointer"
                        >
                          Nâng Cấp Lên Gói Này
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(pkg, 'register')}
                          className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 transition cursor-pointer"
                        >
                          Đăng Ký Gói Này
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal Confirm Checkout */}
        {selectedPackage && !showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-orange-500">
                    {actionType === 'renew' ? 'autorenew' : actionType === 'upgrade' ? 'upgrade' : 'add_card'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {actionType === 'renew'
                      ? 'Xác Nhận Gia Hạn Gói Tập'
                      : actionType === 'upgrade'
                      ? 'Xác Nhận Nâng Cấp Gói VIP'
                      : 'Xác Nhận Đăng Ký Gói Mới'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Package Card */}
                <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-4">
                  <div className="text-xs text-orange-800 font-semibold uppercase tracking-wider">Gói thành viên</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{selectedPackage.name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Thời lượng: {selectedPackage.durationDays} ngày · {selectedPackage.accessType === 'ALL_DAY' ? 'Toàn thời gian (All-Day)' : 'Tiêu chuẩn (Standard)'}
                  </div>
                </div>

                {/* Summary Info */}
                <div className="space-y-2 text-xs border border-slate-200/80 rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Hình thức giao dịch:</span>
                    <strong className="text-slate-900">
                      {actionType === 'renew' ? 'Gia hạn gói đang dùng' : actionType === 'upgrade' ? 'Nâng cấp gói thành viên' : 'Đăng ký mới'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Thời hạn gia tăng:</span>
                    <strong className="text-slate-900">+{selectedPackage.durationDays} ngày</strong>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                    <span className="text-xl font-extrabold text-orange-600">
                      {formatMoney(selectedPackage.price)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onChange={setPaymentMethod}
                  amount={selectedPackage.price}
                  transferMemo={`VQRPKG${selectedPackage.packageId}`}
                />

                <div className="rounded-xl bg-blue-50 p-3 text-[11px] text-blue-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-600 shrink-0">info</span>
                  <span>Quyền lợi hội viên và ưu đãi giảm giá khóa học / thuê sân sẽ được kích hoạt ngay sau khi hoàn tất.</span>
                </div>
              </div>

              <div className="p-6 pt-3 border-t border-slate-100 flex gap-3 bg-white">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelectedPackage(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmPurchase}
                  className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/25 transition disabled:opacity-60"
                >
                  {submitting
                    ? 'Đang xử lý...'
                    : paymentMethod === 'VIETQR'
                    ? 'Tôi Đã Chuyển Khoản — Kích Hoạt'
                    : paymentMethod === 'CASH_COUNTER'
                    ? 'Đăng Ký (Trả Tại Quầy)'
                    : paymentMethod === 'VNPAY'
                    ? 'Thanh Toán Qua VNPAY'
                    : 'Xác Nhận & Kích Hoạt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Payment Modal */}
        {showQrModal && qrData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform animate-in slide-in-from-bottom-4 duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <span className="material-symbols-outlined text-3xl text-orange-600">qr_code_scanner</span>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Quét Mã QR Để Thanh Toán
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Sử dụng app ngân hàng của bạn để scan mã QR bên dưới
              </p>
              
              <div className="relative">
                <img 
                  src={qrData.qrUrl} 
                  alt="QR Code Thanh Toán" 
                  className="w-full max-w-xs mx-auto rounded-2xl border-4 border-orange-500 shadow-lg"
                />
              </div>
              
              <div className="mt-6 space-y-2 text-sm bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">Số tiền:</span>
                  <span className="font-bold text-slate-900">{formatMoney(qrData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nội dung CK:</span>
                  <code className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {qrData.addInfo}
                  </code>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-semibold text-slate-700">BIDV</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">STK:</span>
                  <span className="font-semibold text-slate-700">{qrData.accountNo}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Chủ TK:</span>
                  <span className="font-semibold text-slate-700">{qrData.accountName}</span>
                </div>
              </div>
              
              {pollingPayment && (
                <div className="mt-6 flex items-center justify-center gap-2 text-orange-600 bg-orange-50 rounded-xl py-3 px-4 border border-orange-200">
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold">Đang chờ xác nhận từ ngân hàng...</span>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setShowQrModal(false);
                  setPollingPayment(false);
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                  }
                  setSelectedPackage(null);
                }}
                className="mt-6 text-sm text-slate-500 hover:text-slate-700 font-semibold underline"
              >
                Hủy / Quay lại chọn phương thức khác
              </button>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
