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

    // 10 Bộ môn thể thao chuẩn mẫu thiết kế
    const defaultSports = [
      { sportId: 'sp1', name: 'Gym & Fitness', subtitle: 'TĂNG CƠ & GIẢM MỠ', description: 'Trang thiết bị Technogym nhập khẩu nguyên chiếc từ Ý cùng đo InBody 770 miễn phí.', area: 'ZONE A-B, TẦNG 1', icon: 'fitness_center', tag: 'VIP', slug: 'gym' },
      { sportId: 'sp2', name: 'Sân Pickleball', subtitle: 'CỤM 8 SÂN CÓ MÁI CHE', description: 'Thảm thi đấu chuẩn quốc tế trang bị mái che, thảm giảm chấn và đèn chiếu chống chói.', area: 'KHU SÂN OUTDOOR', icon: 'sports_tennis', tag: 'HOT TREND', slug: 'pickleball' },
      { sportId: 'sp3', name: 'Quần vợt Tennis', subtitle: 'MẶT SÂN CỨNG ITF', description: 'Sân 28m thảm cứng đạt chuẩn ITF, hỗ trợ hệ thống máy bắn bóng tự động chuyên nghiệp.', area: 'TẦNG 2', icon: 'sports_tennis', tag: 'CHUẨN ITF', slug: 'tennis' },
      { sportId: 'sp4', name: 'Yoga & Pilates', subtitle: 'STUDIO CÁCH ÂM', description: 'Không gian yên tĩnh chuẩn studio, máy Pilates Reformer Allegro 2 cùng thảm định tuyến cao cấp.', area: 'LỚP BẮT ĐẦU & NÂNG CAO', icon: 'self_improvement', tag: 'PHỤC HỒI', slug: 'yoga' },
      { sportId: 'sp5', name: 'Bóng đá', subtitle: 'SÂN 5 VÀ SÂN 7', description: 'Đội ngũ trọng tài và hệ thống còi công nghệ hỗ trợ còi thông minh.', area: 'SÂN BÓNG ĐÁ', icon: 'sports_soccer', tag: 'HỖ TRỢ THI ĐẤU', slug: 'football' },
      { sportId: 'sp6', name: 'Cầu lông', subtitle: 'SÂN TRONG NHÀ', description: 'Sân thi đấu thảm giảm chấn cao cấp đạt chuẩn quốc tế BWF.', area: 'SÂN TRONG NHÀ', icon: 'sports', tag: 'PHỔ BIẾN', slug: 'badminton' },
      { sportId: 'sp7', name: 'Bóng chuyền', subtitle: 'MẶT SÂN THI ĐẤU CHUẨN', description: 'Bộ môn bóng chuyền thi đấu hơi chuẩn quốc tế 18x9m tiêu chuẩn.', area: 'SÂN THI ĐẤU CHỦ ĐẠO', icon: 'sports_volleyball', tag: 'MẶT SÂN THI ĐẤU CHUẨN', slug: 'volleyball' },
      { sportId: 'sp8', name: 'Bóng bàn', subtitle: 'SÂN TẬP TRONG NHÀ', description: 'Bàn thi đấu bóng bàn chất lượng cao, trang thiết bị tiêu chuẩn cho tập luyện & thi đấu.', area: 'SÂN TẬP TRONG NHÀ', icon: 'sports_tennis', tag: 'PHÂN XE', slug: 'table-tennis' },
      { sportId: 'sp9', name: 'Bơi lội', subtitle: 'HỒ BƠI', description: 'Bể bơi nhiệt độ chuẩn duy trì 28°C, hệ thống lọc nước Ozon tự động hiện đại.', area: 'HỒ BƠI', icon: 'pool', tag: 'BỂ BƠI 4 MÙA KHÔNG KHÍ', slug: 'swimming' },
      { sportId: 'sp10', name: 'Điền kinh', subtitle: 'ĐƯỜNG CHẠY', description: 'Đường chạy Synthetic đệm cao su giảm va đập, bảo vệ cổ chân và đầu gối khi tập luyện.', area: 'ĐƯỜNG CHẠY', icon: 'directions_run', tag: 'SỨC BỀN', slug: 'running' },
    ];

    // 16 Tiện ích / Cơ sở vật chất
    const defaultFacilities = [
      { facilityId: 'f1', name: 'Sân bóng đá 7 người - Sân H1', description: 'Thảm cỏ nhân tạo đạt chuẩn FIFA, hệ thống chiếu sáng LED chuyên nghiệp.', icon: 'sports_soccer', highlight: 'DÀNH CHO SÂN 7', slug: 'football-7' },
      { facilityId: 'f2', name: 'Sân bóng đá 5 người - Sân H2', description: 'Mặt sân 5 người tiêu chuẩn cho tập luyện và đấu tập.', icon: 'sports_soccer', highlight: 'DÀNH CHO SÂN 5', slug: 'football-5' },
      { facilityId: 'f3', name: 'Sân cầu lông - Sân K1', description: 'Sân thảm PVC chống trượt, mái che chống chói và hệ thống quạt thông gió.', icon: 'sports', highlight: 'SÂN TRONG NHÀ', slug: 'badminton-k1' },
      { facilityId: 'f4', name: 'Sân cầu lông - Sân K2', description: 'Sân thảm chất lượng cao tiêu chuẩn quốc tế.', icon: 'sports', highlight: 'SÂN TRONG NHÀ', slug: 'badminton-k2' },
      { facilityId: 'f5', name: 'Sân bóng chuyền - Sân V1', description: 'Đạt chuẩn thi đấu với lưới điều chỉnh độ cao linh hoạt.', icon: 'sports_volleyball', highlight: 'SÂN THI ĐẤU TỰ DO', slug: 'volleyball-v1' },
      { facilityId: 'f6', name: 'Sân bóng rổ ngoài trời - Sân R1', description: 'Sân bóng rổ ngoài trời mặt sơn Silicon 5 lớp cho độ nảy chuẩn.', icon: 'sports_basketball', highlight: 'SÂN BÓNG RỔ OUTDOOR', slug: 'basketball-r1' },
      { facilityId: 'f7', name: 'Sân bóng bàn T1', description: 'Bàn Double Fish tiêu chuẩn thi đấu.', icon: 'sports_tennis', highlight: 'SÂN TRONG NHÀ', slug: 'table-tennis-t1' },
      { facilityId: 'f8', name: 'Sân bóng bàn T2', description: 'Bàn Double Fish tiêu chuẩn.', icon: 'sports_tennis', highlight: 'SÂN TRONG NHÀ', slug: 'table-tennis-t2' },
      { facilityId: 'f9', name: 'Hồ bơi - Làn L1', description: 'Bể bơi Olympic 50m chuẩn phục vụ tập luyện và thi đấu.', icon: 'pool', highlight: 'LÀN BƠI', slug: 'pool-l1' },
      { facilityId: 'f10', name: 'Hồ bơi - Làn L2', description: 'Bể bơi nhiệt độ duy trì ổn định.', icon: 'pool', highlight: 'LÀN BƠI', slug: 'pool-l2' },
      { facilityId: 'f11', name: 'Đường chạy điền kinh A1', description: 'Đường chạy cao su Synthetic đệm giảm va đập.', icon: 'directions_run', highlight: 'ĐƯỜNG CHẠY', slug: 'track-a1' },
      { facilityId: 'f12', name: 'Đường chạy điền kinh A2', description: 'Đường chạy tiêu chuẩn quốc tế.', icon: 'directions_run', highlight: 'ĐƯỜNG CHẠY', slug: 'track-a2' },
      { facilityId: 'f13', name: 'Check-in Tự động', description: 'Mở cửa thông minh RFID / QR Code giúp vào sân nhanh chóng mà không cần chờ đợi.', icon: 'qr_code_scanner', highlight: 'CHECK-IN TỰ ĐỘNG', slug: 'rfid-checkin' },
      { facilityId: 'f14', name: 'Đội ngũ huấn luyện viên', description: 'Đội ngũ HLV giàu kinh nghiệm hướng dẫn kỹ thuật chuẩn xác và đồng hành sát sao.', icon: 'groups', highlight: 'HLV 1:1 VÀ LỚP NHÓM', slug: 'coaching-team' },
      { facilityId: 'f15', name: 'Trợ lý luyện tập thông minh', description: 'Tích hợp AI phân tích thể trạng, gợi ý lịch tập và chế độ dinh dưỡng tối ưu.', icon: 'smart_toy', highlight: 'KẾT NỐI 24/7', slug: 'ai-assistant' },
      { facilityId: 'f16', name: 'Thời gian tập linh hoạt', description: 'Linh hoạt đặt sân và lịch tập theo cá nhân thông qua ứng dụng di động.', icon: 'schedule', highlight: 'LỊCH LINH HOẠT', slug: 'flexible-schedule' },
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
    { value: '15.000m²', label: 'Diện tích quy hoạch', icon: 'aspect_ratio' },
    { value: '30+ Sân', label: 'Pickleball & Tennis', icon: 'stadium' },
    { value: '100%', label: 'HLV Chứng chỉ NASM', icon: 'workspace_premium' },
    { value: '24/7', label: 'Mở cửa & Check-in RFID', icon: 'schedule' },
  ];

  const highlights = [
    { title: 'Công Nghệ AI Smart System', desc: 'Đo InBody 770, tự động phân tích chỉ số thể trạng và đề xuất giáo án cá nhân hóa.', icon: 'smart_toy' },
    { title: 'Thiết Bị Technogym Nhập Khẩu', desc: '100% máy tập thế hệ mới nhập khẩu nguyên chiếc từ Ý đạt chuẩn Olympic.', icon: 'fitness_center' },
    { title: 'Huấn Luyện Viên Quốc Tế', desc: 'Đội ngũ HLV giàu kinh nghiệm trực tiếp hướng dẫn kỹ thuật 1:1 và lớp nhóm.', icon: 'verified' },
    { title: 'Khu Phục Hồi & Locker RFID', desc: 'Phòng xông hơi Sauna khô/ướt kết hợp tủ đồ RFID bảo mật tuyệt đối.', icon: 'hot_tub' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased">
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
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-slate-50"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">
                    SIÊU TỔ HỢP THỂ THAO ĐA NĂNG CHUẨN OLYMPIC
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-slate-900 leading-[1.15]">
                  Bứt Phá Giới Hạn <br />
                  <span className="text-orange-500 bg-orange-50 px-3 py-1 rounded-2xl border border-orange-200 inline-block my-1">
                    Đỉnh Cao
                  </span>{' '}
                  Thể Thao
                </h1>

                <p className="text-base text-slate-600 max-w-2xl font-medium leading-relaxed">
                  Tổ hợp Gym, Pickleball, Tennis & Studio chuẩn quốc tế tích hợp công nghệ AI quản lý thông minh. Nơi rèn luyện thể lực, nâng tầm sức khỏe và bứt phá phong độ cho mọi hội viên!
                </p>

                {/* Cụm Nút CTA */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link
                    to="/pricing"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs uppercase tracking-wider font-black shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    <span>Nhận Ưu Đãi Gói Tập Ngay</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </Link>

                  <Link
                    to="/facilities"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs uppercase tracking-wider font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-orange-500">
                      explore
                    </span>
                    <span>Tham Quan Cơ Sở 5 Sao</span>
                  </Link>
                </div>
              </div>

              {/* Card hình ảnh bên phải */}
              <div className="lg:col-span-5 relative hidden lg:block">
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop"
                    alt="F Sport Sanctuary"
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded-md border border-orange-500/30">
                      STANDARD OLYMPIC
                    </span>
                    <h3 className="text-lg font-black uppercase">Cụm Sân Pro & Gym Zone</h3>
                  </div>
                </div>
              </div>

            </div>

            {/* 4 Thẻ KPI Chỉ Số */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4 hover:border-orange-300 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-bold">
                    <span className="material-symbols-outlined text-[24px]">{m.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-black text-slate-900 font-mono">{m.value}</div>
                    <div className="text-xs text-slate-500 truncate font-bold">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* ================= 2. KHÁM PHÁ CÁC BỘ MÔN THỂ THAO ================= */}
        <section id="bo-mon" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                CHƯƠNG TRÌNH HUẤN LUYỆN
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-2">
                Khám Phá Các Bộ Môn Thể Thao
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

          {isContentLoading ? (
            <div className="py-12 text-center text-slate-400 font-bold">Đang tải dữ liệu bộ môn...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sports.map((sport) => (
                <div
                  key={sport.sportId || sport.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[26px]">{sport.icon || 'sports_tennis'}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                        {sport.tag || 'HOT'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                        {sport.name}
                      </h3>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {sport.subtitle}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                      {sport.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold uppercase">{sport.area}</span>
                    <Link
                      to={`/sports/${sport.slug || 'detail'}`}
                      className="text-orange-600 font-black uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Chi tiết</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* ================= 3. KHÔNG GIAN LUYỆN TẬP CHUẨN QUỐC TẾ ================= */}
        <section id="tien-ich" className="bg-white py-16 lg:py-24 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                CƠ SỞ VẬT CHẤT
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                Không Gian Luyện Tập Chuẩn Quốc Tế
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {facilities.map((facility) => (
                <Link
                  key={facility.facilityId || facility.id}
                  to={`/facilities/${facility.slug || 'detail'}`}
                  className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-orange-500 flex items-center justify-center font-bold shadow-2xs group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[26px]">{facility.icon}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                      {facility.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 text-xs font-black text-orange-600 uppercase">
                    {facility.highlight}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* ================= 4. TẠI SAO CHỌN F SPORT CENTER? ================= */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              GIÁ TRỊ VƯỢT TRỘI
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Tại Sao Chọn F Sport Center?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-orange-300 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[26px]">{item.icon}</span>
                </div>
                <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ================= 5. BANNER CTA ================= */}
        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/60 p-8 lg:p-12 rounded-3xl border border-slate-800">
              <div className="space-y-3 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                  ĐẶC QUYỀN HỘI VIÊN
                </span>
                <h2 className="text-2xl sm:text-4xl font-black uppercase text-white">
                  Sẵn Sàng Rèn Luyện Cùng F Sport Center?
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