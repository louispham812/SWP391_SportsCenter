import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPublicFacilities, getPublicSports } from '../services/publicContentApi';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const { sports: mockSports, facilities: mockFacilities } = useApp();
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    // Dữ liệu bộ môn mẫu chuẩn màu sắc & thông tin
    const defaultSports = [
      { sportId: 'sp1', name: 'Pickleball', subtitle: 'XU HƯỚNG THỂ THAO MỚI', description: 'Cụm sân chuẩn Olympic trang bị mái che, thảm giảm chấn và đèn chiếu chống chói.', area: 'Khu Sân Pro', icon: 'sports_tennis', tag: 'HOT', slug: 'pickleball' },
      { sportId: 'sp2', name: 'Gym & Fitness', subtitle: 'TĂNG CƠ & GIẢM MỠ', description: 'Trang thiết bị Technogym nhập khẩu nguyên chiếc từ Ý cùng đo InBody 770 miễn phí.', area: 'Zone A-B', icon: 'fitness_center', tag: 'VIP', slug: 'gym' },
      { sportId: 'sp3', name: 'Tennis', subtitle: 'KỸ THUẬT & ĐẤU TẬP', description: 'Thảm sân cứng đạt chuẩn ITF, hỗ trợ hệ thống máy bắn bóng tự động.', area: 'Sân Central', icon: 'sports_tennis', tag: 'POPULAR', slug: 'tennis' },
      { sportId: 'sp4', name: 'Yoga & Pilates', subtitle: 'CÂN BẰNG & PHỤC HỒI', description: 'Phòng tập yên tĩnh trang bị máy Pilates Reformer Allegro 2 hiện đại.', area: 'Studio 01', icon: 'self_improvement', tag: 'RELAX', slug: 'yoga' },
    ];

    // Dữ liệu tiện ích mẫu
    const defaultFacilities = [
      { facilityId: 'f1', name: 'Cụm Sân Thi Đấu Standard', description: 'Hệ thống sân Pickleball & Tennis ngoài trời và mái che với mặt sân thi đấu tiêu chuẩn.', icon: 'stadium', highlight: 'MỞ CỬA 24/7', slug: 'court' },
      { facilityId: 'f2', name: 'Studio Yoga & Pilates', description: 'Không gian yên tĩnh cách âm tiêu chuẩn với thảm định tuyến và máy Reformer.', icon: 'self_improvement', highlight: 'HLV QUỐC TẾ', slug: 'studio' },
      { facilityId: 'f3', name: 'Khu Gym & Biomechanics', description: 'Khu vực tập luyện sức mạnh trang bị máy phân tích InBody 770 chính xác.', icon: 'fitness_center', highlight: 'TECHNOGYM Ý', slug: 'gym-zone' },
      { facilityId: 'f4', name: 'Locker & Sauna Phục Hồi', description: 'Tủ đồ thông minh RFID kết hợp phòng xông hơi khô/ướt xua tan mệt mỏi.', icon: 'hot_tub', highlight: 'CHUẨN 5 SAO', slug: 'locker-sauna' },
    ];

    Promise.all([getPublicSports(), getPublicFacilities()])
      .then(([sportsData, facilitiesData]) => {
        if (!isActive) return;
        setSports(sportsData && sportsData.length > 0 ? sportsData : defaultSports);
        setFacilities(facilitiesData && facilitiesData.length > 0 ? facilitiesData : defaultFacilities);
      })
      .catch(() => {
        if (isActive) {
          setSports(mockSports && mockSports.length > 0 ? mockSports : defaultSports);
          setFacilities(mockFacilities && mockFacilities.length > 0 ? mockFacilities : defaultFacilities);
        }
      })
      .finally(() => {
        if (isActive) setIsContentLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [mockSports, mockFacilities]);

  const metrics = [
    { value: '5.000+', label: 'Hội viên năng động', icon: 'groups' },
    { value: '12+ Sân', label: 'Pickleball & Tennis', icon: 'sports_tennis' },
    { value: '100%', label: 'HLV Quốc tế NASM/ACE', icon: 'verified' },
    { value: '24/7', label: 'Mở cửa linh hoạt', icon: 'schedule' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        
        {/* ================= 1. HERO SECTION ================= */}
        <section className="relative w-full overflow-hidden bg-white -mt-20 pt-32 pb-16 lg:pb-24 border-b border-slate-200">
          
          {/* Background Ảnh Phủ + Gradient Đậm Chất */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center scale-105 opacity-15"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-slate-50/80"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl pt-8 lg:pt-12 pb-8 space-y-6">
              
              {/* Tag Chip Động */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 shadow-2xs backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-widest text-orange-700 font-black">
                  SIÊU TỔ HỢP THỂ THAO ĐA NĂNG CHUẨN OLYMPIC
                </span>
              </div>

              {/* Headline Chính */}
              <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight uppercase leading-[1.15] font-black">
                Bứt Phá Giới Hạn <br className="hidden sm:inline" />
                <span className="text-orange-500 bg-orange-100/80 px-3 py-0.5 rounded-2xl border border-orange-200 inline-block my-1">
                  Đỉnh Cao
                </span>{' '}
                Thể Thao Cùng FPT Sport Center
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
                Trung tâm thể thao đa năng quy mô quốc tế tích hợp hơn 30+ bộ môn: Bơi lội, Điền kinh, Võ thuật, Cầu lông, Bóng rổ đến Gym, Pickleball & Tennis... Nơi nâng tầm thể lực và bứt phá phong độ thi đấu!
              </p>

              {/* Cụm Nút CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/pricing"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] uppercase tracking-wider font-black shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <span>Nhận Ưu Đãi Gói Tập Ngay</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/member/schedule"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-[13px] uppercase tracking-wider font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    calendar_today
                  </span>
                  <span>Xem Lịch Tập & Đặt Sân</span>
                </Link>
              </div>
            </div>

            {/* 4 Thẻ Chỉ Số KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-orange-200 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <span className="material-symbols-outlined text-[26px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-md text-xl font-black text-slate-900 font-mono">{m.value}</div>
                    <div className="text-[12px] text-slate-500 truncate font-bold">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ================= 2. SPORTS SECTION ================= */}
        <section id="bo-mon" className="w-full bg-slate-50/60 py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-orange-500 rounded-full"></span>
                  <span className="text-[11px] uppercase tracking-wider text-orange-600 font-black">
                    CHƯƠNG TRÌNH HUẤN LUYỆN
                  </span>
                </div>
                <h2 className="font-headline-xl text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                  Khám Phá Các Bộ Môn Thể Thao
                </h2>
              </div>

              <Link
                to="/sports"
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-[13px] uppercase tracking-wider font-black group self-start md:self-end"
              >
                <span>Xem tất cả bộ môn</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>

            {isContentLoading ? (
              <div className="py-12 text-center text-slate-400 font-bold">Đang tải dữ liệu bộ môn...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sports.map((sport) => (
                  <div
                    key={sport.sportId || sport.id}
                    className="group relative rounded-3xl bg-white p-6 flex flex-col justify-between border border-slate-200 shadow-2xs hover:shadow-xl hover:border-orange-300 transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black shadow-xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[26px]">{sport.icon || 'sports_tennis'}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] uppercase font-black tracking-wider">
                          {sport.tag || 'HOT'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                          {sport.name}
                        </h3>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mt-0.5">
                          {sport.subtitle || 'TIÊU CHUẨN FPT SPORTS'}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                        {sport.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">
                        {sport.area || 'Khu Thể Thao'}
                      </span>
                      <Link
                        to={`/sports/${sport.slug || 'detail'}`}
                        className="inline-flex items-center gap-1 text-xs text-orange-600 font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform"
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


        {/* ================= 3. FACILITIES SECTION ================= */}
        <section id="tien-ich" className="w-full bg-white py-16 lg:py-24 relative border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[11px] uppercase tracking-widest font-black inline-block border border-orange-200">
                TIỆN ÍCH DỊCH VỤ
              </span>
              <h2 className="font-headline-xl text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                Cơ Sở Vật Chất Chuẩn Quốc Tế
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {facilities.map((facility) => (
                <Link
                  key={facility.facilityId || facility.id}
                  to={`/facilities/${facility.slug || 'detail'}`}
                  className="group p-6 rounded-3xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between shadow-2xs hover:shadow-lg hover:border-orange-300 transition-all"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-orange-500 shadow-2xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[26px]">{facility.icon || 'star'}</span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-headline-md text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                        {facility.name}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                        {facility.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-orange-600 text-xs font-black uppercase">
                    <span>{facility.highlight || 'ĐẲNG CẤP 5 SAO'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* ================= 4. PROMOTION BANNER CTA ================= */}
        <section className="w-full bg-slate-900 py-16 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/80 p-8 lg:p-14 overflow-hidden border border-slate-800 shadow-2xl text-white">
              
              {/* Vệt trang trí */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-2xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] uppercase font-black tracking-wider">
                    GÓI HỘI VIÊN ƯU ĐÃI
                  </span>
                  
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase leading-tight tracking-tight">
                    Tìm Gói Tập Phù Hợp Với Lịch Trình Của Bạn
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                    Đăng ký ngay hôm nay để nhận đặc quyền tập luyện trọn bộ cụm sân Pickleball, Tennis, Gym & Studio cùng quà tặng đo chỉ số InBody miễn phí!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 justify-center">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] uppercase tracking-wider font-black shadow-lg shadow-orange-500/30 transition-all text-center cursor-pointer"
                  >
                    <span>Xem Bảng Giá Gói Tập</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>

                  <Link
                    to="/member"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[13px] uppercase tracking-wider font-bold transition-all text-center backdrop-blur-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-orange-400">
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