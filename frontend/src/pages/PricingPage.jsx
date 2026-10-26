import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/apiClient';
import { getPublicPackages } from '../services/publicContentApi';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(price || 0);

export default function PricingPage() {
  const { currentUser, currentRole, showToast } = useApp();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPackageId, setSavingPackageId] = useState(null);
  const [error, setError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');

  const fetchPackages = () => {
    setLoading(true);
    setError('');
    getPublicPackages()
      .then((rows) => {
        setPackages(Array.isArray(rows) ? rows : []);
      })
      .catch((requestError) => {
        console.error('Lỗi khi tải gói tập từ máy chủ:', requestError);
        setError(requestError.message || 'Không thể kết nối đến máy chủ để tải bảng giá.');
        setPackages([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPackages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePurchase = async (membershipPackage) => {
    if (!currentUser) {
      navigate('/login', { state: { notice: 'Vui lòng đăng nhập tài khoản hội viên để đăng ký gói tập.' } });
      return;
    }

    setSavingPackageId(membershipPackage.packageId);
    setError('');
    setPurchaseMessage('');
    try {
      const result = await apiRequest('/members/me/memberships', {
        method: 'POST',
        body: JSON.stringify({ packageId: membershipPackage.packageId }),
      });
      const message = `Đã ghi nhận yêu cầu đăng ký "${result.packageName}". Trạng thái thanh toán: ${result.paymentStatus}.`;
      setPurchaseMessage(message);
      showToast('Đăng ký gói thành công', message, 'success');
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo yêu cầu đăng ký gói tập.');
    } finally {
      setSavingPackageId(null);
    }
  };

  const getAccessBadge = (accessType) => {
    switch (accessType) {
      case 'ALL_DAY':
        return { label: 'Toàn thời gian (All-Day)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'OFF_PEAK':
        return { label: 'Khung giờ tiết kiệm (Off-Peak)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'PEAK':
        return { label: 'Giờ cao điểm (Peak Time)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: accessType || 'Gói tập hội viên', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="w-full flex-1 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Trang Bảng Giá */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              BẢNG GIÁ HỘI VIÊN • F SPORT CENTER
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Chọn Gói Tập <span className="text-orange-500">Phù Hợp Với Bạn</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Dữ liệu giá và thời hạn cập nhật trực tiếp theo thời gian thực từ cơ sở dữ liệu hệ thống. Không phụ phí ẩn, tích hợp đặc quyền đo InBody và tiện ích 5 sao.
            </p>
          </div>

          {/* Thông báo thông tin / lỗi */}
          {error && (
            <div role="alert" className="mb-6 max-w-2xl mx-auto rounded-2xl border border-red-200 bg-red-50 p-4 text-center space-y-2">
              <p className="text-xs font-bold text-red-800">{error}</p>
              <button
                onClick={fetchPackages}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer"
              >
                Tải lại bảng giá
              </button>
            </div>
          )}

          {purchaseMessage && (
            <div role="status" className="mb-6 max-w-2xl mx-auto rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-xs font-bold text-emerald-800">{purchaseMessage}</p>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <div className="h-4 skeleton-shimmer rounded w-1/3"></div>
                  <div className="h-8 skeleton-shimmer rounded w-3/4"></div>
                  <div className="h-10 skeleton-shimmer rounded w-1/2"></div>
                  <div className="h-20 skeleton-shimmer rounded"></div>
                  <div className="h-12 skeleton-shimmer rounded-xl"></div>
                </div>
              ))}
            </div>
          )}

          {/* Khi dữ liệu rỗng */}
          {!loading && !error && packages.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 max-w-md mx-auto">
              <span className="material-symbols-outlined text-[48px] text-slate-300">loyalty</span>
              <p className="text-sm font-bold text-slate-700">
                Hiện tại hệ thống chưa mở bán gói tập trực tuyến.
              </p>
              <p className="text-xs text-slate-500">
                Vui lòng liên hệ trực tiếp quầy Lễ tân hoặc quay lại sau.
              </p>
            </div>
          )}

          {/* Lưới hiển thị các gói tập từ database */}
          {!loading && packages.length > 0 && (
            <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg, idx) => {
                const badgeInfo = getAccessBadge(pkg.accessType);
                const isFeatured = idx === 0 || pkg.name.toLowerCase().includes('vip') || pkg.name.toLowerCase().includes('diamond');

                return (
                  <article
                    key={pkg.packageId}
                    className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative card-hover ${
                      isFeatured
                        ? 'bg-slate-900 text-white border-2 border-orange-500 shadow-xl'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {isFeatured && (
                      <span className="absolute -top-3.5 left-8 px-4 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        GÓI PHỔ BIẾN NHẤT
                      </span>
                    )}

                    <div className="space-y-6">
                      {/* Huy hiệu thời gian truy cập */}
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${badgeInfo.color}`}>
                          {badgeInfo.label}
                        </span>
                        <h2 className={`mt-3 text-xl sm:text-2xl font-black uppercase tracking-tight ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                          {pkg.name}
                        </h2>
                      </div>

                      {/* Giá tiền */}
                      <div className="border-b border-slate-200/40 pb-6">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl sm:text-4xl font-black ${isFeatured ? 'text-orange-400' : 'text-slate-900'}`}>
                            {formatPrice(pkg.price)}
                          </span>
                          <span className={`text-xs font-bold ${isFeatured ? 'text-slate-400' : 'text-slate-500'}`}>
                            / {pkg.durationDays} ngày
                          </span>
                        </div>
                      </div>

                      {/* Mô tả & Quyền lợi */}
                      <div className="space-y-3">
                        <p className={`text-xs font-bold uppercase tracking-wider ${isFeatured ? 'text-slate-300' : 'text-slate-500'}`}>
                          Đặc quyền bao gồm:
                        </p>
                        
                        <div className="space-y-2 text-xs font-medium">
                          {pkg.description ? (
                            <p className={`leading-relaxed whitespace-pre-line ${isFeatured ? 'text-slate-300' : 'text-slate-600'}`}>
                              {pkg.description}
                            </p>
                          ) : (
                            <p className={isFeatured ? 'text-slate-400' : 'text-slate-500'}>
                              Trọn quyền luyện tập và sử dụng tiện ích theo quy định của gói.
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-2">
                            <span className="material-symbols-outlined text-orange-500 text-[18px]">check_circle</span>
                            <span className={isFeatured ? 'text-slate-200' : 'text-slate-700'}>
                              Check-in tự động RFID &amp; QR
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500 text-[18px]">check_circle</span>
                            <span className={isFeatured ? 'text-slate-200' : 'text-slate-700'}>
                              Miễn phí đo InBody 770
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500 text-[18px]">check_circle</span>
                            <span className={isFeatured ? 'text-slate-200' : 'text-slate-700'}>
                              Tủ Locker thông minh &amp; phòng tắm nóng lạnh
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động Đăng Ký */}
                    <div className="pt-8">
                      {currentRole === 'member' ? (
                        <button
                          type="button"
                          disabled={savingPackageId !== null}
                          onClick={() => handlePurchase(pkg)}
                          className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            isFeatured
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                              : 'bg-slate-900 hover:bg-orange-500 text-white'
                          }`}
                        >
                          {savingPackageId === pkg.packageId ? 'Đang gửi yêu cầu...' : 'Đăng Ký Gói Này'}
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className={`block w-full py-3.5 px-4 rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                            isFeatured
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                              : 'bg-slate-900 hover:bg-orange-500 text-white'
                          }`}
                        >
                          Đăng Nhập Để Đăng Ký
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* Phần hỏi đáp nhanh FAQ */}
          <section className="mt-20 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-2xs space-y-6">
            <h3 className="text-xl font-black uppercase text-slate-900 text-center">
              Câu Hỏi Thường Gặp Về Gói Tập
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">Gói tập có tự động gia hạn không?</h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Không, hệ thống không tự động trừ tiền. Hội viên chủ động gia hạn hoặc thanh toán tại quầy lễ tân khi hết hạn gói.
                </p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">Tôi có thể bảo lưu gói tập khi bận không?</h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Có, hội viên được bảo lưu tối đa 30 ngày cho các gói từ 3 tháng trở lên. Vui lòng liên hệ Lễ tân để được hỗ trợ.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
