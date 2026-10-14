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

    // Mẫu bộ môn fallback khi API chưa sẵn sàng
    const defaultSports = [
      { sportId: 'sp1', name: 'Pickleball', subtitle: 'Xu hướng thể thao mới', description: 'Cụm sân chuẩn Olympic trang bị mái che, thảm giảm chấn và đèn chiếu chống chói.', area: 'Khu Sân Pro', icon: 'sports_tennis', tag: 'HOT', slug: 'pickleball' },
      { sportId: 'sp2', name: 'Gym & Fitness', subtitle: 'Tăng cơ & Giảm mỡ', description: 'Trang thiết bị Technogym nhập khẩu nguyên chiếc từ Ý cùng đo InBody miễn phí.', area: 'Zone A-B', icon: 'fitness_center', tag: 'VIP', slug: 'gym' },
      { sportId: 'sp3', name: 'Tennis', subtitle: 'Kỹ thuật & Đấu tập', description: 'Thảm sân cứng đạt chuẩn ITF, hỗ trợ hệ thống máy bắn bóng tự động.', area: 'Sân Central', icon: 'sports_tennis', tag: 'POPULAR', slug: 'tennis' },
      { sportId: 'sp4', name: 'Yoga & Pilates', subtitle: 'Cân bằng & Phục hồi', description: 'Phòng tập yên tĩnh trang bị máy Pilates Reformer Allegro 2 hiện đại.', area: 'Studio 01', icon: 'self_improvement', tag: 'RELAX', slug: 'yoga' },
    ];

    const defaultFacilities = [
      { facilityId: 'f1', name: 'Cụm Sân Thi Đấu Standard', description: 'Hệ thống sân Pickleball & Tennis ngoài trời và mái che với mặt sân thi đấu tiêu chuẩn.', icon: 'stadium', highlight: 'Mở cửa 24/7', slug: 'court' },
      { facilityId: 'f2', name: 'Studio Yoga & Pilates', description: 'Không gian yên tĩnh cách âm tiêu chuẩn với thảm định tuyến và máy Reformer.', icon: 'self_improvement', highlight: 'HLV Quốc Tế', slug: 'studio' },
      { facilityId: 'f3', name: 'Khu Gym & Biomechanics', description: 'Khu vực tập luyện sức mạnh trang bị máy phân tích InBody 770 chính xác.', icon: 'fitness_center', highlight: 'Technogym Ý', slug: 'gym-zone' },
      { facilityId: 'f4', name: 'Locker & Sauna Phục Hồi', description: 'Tủ đồ thông minh RFID kết hợp phòng xông hơi khô/ướt xua tan mệt mỏi.', icon: 'hot_tub', highlight: 'Chuẩn 5 Sao', slug: 'locker-sauna' },
    ];

    Promise.all([getPublicSports(), getPublicFacilities()])
      .then(([sportsData, facilitiesData]) => {
        if (!isActive) return;
        setSports(sportsData && sportsData.length > 0 ? sportsData : defaultSports);
        setFacilities(facilitiesData && facilitiesData.length > 0 ? facilitiesData : defaultFacilities);
      })
      .catch(() => {
        // Fallback tự động khi Backend offline
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-widest text-slate-900 font-black">
                  SIÊU TỔ HỢP THỂ THAO ĐA NĂNG CHUẨN OLYMPIC
                </span>
              </div>

              <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight uppercase mb-6 leading-tight font-black">
                Bứt Phá Giới Hạn <br className="hidden sm:inline" />
                <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md underline decoration-orange-400 decoration-4 underline-offset-8">
                  Đỉnh Cao
                </span>{' '}
                Thể Thao Cùng FPT
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed font-medium">
                Trung tâm thể thao đa năng quy mô quốc tế tích hợp hơn 30+ bộ môn: Bơi lội, Điền kinh, Võ thuật, Cầu lông, Bóng rổ đến Gym, Pickleball & Tennis... Nơi nâng tầm thể lực và bứt phá phong độ thi đấu!
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/pricing"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 text-white text-[14px] uppercase tracking-wider font-black shadow-md hover:bg-orange-600 hover:shadow-lg transition-all"
                >
                  <span>Nhận ưu đãi gói tập ngay</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>

                <Link
                  to="/member/schedule"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-[14px] uppercase tracking-wider font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    calendar_today
                  </span>
                  <span>Xem lịch tập & Đặt sân</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-md text-xl font-black text-slate-900">{m.value}</div>
                    <div className="text-[12px] text-slate-500 truncate font-bold">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPORTS SECTION */}
        <section id="bo-mon" className="w-full bg-slate-50/50 py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-1 bg-orange-500 rounded-full"></span>
                  <span className="text-[11px] uppercase tracking-wider text-orange-600 font-black">
                    CHƯƠNG TRÌNH HUẤN LUYỆN
                  </span>
                </div>
                <h2 className="font-headline-xl text-3xl font-black text-slate-900 uppercase">
                  Khám Phá Các Bộ Môn Thể Thao
                </h2>
              </div>

              <div className="mt-4 md:mt-0">
                <Link
                  to="/sports"
                  className="inline-flex items-center gap-1 text-orange-600 text-[13px] uppercase tracking-wider hover:underline font-extrabold group"
                >
                  <span>Xem tất cả bộ môn</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {isContentLoading ? (
              <div className="py-12 text-center text-slate-500 font-bold">Đang tải dữ liệu bộ môn...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sports.map((sport) => (
                  <div
                    key={sport.sportId || sport.id}
                    className="group relative rounded-2xl bg-white p-6 flex flex-col justify-between border border-slate-200 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                          <span className="material-symbols-outlined text-[28px]">{sport.icon || 'sports_tennis'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] uppercase font-black">
                          {sport.tag || 'HOT'}
                        </span>
                      </div>

                      <h3 className="font-headline-sm text-lg text-slate-900 mb-1 group-hover:text-orange-600 transition-colors font-black">
                        {sport.name}
                      </h3>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
                        {sport.subtitle || 'Tiêu chuẩn FPT Sports'}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                        {sport.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-bold">
                        {sport.area || 'Khu Thể Thao'}
                      </span>
                      <Link
                        to={`/sports/${sport.slug || 'detail'}`}
                        className="inline-flex items-center gap-1 text-xs text-orange-600 font-black uppercase tracking-wider"
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

        {/* FACILITIES SECTION */}
        <section id="tien-ich" className="w-full bg-white py-16 lg:py-24 relative border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[11px] uppercase tracking-widest font-black inline-block mb-3 border border-orange-200">
                TIỆN ÍCH DỊCH VỤ
              </span>
              <h2 className="font-headline-xl text-3xl font-black text-slate-900 uppercase">
                Cơ Sở Vật Chất Chuẩn Quốc Tế
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {facilities.map((facility) => (
                <Link
                  key={facility.facilityId || facility.id}
                  to={`/facilities/${facility.slug || 'detail'}`}
                  className="group p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-orange-500 mb-4 shadow-2xs">
                      <span className="material-symbols-outlined text-[28px]">{facility.icon || 'star'}</span>
                    </div>
                    <h3 className="font-headline-md text-lg text-slate-900 mb-2 font-black group-hover:text-orange-600">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{facility.description}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-orange-600 text-xs font-black uppercase">
                    <span>{facility.highlight || 'Đẳng cấp 5 sao'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}