import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useApp } from '../context/AppContext';

export default function PricingPage() {
  const { showToast, addAuditLog } = useApp();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 3 Hạng thẻ thành viên
  const membershipTiers = [
    {
      name: 'Silver Member',
      tag: 'Phổ Biến',
      priceMonthly: '1.490.000',
      priceAnnual: '1.190.000',
      desc: 'Dành cho người mới bắt đầu muốn duy trì thể lực với đầy đủ tiện ích cơ bản.',
      benefits: [
        'Toàn quyền khu vực Gym & Fitness 24/7',
        'Tủ đồ cá nhân thông minh & Khăn tập cao cấp',
        'Giảm 10% khi đăng ký lớp thể thao chuyên biệt',
        'Giảm 15% khi thuê sân Pickleball & Tennis',
        '01 buổi đo InBody & tư vấn thể trạng ban đầu',
      ],
      isPopular: false,
      btnColor: 'bg-surface-container hover:bg-surface-container-high text-primary',
    },
    {
      name: 'Gold Member',
      tag: 'Khuyên Dùng · Best Value',
      priceMonthly: '2.790.000',
      priceAnnual: '2.230.000',
      desc: 'Đầy đủ đặc quyền luyện tập toàn diện cùng dịch vụ phục hồi 5 sao.',
      benefits: [
        'Tất cả quyền lợi của hạng Silver',
        'Sử dụng không giới hạn Bể bơi bốn mùa & Xông hơi Sauna',
        'Giảm 20% khi đăng ký lớp thể thao chuyên biệt',
        'Giảm 30% khi thuê sân giờ cao điểm',
        '02 buổi tập kèm 1-1 cùng Master Coach',
        'Đo InBody định kỳ 2 tuần/lần',
      ],
      isPopular: true,
      btnColor: 'bg-secondary-container hover:bg-secondary-fixed-dim text-primary font-bold shadow-md',
    },
    {
      name: 'Diamond VIP',
      tag: 'Đặc Quyền Tối Cao',
      priceMonthly: '4.490.000',
      priceAnnual: '3.590.000',
      desc: 'Trải nghiệm đỉnh cao với trợ lý riêng và đặc quyền phòng VIP khép kín.',
      benefits: [
        'Toàn quyền truy cập tất cả tiện ích & phòng tập VIP',
        'Miễn phí 4 lượt chơi Golf 3D Trackman/tháng',
        'Giảm 35% tất cả các lớp thể thao chuyên sâu',
        'Giảm 50% phí thuê sân Pickleball & Tennis',
        '04 buổi tập kèm 1-1 cùng Master Coach/tháng',
        'Phục vụ đồ uống dinh dưỡng & quầy Protein Bar',
      ],
      isPopular: false,
      btnColor: 'bg-primary hover:bg-slate-800 text-white font-bold',
    },
  ];

  // Các gói môn thể thao chuyên biệt
  const sportsPackages = [
    {
      id: 1,
      category: 'racket',
      title: 'Pickleball Clinic & Match Pass',
      tag: '10 Buổi · 30 Ngày',
      icon: 'sports_tennis',
      desc: 'Huấn luyện chiến thuật đánh đơn/đôi và cọ xát thực chiến có trọng tài.',
      priceOriginal: '2.500.000 ₫',
      priceSilver: '2.250.000 ₫',
      priceGold: '2.000.000 ₫',
      priceDiamond: '1.625.000 ₫',
      features: [
        'HLV chuyên nghiệp chứng chỉ PPR',
        'Sân có mái che chuẩn USAPA',
        'Ưu đãi đặt sân kèm đến -50%',
      ],
    },
    {
      id: 2,
      category: 'racket',
      title: 'Tennis High-Performance',
      tag: 'Khóa 12 Buổi',
      icon: 'sports_baseball',
      desc: 'Tập trung chỉnh đòn Forehand/Backhand uy lực và kỹ năng giao bóng thi đấu.',
      priceOriginal: '6.800.000 ₫',
      priceSilver: '6.120.000 ₫',
      priceGold: '5.440.000 ₫',
      priceDiamond: '4.420.000 ₫',
      features: [
        'HLV 1 kèm 1 theo sát từng pha bóng',
        'Đo tốc độ phát bóng bằng AI camera',
        'Mặt sân Plexipave chuẩn Grand Slam',
      ],
    },
    {
      id: 3,
      category: 'water',
      title: 'Bơi Lội Bốn Mùa Chuyên Sâu',
      tag: 'Vé Tháng 30 Lượt',
      icon: 'pool',
      desc: 'Tập luyện sức bền tim mạch, cải thiện nhịp thở và hoàn thiện kỹ thuật bơi.',
      priceOriginal: '1.800.000 ₫',
      priceSilver: '1.710.000 ₫',
      priceGold: '1.440.000 ₫',
      priceDiamond: '1.170.000 ₫',
      features: [
        'Bể bơi điện phân muối khoáng không mùi Clo',
        'Làn bơi 50m nhiệt độ chuẩn Olympic',
        'Chỉnh kỹ thuật sải tay & hơi thở chuyên sâu',
      ],
    },
    {
      id: 4,
      category: 'mindbody',
      title: 'Yoga & Pilates Reformer',
      tag: 'Gói 15 Buổi',
      icon: 'self_improvement',
      desc: 'Tái định hình cột sống, kích hoạt nhóm cơ lõi sâu và phục hồi chức năng.',
      priceOriginal: '3.200.000 ₫',
      priceSilver: '3.040.000 ₫',
      priceGold: '2.720.000 ₫',
      priceDiamond: '2.080.000 ₫',
      features: [
        'Dàn máy Pilates Allegro 2 cao cấp',
        'Lớp học giới hạn tối đa 6 học viên',
        'Phục hồi & trị liệu khớp chuyên sâu',
      ],
    },
    {
      id: 5,
      category: 'combat',
      title: 'Boxing & Muay Thai Kick',
      tag: 'Khóa 16 Buổi',
      icon: 'sports_mma',
      desc: 'Khai phóng phản xạ, đốt calo tối đa với sàn đấu tiêu chuẩn và găng Everlast Pro.',
      priceOriginal: '3.600.000 ₫',
      priceSilver: '3.240.000 ₫',
      priceGold: '2.880.000 ₫',
      priceDiamond: '2.340.000 ₫',
      features: [
        'Ring thi đấu chuẩn quốc tế WBA/WBC',
        'HLV võ thuật đạt đai đen & kiện tướng',
        'Trang bị bảo hộ đầu & băng quấn cao cấp',
      ],
    },
    {
      id: 6,
      category: 'other',
      title: 'Golf 3D Simulator Trackman',
      tag: '10 Buổi · Trackman 4',
      icon: 'sports_golf',
      desc: 'Phân tích góc nghiêng Swing, tốc độ xoáy bóng qua cảm biến Trackman 4 tân tiến.',
      priceOriginal: '5.500.000 ₫',
      priceSilver: '4.950.000 ₫',
      priceGold: '4.400.000 ₫',
      priceDiamond: '3.575.000 ₫',
      features: [
        'Phòng Golf 3D Trackman 4 & Bravo Golf',
        'Trải nghiệm giả lập hơn 150 sân PGA Tour',
        'HLV có chứng chỉ PGA chỉnh tư thế',
      ],
    },
  ];

  const filteredSports =
    selectedCategory === 'all'
      ? sportsPackages
      : sportsPackages.filter((p) => p.category === selectedCategory);

  const handleOpenCheckout = (item) => {
    setPaymentSuccess(false);
    setCheckoutModal(item);
  };

  const handleConfirmPayment = () => {
    setPaymentSuccess(true);
    const itemName = checkoutModal.name || checkoutModal.title;
    addAuditLog('Mua gói dịch vụ', `Đã thanh toán thành công gói ${itemName}`);
    showToast('Thanh toán thành công', `Chào mừng bạn gia nhập gói "${itemName}"! Mã đặt chỗ đã được gửi về SMS.`, 'success');
    setTimeout(() => {
      setCheckoutModal(null);
      setPaymentSuccess(false);
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-md text-on-surface">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-secondary font-bold px-2 py-0.5 rounded bg-secondary-container/20">
                  BẢNG GIÁ NIÊM YẾT
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                  OLYMPIC TRAINING TIERS
                </span>
              </div>
              <h1 className="font-headline-xl text-3xl sm:text-5xl uppercase tracking-tight text-primary font-bold">
                BẢNG GIÁ DỊCH VỤ & <span className="text-secondary">THẺ HỘI VIÊN ELITE</span>
              </h1>
              <p className="text-base text-slate-600 max-w-2xl">
                Lựa chọn gói hội viên phù hợp với lịch trình tập luyện của bạn. Tận hưởng đặc quyền cơ sở vật chất chuẩn Olympic, công nghệ đo lường sinh trắc học và hỗ trợ từ HLV chuyên nghiệp.
              </p>
            </div>

            {/* Toggle Billing (Monthly / Annual) */}
            <div className="p-1 rounded-xl bg-white border border-slate-200 flex items-center shadow-sm self-start lg:self-auto">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  !isAnnual
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo tháng
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isAnnual
                    ? 'bg-secondary-container text-primary font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Theo năm</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary text-secondary-container uppercase font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Section 1: 3 Hạng thẻ thành viên */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
              <span className="material-symbols-outlined text-secondary text-[24px]">
                workspace_premium
              </span>
              <h2 className="font-headline-sm text-xl uppercase text-primary font-bold">
                3 Hạng Thẻ Hội Viên Trung Tâm (Membership Tiers)
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {membershipTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl bg-white p-7 flex flex-col justify-between transition-all duration-300 relative shadow-sm hover:shadow-xl ${
                    tier.isPopular
                      ? 'border-2 border-secondary ring-4 ring-secondary-container/20'
                      : 'border border-slate-200'
                  }`}
                >
                  {tier.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-secondary-container text-primary text-[11px] font-bold uppercase tracking-wider shadow-sm">
                      {tier.tag}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-headline-sm text-2xl font-bold text-primary">
                        {tier.name}
                      </h3>
                      {!tier.isPopular && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                          {tier.tag}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">{tier.desc}</p>

                    <div className="flex items-baseline gap-1.5 mb-6">
                      <span className="text-3xl sm:text-4xl font-headline-xl font-bold text-primary">
                        {isAnnual ? tier.priceAnnual : tier.priceMonthly} ₫
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ tháng</span>
                    </div>

                    <div className="space-y-3 mb-8 pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Đặc quyền bao gồm:
                      </span>
                      <ul className="space-y-2.5 text-xs text-slate-700">
                        {tier.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">
                              check_circle
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleOpenCheckout({
                        title: tier.name,
                        type: 'Membership Tier',
                        price: (isAnnual ? tier.priceAnnual : tier.priceMonthly) + ' ₫ / tháng',
                      })
                    }
                    className={`w-full py-3 rounded-xl uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 ${tier.btnColor}`}
                  >
                    <span>Đăng Ký Ngay</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle Benefit Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-secondary-container/30 via-slate-50 to-white border-2 border-secondary-container mb-12 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    card_giftcard
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-secondary font-bold">
                    ĐẶC QUYỀN HỘI VIÊN LIÊN KẾT (BUNDLE BENEFIT)
                  </span>
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-primary uppercase">
                  Sở hữu Thẻ Hội Viên để nhận chiết khấu lên đến 35% cho tất cả các môn & sân bãi
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Hội viên Silver: -10% lớp / -15% sân • Hội viên Gold: -20% lớp / -30% sân • Hội viên Diamond: -35% lớp / -50% sân.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                  Silver: -10%
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-secondary-container text-primary text-xs font-bold shadow-sm">
                  Gold: -20%
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                  Diamond: -35%
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Gói Thể Thao Bán Theo Bộ Môn */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-secondary font-bold px-2 py-0.5 rounded bg-secondary-container/20">
                  KHÓA TẬP & THẺ LƯỢT CHUYÊN SÂU
                </span>
                <h2 className="font-headline-lg text-2xl uppercase tracking-tight text-primary font-bold mt-1">
                  Gói Thể Thao Chuyên Biệt
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Chương trình đào tạo chuyên sâu và thẻ lượt dành riêng cho từng bộ môn thể thao với HLV chuyên nghiệp và đo lường chuyên biệt.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'racket', label: 'Môn Vợt' },
                  { id: 'water', label: 'Dưới Nước' },
                  { id: 'mindbody', label: 'Yoga & Pilates' },
                  { id: 'combat', label: 'Võ thuật' },
                  { id: 'other', label: 'Golf 3D' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Sports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSports.map((sp) => (
                <div
                  key={sp.id}
                  className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded text-[11px] uppercase tracking-wider text-secondary bg-secondary-container/20 font-bold">
                        {sp.tag}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-secondary-container flex items-center justify-center text-primary transition-colors">
                        <span className="material-symbols-outlined text-[22px]">{sp.icon}</span>
                      </div>
                    </div>

                    <h3 className="font-headline-sm text-lg uppercase text-primary font-bold mb-1">
                      {sp.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{sp.desc}</p>

                    {/* Price comparison box */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Giá khách lẻ:</span>
                        <span className="line-through font-semibold">{sp.priceOriginal}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Hội viên Silver (-10%):</span>
                        <span className="font-semibold">{sp.priceSilver}</span>
                      </div>
                      <div className="flex justify-between text-secondary font-bold">
                        <span>Hội viên Gold (-20%):</span>
                        <span className="font-headline-sm text-sm text-primary">{sp.priceGold}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                        <span>Hội viên Diamond (-35%):</span>
                        <span>{sp.priceDiamond}</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-700 mb-6">
                      {sp.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            check_circle
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() =>
                      handleOpenCheckout({
                        title: sp.title,
                        type: 'Gói Bộ Môn',
                        price: sp.priceGold,
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-secondary-container text-primary text-xs uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Đăng Ký Gói Bộ Môn</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Checkout Modal (VietQR / VNPay Sandbox Simulation) */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setCheckoutModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {paymentSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <h3 className="font-headline-sm text-xl font-bold text-slate-900">
                  Thanh Toán Thành Công!
                </h3>
                <p className="text-xs text-slate-600">
                  Gói <strong>{checkoutModal.title}</strong> đã được kích hoạt trên hệ thống. Hóa đơn điện tử đã gửi tới email của bạn.
                </p>
                <div className="pt-4">
                  <span className="text-xs text-secondary font-bold uppercase tracking-wider animate-pulse">
                    Đang đồng bộ hồ sơ hội viên...
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-primary font-bold text-[10px] uppercase">
                    {checkoutModal.type}
                  </span>
                  <span className="text-xs text-slate-400">Cổng Thanh Toán Trực Tuyến</span>
                </div>

                <h3 className="font-headline-sm text-xl font-bold text-primary mb-1">
                  {checkoutModal.title}
                </h3>
                <div className="text-2xl font-bold text-secondary mb-4">
                  {checkoutModal.price}
                </div>

                {/* QR Code Demo */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center mb-4">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ELITE_SPORTS_PAYMENT_SANDBOX_2026"
                    alt="VietQR Payment"
                    className="w-36 h-36 mx-auto rounded-lg shadow-sm mb-2"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">
                    Quét mã VietQR / MoMo / VNPay để thanh toán tự động
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Đơn vị thụ hưởng:</span>
                    <strong className="text-slate-900">ELITE SPORTS CENTER CORP</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Nội dung CK:</span>
                    <strong className="font-mono text-primary">ELT2026 8924</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckoutModal(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase shadow-md flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Xác Nhận Đã Chuyển</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
