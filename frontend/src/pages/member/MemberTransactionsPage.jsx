import React, { useState, useEffect, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberTransactions, getMemberProfile } from '../../services/memberApi';

export default function MemberTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'MEMBERSHIP' | 'CLASS' | 'COURT' | 'REFUNDED'
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, profRes] = await Promise.all([
        getMemberTransactions().catch(() => []),
        getMemberProfile().catch(() => null),
      ]);
      setTransactions(Array.isArray(txRes) ? txRes : []);
      setProfile(profRes);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Không thể tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType === 'ALL') return true;
      if (filterType === 'REFUNDED') return t.paymentStatus === 'REFUNDED';
      return t.itemType === filterType;
    });
  }, [transactions, filterType]);

  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalRefunded = 0;
    transactions.forEach((t) => {
      const val = parseFloat(t.amount) || 0;
      if (t.paymentStatus === 'REFUNDED') {
        totalRefunded += val;
      } else if (t.paymentStatus === 'PAID') {
        totalSpent += val;
      }
    });
    return {
      totalSpent,
      totalRefunded,
      count: transactions.length,
    };
  }, [transactions]);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
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

  const getItemTypeBadge = (itemType, paymentStatus) => {
    if (paymentStatus === 'REFUNDED') {
      return {
        label: 'Hoàn Tiền 100%',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: 'currency_exchange',
      };
    }
    switch (itemType) {
      case 'MEMBERSHIP':
        return {
          label: 'Gói Hội Viên',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: 'card_membership',
        };
      case 'CLASS':
        return {
          label: 'Lớp Thể Thao',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: 'school',
        };
      case 'COURT':
        return {
          label: 'Đặt Sân Bãi',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: 'sports_tennis',
        };
      default:
        return {
          label: 'Dịch Vụ Khác',
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: 'receipt',
        };
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              Tài Chính Hội Viên
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Lịch Sử Giao Dịch & Hóa Đơn Điện Tử
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tra cứu minh bạch toàn bộ các khoản thanh toán gói hội viên, phí đặt lớp, tiền sân và hoàn tiền tự động khi hủy lịch.
            </p>
          </div>
          <button
            onClick={loadData}
            type="button"
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-orange-600 text-xs font-bold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Làm mới lịch sử
          </button>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đã Thanh Toán</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              {formatVnd(stats.totalSpent)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Giao dịch thành công
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Được Hoàn Lại</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600">
              {formatVnd(stats.totalRefunded)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">published_with_changes</span>
              Hoàn 100% khi hủy trước 2 giờ
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Lệnh Giao Dịch</span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-orange-600">
              {stats.count}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Bao gồm gói tập, lớp học, sân bãi
            </span>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'MEMBERSHIP', label: 'Gói thành viên' },
                { id: 'CLASS', label: 'Lớp học' },
                { id: 'COURT', label: 'Đặt sân' },
                { id: 'REFUNDED', label: 'Đã hoàn tiền' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold">Đang tải sổ giao dịch...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl text-xs">
                {error}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-[32px]">receipt_long</span>
                </div>
                <h3 className="text-base font-bold text-slate-800">Không có giao dịch nào</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Bạn chưa có khoản thanh toán nào cho danh mục này.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Mã Giao Dịch</th>
                      <th className="py-3 px-4">Dịch Vụ / Nội Dung</th>
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Phương Thức</th>
                      <th className="py-3 px-4">Số Tiền</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Biên Lai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => {
                      const typeMeta = getItemTypeBadge(tx.itemType, tx.paymentStatus);
                      const isRefund = tx.paymentStatus === 'REFUNDED';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {tx.referenceCode || `TX-${tx.id}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg border text-[14px] ${typeMeta.color}`}>
                                <span className="material-symbols-outlined text-[16px] block">
                                  {typeMeta.icon}
                                </span>
                              </span>
                              <div>
                                <div className="font-bold text-slate-900">{tx.itemName}</div>
                                <div className="text-[10px] text-slate-400">{typeMeta.label}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {formatDateTime(tx.createdAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                              {tx.paymentMethod || 'SANDBOX'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className={isRefund ? 'text-indigo-600' : 'text-slate-900'}>
                              {isRefund ? `+${formatVnd(tx.amount)}` : formatVnd(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isRefund ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                Đã Hoàn Tiền
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Thành Công
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedReceipt(tx)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-bold transition-colors inline-flex items-center gap-1"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[14px]">receipt</span>
                              Xem biên lai
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Printable E-Receipt Modal */}
        {selectedReceipt && (
          <div
            onClick={() => setSelectedReceipt(null)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-6 relative animate-in zoom-in-95 duration-150"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
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
                  {selectedReceipt.paymentStatus === 'REFUNDED'
                    ? 'PHIẾU XÁC NHẬN HOÀN TIỀN ĐIỆN TỬ'
                    : 'HÓA ĐƠN XÁC NHẬN THANH TOÁN ĐIỆN TỬ'}
                </p>
                <span className="inline-block mt-2 font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Mã: {selectedReceipt.referenceCode || `TX-${selectedReceipt.id}`}
                </span>
              </div>

              {/* Receipt Content */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Khách hàng:</span>
                  <span className="font-bold text-slate-800">{profile?.fullName || 'Hội viên F Sport'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Thời gian tạo:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(selectedReceipt.createdAt)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Nội dung dịch vụ:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.itemName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Phương thức:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Trạng thái giao dịch:</span>
                  <span
                    className={`font-bold ${
                      selectedReceipt.paymentStatus === 'REFUNDED' ? 'text-indigo-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedReceipt.paymentStatus === 'REFUNDED' ? 'Đã hoàn trả 100%' : 'Thành công (Đã quyết toán)'}
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-slate-700">Tổng tiền giao dịch:</span>
                  <span className="text-xl font-black text-orange-600">
                    {formatVnd(selectedReceipt.amount)}
                  </span>
                </div>
              </div>

              {/* Stamp & Footer */}
              <div className="pt-4 border-t border-dashed border-slate-200 text-center space-y-3">
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
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  In / Lưu biên lai PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
