import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPublicFacilities, getPublicSports } from '../services/publicContentApi';

const FALLBACK_SPORTS = [
  {
    sportId: 1,
    name: 'Cụm Bơi Lội Olympic',
    slug: 'boi-loi',
    subtitle: 'Hồ bơi 50m chuẩn quốc tế',
    description: 'Hệ thống lọc nước điện phân muối hiện đại, 10 làn bơi tiêu chuẩn cùng khu vực nhảy cầu chuyên nghiệp.',
    tag: 'Chuẩn Olympic',
    area: 'Khu Thể thao dưới nước',
    icon: 'pool',
  },
  {
    sportId: 2,
    name: 'Nhà Thi Đấu Đa Năng',
    slug: 'nha-thi-dau',
    subtitle: 'Bóng rổ, Cầu lông, Bóng chuyền',
    description: 'Mặt sàn gỗ Maple nhập khẩu chống chấn thương, sức chứa 2.000 khán giả với hệ thống máy lạnh toàn phần.',
    tag: 'Đa năng',
    area: 'Tòa nhà Arena',
    icon: 'sports_basketball',
  },
  {
    sportId: 3,
    name: 'Gym & Crossfit Center',
    slug: 'gym-fitness',
    subtitle: 'Rèn luyện thể lực đỉnh cao',
    description: 'Trang thiết bị TechnoGym & Hammer Strength 100%, khu vực Powerlifting và Functional Training chuyên sâu.',
    tag: 'Tối tân 5★',
    area: 'Tầng 1 & 2 - Main Center',
    icon: 'fitness_center',
  },
  {
    sportId: 4,
    name: 'Cụm Sân Pickleball & Tennis',
    slug: 'pickleball-tennis',
    subtitle: 'Hệ thống sân ngoài trời & Có mái che',
    description: 'Mặt sân sơn Plexipave 8 lớp chống lóa, hệ thống đèn LED chuẩn truyền hình cùng dịch vụ trọng tài chuyên nghiệp.',
    tag: 'HOT Trend',
    area: 'Cụm sân phía Tây',
    icon: 'sports_tennis',
  },
];

const FALLBACK_FACILITIES = [
  {
    facilityId: 1,
    name: 'Phòng Xông Hơi Băng Tuyết & Sauna',
    slug: 'sauna-ice',
    description: 'Liệu pháp phục hồi cơ bắp chuyên sâu sau giờ tập nặng, giúp giảm mỏi cơ và tái tạo năng lượng tức thì.',
    highlight: 'Miễn phí cho Hội viên',
    icon: 'spa',
  },
  {
    facilityId: 2,
    name: 'Thẻ Thông Minh & AI Check-in',
    slug: 'ai-checkin',
    description: 'Tự động nhận diện khuôn mặt và quản lý lịch đặt sân linh hoạt ngay trên điện thoại thông minh.',
    highlight: 'Công nghệ FPT 4.0',
    icon: 'fingerprint',
  },
  {
    facilityId: 3,
    name: 'Locker Bằng Khóa Từ An Toàn',
    slug: 'smart-locker',
    description: 'Tủ đồ riêng tư tích hợp khóa cảm ứng thông minh, trang bị khu vực trang điểm và sấy tóc cao cấp.',
    highlight: 'An toàn 100%',
    icon: 'lock_reset',
  },
  {
    facilityId: 4,
    name: 'Healthy Bar & Lounge',
    slug: 'healthy-bar',
    description: 'Nạp nhanh Protein shake, nước ép hoa quả tươi và không gian làm việc/thư giãn lý tưởng cho sinh viên.',
    highlight: 'Chill & Nạp năng lượng',
    icon: 'local_cafe',
  },
];

