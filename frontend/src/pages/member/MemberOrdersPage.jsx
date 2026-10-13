import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

const formatVND = (amount) => (amount || 0).toLocaleString('vi-VN') + ' ₫';

export default function MemberOrdersPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'confirmed' | 'cancelled'
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);

  // Danh sách đơn hàng mẫu đại diện cho đầy đủ các trạng thái nghiệp vụ
  const [orders, setOrders] = useState([
    {
      id: 'ORD-89301',
      sportName: 'Pickleball Pro Clinic',
      className: 'Pickleball Chiến Thuật Nâng Cao',
      shiftTime: '18:00 - 19:30 (Thứ 3, 18/11/2026)',
      coachName: 'HLV Lê Anh Tuấn',
      room: 'Sân Mái Che Pro 01',
      createdDate: '18/10/2026 - 10:15',
      originalPrice: 450000,
      finalPrice: 0,
      paymentMethod: 'Đặc quyền Member Pass',
      status: 'CONFIRMED', // CONFIRMED | PENDING | CANCELLED_REFUNDED | CANCELLED_EXPIRED
      hoursLeftToClass: 5, // Còn 5 tiếng nữa mới đến giờ tập (> 2 tiếng -> Đủ điều kiện hoàn tiền)
    },
    {
      id: 'ORD-77210',
      sportName: 'Tennis ITF High-Performance',
      className: 'Tennis Chỉnh Đòn Forehand & Backhand',
      shiftTime: '19:30 - 21:00 (Thứ 5, 20/11/2026)',
      coachName: 'HLV Trần Đình Long',
      room: 'Sân Tennis Central 02',
      createdDate: '18/10/2026 - 11:30',
      originalPrice: 800000,
      finalPrice: 200000,
      paymentMethod: 'VNPAY-QR',
      status: 'PENDING', // Đơn treo chờ thanh toán
      hoursLeftToClass: 48,
    },
    {
      id: 'ORD-65109',
      sportName: 'Studio Yoga & Pilates',
      className: 'Yoga Phục Hồi & Trị Liệu Cột Sống',
      shiftTime: '07:00 - 08:30 (Thứ 2, 10/11/2026)',
      coachName: 'HLV Vũ Thu Hà',
      room: 'Studio Yoga 02',
      createdDate: '08/11/2026 - 14:20',
      originalPrice: 400000,
      finalPrice: 0,
      paymentMethod: 'Đặc quyền Member Pass',
      status: 'CANCELLED_REFUNDED', // Đã hủy & hoàn tiền/lượt
      hoursLeftToClass: 0,
    },
  ]);

  // Lọc danh sách theo Tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'pending') return orders.filter((o) => o.status === 'PENDING');
    if (activeTab === 'confirmed') return orders.filter((o) => o.status === 'CONFIRMED');
    if (activeTab === 'cancelled') return orders.filter((o) => o.status.startsWith('CANCELLED'));
    return orders;
  }, [orders, activeTab]);

  // 1. Thao tác tiếp tục thanh toán đơn treo
  const handlePayPendingOrder = (order) => {
    navigate('/member/checkout', { state: { order } });
  };

  // 2. Thao tác hủy đơn treo chưa thanh toán (Free 100%)
  const handleCancelPendingOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED_EXPIRED' } : o))
    );
    showToast?.('Đã hủy đơn treo', 'Đã gỡ đơn đăng ký chưa thanh toán khỏi hệ thống.', 'info');
  };

  // 3. Thao tác Xác nhận Hủy & Hoàn tiền tự động về Ví FPT Pay
  const handleConfirmRefund = () => {
    if (!selectedOrderToCancel) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrderToCancel.id ? { ...o, status: 'CANCELLED_REFUNDED' } : o
      )
    );

    const refundAmountText =
      selectedOrderToCancel.finalPrice > 0
        ? `Đã hoàn ${formatVND(selectedOrderToCancel.finalPrice)} vào Ví FPT Pay!`
        : 'Đã hoàn lại 1 lượt tập vào tài khoản!';

    showToast?.('Hủy ca & Hoàn tiền thành công', `${refundAmountText} Lịch tập cá nhân đã được gỡ ca này.`, 'success');
    setSelectedOrderToCancel(null);
  };

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        {/* Header Trang */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
            ORDER & INVOICE MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase mt-1">
            Đơn Đăng Ký & Hóa Đơn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Quản lý các đơn treo chờ thanh toán, lịch sử hóa đơn và thực hiện Hủy ca & Hoàn tiền tự động.
          </p>
        </div>

        {/* Thanh Tab Chuyển Đổi */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'all', label: 'Tất cả đơn hàng' },
            { id: 'pending', label: 'Chờ thanh toán (Đơn treo)' },
            { id: 'confirmed', label: 'Đã xác nhận / Đã thanh toán' },
            { id: 'cancelled', label: 'Đã hủy & Hoàn tiền' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh Sách Đơn Hàng */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <span className="material-symbols-outlined text-[40px] text-slate-300">receipt_long</span>
              <p className="text-xs font-bold text-slate-500">Chưa có đơn hàng nào trong mục này.</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isPending = ord.status === 'PENDING';
              const isConfirmed = ord.status === 'CONFIRMED';
              const isRefunded = ord.status === 'CANCELLED_REFUNDED';
              const isExpired = ord.status === 'CANCELLED_EXPIRED';
              const canCancelWithRefund = isConfirmed && ord.hoursLeftToClass >= 2;

              return (
                <div
                  key={ord.id}
                  className={`bg-white rounded-3xl p-5 border transition-all shadow-sm space-y-4 ${
                    isPending ? 'border-amber-400 ring-2 ring-amber-400/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{ord.id}</span>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {ord.sportName}
                      </span>

                      {/* Badges Trạng Thái */}
                      {isPending && (
                        <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                          Chờ thanh toán (Đơn treo)
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          ✓ Đã thanh toán & Đã sync lịch
                        </span>
                      )}
                      {isRefunded && (
                        <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          • Đã hủy & Hoàn tiền vào ví
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                          • Đã hủy đơn
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400">Khởi tạo: {ord.createdDate}</div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900">{ord.className}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span>Lịch tập: <strong className="text-slate-900 font-bold">{ord.shiftTime}</strong></span>
                        <span>•</span>
                        <span>HLV: <strong className="text-slate-900 font-bold">{ord.coachName}</strong></span>
                        <span>•</span>
                        <span>Sân/Phòng: <strong className="text-slate-900 font-bold">{ord.room}</strong></span>
                      </div>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      <div className="text-[10px] text-slate-400">Tổng thanh toán</div>
                      <div className="text-lg font-black text-orange-600 font-mono">
                        {ord.finalPrice === 0 ? '0 ₫ (Miễn phí Member Pass)' : formatVND(ord.finalPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Cụm Nút Thao Tác Theo Nghiệp Vụ */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {isPending && <span className="text-amber-700 font-bold">• Đơn hàng được giữ chỗ trong 15 phút.</span>}
                      {isConfirmed && (
                        <span>
                          Quy định hủy ca: <strong className={ord.hoursLeftToClass >= 2 ? 'text-emerald-600' : 'text-red-600'}>
                            {ord.hoursLeftToClass >= 2 ? 'Đủ điều kiện hoàn tiền 100% (> 2 tiếng)' : 'Không thể hoàn tiền (< 2 tiếng)'}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Xử lý cho Đơn Treo Chờ Thanh Toán */}
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCancelPendingOrder(ord.id)}
                            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                          >
                            Hủy đơn treo
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePayPendingOrder(ord)}
                            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer"
                          >
                            Thanh Toán Tiếp
                          </button>
                        </>
                      )}

                      {/* Xử lý cho Đơn Đã Thanh Toán -> Cho phép Hủy & Hoàn tiền nếu trước 2 tiếng */}
                      {isConfirmed && (
                        canCancelWithRefund ? (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderToCancel(ord)}
                            className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            <span>Hủy Ca & Hoàn Tiền Vào Ví</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                            title="Quá hạn hủy ca (< 2 tiếng trước giờ tập)"
                          >
                            Không Thể Hủy (Sát Giờ Tập)
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL XÁC NHẬN HỦY CA & HOÀN TIỀN VÀO VÍ FPT PAY */}
        {selectedOrderToCancel && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setSelectedOrderToCancel(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Xác Nhận Hủy Ca & Hoàn Tiền
                  </h3>
                  <p className="text-xs text-slate-500">Đơn hàng #{selectedOrderToCancel.id}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lớp học:</span>
                  <strong className="text-slate-900">{selectedOrderToCancel.className}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giờ tập:</span>
                  <strong className="text-slate-900">{selectedOrderToCancel.shiftTime}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-emerald-600">
                  <span>Số tiền/lượt hoàn trả:</span>
                  <span>
                    {selectedOrderToCancel.finalPrice > 0
                      ? formatVND(selectedOrderToCancel.finalPrice) + ' (Về Ví FPT Pay)'
                      : 'Hoàn 1 Lượt Tập VIP'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Sau khi xác nhận hủy, ca tập này sẽ <strong>tự động gỡ khỏi Lịch tập cá nhân</strong> của bạn để nhường slot cho học viên khác.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderToCancel(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Bỏ Qua
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/20"
                >
                  Xác Nhận Hủy & Hoàn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}