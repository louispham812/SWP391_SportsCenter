import React, { useState, useMemo } from 'react';
import { apiRequest } from '../../services/apiClient';

// Format functions inline (self-contained component)
const formatVnd = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatRefCode = (refCode) => {
  if (!refCode) return '#N/A';
  if (refCode.startsWith('#')) return refCode;
  if (/^\d+$/.test(refCode)) return `#${refCode}`;
  if (refCode.includes('-') && refCode.length > 20) return `#${refCode.substring(0, 8)}`;
  return `#${refCode}`;
};

const getItemTypeIcon = (itemType) => {
  switch (itemType) {
    case 'MEMBERSHIP': return '🎫';
    case 'COURT': return '🏸';
    case 'CLASS': return '📚';
    case 'PT': return '💪';
    case 'QUOTA': return '⭐';
    default: return '📄';
  }
};

const getItemTypeLabel = (itemType) => {
  switch (itemType) {
    case 'MEMBERSHIP': return 'Gói Hội Viên';
    case 'COURT': return 'Đặt Sân';
    case 'CLASS': return 'Lớp Học';
    case 'PT': return 'Huấn Luyện Viên';
    case 'QUOTA': return 'Khấu Trừ Quota';
    default: return 'Dịch Vụ Khác';
  }
};

/**
 * Refund Request Modal Component (MEM-31 / MGR-16)
 * Allows members to request refund for paid transactions
 * Includes grouped dropdown with shortened reference codes (OPTION 2 FIX)
 * Self-contained with inline format functions
 * 
 * @param {boolean} show - Whether modal is visible
 * @param {Function} onClose - Callback to close modal
 * @param {Array} transactions - All transactions list
 * @param {Function} onSuccess - Callback after successful refund request
 * @param {Function} showToast - Toast notification function
 */
export default function RefundRequestModal({ 
  show, 
  onClose, 
  transactions, 
  onSuccess,
  showToast 
}) {
  const [selectedTxForRefund, setSelectedTxForRefund] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Filter only paid transactions with amount > 0 (cannot refund quota or already refunded)
  const paidTransactions = transactions.filter(
    (t) => t.paymentStatus === 'PAID' && parseFloat(t.amount) > 0
  );

  // Group transactions by item type for better dropdown UX (OPTION 2 FIX)
  const groupedPaidTransactions = useMemo(() => {
    const groups = {};
    
    paidTransactions.forEach((tx) => {
      const type = tx.itemType || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(tx);
    });
    
    // Sort groups by priority: MEMBERSHIP > COURT > CLASS > PT > OTHER
    const sortOrder = ['MEMBERSHIP', 'COURT', 'CLASS', 'PT', 'OTHER'];
    const sorted = {};
    sortOrder.forEach(type => {
      if (groups[type]) {
        sorted[type] = groups[type];
      }
    });
    
    // Add any other types not in sortOrder
    Object.keys(groups).forEach(type => {
      if (!sorted[type]) {
        sorted[type] = groups[type];
      }
    });
    
    return sorted;
  }, [paidTransactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTxForRefund) {
      showToast('Lỗi', 'Vui lòng chọn giao dịch muốn yêu cầu hoàn tiền.', 'error');
      return;
    }
    const targetTx = transactions.find((t) => (t.referenceCode || `TX-${t.id}`) === selectedTxForRefund);
    if (!targetTx) return;

    try {
      await apiRequest('/members/me/refunds', {
        method: 'POST',
        body: JSON.stringify({
          transactionId: targetTx.id || null,
          referenceCode: targetTx.referenceCode || `TX-${targetTx.id}`,
          bookingDescription: targetTx.itemName || 'Giao dịch dịch vụ thể thao',
          refundAmount: parseFloat(targetTx.amount) || 0,
          reason: refundReason,
          bankName,
          bankAccount,
          accountHolder,
        }),
      });
      
      // Reset form
      setSelectedTxForRefund('');
      setRefundReason('');
      setBankAccount('');
      setAccountHolder('');
      
      onClose();
      showToast(
        'Yêu cầu hoàn tiền đã gửi',
        'Đã chuyển đến Quản lý xét duyệt theo quy chế hoàn tiền 2 tiếng.',
        'success'
      );
      await onSuccess();
    } catch (err) {
      showToast('Lỗi yêu cầu hoàn tiền', err.message || 'Không thể gửi yêu cầu hoàn tiền.', 'error');
    }
  };

  if (!show) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 !m-0"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 relative"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Gửi Yêu Cầu Hoàn Tiền</h3>
              <p className="text-xs text-slate-500">Áp dụng cho hủy lịch trước 2h hoặc yêu cầu hoàn phí theo quy chế</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Chọn Giao Dịch Cần Hoàn</label>
            <select
              value={selectedTxForRefund}
              onChange={(e) => setSelectedTxForRefund(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Chọn giao dịch đã thanh toán --</option>
              
              {/* Grouped by item type for better UX (OPTION 2 FIX) */}
              {Object.entries(groupedPaidTransactions).map(([type, items]) => (
                <optgroup 
                  key={type} 
                  label={`${getItemTypeIcon(type)} ${getItemTypeLabel(type)}`}
                >
                  {items.map((tx) => (
                    <option 
                      key={tx.id} 
                      value={tx.referenceCode || `TX-${tx.id}`}
                    >
                      {formatRefCode(tx.referenceCode || `TX-${tx.id}`)} · {tx.itemName || 'Dịch vụ'} ({formatVnd(tx.amount)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Lý Do Yêu Cầu Hoàn Tiền</label>
            <textarea
              rows="2"
              placeholder="Ví dụ: Bận công tác đột xuất, hủy sân trước giờ quy định 2 tiếng, lý do sức khỏe..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ngân Hàng</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="Vietcombank">Vietcombank</option>
                <option value="MB Bank">MB Bank</option>
                <option value="Techcombank">Techcombank</option>
                <option value="BIDV">BIDV</option>
                <option value="ACB">ACB</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Số Tài Khoản</label>
              <input
                type="text"
                placeholder="0123456789"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Chủ Tài Khoản</label>
              <input
                type="text"
                placeholder="NGUYEN VAN A"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            <strong>Lưu ý quy chế:</strong> Hệ thống đối soát mốc thời gian hủy booking trước 2 tiếng. Sau khi Quản lý duyệt, số tiền sẽ được chuyển khoản trực tiếp qua ngân hàng thụ hưởng trong vòng 24 giờ.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Gửi Yêu Cầu Hoàn Tiền
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
