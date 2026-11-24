import { useState } from 'react';
import { Link } from 'react-router-dom';

const POLICY_DETAILS = {
  membership: {
    title: 'Chính sách Hội viên',
    content: 'Gói tập sau khi thanh toán trực tuyến hoặc tại quầy sẽ được Quản lý xét duyệt kích hoạt. Gia hạn gói cùng hạng sẽ nối tiếp thời hạn sử dụng hiện có.',
  },
  terms: {
    title: 'Điều khoản sử dụng',
    content: 'Hội viên có thể hủy hoặc đổi lịch đặt sân trước giờ chơi tối thiểu theo quy định hệ thống (mặc định 2 giờ). Vui lòng đến check-in đúng giờ bằng thẻ RFID hoặc mã QR.',
  },
  privacy: {
    title: 'Bảo mật thông tin',
    content: 'Dữ liệu cá nhân, chỉ số sức khỏe và lịch sử giao dịch được mã hóa phiên xác thực và chỉ phục vụ vận hành dịch vụ thể thao tại F Sport Center.',
  },
};

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState(null);
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
              <li>
                <button type="button" onClick={() => setActivePolicy('membership')} className="hover:text-orange-600 cursor-pointer text-left">
                  Chính sách Hội viên
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy('terms')} className="hover:text-orange-600 cursor-pointer text-left">
                  Điều khoản sử dụng
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy('privacy')} className="hover:text-orange-600 cursor-pointer text-left">
                  Bảo mật thông tin
                </button>
              </li>
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
          <p>© 2026 F SPORT CENTER · Trung Tâm Thể Thao Đa Năng</p>
          <span className="font-bold text-orange-600 uppercase tracking-wider">PERFORMANCE FIRST</span>
        </div>
      </div>

      {activePolicy && POLICY_DETAILS[activePolicy] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-policy-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setActivePolicy(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="footer-policy-title" className="text-base font-black text-slate-900 uppercase">
                {POLICY_DETAILS[activePolicy].title}
              </h3>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setActivePolicy(null)}
                className="w-8 h-8 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {POLICY_DETAILS[activePolicy].content}
            </p>
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
