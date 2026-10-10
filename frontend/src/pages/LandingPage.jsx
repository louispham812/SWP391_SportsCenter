import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LandingPage() {
  const sports = [
    {
      title: 'Gym & Fitness',
      subtitle: 'Trang thiết bị hiện đại',
      tag: 'Olympic Spec',
      tagColor: 'bg-slate-100 text-slate-700',
      desc: 'Máy tập Technogym & Hammer Strength nhập khẩu nguyên chiếc, khu tạ tự do chuẩn Olympic tải trọng lớn kèm đo lường điện tử.',
      icon: 'fitness_center',
      area: 'Khu vực 800m²',
      link: '/pricing',
    },
    {
      title: 'Sân Pickleball',
      subtitle: 'Cụm 5 sân có mái che',
      tag: 'Hot Trend',
      tagColor: 'bg-secondary-container/30 text-secondary border border-secondary/20',
      desc: 'Mặt sân US Open Pro Cushion giảm chấn chấn thương khớp, hệ thống đèn LED chống chói 500 Lux phục vụ thi đấu cả ngày lẫn đêm.',
      icon: 'sports_tennis',
      area: 'Đạt chuẩn USAPA',
      link: '/pricing',
    },
    {
      title: 'Quần Vợt Tennis',
      subtitle: 'Sân chuẩn thi đấu',
      tag: 'Chuẩn ITF',
      tagColor: 'bg-slate-100 text-slate-700',
      desc: 'Mặt sân đất nện nhân tạo & sân cứng Plexipave cao cấp. Tích hợp máy bắn bóng tự động và phòng thay đồ V.I.P khép kín.',
      icon: 'sports_baseball',
      area: '7 Sân Quốc Tế',
      link: '/pricing',
    },
    {
      title: 'Yoga & Pilates',
      subtitle: 'Không gian tĩnh lặng',
      tag: 'Phục Hồi',
      tagColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      desc: 'Phòng tập cách âm tràn ngập ánh sáng tự nhiên với hệ thống máy Reformer nhập khẩu nguyên chiếc từ Đức và hương thảo mộc an lành.',
      icon: 'self_improvement',
      area: 'Lớp Tối Đa 8 Người',
      link: '/pricing',
    },
  ];

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
                  to="/pricing"
                  className="inline-flex items-center gap-1 text-primary text-[13px] uppercase tracking-wider hover:text-secondary transition-colors font-bold group"
                >
                  <span>Xem Bảng giá toàn bộ môn</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    arrow_outward
                  </span>
                </Link>
              </div>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sports.map((sport, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl bg-white p-6 flex flex-col justify-between border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-primary group-hover:bg-secondary-container group-hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-[28px]">{sport.icon}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-[11px] uppercase font-semibold ${sport.tagColor}`}>
                        {sport.tag}
                      </span>
                    </div>

                    <h3 className="font-headline-sm text-lg text-primary mb-1 group-hover:text-secondary transition-colors font-bold">
                      {sport.title}
                    </h3>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                      {sport.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {sport.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      {sport.area}
                    </span>
                    <Link
                      to={sport.link}
                      className="inline-flex items-center gap-1 text-xs text-secondary group-hover:translate-x-1 transition-transform uppercase tracking-wider font-bold"
                    >
                      <span>Chi tiết</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-surface-container-low border border-slate-200 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-secondary mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">access_time</span>
                  </div>
                  <h3 className="font-headline-md text-xl text-primary mb-2 font-bold">
                    Mở Cửa 24/7 Linh Hoạt
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Tập luyện bất kỳ lúc nào bạn muốn. Hệ thống check-in quầy và QR bảo mật giúp hội viên chủ động lịch biểu mà không cần thủ tục rườm rà.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-secondary text-xs uppercase tracking-wider font-bold">
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  <span>Check-in tự động 0.3s</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-white border-2 border-secondary/50 flex flex-col justify-between relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-24 h-1.5 bg-secondary-container"></div>
                <div>
                  <div className="w-14 h-14 rounded-xl bg-secondary-container/20 border border-secondary/20 flex items-center justify-center text-secondary mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">badge</span>
                  </div>
                  <h3 className="font-headline-md text-xl text-primary mb-2 font-bold">
                    Đội Ngũ HLV Chuyên Nghiệp
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    100% huấn luyện viên có chứng chỉ quốc tế NASM, ACE, ITF và kinh nghiệm thi đấu. Giáo án rèn luyện được cá nhân hóa và gợi ý bằng AI chuyên sâu.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-secondary text-xs uppercase tracking-wider font-bold">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>Kèm 1-1 chuyên sâu</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-surface-container-low border border-slate-200 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-secondary mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                  </div>
                  <h3 className="font-headline-md text-xl text-primary mb-2 font-bold">
                    Hệ Thống AI Thông Minh
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Trợ lý ảo hỗ trợ giải đáp thắc mắc, phân tích chỉ số thể trạng và tự động đề xuất lộ trình rèn luyện tối ưu cho từng hội viên.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-secondary text-xs uppercase tracking-wider font-bold">
                  <span className="material-symbols-outlined text-[16px]">analytics</span>
                  <span>Số hóa 100% dữ liệu</span>
                </div>
              </div>
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
                    ƯU ĐÃI ĐẶC QUYỀN THÁNG NÀY
                  </div>
                  <h2 className="font-headline-xl text-2xl sm:text-4xl text-white uppercase leading-tight mb-3 font-bold">
                    Sẵn sàng thay đổi bản thân? Đăng ký gói tập nhận ngay ưu đãi 20%
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 mb-6">
                    Trở thành hội viên Elite Sports Center ngay hôm nay để nhận thêm quà tặng cao cấp và hỗ trợ chuyên gia toàn diện.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </span>
                      <span>Tặng 02 buổi tập cùng Master PT 1-on-1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </span>
                      <span>Bộ quà tặng Elite Sports Kit độc quyền</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </span>
                      <span>Miễn phí dịch vụ xông hơi Sauna & Băng tuyết</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </span>
                      <span>Đo phân tích chỉ số thể trạng InBody hàng tháng</span>
                    </div>
                  </div>
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
