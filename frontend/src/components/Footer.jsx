import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group inline-flex">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <span className="font-headline-sm text-[18px] uppercase text-slate-900 font-extrabold tracking-tight">
                FPT SPORTS <span className="text-orange-500">CENTER</span>
              </span>
            </Link>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
              Siêu tổ hợp thể thao đa năng chuẩn Olympic, mang lại trải nghiệm luyện tập hiện đại và hệ sinh thái vận động đỉnh cao cho sinh viên & cán bộ FPT.
            </p>
          </div>

          {/* Col 2: Contact & Location */}
          <div>
            <h4 className="text-[13px] uppercase text-slate-900 mb-4 tracking-wider font-extrabold">
              Liên hệ & Cơ sở
            </h4>
            <p className="text-[13px] text-slate-600 mb-2 font-medium leading-snug">
              Khu Thể thao Đa năng, Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội
            </p>
            <p className="text-[13px] text-orange-600 font-bold mb-2">
              Hotline: 1900 8899 (24/7)
            </p>
            <p className="text-[13px] text-slate-600 font-medium">sportscenter@fpt.edu.vn</p>
          </div>

          {/* Col 3: Rules & Policies */}
          <div>
            <h4 className="text-[13px] uppercase text-slate-900 mb-4 tracking-wider font-extrabold">
              Quy định & Chính sách
            </h4>
            <ul className="space-y-2 text-[13px] text-slate-600 font-medium">
              <li>
                <a href="#chinh-sach" className="hover:text-orange-600 transition-colors">
                  Chính sách Hội viên FPT
                </a>
              </li>
              <li>
                <a href="#dieu-khoan" className="hover:text-orange-600 transition-colors">
                  Điều khoản sử dụng & Đặt sân
                </a>
              </li>
              <li>
                <a href="#bao-mat" className="hover:text-orange-600 transition-colors">
                  Bảo mật thông tin cá nhân
                </a>
              </li>
              <li>
                <a href="#noi-quy" className="hover:text-orange-600 transition-colors">
                  Nội quy Trung tâm Thể thao
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Social Channels */}
          <div>
            <h4 className="text-[13px] uppercase text-slate-900 mb-4 tracking-wider font-extrabold">
              Kênh Truyền Thông
            </h4>
            <div className="flex items-center gap-2 mb-4">
              <a
                href="#share"
                className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm"
                aria-label="Share"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
              <a
                href="#videos"
                className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm"
                aria-label="Videos"
              >
                <span className="material-symbols-outlined text-[20px]">smart_display</span>
              </a>
              <a
                href="#chat"
                className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm"
                aria-label="Chat"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>
            </div>
            <p className="text-[12px] text-slate-500 font-medium">
              Giờ phục vụ: 05:30 - 23:00 hàng ngày (Cả ngày Lễ & Tết)
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100">
          <p className="text-[12px] text-slate-500 font-medium">
            © 2026 FPT SPORTS CENTER · SWP391 FPT University Project
          </p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="text-[11px] uppercase tracking-wider text-orange-600 font-extrabold">
              FPT UNIVERSITY SANCTUARY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}