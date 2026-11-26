import { useId, useState } from 'react';
import ModalDialog from '../common/ModalDialog';
import { formatPaymentMethod } from '../../utils/enumLabels';

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
 */
export default function ReceiptModal({ receipt, profile, onClose }) {
  const titleId = useId();
  const [copiedCode, setCopiedCode] = useState(false);

  const ps = String(receipt?.paymentStatus || '').toUpperCase();
  const isRefund = ps === 'REFUNDED';
  const isPending = ps === 'PENDING' || ps === 'PENDING_PAYMENT';
  const isFailed = ps === 'FAILED';
  const isCancelled = ps === 'CANCELLED' || ps === 'VOID';
  const isQuota =
    Boolean(receipt) &&
    !isRefund &&
    !isPending &&
    !isFailed &&
    !isCancelled &&
    (parseFloat(receipt.amount) === 0 || receipt.paymentMethod === 'MEMBERSHIP_QUOTA');

  const refCode = receipt
    ? receipt.referenceCode || `TX-${receipt.transactionId ?? receipt.id ?? receipt.paymentId ?? ''}`
    : '';

  const handleCopyCode = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <ModalDialog
      open={Boolean(receipt)}
      onClose={onClose}
      titleId={titleId}
      maxWidthClass="max-w-md"
    >
      {receipt && (
        <div className="receipt-print-area w-full bg-white p-6 space-y-5 relative print:p-0">
          {/* Close Button */}
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="print:hidden absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* Receipt Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-orange-500/25">
              <span aria-hidden="true" className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <h3 id={titleId} className="font-headline-sm font-black text-slate-900 text-lg uppercase tracking-tight">
              F SPORT ATHLETIC CENTER
            </h3>
            <p className="text-[11px] text-slate-500">
              {isRefund
                ? 'PHIẾU XÁC NHẬN HOÀN TIỀN ĐIỆN TỬ'
                : isQuota
                ? 'BIÊN LAI KHẤU TRỪ HẠN NGẠCH GÓI TẬP'
                : 'HÓA ĐƠN XÁC NHẬN THANH TOÁN ĐIỆN TỬ'}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
              <span className="font-mono text-[11px] font-bold text-slate-700">
                Mã: {refCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Sao chép mã giao dịch"
                className="print:hidden text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                {copiedCode ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          {/* 0đ Quota Highlight Box */}
          {isQuota && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">stars</span>
                Khấu Trừ Hạn Ngạch Gói Hội Viên
              </div>
              <p className="text-[11px] text-amber-700">
                Đã sử dụng hạn ngạch từ gói hội viên của bạn. Số tiền thanh toán trực tiếp: <strong>0 VNĐ</strong>.
              </p>
            </div>
          )}

          {/* Receipt Content */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
              <span className="text-slate-400 shrink-0">Khách hàng:</span>
              <span className="font-bold text-slate-800 text-right">{profile?.fullName || 'Hội viên F Sport'}</span>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
              <span className="text-slate-400 shrink-0">Thời gian tạo:</span>
              <span className="font-medium text-slate-800 text-right">{formatDateTime(receipt.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
              <span className="text-slate-400 shrink-0">Nội dung dịch vụ:</span>
              <span className="font-bold text-slate-900 text-right">{receipt.itemName}</span>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
              <span className="text-slate-400 shrink-0">Phương thức:</span>
              <span className="font-bold text-slate-700 text-right">{formatPaymentMethod(receipt.paymentMethod)}</span>
            </div>
            <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
              <span className="text-slate-400 shrink-0">Trạng thái giao dịch:</span>
              <span
                className={`font-bold text-right ${
                  isRefund
                    ? 'text-indigo-600'
                    : isPending
                    ? 'text-amber-600'
                    : isFailed
                    ? 'text-rose-600'
                    : isCancelled
                    ? 'text-slate-600'
                    : isQuota
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {isRefund
                  ? 'Đã hoàn trả 100%'
                  : isPending
                  ? 'Chờ thanh toán'
                  : isFailed
                  ? 'Thanh toán thất bại'
                  : isCancelled
                  ? 'Đã hủy giao dịch'
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
              <span aria-hidden="true" className="material-symbols-outlined text-[14px]">check_circle</span>
              Hệ thống F Sport đã chứng thực điện tử
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Biên lai điện tử có giá trị đối soát kế toán và giải quyết quyền lợi hội viên tại quầy Lễ tân.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">print</span>
              In / Lưu biên lai PDF
            </button>
          </div>
        </div>
      )}
    </ModalDialog>
  );
}
