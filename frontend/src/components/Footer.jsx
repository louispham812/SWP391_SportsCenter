import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 font-body-md text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4H19L17.5 8H11.5L10.5 11H16.5L15 15H10L8.5 20H4.5L7 4Z" fill="currentColor" />
                </svg>
              </div>
              <span className="font-headline-sm text-[18px] uppercase text-slate-900 font-black">
                F SPORT <span className="text-orange-500">CENTER</span>
              </span>
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed font-medium mt-2">
              Tổ hợp thể thao đa năng F Sport Center chuẩn quốc tế phục vụ hội viên và cộng đồng đam mê rèn luyện thể lực.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs uppercase text-slate-900 mb-4 tracking-wider font-black">
              Liên hệ & Cơ sở
            </h4>
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Khu Thể Thao F Sport, Đường Khu Công Nghệ Cao, TP.HCM / Hà Nội
            </p>
            <p className="text-xs text-orange-600 font-extrabold mb-2">
              Hotline: 1900 8899 (24/7)
            </p>
            <p className="text-xs text-slate-600 font-medium">contact@fsportcenter.vn</p>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs uppercase text-slate-900 mb-4 tracking-wider font-black">
              Quy định & Chính sách
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><a href="#chinh-sach" className="hover:text-orange-600">Chính sách Hội viên</a></li>
              <li><a href="#dieu-khoan" className="hover:text-orange-600">Điều khoản sử dụng</a></li>
              <li><a href="#bao-mat" className="hover:text-orange-600">Bảo mật thông tin</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs uppercase text-slate-900 mb-4 tracking-wider font-black">
              Thời Gian Hoạt Động
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Giờ phục vụ: <strong>05:30 - 23:00</strong> hàng ngày (Cả ngày Lễ & Tết)
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <p>© 2026 F SPORT CENTER · ATHLETIC PERFORMANCE SANCTUARY</p>
          <span className="font-bold text-orange-600 uppercase tracking-wider">PERFORMANCE FIRST</span>
        </div>
      </div>
    </footer>
  );
}