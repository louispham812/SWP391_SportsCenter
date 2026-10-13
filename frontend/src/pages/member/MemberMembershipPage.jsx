import React, { useState, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

const formatVND = (amount) => (amount || 0).toLocaleString('vi-VN') + ' ₫';

// Hàm chuẩn hóa & tính cấp độ hạng thẻ (Tránh lỗi lệch chuỗi String)
const getTierRank = (tierStr = '', nameStr = '') => {
  const combined = (tierStr + ' ' + nameStr).toUpperCase();
  if (combined.includes('DIAMOND')) return 2;
  if (combined.includes('GOLD')) return 1;
  return 0; // Gói bổ trợ PT hoặc gói thường
};

export default function MemberMembershipPage() {
  const {
    currentUser,
    activePlan,
    purchasePackage,
    showToast,
  } = useApp();

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentGateway, setPaymentGateway] = useState('vnpay');

  const user = useMemo(() => currentUser || {
    name: 'Member Võ Tấn Triều',
    memberId: 'MEM001',
  }, [currentUser]);

  const plan = useMemo(() => activePlan || {
    name: 'Gói FPT Pickleball Pass & VIP Diamond',
    tier: 'Diamond VIP',
    expireDate: '15/12/2026',
    remainingDays: 320,
    remainingPTSessions: 8,
    price: 3490000,
  }, [activePlan]);

  // Cấp độ hạng thẻ hiện tại của hội viên
  const currentRank = useMemo(() => {
    return getTierRank(plan.tier, plan.name);
  }, [plan.tier, plan.name]);

  const isHighestTier = currentRank >= 2;

  // Danh sách các gói dịch vụ
  const membershipPackages = useMemo(() => [
    {
      id: 'pkg_gold',
      name: 'Gói Hội Viên Gold Pass',
      tier: 'Gold',
      price: 1490000,
      period: '6 Tháng',
      desc: 'Tập tự do cụm sân Pickleball & Gym ngoài giờ cao điểm. Tặng 3 buổi PT.',
      features: ['Đặt sân trước 3 ngày', 'Giảm 10% tại quầy nước', 'Đo InBody miễn phí 1 lần/tháng'],
      badge: 'Phổ biến',
    },
    {
      id: 'pkg_diamond',
      name: 'Gói FPT Pickleball Pass & VIP Diamond',
      tier: 'Diamond VIP',
      price: 3490000,
      period: '12 Tháng',
      desc: 'Đặc quyền VIP tối cao: Đặt sân không giới hạn khung giờ, tặng 12 buổi PT cá nhân.',
      features: ['Đặt sân VIP trước 7 ngày', 'Miễn phí tủ đồ Locker riêng', 'Giảm 20% dịch vụ & quầy nước', 'Mã Dynamic QR Check-in VIP'],
      badge: 'Gói Cao Cấp Nhất',
    },
    {
      id: 'pkg_pt_10',
      name: 'Gói Chuyên Sâu 10 Buổi PT 1:1',
      tier: 'PT Package',
      price: 2500000,
      period: '60 Ngày',
      desc: 'Huấn luyện viên cá nhân theo sát giáo án chấn thương & sửa kỹ thuật.',
      features: ['Cam kết chuẩn kỹ thuật', 'Lịch tập linh hoạt 1:1', 'Giáo án cá nhân hóa AI Coach'],
      badge: 'Gói Bổ Trợ',
    },
  ], []);

  // Áp dụng voucher
  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (code === 'ELITE20') {
      setDiscountPercent(20);
      showToast?.('Áp mã thành công', 'Giảm ngay 20% cho đơn đăng ký!', 'success');
    } else if (code === 'SUMMER30') {
      setDiscountPercent(30);
      showToast?.('Áp mã thành công', 'Giảm ngay 30% cho đơn đăng ký!', 'success');
    } else {
      setDiscountPercent(0);
      showToast?.('Mã không hợp lệ', 'Thử mã ELITE20 (-20%) hoặc SUMMER30 (-30%)', 'error');
    }
  };

  // Xác nhận gia hạn / mua gói
  const handleConfirmPurchase = (e) => {
    e.preventDefault();
    if (!selectedPackage) return;
    purchasePackage?.(selectedPackage, voucherCode, paymentGateway.toUpperCase());
    setSelectedPackage(null);
    setVoucherCode('');
    setDiscountPercent(0);
    showToast?.('Thanh toán thành công', `Đã xử lý giao dịch cho ${selectedPackage.name}`, 'success');
  };

  // HIỂN THỊ NÚT THAO TÁC THEO ĐÚNG CẤP ĐỘ HẠNG THẺ
  const renderPackageAction = (pkg) => {
    // 1. Gói Bổ Trợ PT (Không xét hạng thẻ)
    if (pkg.tier === 'PT Package') {
      return (
        <button
          type="button"
          onClick={() => setSelectedPackage(pkg)}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
        >
          <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
          <span>Mua Thêm Gói PT</span>
        </button>
      );
    }

    const pkgRank = getTierRank(pkg.tier, pkg.name);

    // 2. CÙNG CẤP ĐỘ HẠNG THẺ = GÓI ĐANG SỬ DỤNG (HIỆN NÚT GIA HẠN)
    if (pkgRank === currentRank) {
      return (
        <div className="space-y-2">
          <div className="w-full py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs uppercase text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>Gói Đang Sử Dụng</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPackage(pkg)}
            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <span className="material-symbols-outlined text-[18px]">autorenew</span>
            <span>Gia Hạn Gói Này</span>
          </button>
        </div>
      );
    }

    // 3. CẤP ĐỘ CAO HƠN = CHO PHÉP NÂNG CẤP
    if (pkgRank > currentRank) {
      return (
        <button
          type="button"
          onClick={() => setSelectedPackage(pkg)}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
        >
          <span className="material-symbols-outlined text-[18px]">upgrade</span>
          <span>Nâng Cấp Lên Gói Này</span>
        </button>
      );
    }

    // 4. CẤP ĐỘ THẤP HƠN = KHÓA
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs uppercase text-center cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined text-[18px]">lock</span>
        <span>Hạng Thấp Hơn Gói Hiện Tại</span>
      </button>
    );
  };

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        {/* Banner Tổng Quan Gói Hiện Tại */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                  GÓI ĐANG KÍCH HOẠT
                </span>
                {isHighestTier && (
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                    HẠNG VIP CAO NHẤT
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {plan.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-medium">
                <span>Hạn sử dụng: <strong className="text-white font-bold">{plan.expireDate}</strong></span>
                <span>•</span>
                <span>Thời gian còn lại: <strong className="text-orange-400 font-bold">{plan.remainingDays} ngày</strong></span>
                <span>•</span>
                <span>Buổi PT còn lại: <strong className="text-emerald-400 font-bold">{plan.remainingPTSessions} buổi</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPackage(membershipPackages[1])}
              className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 shrink-0 cursor-pointer transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">autorenew</span>
              <span>Gia Hạn Thẻ Hiện Tại</span>
            </button>
          </div>
        </div>

        {/* Danh Sách Các Gói Tập & Nâng Cấp */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase">
                Danh Sách Gói Tập & Đặc Quyền
              </h2>
              <p className="text-xs text-slate-500">
                Lựa chọn gia hạn thẻ hiện tại, nâng cấp đặc quyền VIP hoặc đăng ký thêm gói PT cá nhân.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {membershipPackages.map((pkg) => {
              const pkgRank = getTierRank(pkg.tier, pkg.name);
              const isCurrent = pkgRank === currentRank && pkg.tier !== 'PT Package';

              return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl p-6 bg-white border transition-all flex flex-col justify-between space-y-5 relative shadow-sm ${
                    isCurrent
                      ? 'border-2 border-orange-500 ring-4 ring-orange-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider">
                      {pkg.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {pkg.tier}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-2">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{pkg.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {formatVND(pkg.price)}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold"> / {pkg.period}</span>
                    </div>

                    <ul className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
                      {pkg.features.map((ft, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-orange-500 text-[16px]">check_circle</span>
                          <span>{ft}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    {renderPackageAction(pkg)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Thanh Toán Trực Tuyến */}
        {selectedPackage && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">credit_card</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">
                    Thanh Toán Gói Dịch Vụ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gói đăng ký: <strong className="text-slate-900">{selectedPackage.name}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmPurchase} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1">
                    Nhập mã Voucher giảm giá
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="VD: ELITE20, SUMMER30..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Giá gói niêm yết:</span>
                    <span className="font-mono">{formatVND(selectedPackage.price)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Giảm giá Voucher (-{discountPercent}%):</span>
                      <span className="font-mono">-{formatVND((selectedPackage.price * discountPercent) / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                    <span>Tổng tiền thanh toán:</span>
                    <span className="font-mono text-orange-600">
                      {formatVND(selectedPackage.price * (1 - discountPercent / 100))}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
                    Chọn cổng thanh toán trực tuyến
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'vnpay', name: 'VNPAY-QR' },
                      { id: 'momo', name: 'Ví MoMo' },
                      { id: 'vietqr', name: 'VietQR / Banking' },
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setPaymentGateway(gw.id)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          paymentGateway === gw.id
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {gw.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Xác Nhận Thanh Toán Ngay
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}