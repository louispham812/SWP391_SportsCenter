import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPublicFacilities, getPublicSports } from '../services/publicContentApi';

export default function LandingPage() {
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    let isActive = true;
    Promise.all([getPublicSports(), getPublicFacilities()])
      .then(([sportsData, facilitiesData]) => {
        if (!isActive) return;
        setSports(sportsData);
        setFacilities(facilitiesData);
      })
      .catch((error) => {
        if (isActive) setContentError(error.message || 'Không thể tải nội dung trang chủ.');
      })
      .finally(() => {
        if (isActive) setIsContentLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const metrics = [
    { value: '5.000+', label: 'Hội viên năng động', icon: 'groups' },
    { value: '12+ Sân', label: 'Pickleball & Tennis', icon: 'sports_tennis' },
    { value: '100%', label: 'HLV Quốc tế NASM/ACE', icon: 'verified' },
    { value: '24/7', label: 'Mở cửa linh hoạt', icon: 'schedule' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-md text-on-surface">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-white -mt-20 pt-32 pb-16 lg:pb-24 border-b border-slate-200/80">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center scale-105 opacity-20"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl pt-8 lg:pt-12 pb-8">
              {/* Live Tag Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(80,102,0,0.4)] animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-widest text-primary font-bold">
                  TỔ HỢP THỂ THAO ĐẲNG CẤP 5 SAO
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-6xl text-primary tracking-tight uppercase mb-6 leading-tight font-bold">
                Đánh Thức <br className="hidden sm:inline" />
                <span className="text-secondary bg-secondary-container/30 px-2 py-0.5 rounded-md underline decoration-secondary-container decoration-4 underline-offset-8">
                  Tiềm Năng
                </span>{' '}
                Thể Thao Của Bạn
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed">
                Tổ hợp phòng tập Gym, Yoga, cụm sân Pickleball & Tennis chuẩn quốc tế ngay tại trung tâm thành phố. Thiết kế tối ưu hiệu suất với hệ thống AI quản lý thông minh.
              </p>

              {/* CTA Cluster */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/pricing"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-secondary-container text-primary text-[14px] uppercase tracking-wider font-bold shadow-md hover:bg-secondary-fixed-dim hover:shadow-lg transition-all"
                >
                  <span>Đăng ký gói tập ngay</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/member/schedule"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-[14px] uppercase tracking-wider font-semibold shadow-sm hover:bg-slate-50 hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    calendar_today
                  </span>
                  <span>Xem lịch học</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary-container/25 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-md text-xl font-bold text-primary">{m.value}</div>
                    <div className="text-[12px] text-slate-500 truncate font-medium">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPORTS & SERVICES SECTION */}
        <section id="bo-mon" className="w-full bg-background py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-1 bg-secondary rounded-full"></span>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                    CHƯƠNG TRÌNH HUẤN LUYỆN
                  </span>
                </div>
                <h2 className="font-headline-xl text-3xl font-bold text-primary uppercase">
                  Khám Phá Các Bộ Môn
                </h2>
                <p className="text-base text-slate-600 mt-2 max-w-xl">
                  Không gian rèn luyện chuẩn mực quốc tế với trang thiết bị tối tân, thiết kế chuyên biệt cho từng trải nghiệm.
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <Link
                  to="/sports"
                  className="inline-flex items-center gap-1 text-primary text-[13px] uppercase tracking-wider hover:text-secondary transition-colors font-bold group"
                >
                  <span>Xem tất cả bộ môn</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    arrow_outward
                  </span>
                </Link>
              </div>
            </div>

            {/* Grid Cards */}
            {contentError && (
              <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                Không thể tải danh sách bộ môn: {contentError}
              </p>
            )}
            {isContentLoading ? (
              <p role="status" className="py-6 text-slate-600">Đang tải bộ môn...</p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sports.map((sport) => (
                <div
                  key={sport.sportId}
                  className="group relative rounded-xl bg-white p-6 flex flex-col justify-between border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-primary group-hover:bg-secondary-container group-hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-[28px]">{sport.icon}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] uppercase font-semibold">
                        {sport.tag}
                      </span>
                    </div>

                    <h3 className="font-headline-sm text-lg text-primary mb-1 group-hover:text-secondary transition-colors font-bold">
                      {sport.name}
                    </h3>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                      {sport.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {sport.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      {sport.area}
                    </span>
                    <Link
                      to={`/sports/${sport.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-secondary group-hover:translate-x-1 transition-transform uppercase tracking-wider font-bold"
                    >
                      <span>Chi tiết</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section id="tien-ich" className="w-full bg-white py-16 lg:py-24 relative border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] uppercase tracking-widest text-secondary inline-block mb-3 font-bold">
                GIÁ TRỊ KHÁC BIỆT
              </span>
              <h2 className="font-headline-xl text-3xl font-bold text-primary uppercase">
                Tại Sao Chọn Elite Sports?
              </h2>
              <p className="text-base text-slate-600 mt-2">
                Trải nghiệm vượt trội kiến tạo từ sự chuyên nghiệp, chuẩn mực dịch vụ quốc tế và công nghệ quản trị hiện đại.
              </p>
            </div>

            {contentError && (
              <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                Không thể tải danh sách tiện ích: {contentError}
              </p>
            )}
            {isContentLoading ? (
              <p role="status" className="py-6 text-slate-600">Đang tải tiện ích...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {facilities.map((facility) => (
                  <Link
                    key={facility.facilityId}
                    to={`/facilities/${facility.slug}`}
                    className="group p-8 rounded-2xl bg-surface-container-low border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-secondary mb-6 shadow-sm">
                        <span className="material-symbols-outlined text-[32px]">{facility.icon}</span>
                      </div>
                      <h3 className="font-headline-md text-xl text-primary mb-2 font-bold group-hover:text-secondary">
                        {facility.name}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{facility.description}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-secondary text-xs uppercase tracking-wider font-bold">
                      <span className="material-symbols-outlined text-[16px]">{facility.icon}</span>
                      <span>{facility.highlight}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-8 text-center">
              <Link to="/facilities" className="font-bold text-emerald-800 hover:underline">
                Khám phá tất cả tiện ích →
              </Link>
            </div>
          </div>
        </section>

        {/* PROMOTION BANNER CTA */}
        <section className="w-full bg-background py-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary to-[#0f243d] p-8 lg:p-14 overflow-hidden shadow-2xl text-white">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-secondary-container text-primary text-[11px] uppercase tracking-wider font-bold mb-4 shadow-sm">
                    GÓI HỘI VIÊN
                  </div>
                  <h2 className="font-headline-xl text-2xl sm:text-4xl text-white uppercase leading-tight mb-3 font-bold">
                    Tìm gói tập phù hợp với lịch trình của bạn
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 mb-6">
                    Giá, thời hạn và tình trạng mở bán được cập nhật từ cơ sở dữ liệu.
                  </p>

                  <p className="text-xs sm:text-sm text-slate-100">
                    Xem danh sách gói đang mở bán và chi tiết đăng ký tại trang bảng giá.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3 shrink-0 justify-center">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-secondary-container text-primary text-[14px] uppercase tracking-wider font-bold shadow-lg hover:bg-secondary-fixed-dim transition-all text-center"
                  >
                    <span>Xem Bảng Giá Gói Tập</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>

                  <Link
                    to="/member"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[13px] uppercase tracking-wider font-semibold transition-all text-center backdrop-blur-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] text-secondary-container">
                      sports_score
                    </span>
                    <span>Vào Cổng Hội Viên</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
