import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary-container shadow-sm">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <span className="font-headline-sm text-[18px] uppercase text-primary font-bold">
                ELITE SPORTS
              </span>
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Tổ hợp thể thao cao cấp chuẩn Olympic, mang lại trải nghiệm luyện tập tối tân và phục hồi chuyên sâu cho vận động viên và hội viên ưu tú.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-[14px] uppercase text-primary mb-4 tracking-wider font-bold">
              Liên hệ & Cơ sở
            </h4>
            <p className="text-[13px] text-slate-600 mb-2">
              Khu Thể thao Đỉnh cao, Số 01 Đại Lộ Thăng Long, Hà Nội
            </p>
            <p className="text-[13px] text-primary font-semibold mb-2">
              Hotline: 1900 8899 (24/7)
            </p>
            <p className="text-[13px] text-slate-600">contact@elitesports.vn</p>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-[14px] uppercase text-primary mb-4 tracking-wider font-bold">
              Quy định & Chính sách
            </h4>
            <ul className="space-y-2 text-[13px] text-slate-600">
              <li>
                <a href="#chinh-sach" className="hover:text-primary transition-colors">
                  Chính sách Hội viên
                </a>
              </li>
              <li>
                <a href="#dieu-khoan" className="hover:text-primary transition-colors">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#bao-mat" className="hover:text-primary transition-colors">
                  Bảo mật thông tin
                </a>
              </li>
              <li>
                <a href="#noi-quy" className="hover:text-primary transition-colors">
                  Nội quy phòng tập
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-[14px] uppercase text-primary mb-4 tracking-wider font-bold">
              Kênh Truyền Thông
            </h4>
            <div className="flex items-center gap-2 mb-4">
              <a
                href="#share"
                className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-200 transition-colors"
                aria-label="Share"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
              <a
                href="#videos"
                className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-200 transition-colors"
                aria-label="Videos"
              >
                <span className="material-symbols-outlined text-[20px]">smart_display</span>
              </a>
              <a
                href="#chat"
                className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary hover:bg-slate-200 transition-colors"
                aria-label="Chat"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>
            </div>
            <p className="text-[12px] text-slate-500">
              Giờ phục vụ: 05:30 - 23:00 hàng ngày (Cả ngày Lễ & Tết)
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100">
          <p className="text-[12px] text-slate-500">
            © 2026 ELITE SPORTS CENTER · SWP391 FPT University Project
          </p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
              PERFORMANCE FIRST
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
