import { useEffect, useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import { apiRequest, generatePayment } from '../../services/apiClient';
import { getPublicPackages } from '../../services/publicContentApi';
import { getMemberMemberships, purchaseMembership } from '../../services/memberApi';
import { redirectToPayment } from '../../services/paymentNavigation';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';
import ActiveMemberPackages from '../../components/common/ActiveMemberPackages';
import { getActiveMemberships, getTierBadgeStyle } from '../../utils/memberMemberships';

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
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPreview, setVoucherPreview] = useState(null);
  const pendingMemberships = memberships.filter((m) => ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'PENDING'].includes(m.status));
  const checkoutAmount = voucherPreview?.finalAmount ?? selectedPackage?.price;
  const applyVoucher = async () => {
    setCheckoutError('');
    setVoucherPreview(null);
    try {
      const result = await apiRequest('/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({ code: voucherCode, amount: selectedPackage.price, appliesTo: 'MEMBERSHIP_ONLY' }),
      });
      if (!result.valid) throw new Error(result.message);
      setVoucherPreview(result);
    } catch (err) { setCheckoutError(err.message); }
  };
  const resumePayment = async (membership) => {
    try {
      const result = await generatePayment(membership.paymentId, 'VNPAY');
      redirectToPayment(membership.paymentId, result.paymentUrl);
    } catch (err) { showToast('Không thể thanh toán', err.message, 'error'); }
  };

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

  const activeMemberships = getActiveMemberships(memberships);
  const tierRank = { BRONZE: 1, SILVER: 2, GOLD: 3, DIAMOND: 4 };
  const currentTierRank = Math.max(0, ...activeMemberships.map((membership) => tierRank[membership.membershipTier] || 0));
  const sortedPackages = [...packages].sort((a, b) =>
    (tierRank[a.membershipTier] || 99) - (tierRank[b.membershipTier] || 99)
    || Number(a.price || 0) - Number(b.price || 0)
  );

  const handleOpenCheckout = (pkg, type) => {
    if (pendingMemberships.some((m) => m.packageId === pkg.packageId)) return;
    setVoucherCode('');
    setVoucherPreview(null);
    setSelectedPackage(pkg);
    setActionType(type);
    setPaymentMethod('VNPAY');
    setCheckoutError('');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;
    setSubmitting(true);
    setCheckoutError('');
    try {
      const result = await purchaseMembership(selectedPackage.packageId, paymentMethod, voucherPreview?.voucher?.code);

      // Redirect to VNPay payment page
      if (paymentMethod === 'VNPAY' && result.paymentId && result.paymentStatus !== 'PAID') {
        try {
          const vnpayResult = await generatePayment(result.paymentId, 'VNPAY');

          redirectToPayment(result.paymentId, vnpayResult.paymentUrl);
          return;
        } catch (vnpayError) {
          console.error('[VNPAY] Exception:', vnpayError);
          showToast('Lỗi VNPay', vnpayError.message || 'Không thể chuyển đến trang thanh toán VNPay. Vui lòng thử lại.', 'error');
          setSelectedPackage(null);
          await loadData();
          setSubmitting(false);
          return;
        }
      }

      // Các phương thức khác (CASH_COUNTER, SANDBOX) hoặc không có paymentId
      const title = actionType === 'renew' ? 'Gia hạn thành công' : actionType === 'upgrade' ? 'Nâng cấp thành công' : 'Đăng ký thành công';
      const message = result.paymentStatus === 'PAID'
        ? `Gói ${selectedPackage.name} đã thanh toán và đang chờ Quản lý phê duyệt.`
        : `Gói ${selectedPackage.name} đang chờ thanh toán tại quầy trong 10 phút. Gói chưa được kích hoạt.`;
      showToast(title, message, 'success');
      setSelectedPackage(null);
      await loadData();
    } catch (err) {
      console.error('[PACKAGE] Purchase error:', err);
      showToast('Thao tác không thành công', err.message || 'Không thể thực hiện giao dịch gói tập.', 'error');
      setSelectedPackage(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
              Hạng hội viên & quyền lợi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Xem hạng đang dùng, so sánh quyền lợi và chọn hạng phù hợp với lịch tập của bạn.
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

        {pendingMemberships.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <h2 className="font-bold text-amber-900">Yêu cầu gói tập đang xử lý</h2>
            {pendingMemberships.map((m) => (
              <div key={m.membershipId} className="flex items-center justify-between gap-3 text-sm">
                <span>{m.packageName} — {m.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán (giữ yêu cầu 10 phút)' : 'Đã thanh toán · Đang chờ duyệt'}</span>
                {m.status === 'PENDING_PAYMENT' && m.paymentMethod === 'VNPAY' && m.paymentId && (
                  <button type="button" onClick={() => resumePayment(m)} className="font-bold text-orange-700 underline">Tiếp tục thanh toán</button>
                )}
              </div>
            ))}
          </section>
        )}

        <ActiveMemberPackages memberships={activeMemberships} onRenew={(membership) => {
          const pkg = packages.find((item) => item.packageId === membership.packageId);
          if (pkg) handleOpenCheckout(pkg, 'renew');
          else showToast('Chưa thể gia hạn', 'Gói này hiện không mở bán. Vui lòng liên hệ lễ tân.', 'info');
        }} />

        {/* Business Rule Notice Callout */}
        <details className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">Thông tin gia hạn &amp; nâng hạng</summary>
          <p className="mt-3 leading-6">Gia hạn sẽ nối tiếp kỳ đang dùng. Bạn có thể chọn hạng cao hơn để tăng quyền lợi; hạng mới được kích hoạt sau khi thanh toán và được quản lý duyệt. Hiện không hỗ trợ hạ hạng khi gói đang có hiệu lực.</p>
        </details>

        {/* Packages Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-lg font-bold text-slate-900">
              So sánh các hạng hội viên
            </h3>
            <span className="text-sm text-slate-500">{packages.length} hạng đang mở bán</span>
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
            <div className={`grid gap-5 md:grid-cols-2 ${packages.length === 4 ? 'xl:grid-cols-2 2xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
              {sortedPackages.map((pkg) => {
                const pending = pendingMemberships.find((m) => m.packageId === pkg.packageId);
                const pkgPrice = Number(pkg.price || 0);
                const isCurrent = activeMemberships.some((membership) => membership.packageId === pkg.packageId);
                const pkgTierRank = tierRank[pkg.membershipTier] || 0;
                const isLower = !isCurrent && pkgTierRank > 0 && currentTierRank > 0 && pkgTierRank < currentTierRank;
                const isHigher = !isCurrent && pkgTierRank > 0 && currentTierRank > 0 && pkgTierRank > currentTierRank;

                return (
                  <div
                    key={pkg.packageId}
                    className={`relative flex flex-col justify-between rounded-2xl border-2 p-5 sm:p-6 transition-colors shadow-sm ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-50/30'
                        : isLower
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div>
                      <div className="mb-4 flex min-h-7 flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTierBadgeStyle(pkg.membershipTier || pkg.name, 'light')}`}>
                          {['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'].includes(String(pkg.membershipTier || '').toUpperCase())
                            ? 'Hạng tiêu chuẩn'
                            : 'Hạng tùy chỉnh'}
                        </span>
                        {pending ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Đang chờ xử lý</span>
                        ) : isCurrent ? (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">Hạng đang sử dụng</span>
                        ) : isHigher ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Quyền lợi cao hơn</span>
                        ) : isLower ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Hạng thấp hơn hiện tại</span>
                        ) : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Sẵn sàng đăng ký</span>}
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">{pkg.name}</h4>
                      <p className="mt-1 text-sm text-slate-600">Quyền lợi cho mỗi kỳ {pkg.durationDays} ngày.</p>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold tracking-tight text-slate-900">
                            {formatMoney(pkgPrice)}
                          </span>
                          <span className="text-sm text-slate-600">/ {pkg.durationDays} ngày</span>
                        </div>
                      </div>

                      {/* Features list */}
                      <ul className="mt-5 space-y-3 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          <span>{pkg.quotaSessions || 0} buổi lớp học hoặc PT / kỳ</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          <span>{pkg.quotaCourts || 0} giờ sân / kỳ</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                          <span>Áp dụng mọi bộ môn, theo lịch còn chỗ</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span aria-hidden="true" className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                          <span>{pkg.accessType === 'ALL_DAY' ? 'Trong giờ hoạt động' : pkg.accessType === 'OFF_PEAK' ? 'Giờ thấp điểm 08:00–16:00' : 'Giờ cao điểm'}</span>
                        </li>
                      </ul>
                      {pkg.description && (
                        <details className="mt-4 text-sm text-slate-600">
                          <summary className="cursor-pointer font-medium underline underline-offset-4">Chi tiết quyền lợi</summary>
                          <p className="mt-2 leading-6">{pkg.description}</p>
                        </details>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {pending ? (
                        <button type="button" disabled className="w-full rounded-xl bg-amber-100 py-3 text-xs font-bold text-amber-800">
                          {pending.status === 'PENDING_PAYMENT' ? 'Đang chờ thanh toán' : 'Đang chờ duyệt'}
                        </button>
                      ) : isCurrent ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(pkg, 'renew')}
                          className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-3 text-sm font-semibold text-white transition cursor-pointer"
                        >
                          Gia hạn thêm {pkg.durationDays} ngày
                        </button>
                      ) : isLower ? (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed"
                          title="Không thể đăng ký gói thấp hơn gói hiện tại"
                        >
                          Không hỗ trợ hạ hạng
                        </button>
                      ) : isHigher ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(pkg, 'upgrade')}
                          className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-3 text-sm font-semibold text-white transition cursor-pointer"
                        >
                          Nâng lên hạng này
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(pkg, 'register')}
                          className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-3 text-sm font-semibold text-white transition cursor-pointer"
                        >
                          Đăng ký hạng này
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Confirm Checkout */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 !m-0">
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
                      ? 'Xác nhận nâng hạng hội viên'
                      : 'Xác Nhận Đăng Ký Gói Mới'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
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
                      {formatMoney(checkoutAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="package-voucher" className="text-xs font-bold">Mã ưu đãi gói tập</label>
                  <div className="flex gap-2">
                    <input id="package-voucher" value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherPreview(null); }} className="flex-1 min-w-0 rounded-xl border p-2 text-sm" />
                    <button type="button" onClick={applyVoucher} disabled={!voucherCode.trim() || submitting} className="rounded-xl border px-3 text-sm font-bold">Áp dụng</button>
                  </div>
                  {voucherPreview && <p className="text-xs text-emerald-700">Giảm {formatMoney(voucherPreview.discountAmount)} · Còn {formatMoney(checkoutAmount)}</p>}
                </div>
                {/* Payment Method Selector */}
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onChange={setPaymentMethod}
                  amount={checkoutAmount}
                  transferMemo={`VQRPKG${selectedPackage.packageId}`}
                />

                <div className="rounded-xl bg-blue-50 p-3 text-[11px] text-blue-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-600 shrink-0">info</span>
                  <span>Quyền lợi hội viên được kích hoạt sau khi thanh toán hợp lệ và Quản lý duyệt gói.</span>
                </div>

                {/* Inline Error Alert */}
                {checkoutError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-start gap-3 animate-in fade-in">
                    <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0 mt-0.5">error</span>
                    <div className="space-y-0.5">
                      <div className="font-bold text-red-900">Không thể hoàn tất giao dịch:</div>
                      <p className="leading-relaxed font-medium">{checkoutError}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 pt-3 border-t border-slate-100 flex gap-3 bg-white">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelectedPackage(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmPurchase}
                  className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/25 transition disabled:opacity-60 cursor-pointer"
                >
                  {submitting
                    ? 'Đang xử lý...'
                    : paymentMethod === 'CASH_COUNTER'
                    ? 'Đăng Ký (Trả Tại Quầy)'
                    : paymentMethod === 'VNPAY'
                    ? 'Thanh Toán Qua VNPAY'
                    : 'Xác Nhận Đăng Ký'}
                </button>
              </div>
            </div>
          </div>
        )}

    </MemberLayout>
  );
}
