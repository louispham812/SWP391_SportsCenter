import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPublicFacilities, getPublicSports } from '../services/publicContentApi';
import { getSportMedia, getFacilityMedia, DEFAULT_SPORT_IMG } from '../utils/mediaMap';

export default function LandingPage() {
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchPublicContent = () => {
    setIsContentLoading(true);
    setLoadError('');

    Promise.all([getPublicSports(), getPublicFacilities()])
      .then(([sportsData, facilitiesData]) => {
        setSports(Array.isArray(sportsData) ? sportsData : []);
        setFacilities(Array.isArray(facilitiesData) ? facilitiesData : []);
      })
      .catch((err) => {
        console.error('Lỗi khi tải dữ liệu trang chủ từ máy chủ backend:', err);
        setLoadError('Không thể tải dữ liệu trực tiếp từ máy chủ backend. Vui lòng kiểm tra kết nối dịch vụ.');
        setSports([]);
        setFacilities([]);
      })
      .finally(() => {
        setIsContentLoading(false);
      });
  };

  useEffect(() => {
    fetchPublicContent();
  }, []);

  const metrics = [
    { value: '15.000m²', label: 'Diện tích quy hoạch', icon: 'aspect_ratio' },
    { value: '10 Bộ Môn', label: 'Chuẩn Olympic & ITF', icon: 'stadium' },
    { value: '16 Tiện Ích', label: 'Cơ sở & Sân thi đấu', icon: 'workspace_premium' },
    { value: '24/7', label: 'Check-in RFID & AI Smart', icon: 'schedule' },
  ];

  const highlights = [
    { title: 'Công Nghệ AI Smart System', desc: 'Đo InBody 770, tự động phân tích chỉ số thể trạng và đề xuất giáo án cá nhân hóa.', icon: 'smart_toy' },
    { title: 'Thiết Bị Technogym Nhập Khẩu', desc: '100% máy tập thế hệ mới nhập khẩu nguyên chiếc từ Ý đạt chuẩn Olympic.', icon: 'fitness_center' },
    { title: 'Huấn Luyện Viên Quốc Tế', desc: 'Đội ngũ HLV giàu kinh nghiệm trực tiếp hướng dẫn kỹ thuật 1:1 và lớp nhóm.', icon: 'verified' },
    { title: 'Khu Phục Hồi & Locker RFID', desc: 'Phòng xông hơi Sauna khô/ướt kết hợp tủ đồ RFID bảo mật tuyệt đối.', icon: 'hot_tub' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        
        {/* ================= 1. HERO SECTION ================= */}
        <section className="relative w-full overflow-hidden bg-white pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div
              className="w-full h-full bg-cover bg-center opacity-10"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Nội dung Banner bên trái */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  F Sport Center · Trung Tâm Thể Thao Đa Năng
                </div>

                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-normal text-slate-900 leading-[1.35] sm:leading-[1.35] lg:leading-[1.35]"
                  style={{ lineHeight: 1.35 }}
                >
                  Tổ Hợp Thể Thao <br />
                  <span className="inline-block pt-3.5 -mt-3.5 pb-1.5 -mb-1.5 bg-gradient-to-r from-[#FF6B00] via-[#FFA04D] to-[#FF3D00] bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(255,107,0,0.25)]">
                    Đẳng Cấp &amp; Đa Năng
                  </span> <br />
                  <span className="relative inline-block pb-3">
                    Chuẩn Quốc Tế
                    <span className="absolute bottom-0 left-0 w-28 sm:w-36 h-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FFA04D] shadow-xs"></span>
                  </span>
                </h1>

                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                  Trải nghiệm hệ thống sân thi đấu Pickleball, Tennis, Bóng đá, Cầu lông, Bơi lội và Gym Technogym thế hệ mới. Hệ thống quản lý thông minh với check-in RFID và trợ lý huấn luyện AI Assistant.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-all text-center cursor-pointer"
                  >
                    <span>Xem Gói Hội Viên</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>

                  <Link
                    to="/member/book"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all text-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-orange-400">calendar_month</span>
                    <span>Đặt Sân / Lịch Tập</span>
                  </Link>
                </div>

              </div>

              {/* Card hình ảnh nổi bật bên phải */}
              <div className="lg:col-span-5 relative hidden lg:block">
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 shadow-xl group">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop"
                    alt="F Sport Sanctuary"
                    className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_SPORT_IMG;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded-md border border-orange-500/30">
                      STANDARD OLYMPIC
                    </span>
                    <h3 className="text-lg font-black uppercase">Cụm Sân Pro &amp; Gym Zone</h3>
                  </div>
                </div>
              </div>

            </div>

            {/* 4 Thẻ KPI Chỉ Số */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4 hover:border-orange-300 transition-all"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-bold">
                    <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg sm:text-xl font-black text-slate-900 font-mono leading-tight">{m.value}</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 truncate font-bold mt-0.5">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* ================= 2. KHÁM PHÁ CÁC BỘ MÔN THỂ THAO ================= */}
        <section id="bo-mon" className="py-10 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                CHƯƠNG TRÌNH HUẤN LUYỆN
              </span>
              <h2
                className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-normal leading-[1.32] sm:leading-[1.32] mt-2"
                style={{ lineHeight: 1.32 }}
              >
                Khám Phá Các <span className="inline-block pt-2 -mt-2 pb-1 -mb-1 bg-gradient-to-r from-[#FF6B00] to-[#FF8533] bg-clip-text text-transparent">Bộ Môn Thể Thao</span>
              </h2>
            </div>

            <Link
              to="/sports"
              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-xs uppercase tracking-wider font-black group"
            >
              <span>Xem tất cả bộ môn</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
              <span className="material-symbols-outlined text-red-500 text-[32px]">warning</span>
              <p className="text-xs font-bold text-red-800">{loadError}</p>
              <button
                onClick={fetchPublicContent}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer"
              >
                Tải lại
              </button>
            </div>
          )}

          {isContentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs space-y-3">
                  <div className="w-full h-44 skeleton-shimmer"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 skeleton-shimmer rounded w-1/3"></div>
                    <div className="h-6 skeleton-shimmer rounded w-2/3"></div>
                    <div className="h-3 skeleton-shimmer rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {sports.map((sport) => {
                const media = getSportMedia(sport.slug);
                return (
                  <article
                    key={sport.sportId || sport.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-2xs card-hover group"
                  >
                    <div>
                      {/* Hình ảnh minh họa bắt mắt */}
                      <div className="relative w-full h-44 overflow-hidden bg-slate-100">
                        <img
                          src={media.image}
                          alt={sport.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_SPORT_IMG;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                        
                        {/* Tag góc trên */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                            {sport.tag || 'HOT'}
                          </span>
                        </div>

                        {/* Icon & Specs góc dưới ảnh */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                            <span className="material-symbols-outlined text-[18px]">
                              {sport.icon || 'sports_tennis'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-white drop-shadow-sm truncate max-w-[150px]">
                            {sport.area || 'Tiêu chuẩn'}
                          </span>
                        </div>
                      </div>

                      {/* Nội dung card */}
                      <div className="p-5 space-y-2">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase">
                          {sport.name}
                        </h3>
                        {sport.subtitle && (
                          <p className="text-[10px] uppercase tracking-wider text-orange-600 font-bold">
                            {sport.subtitle}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
                          {sport.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer card */}
                    <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                      <Link
                        to={`/sports/${sport.slug}`}
                        className="text-orange-600 font-black uppercase flex items-center gap-0.5 hover:text-orange-700 transition-colors"
                      >
                        <span>Chi tiết</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </Link>

                      <Link
                        to="/member/book"
                        className="px-3.5 py-2 min-h-[36px] inline-flex items-center rounded-lg bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 text-[10px] font-black uppercase tracking-wider transition-colors"
                      >
                        Đặt Sân
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>


        {/* ================= 3. TIỆN ÍCH & CƠ SỞ VẬT CHẤT ================= */}
        <section id="tien-ich" className="py-10 lg:py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  CƠ SỞ VẬT CHẤT TIÊU CHUẨN 5 SAO
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-normal leading-[1.32] sm:leading-[1.32] mt-2"
                  style={{ lineHeight: 1.32 }}
                >
                  Hệ Thống <span className="inline-block pt-2 -mt-2 pb-1 -mb-1 bg-gradient-to-r from-[#FF6B00] to-[#FF8533] bg-clip-text text-transparent">Tiện Ích &amp; Sân Bãi</span>
                </h2>
              </div>

              <Link
                to="/facilities"
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-xs uppercase tracking-wider font-black group"
              >
                <span>Xem tất cả tiện ích</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>

            {isContentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-50 rounded-3xl p-5 space-y-3">
                    <div className="w-12 h-12 skeleton-shimmer rounded-xl"></div>
                    <div className="h-5 skeleton-shimmer rounded w-2/3"></div>
                    <div className="h-3 skeleton-shimmer rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : facilities.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center space-y-2">
                <span className="material-symbols-outlined text-[36px] text-slate-400">stadium</span>
                <p className="text-xs font-bold text-slate-600">
                  Hệ thống đang đồng bộ danh mục cơ sở vật chất. Vui lòng quay lại sau ít phút.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {facilities.slice(0, 8).map((facility) => {
                  const media = getFacilityMedia(facility.slug);
                  return (
                    <Link
                      key={facility.facilityId || facility.id}
                      to={`/facilities/${facility.slug}`}
                      className="bg-slate-50 rounded-3xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs card-hover group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-orange-500 flex items-center justify-center font-bold shadow-2xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[24px]">
                              {facility.icon || 'stadium'}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100/70 px-2.5 py-0.5 rounded-md">
                            {facility.highlight || media.badge}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                            {facility.name}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1 line-clamp-3">
                            {facility.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-black text-orange-600 uppercase">
                        <span>Chi tiết cơ sở</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>


        {/* ================= 4. TẠI SAO CHỌN F SPORT CENTER? ================= */}
        <section className="py-10 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              GIÁ TRỊ VƯỢT TRỘI
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-normal leading-[1.32] sm:leading-[1.32]"
              style={{ lineHeight: 1.32 }}
            >
              Tại Sao Chọn <span className="inline-block pt-2 -mt-2 pb-1 -mb-1 bg-gradient-to-r from-[#FF6B00] to-[#FF8533] bg-clip-text text-transparent">F Sport Center</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs card-hover"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                </div>
                <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ================= 5. BANNER CTA GÓI TẬP ================= */}
        <section className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/60 p-8 lg:p-12 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="space-y-3 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                  ĐẶC QUYỀN HỘI VIÊN
                </span>
                <h2
                  className="text-2xl sm:text-4xl font-black uppercase text-white tracking-normal leading-[1.32] sm:leading-[1.32]"
                  style={{ lineHeight: 1.32 }}
                >
                  Sẵn Sàng Rèn Luyện Cùng <span className="inline-block pt-2 -mt-2 pb-1 -mb-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">F Sport Center</span>?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Đăng ký gói tập ngay hôm nay để nhận ưu đãi đặc quyền cho hội viên mới và lượt đo InBody 770 miễn phí!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Link
                  to="/pricing"
                  className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all text-center cursor-pointer"
                >
                  Đăng Ký Gói Tập Ngay
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all text-center cursor-pointer"
                >
                  Đăng Nhập Tài Khoản
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}