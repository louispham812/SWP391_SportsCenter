import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

const formatVND = (amount) => (amount || 0).toLocaleString('vi-VN') + ' ₫';

export default function MemberCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateOrderStatus, showToast } = useApp();

  const orderData = location.state?.order || {
    id: 'ORD-PENDING-99',
    sportName: 'Pickleball Pro Clinic',
    className: 'Pickleball Chiến Thuật Nâng Cao',
    shiftTime: '18:00 - 19:30 (Thứ 2, 4, 6)',
    coachName: 'HLV Lê Anh Tuấn',
    room: 'Sân Mái Che Pro 01',
    originalPrice: 450000,
    finalPrice: 0,
    discountReason: 'Đặc quyền Member Pass (-100%)',
  };

  const [paymentGateway, setPaymentGateway] = useState('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (updateOrderStatus) {
        updateOrderStatus(orderData.id, 'CONFIRMED');
      }
      showToast?.('Thanh toán thành công', `Đã xác nhận đơn #${orderData.id}. Ca tập đã được thêm vào Lịch cá nhân!`, 'success');
      navigate('/member/orders');
    }, 1000);
  };

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/member/classes" className="text-slate-500 hover:text-orange-600 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Quay lại chọn lớp</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-extrabold text-orange-600 uppercase">Thanh toán đơn đăng ký</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-xs font-black text-amber-600 uppercase">Đơn đăng ký chờ thanh toán</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">#{orderData.id}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {orderData.sportName}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1">{orderData.className}</h2>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ca tập & Lịch học:</span>
                    <strong className="text-slate-900">{orderData.shiftTime}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Huấn luyện viên:</span>
                    <strong className="text-slate-900">{orderData.coachName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Địa điểm:</span>
                    <strong className="text-slate-900">{orderData.room}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Giá niêm yết ca tập:</span>
                  <span className="font-mono">{formatVND(orderData.originalPrice)}</span>
                </div>
                {orderData.discountReason && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Ưu đãi áp dụng ({orderData.discountReason}):</span>
                    <span className="font-mono">-{formatVND(orderData.originalPrice - orderData.finalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-200">
                  <span>Tổng thanh toán:</span>
                  <span className="font-mono text-orange-600">
                    {orderData.finalPrice === 0 ? '0 ₫ (Miễn phí Member)' : formatVND(orderData.finalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Khối bảo vệ đơn hàng tự động */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Đã lưu đơn đăng ký thành công</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Thông tin đơn hàng đã được hệ thống ghi nhận tại mục <strong>"Đơn đăng ký & Hóa đơn"</strong>. Bạn có thể thanh toán ngay hoặc quay lại thanh toán sau bất kỳ lúc nào.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Phương Thức Thanh Toán</h3>

              <div className="space-y-2">
                {[
                  { id: 'vnpay', name: 'VNPAY-QR / Ngân Hàng', desc: 'Quét mã VietQR nhanh chóng' },
                  { id: 'wallet', name: 'Ví FPT Pay (Số dư: 1.500.000 ₫)', desc: 'Thanh toán trực tiếp' },
                ].map((gw) => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setPaymentGateway(gw.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      paymentGateway === gw.id
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{gw.name}</div>
                      <div className="text-[10px] text-slate-500">{gw.desc}</div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentGateway === gw.id ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                    }`}>
                      {paymentGateway === gw.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Đang xử lý giao dịch...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Xác Nhận Thanh Toán</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/member/orders')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase transition-colors cursor-pointer text-center"
              >
                Lưu Đơn & Thanh Toán Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}