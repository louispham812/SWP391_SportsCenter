import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  // Chỉ số ấn tượng của FPT Sports Center
  const milestones = [
    { number: '15.000 m²', label: 'Tổng diện tích quy hoạch', icon: 'aspect_ratio' },
    { number: '30+', label: 'Bộ môn thể thao đa dạng', icon: 'sports_tennis' },
    { number: '50+', label: 'HLV chứng chỉ quốc tế (NASM/PPR)', icon: 'workspace_premium' },
    { number: '98%', label: 'Sinh viên & Hội viên hài lòng', icon: 'sentiment_very_satisfied' },
  ];

  // Giá trị cốt lõi
  const coreValues = [
    {
      title: 'Hiệu Suất & Kỷ Luật',
      desc: 'Xây dựng thói quen rèn luyện nghiêm túc, nâng cao sức bền thể lực và bản lĩnh thi đấu đỉnh cao.',
      icon: 'electric_bolt',
      badge: 'PERFORMANCE',
    },
    {
      title: 'Công Nghệ AI Tiên Tiến',
      desc: 'Tích hợp hệ thống phân tích InBody, AI đề xuất giáo án cá nhân hóa và quản lý check-in RFID 1-touch.',
      icon: 'smart_toy',
      badge: 'INNOVATION',
    },
    {
      title: 'Chuẩn Mực Olympic',
      desc: 'Trang thiết bị nhập khẩu Technogym Ý, cụm sân Pickleball & Tennis phủ thảm giảm chấn tiêu chuẩn ITF/PPR.',
      icon: 'verified',
      badge: 'QUALITY',
    },
    {
      title: 'Cộng Đồng Kết Nối',
      desc: 'Nơi giao lưu, ghép đội thi đấu và phát triển phong trào thể thao sinh viên FPT năng động, lành mạnh.',
      icon: 'groups',
      badge: 'COMMUNITY',
    },
  ];

  // Đội ngũ ban huấn luyện tiêu biểu
  const coachesTeam = [
    {
      name: 'HLV Lê Anh Tuấn',
      role: 'Master Coach Pickleball & PT Biomechanics',
      cert: 'Chứng chỉ PPR Level 2 Pro & NASM CPT',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      exp: '6 năm kinh nghiệm huấn luyện thi đấu chuyên nghiệp',
    },
    {
      name: 'HLV Vũ Thu Hà',
      role: 'Senior Coach Yoga & Pilates Reformer',
      cert: 'Chứng chỉ Pilates Reformer International',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      exp: '8 năm giảng dạy Pilates & Phục hồi cột sống',
    },
    {
      name: 'HLV Trần Đình Long',
      role: 'Head Coach Tennis ITF High-Performance',
      cert: 'Chứng chỉ HLV Tennis Quốc tế ITF Level 2',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      exp: 'Cựu VĐV đội tuyển trẻ quốc gia',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-body-md text-slate-800 antialiased">
      <Navbar />

      <main className="w-full pt-20 flex-1">
        
        {/* HERO BANNER SECTION */}
        <section className="relative overflow-hidden bg-slate-900 text-white py-20 lg:py-28">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop')",
              }}
            ></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                VỀ CHÚNG TÔI • FPT SPORTS CENTER
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight text-white">
                Kiến Tạo Thế Hệ <br />
                <span className="text-orange-500">Sinh Viên FPT</span> Toàn Năng
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl">
                FPT Sports Center là siêu tổ hợp thể thao đa năng chuẩn quốc tế, tích hợp công nghệ AI chuyển đổi số hiện đại. Chúng tôi sứ mệnh mang lại không gian rèn luyện thể lực tối tân, truyền cảm hứng sống khỏe và bứt phá phong độ thi đấu.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/pricing"
                  className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2"
                >
                  <span>Khám Phá Gói Tập</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>

                <Link
                  to="/facilities"
                  className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Tham Quan Cơ Sở
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS / STATS STRIP */}
        <section className="bg-slate-50 border-y border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {milestones.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                    <span className="material-symbols-outlined text-[26px]">{item.icon}</span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{item.number}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TẦM NHÌN & SỨ MỆNH */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Cột hình ảnh minh họa */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop"
                  alt="FPT Sports Center Gymnasium"
                  className="w-full h-[400px] sm:h-[480px] object-cover"
                />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white p-6 rounded-3xl shadow-xl max-w-xs hidden sm:block border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-400 text-[24px]">verified</span>
                  <span className="text-xs font-black uppercase text-orange-400">ĐẠT CHUẨN OLYMPIC</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Trang bị 100% thảm thi đấu chuẩn ITF/PPR và máy tập sức mạnh Technogym Ý.
                </p>
              </div>
            </div>

            {/* Cột nội dung Tầm nhìn & Sứ mệnh */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  OUR MISSION & VISION
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                  Sứ Mệnh Nâng Tầm Thể Lực & Phong Độ Thi Đấu
                </h2>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Tại <strong>FPT Sports Center</strong>, chúng tôi tin rằng thể lực dẻo dai và tinh thần minh mẫn là nền tảng cốt lõi cho mọi thành công học thuật và sự nghiệp. Trung tâm không chỉ cung cấp không gian tập luyện mà còn xây dựng một hệ sinh thái thể thao chuyển đổi số toàn diện.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                    <span className="material-symbols-outlined text-orange-500 text-[20px]">flag</span>
                    <span>Sứ Mệnh (Mission)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Phát triển thể chất toàn diện, tôi luyện tinh thần kỷ luật và khuyến khích lối sống năng động cho sinh viên, giảng viên và cộng đồng FPT.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px]">visibility</span>
                    <span>Tầm Nhìn (Vision)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Trở thành mô hình tổ hợp thể thao học đường dẫn đầu Việt Nam, ứng dụng tiên phong trí tuệ nhân tạo (AI) trong phân tích phong độ và đề xuất giáo án tập luyện.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* GIÁ TRỊ CỐT LÕI */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                CORE VALUES
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-white">
                4 Giá Trị Cốt Lõi Tại FPT Sports
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Những định hướng chiến lược cam kết trải nghiệm huấn luyện xuất sắc nhất cho hội viên.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((val, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/90 border border-slate-700/80 p-6 rounded-3xl space-y-4 hover:border-orange-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shadow-md">
                      <span className="material-symbols-outlined text-[26px]">{val.icon}</span>
                    </div>
                    <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase">
                      {val.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-orange-400 transition-colors">
                      {val.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                      {val.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ĐỘI NGŨ BAN HUẤN LUYỆN */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                EXPERT COACHES
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mt-2">
                Đội Ngũ Huấn Luyện Viên Đỉnh Cao
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md">
              100% HLV sở hữu chứng chỉ chuyên môn quốc tế, giàu kinh nghiệm thi đấu và tận tâm đồng hành cùng mục tiêu thể lực của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coachesTeam.map((coach, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm hover:border-orange-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={coach.avatar}
                      alt={coach.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shrink-0 shadow-md"
                    />
                    <div>
                      <h3 className="text-base font-black text-slate-900">{coach.name}</h3>
                      <p className="text-xs font-bold text-orange-600">{coach.role}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                      <span>{coach.cert}</span>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      {coach.exp}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Khóa huấn luyện:</span>
                  <span className="text-orange-600">Lớp Nhóm & PT 1:1</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BANNER CTA ĐĂNG KÝ */}
        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
              Sẵn Sàng Bứt Phá Phong Độ Thể Thao?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto">
              Đăng ký ngay gói tập FPT Sports Center để nhận đặc quyền trải nghiệm trọn bộ cụm sân Pickleball, Tennis, Gym & Studio chuẩn 5 sao!
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link
                to="/pricing"
                className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all"
              >
                Trở Thành Hội Viên Ngay
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Đăng Nhập Tài Khoản
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}