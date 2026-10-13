import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800">
      <Navbar />

      <main className="flex-1">
        {/* =========================================
            1. HERO HEADER BANNER
           ========================================= */}
        <section className="relative bg-slate-900 py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 font-extrabold text-xs uppercase tracking-widest border border-orange-500/20 mb-4">
              Về Chúng Tôi
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Tổ Hợp Thể Thao Đa Năng <br className="hidden sm:inline" />
              <span className="text-orange-500">FPT Sports Center</span>
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
              Biểu tượng thể thao hiện đại chuẩn Olympic tại FPT University. Nơi rèn luyện thể chất, thi đấu bứt phá và nuôi dưỡng tinh thần thể thao văn minh cho học viên và cộng đồng.
            </p>
          </div>
        </section>

        {/* =========================================
            2. GIỚI THIỆU CHUNG & CHỈ SỐ ẤN TƯỢNG
           ========================================= */}
        <section className="py-16 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  Khát Vọng Nâng Tầm Thể Lực & Tinh Thần Đồng Đội
                </h2>
                <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Được thành lập với sứ mệnh mang đến môi trường rèn luyện thể chất toàn diện, FPT Sports Center tích hợp hơn 30+ bộ môn từ Pickleball, Tennis, Bơi lội, Gym Olympic cho tới Boxing và Yoga.
                </p>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Chúng tôi ứng dụng công nghệ quản lý vận hành thông minh qua thẻ RFID, cổng check-in QR tự động và trợ lý AI cá nhân hóa lịch tập cho từng hội viên.
                </p>

                {/* Grid Chỉ số */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/80 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-orange-600">30+</div>
                    <div className="text-xs text-slate-600 font-bold mt-1">Bộ môn thể thao</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/80 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-orange-600">15.000m²</div>
                    <div className="text-xs text-slate-600 font-bold mt-1">Diện tích tổ hợp</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/80 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-orange-600">100%</div>
                    <div className="text-xs text-slate-600 font-bold mt-1">Chuẩn Olympic</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80"
                    alt="FPT Sports Center Facilities"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            3. TẦM NHÌN & SỨ MỆNH
           ========================================= */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Giá Trị Cốt Lõi Tại FPT Sports
              </h2>
              <p className="mt-2 text-slate-500 text-sm">
                Xây dựng lối sống lành mạnh, kỷ luật và năng động cho thế hệ trẻ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                  <span className="material-symbols-outlined text-[28px]">verified</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Tiêu Chuẩn Quốc Tế</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Trang thiết bị nhập khẩu Châu Âu, cụm sân Pickleball USAPA & Tennis ITF đạt chuẩn thi đấu chuyên nghiệp.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                  <span className="material-symbols-outlined text-[28px]">groups</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Đội Ngũ HLV Tận Tâm</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  100% Huấn luyện viên sở hữu chứng chỉ quốc tế (PPR, NASM, ITF), luôn sát sao kèm cặp từng học viên.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                  <span className="material-symbols-outlined text-[28px]">smart_toy</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Trải Nghiệm Số Hóa</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Đặt lịch sân, chọn HLV, theo dõi chỉ số InBody và quản lý gói tập trực quan ngay trên ứng dụng di động.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            4. CALL TO ACTION (CTA)
           ========================================= */}
        <section className="py-16 bg-orange-500 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Sẵn Sàng Bứt Phá Giới Hạn Cùng FPT Sports?
            </h2>
            <p className="mt-3 text-orange-100 text-sm sm:text-base">
              Đăng ký ngay hôm nay để nhận ưu đãi trải nghiệm 7 ngày miễn phí toàn bộ dịch vụ!
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/pricing"
                className="px-6 py-3 rounded-xl bg-white text-orange-600 font-extrabold text-sm shadow-lg hover:bg-orange-50 transition-all"
              >
                Xem Bảng Giá Gói Tập
              </Link>
              <Link
                to="/member"
                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-lg hover:bg-slate-800 transition-all"
              >
                Trở Thành Hội Viên
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}