import React from 'react';

// Format functions inline (self-contained component)
const formatVnd = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDateTime = (isoStr) => {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
};

/**
 * Receipt Modal Component
 * Displays electronic receipt for a transaction with print functionality
 * Self-contained with inline format functions
 * 
 * @param {Object} receipt - Transaction object to display
 * @param {Object} profile - User profile with fullName
 * @param {Function} onClose - Callback to close modal
 */
export default function ReceiptModal({ receipt, profile, onClose }) {
  if (!receipt) return null;

  const isRefund = receipt.paymentStatus === 'REFUNDED';
  const isQuota = parseFloat(receipt.amount) === 0 || receipt.paymentMethod === 'MEMBERSHIP_QUOTA';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 !m-0"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 relative animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Receipt Header */}
        <div className="text-center pb-4 border-b border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-orange-500/25">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <h3 className="font-headline-sm font-black text-slate-900 text-lg uppercase tracking-tight">
            F SPORT ATHLETIC CENTER
          </h3>
          <p className="text-[11px] text-slate-500">
            {isRefund
              ? 'PHIẾU XÁC NHẬN HOÀN TIỀN ĐIỆN TỬ'
              : isQuota
              ? 'BIÊN LAI KHẤU TRỪ HẠN NGẠCH GÓI TẬP'
              : 'HÓA ĐƠN XÁC NHẬN THANH TOÁN ĐIỆN TỬ'}
          </p>
          <span className="inline-block mt-2 font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Mã: {receipt.referenceCode || `TX-${receipt.id}`}
          </span>
        </div>

        {/* 0đ Quota Highlight Box (MEM-12) */}
        {isQuota && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <span className="material-symbols-outlined text-[18px]">stars</span>
              Khấu Trừ Gói Hội Viên VIP All-Access
            </div>
            <p className="text-[11px] text-amber-700">
              Đã cấn trừ <strong>1 buổi</strong> từ hạn ngạch gói tập đã mua. Số tiền thanh toán trực tiếp: <strong>0 VNĐ</strong>.
            </p>
          </div>
        )}

        {/* Receipt Content */}
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Khách hàng:</span>
            <span className="font-bold text-slate-800">{profile?.fullName || 'Hội viên F Sport'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Thời gian tạo:</span>
            <span className="font-medium text-slate-800">{formatDateTime(receipt.createdAt)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Nội dung dịch vụ:</span>
            <span className="font-bold text-slate-900">{receipt.itemName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Phương thức:</span>
            <span className="font-mono font-bold text-slate-700">{receipt.paymentMethod}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Trạng thái giao dịch:</span>
            <span
              className={`font-bold ${
                isRefund
                  ? 'text-indigo-600'
                  : isQuota
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {isRefund
                ? 'Đã hoàn trả 100%'
                : isQuota
                ? 'Đã cấn trừ Quota'
                : 'Thành công (Đã quyết toán)'}
            </span>
          </div>

          <div className="pt-2 flex justify-between items-baseline text-sm">
            <span className="font-bold text-slate-700">Tổng tiền giao dịch:</span>
            <span className="text-xl font-black text-orange-600">
              {formatVnd(receipt.amount)}
            </span>
          </div>
        </div>

        {/* Stamp & Footer */}
        <div className="pt-3 border-t border-dashed border-slate-200 text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Hệ thống F Sport đã chứng thực điện tử
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Biên lai điện tử có giá trị đối soát kế toán và giải quyết quyền lợi hội viên tại quầy Lễ tân.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            In / Lưu biên lai PDF
          </button>
        </div>
      </div>
    </div>
  );
}