export default function LandingPage() {
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    Promise.all([getPublicSports(), getPublicFacilities()])
      .then(([sportsData, facilitiesData]) => {
        if (!isActive) return;
        setSports(sportsData && sportsData.length > 0 ? sportsData : FALLBACK_SPORTS);
        setFacilities(facilitiesData && facilitiesData.length > 0 ? facilitiesData : FALLBACK_FACILITIES);
      })
      .catch(() => {
        if (!isActive) return;
        setSports(FALLBACK_SPORTS);
        setFacilities(FALLBACK_FACILITIES);
      })
      .finally(() => {
        if (isActive) setIsContentLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const metrics = [
    { value: '30+', label: 'Bộ Môn Thể Thao', icon: 'sports' },
    { value: '50.000m²', label: 'Diện Tích Tổ Hợp', icon: 'straighten' },
    { value: '100%', label: 'HLV Bằng Quốc Tế', icon: 'verified' },
    { value: '24/7', label: 'Mở Cửa Linh Hoạt', icon: 'schedule' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-white -mt-20 pt-32 pb-16 lg:pb-24 border-b border-slate-200/80">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="absolute inset-0 z-0 opacity-10">
            <div
              className="w-full h-full bg-cover bg-center scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl pt-6 lg:pt-10 pb-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 shadow-sm backdrop-blur-md mb-6 cursor-default">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(242,112,35,0.8)] animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-widest text-orange-600 font-extrabold">
                  SIÊU TỔ HỢP THỂ THAO ĐA NĂNG CHUẨN OLYMPIC
                </span>
              </div>

              {/* Headline - Dùng inline style ép chiều cao dòng lineHeight: 1.4 và margin cách biệt 10px */}
              <div className="mb-8">
                <div 
                  className="text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight uppercase font-black"
                  style={{ lineHeight: '1.4', margin: '10px 0' }}
                >
                  Bứt Phá Giới Hạn
                </div>
                <div 
                  className="text-3xl sm:text-5xl lg:text-6xl tracking-tight uppercase font-black"
                  style={{ lineHeight: '1.4', margin: '10px 0' }}
                >
                  <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent inline-block py-1">
                    Đỉnh Cao Thể Thao
                  </span>
                </div>
                <div 
                  className="text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight uppercase font-black"
                  style={{ lineHeight: '1.4', margin: '10px 0' }}
                >
                  Cùng FPT Sports
                </div>
              </div>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed font-medium">
                Trung tâm thể thao đa năng quy mô quốc tế tích hợp hơn 30+ bộ môn: Bơi lội, Điền kinh, Võ thuật, Cầu lông, Bóng rổ đến Gym, Pickleball & Tennis... Nơi nâng tầm thể lực và bứt phá phong độ thi đấu!
              </p>

              {/* CTA Cluster */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/pricing"
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-orange-500 text-white text-[14px] uppercase tracking-wider font-extrabold shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <span>Nhận ưu đãi gói tập ngay</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/member/schedule"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-300/80 text-slate-800 text-[14px] uppercase tracking-wider font-bold shadow-sm hover:bg-orange-50/60 hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-orange-500">
                    calendar_today
                  </span>
                  <span>Xem lịch tập & Đặt sân</span>
                </Link>
              </div>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300">
                    <span className="material-symbols-outlined text-[26px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-md text-xl sm:text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      {m.value}
                    </div>
                    <div className="text-[12px] text-slate-500 truncate font-semibold">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPORTS & SERVICES SECTION */}
        <section id="bo-mon" className="w-full bg-slate-50 py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-1 bg-orange-500 rounded-full"></span>
                  <span className="text-[11px] uppercase tracking-widest text-orange-600 font-extrabold">
                    HỆ THỐNG BỘ MÔN ĐA DẠNG
                  </span>
                </div>
                <h2 className="font-headline-xl text-3xl sm:text-4xl font-black text-slate-900 uppercase">
                  Khám Phá Các Bộ Môn
                </h2>
                <p className="text-base text-slate-600 mt-2 max-w-xl font-medium">
                  Hơn 30+ bộ môn vận động từ cơ bản đến thi đấu chuyên nghiệp với cơ sở vật chất chuẩn Olympic.
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <Link
                  to="/sports"
                  className="inline-flex items-center gap-1.5 text-orange-600 text-[13px] uppercase tracking-wider hover:text-orange-700 font-extrabold group"
                >
                  <span>Xem tất cả bộ môn</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {isContentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sports.map((sport) => (
                  <div
                    key={sport.sportId}
                    className="group relative rounded-2xl bg-white p-6 flex flex-col justify-between border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                          <span className="material-symbols-outlined text-[28px]">{sport.icon}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] uppercase font-bold tracking-wider">
                          {sport.tag}
                        </span>
                      </div>

                      <h3 className="font-headline-sm text-lg text-slate-900 mb-1 group-hover:text-orange-600 transition-colors font-black">
                        {sport.name}
                      </h3>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-3">
                        {sport.subtitle}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                        {sport.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        {sport.area}
                      </span>
                      <Link
                        to={`/sports/${sport.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-orange-600 group-hover:translate-x-1 transition-transform uppercase tracking-wider font-black"
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
              <span className="px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] uppercase tracking-widest text-orange-600 inline-block mb-3 font-extrabold">
                TRẢI NGHIỆM ĐẲNG CẤP
              </span>
              <h2 className="font-headline-xl text-3xl sm:text-4xl font-black text-slate-900 uppercase">
                Tại Sao Chọn FPT Sports Center?
              </h2>
              <p className="text-base text-slate-600 mt-2 font-medium">
                Sở hữu hệ sinh thái thể thao quy mô chuẩn quốc tế phục vụ trọn vẹn mọi nhu cầu tập luyện và thi đấu.
              </p>
            </div>

            {isContentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-56 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse p-6"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {facilities.map((facility) => (
                  <Link
                    key={facility.facilityId}
                    to={`/facilities/${facility.slug}`}
                    className="group p-7 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-orange-300 hover:bg-white transition-all duration-300"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-orange-500 mb-6 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        <span className="material-symbols-outlined text-[32px]">{facility.icon}</span>
                      </div>
                      <h3 className="font-headline-md text-xl text-slate-900 mb-2 font-black group-hover:text-orange-600 transition-colors">
                        {facility.name}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{facility.description}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-1.5 text-orange-600 text-xs uppercase tracking-wider font-extrabold">
                      <span className="material-symbols-outlined text-[16px]">{facility.icon}</span>
                      <span>{facility.highlight}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 text-center">
              <Link
                to="/facilities"
                className="inline-flex items-center gap-2 font-extrabold text-orange-600 hover:text-orange-700 hover:underline text-sm uppercase tracking-wider"
              >
                <span>Khám phá tất cả tiện ích cao cấp</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* PROMOTION BANNER CTA */}
        <section className="w-full bg-slate-50 py-16 lg:py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-slate-900 p-8 lg:p-14 overflow-hidden shadow-2xl shadow-orange-500/15 text-white">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-orange-600 text-[11px] uppercase tracking-wider font-black mb-4 shadow-md">
                    ⚡ ƯU ĐÃI NĂNG LƯỢNG THÁNG NÀY
                  </div>
                  <h2 className="font-headline-xl text-2xl sm:text-4xl text-white uppercase leading-tight mb-3 font-black">
                    Sẵn sàng bứt phá? Đăng ký gói tập nhận ngay ưu đãi giảm 20%
                  </h2>
                  <p className="text-sm sm:text-base text-orange-100 mb-6 font-medium">
                    Trở thành hội viên FPT Sports Center ngay hôm nay để trải nghiệm siêu tổ hợp thể thao đẳng cấp nhất!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-white font-semibold">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                        ✓
                      </span>
                      <span>Tặng 02 buổi tập cùng HLV PT 1-on-1</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                        ✓
                      </span>
                      <span>Bộ quà tặng FPT Sports Kit độc quyền</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                        ✓
                      </span>
                      <span>Miễn phí dịch vụ xông hơi Sauna cao cấp</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                        ✓
                      </span>
                      <span>Đo phân tích chỉ số InBody định kỳ</span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3.5 shrink-0 justify-center">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-orange-600 text-[14px] uppercase tracking-wider font-black shadow-xl hover:bg-orange-50 hover:scale-105 transition-all text-center"
                  >
                    <span>Xem Bảng Giá Gói Tập</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>

                  <Link
                    to="/member"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-[13px] uppercase tracking-wider font-bold transition-all text-center backdrop-blur-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] text-orange-300">
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