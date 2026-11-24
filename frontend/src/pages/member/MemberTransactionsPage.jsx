import { useState, useEffect, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import {
  getMemberProfile,
  getMemberTransactions,
} from '../../services/memberApi';
import { useApp } from '../../context/AppContext';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';

// Import only 2 reusable modals
import ReceiptModal from '../../components/member/ReceiptModal';
import RefundRequestModal from '../../components/member/RefundRequestModal';

// ============================================================
// FORMAT FUNCTIONS (Inline - follows MemberClassesPage pattern)
// ============================================================
const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const getItemTypeBadge = (itemType, paymentStatus, amount) => {
  if (paymentStatus === 'REFUNDED') {
    return { label: 'Hoàn Tiền 100%', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: 'currency_exchange' };
  }
  if (itemType === 'QUOTA' || parseFloat(amount) === 0) {
    return { label: 'Khấu trừ Quota (0đ)', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'stars' };
  }
  switch (itemType) {
    case 'MEMBERSHIP': return { label: 'Gói Hội Viên', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'card_membership' };
    case 'CLASS': return { label: 'Lớp Thể Thao', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'school' };
    case 'COURT': return { label: 'Đặt Sân Bãi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'sports_tennis' };
    case 'PT': return { label: 'Thuê HLV Riêng', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'person_add_alt_1' };
    default: return { label: 'Dịch Vụ Khác', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: 'receipt' };
  }
};

// Filter labels
const FILTER_LABELS = {
  ALL: 'Tất cả',
  MEMBERSHIP: 'Gói thành viên',
  CLASS: 'Lớp học',
  COURT: 'Đặt sân',
  QUOTA: 'Khấu trừ Quota (0đ)',
  REFUNDED: 'Đã hoàn tiền',
};

/**
 * Member Transactions Page
 * Displays transaction history with filtering, pagination, and modals
 * Option 2: Clean refactor with inline rendering (3 files total)
 */
export default function MemberTransactionsPage() {
  const { showToast } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'MEMBERSHIP' | 'CLASS' | 'COURT' | 'REFUNDED' | 'QUOTA'
  const [currentPage, setCurrentPage] = useState(1);
  const TX_PER_PAGE = 8;

  // Modal states
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const fetchDashboardData = async () => {
    const [txRes, profRes] = await Promise.all([
      getMemberTransactions().catch(() => []),
      getMemberProfile().catch(() => null),
    ]);
    return {
      txList: Array.isArray(txRes) ? txRes : [],
      profRes,
    };
  };

  useEffect(() => {
    let active = true;
    fetchDashboardData()
      .then(({ txList, profRes }) => {
        if (!active) return;
        setTransactions(txList);
        setProfile(profRes);
        setError(null);
      })
      .catch((err) => {
        console.error('Error loading transactions:', err);
        if (active) setError('Không thể tải lịch sử giao dịch.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { txList, profRes } = await fetchDashboardData();
      setTransactions(txList);
      setProfile(profRes);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Không thể tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on selected type
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType === 'ALL') return true;
      if (filterType === 'REFUNDED') return t.paymentStatus === 'REFUNDED';
      if (filterType === 'QUOTA') {
        return t.itemType === 'QUOTA' || t.paymentMethod === 'MEMBERSHIP_QUOTA' || parseFloat(t.amount) === 0;
      }
      return t.itemType === filterType;
    });
  }, [transactions, filterType]);

  const totalPages = Math.ceil(filteredTransactions.length / TX_PER_PAGE) || 1;

  // Paginate filtered transactions
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * TX_PER_PAGE;
    return filteredTransactions.slice(start, start + TX_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Calculate statistics
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

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
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
              Tra cứu minh bạch toàn bộ các khoản thanh toán gói hội viên, phí đặt lớp, khấu trừ quota 0đ và hoàn tiền tự động khi hủy lịch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRefundModal(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
              Yêu Cầu Hoàn Tiền
            </button>

            <button
              onClick={loadData}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Làm mới
            </button>
          </div>
        </div>

        {/* Financial Stats Cards - INLINE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Spent Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Đã Thanh Toán
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              {formatMoney(stats.totalSpent)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Giao dịch thành công
            </span>
          </div>

          {/* Total Refunded Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đã Được Hoàn Lại
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600">
              {formatMoney(stats.totalRefunded)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">published_with_changes</span>
              Hoàn 100% khi hủy trước 2 giờ
            </span>
          </div>

          {/* Transaction Count Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Lệnh Giao Dịch
            </span>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-orange-600">
              {stats.count}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Bao gồm gói tập, lớp học, sân bãi và cấn trừ Quota
            </span>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters - INLINE */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2">
              {Object.keys(FILTER_LABELS).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterType === filter
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {FILTER_LABELS[filter]}
                </button>
              ))}
            </div>
          </div>

          {/* Table - INLINE */}
          <div className="p-4 sm:p-5">
            {loading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : error ? (
              <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl text-xs">
                {error}
              </div>
            ) : paginatedTransactions.length === 0 ? (
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
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                      <th className="py-3 px-2.5">Mã Giao Dịch</th>
                      <th className="py-3 px-2.5 min-w-[180px]">Dịch Vụ / Nội Dung</th>
                      <th className="py-3 px-2.5">Thời Gian</th>
                      <th className="py-3 px-2.5">Phương Thức</th>
                      <th className="py-3 px-2.5">Số Tiền</th>
                      <th className="py-3 px-2.5">Trạng Thái</th>
                      <th className="py-3 px-2.5 text-right">Biên Lai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedTransactions.map((tx, idx) => {
                      const typeMeta = getItemTypeBadge(tx.itemType, tx.paymentStatus, tx.amount);
                      const isRefund = tx.paymentStatus === 'REFUNDED';
                      const isQuota = tx.itemType === 'QUOTA' || tx.paymentMethod === 'MEMBERSHIP_QUOTA' || parseFloat(tx.amount) === 0;

                      return (
                        <tr 
                          key={tx.id || tx.transactionId || tx.paymentId || tx.referenceCode || `tx-${idx}`} 
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Reference Code */}
                          <td className="py-3.5 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {tx.referenceCode || `TX-${tx.id}`}
                          </td>

                          {/* Item Name & Type Badge */}
                          <td className="py-3.5 px-2.5 min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg border text-[14px] shrink-0 ${typeMeta.color}`}>
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

                          {/* Created At */}
                          <td className="py-3.5 px-2.5 text-slate-600 font-medium whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold whitespace-nowrap">
                              {isQuota ? 'MEMBERSHIP_QUOTA' : tx.paymentMethod || 'SANDBOX'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-2.5 font-bold whitespace-nowrap">
                            {isQuota ? (
                              <span className="text-amber-600 font-extrabold whitespace-nowrap">0 ₫ (Quota VIP)</span>
                            ) : isRefund ? (
                              <span className="text-indigo-600 whitespace-nowrap">+{formatMoney(tx.amount)}</span>
                            ) : (
                              <span className="text-slate-900 whitespace-nowrap">{formatMoney(tx.amount)}</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-2.5 whitespace-nowrap">
                            {(() => {
                              const ps = String(tx.paymentStatus || '').toUpperCase();
                              if (isRefund) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                                    Đã Hoàn Tiền
                                  </span>
                                );
                              }
                              if (ps === 'PENDING' || ps === 'PENDING_PAYMENT') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                                    Chờ Thanh Toán
                                  </span>
                                );
                              }
                              if (ps === 'FAILED') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                                    Thất Bại
                                  </span>
                                );
                              }
                              if (ps === 'CANCELLED' || ps === 'VOID') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                                    Đã Hủy
                                  </span>
                                );
                              }
                              if (isQuota) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                                    Khấu Trừ Quota
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                                  Thành Công
                                </span>
                              );
                            })()}
                          </td>

                          {/* Receipt Button */}
                          <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedReceipt(tx)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Hiển thị {(currentPage - 1) * TX_PER_PAGE + 1} - {Math.min(currentPage * TX_PER_PAGE, filteredTransactions.length)} trên tổng số {filteredTransactions.length} giao dịch
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Modals - Only 2 reusable modals imported */}
        <ReceiptModal 
          receipt={selectedReceipt} 
          profile={profile} 
          onClose={() => setSelectedReceipt(null)} 
        />

        <RefundRequestModal
          show={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          transactions={transactions}
          onSuccess={loadData}
          showToast={showToast}
        />
    </MemberLayout>
  );
}
