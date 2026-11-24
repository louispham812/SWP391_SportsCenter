import { useState, useEffect, useCallback } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';

export default function ReceptionEquipmentPage() {
  const { showToast } = useApp();

  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
  const [activeTab, setActiveTab] = useState('loans'); // 'loans' | 'items'

  // New loan state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return & Checkout Modal
  const [returningLoan, setReturningLoan] = useState(null);
  const [returnReceipt, setReturnReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isReturning, setIsReturning] = useState(false);

  const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMethodLabel = (method, fee) => {
    if (!Number(fee || 0)) return 'Miễn phí';
    const upper = String(method || 'CASH').toUpperCase();
    if (upper === 'VNPAY' || upper === 'ONLINE') return 'VNPay';
    if (upper === 'CASH' || upper === 'CASH_COUNTER') return 'Tiền mặt';
    return upper;
  };

  const loadEquipments = useCallback(async () => {
    try {
      const [eqs, lns] = await Promise.all([
        apiRequest('/receptionist/equipments').catch(() => []),
        apiRequest('/receptionist/equipment-loans').catch(() => []),
      ]);
      setItems(Array.isArray(eqs) ? eqs : []);
      setLoans(Array.isArray(lns) ? lns : []);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu thiết bị:', err);
    }
  }, []);

  useEffect(() => {
    loadEquipments();
  }, [loadEquipments]);

  // Search members debounce
  useEffect(() => {
    let current = true;
    if (memberSearch.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const timer = setTimeout(() => {
      apiRequest(`/receptionist/members?query=${encodeURIComponent(memberSearch.trim())}&page=0&size=10`)
        .then((res) => {
          if (current) setMemberResults(res.content || []);
        })
        .catch(() => {
          if (current) setMemberResults([]);
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [memberSearch]);

  // Handle Borrow
  const handleBorrow = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      showToast('Chưa chọn hội viên', 'Vui lòng tìm và chọn hội viên mượn đồ.', 'warning');
      return;
    }
    if (!selectedItemId) {
      showToast('Chưa chọn dụng cụ', 'Vui lòng chọn loại dụng cụ thể thao cần mượn.', 'warning');
      return;
    }

    const item = items.find((i) => i.itemId === Number(selectedItemId));
    if (!item) return;

    const qty = Number(quantity) || 1;
    if (item.availableQuantity < qty) {
      showToast('Hết đồ', `Hiện tại dụng cụ "${item.itemName}" chỉ còn ${item.availableQuantity} chiếc.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/receptionist/equipment-loans', {
        method: 'POST',
        body: JSON.stringify({
          memberId: selectedMember.userId,
          itemId: item.itemId,
          quantity: qty,
        }),
      });

      showToast(
        'Mượn dụng cụ thành công',
        `Đã ghi nhận mượn ${qty} x "${item.itemName}" cho hội viên ${selectedMember.fullName}.`,
        'success'
      );

      setSelectedMember(null);
      setMemberSearch('');
      setSelectedItemId('');
      setQuantity(1);
      await loadEquipments();
    } catch (err) {
      showToast('Lỗi mượn đồ', err.message || 'Không thể ghi nhận mượn đồ.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate rental fee upon return (matches backend CEILING(minutes / 60))
  const calculateFee = (loan) => {
    const rate = Number(loan?.rentalPricePerHour || 0);
    if (!rate || rate <= 0) return 0;
    const startMs = loan?.loanedAt ? new Date(loan.loanedAt).getTime() : NaN;
    const diffMinutes = Number.isFinite(startMs)
      ? Math.max(1, Math.floor(Math.max(0, Date.now() - startMs) / 60000))
      : 1;
    const elapsedHours = Math.max(1, Math.ceil(diffMinutes / 60));
    return elapsedHours * rate * (Number(loan?.quantity) || 1);
  };

  const openReturnModal = (loan) => {
    setPaymentMethod('CASH');
    setReturningLoan(loan);
  };

  const handleConfirmReturn = async () => {
    if (!returningLoan || isReturning) return;
    const estimatedFee = calculateFee(returningLoan);

    setIsReturning(true);
    try {
      const returned = await apiRequest(`/receptionist/equipment-loans/${returningLoan.loanId}/return`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod }),
      });

      const actualFee = Number(returned?.rentalFee ?? estimatedFee);
      const methodSummary = actualFee > 0
        ? ` (${returned?.paymentMethod || paymentMethod})`
        : ' (Miễn phí)';

      showToast(
        'Trả đồ hoàn tất',
        `Đã nhận lại ${returningLoan.quantity} x "${returningLoan.itemName}". Phí thu: ${actualFee.toLocaleString()}đ${methodSummary}.`,
        'success'
      );
      setReturnReceipt({
        loanId: returned?.loanId ?? returningLoan.loanId,
        memberName: returned?.memberName ?? returningLoan.memberName,
        phone: returned?.phone ?? returningLoan.phone,
        itemName: returned?.itemName ?? returningLoan.itemName,
        quantity: returned?.quantity ?? returningLoan.quantity,
        loanedAt: returned?.loanedAt ?? returningLoan.loanedAt,
        returnedAt: returned?.returnedAt || new Date().toISOString(),
        rentalFee: actualFee,
        paymentMethod: actualFee > 0 ? (returned?.paymentMethod || 'CASH') : 'FREE',
      });
      setReturningLoan(null);
      await loadEquipments();
    } catch (err) {
      showToast('Lỗi trả đồ', err.message || 'Không thể xác nhận trả đồ.', 'error');
    } finally {
      setIsReturning(false);
    }
  };

  const activeLoans = loans.filter((l) => ['BORROWED', 'OVERDUE'].includes((l.status || '').toUpperCase()));
  const returnedLoans = loans.filter((l) => (l.status || '').toUpperCase() === 'RETURNED');

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              F SPORT RECEPTION · MƯỢN &amp; THUÊ DỤNG CỤ
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Quản Lý Mượn &amp; Thuê Dụng Cụ Thể Thao
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Cấp phát vợt thi đấu, giày, khăn tập, tính tiền thuê theo giờ và đối soát hoàn trả trực tiếp tại quầy.
            </p>
          </div>
        </header>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'loans', label: `Đang mượn (${activeLoans.length})`, icon: 'sports_tennis' },
            { id: 'history', label: `Lịch sử trả đồ (${returnedLoans.length})`, icon: 'history' },
            { id: 'items', label: 'Kho dụng cụ & Giá thuê', icon: 'inventory_2' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Borrow Form & Active Loans */}
        {activeTab === 'loans' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Borrow Form (5 cols) */}
            <form onSubmit={handleBorrow} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">add_task</span>
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Cho Mượn / Thuê Mới</h2>
                  <p className="text-xs text-slate-500">Tra cứu hội viên và cấp phát dụng cụ</p>
                </div>
              </div>

              {/* Member Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-700">1. Tra cứu hội viên (Tên, SĐT, RFID) *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setSelectedMember(null);
                    }}
                    placeholder="Nhập tên, số điện thoại hoặc mã RFID..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {memberResults.length > 0 && !selectedMember && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100">
                    {memberResults.map((m) => (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => {
                          setSelectedMember(m);
                          setMemberSearch(m.fullName);
                        }}
                        className="w-full p-2.5 text-left text-xs hover:bg-orange-50 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <strong className="block text-slate-900">{m.fullName}</strong>
                          <span className="text-slate-500 text-[11px]">{m.phone || m.email}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Chọn
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMember && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
                      <span>Hội viên: <strong>{selectedMember.fullName}</strong> ({selectedMember.phone || selectedMember.email})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberSearch('');
                      }}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Đổi
                    </button>
                  </div>
                )}
              </div>

              {/* Item selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-700">2. Chọn dụng cụ thể thao *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">-- Chọn dụng cụ trong kho --</option>
                  {items.map((i) => {
                    const price = Number(i.rentalPricePerHour || 0);
                    const isInactive = (i.status || '').toUpperCase() !== 'ACTIVE';
                    return (
                      <option key={i.itemId} value={i.itemId} disabled={i.availableQuantity <= 0 || isInactive}>
                        {i.itemName} (Còn {i.availableQuantity}/{i.totalQuantity}) — {price === 0 ? 'Miễn phí' : `${price.toLocaleString()}đ/giờ`}{isInactive ? ' [Ngưng]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-700">3. Số lượng mượn *</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedMember || !selectedItemId}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>Xác nhận xuất mượn dụng cụ</span>
              </button>
            </form>

            {/* Right: Active Borrowed List (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Danh sách dụng cụ đang được mượn</h2>
                  <p className="text-xs text-slate-500">{activeLoans.length} đơn đang hoạt động chưa hoàn trả</p>
                </div>
              </div>

              {activeLoans.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-4xl">inventory</span>
                  <p className="text-xs">Hiện tại không có dụng cụ nào đang được mượn.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Hội viên</th>
                        <th className="px-4 py-3">Dụng cụ</th>
                        <th className="px-4 py-3">Giờ mượn</th>
                        <th className="px-4 py-3">Đơn giá / giờ</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {activeLoans.map((loan) => {
                        const estimatedFee = calculateFee(loan);
                        const rate = Number(loan.rentalPricePerHour || 0);
                        const isOverdue = (loan.status || '').toUpperCase() === 'OVERDUE';
                        return (
                          <tr key={loan.loanId} className="hover:bg-slate-50">
                            <td className="px-4 py-3.5">
                              <strong className="block text-slate-900">{loan.memberName}</strong>
                              <span className="text-[11px] text-slate-500">{loan.phone}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-slate-800">{loan.quantity}x {loan.itemName}</span>
                              {isOverdue && (
                                <span className="ml-1.5 inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                  Quá hạn
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              {formatDateTime(loan.loanedAt)}
                            </td>
                            <td className="px-4 py-3.5">
                              {rate === 0 ? (
                                <span className="text-emerald-700 font-bold">0đ (Miễn phí)</span>
                              ) : (
                                <span className="font-bold text-orange-600">
                                  {rate.toLocaleString()}đ/h
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => openReturnModal(loan)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-orange-500 text-white text-[11px] font-bold uppercase transition-all shadow-2xs cursor-pointer"
                              >
                                Nhận trả đồ ({estimatedFee > 0 ? `${estimatedFee.toLocaleString()}đ` : '0đ'})
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
        )}

        {/* Tab 2: Loan History */}
        {activeTab === 'history' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Lịch sử trả đồ &amp; Doanh thu thuê dụng cụ</h2>
              <p className="text-xs text-slate-500">Các lượt mượn đã hoàn trả và đối soát phí thanh toán</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Hội viên</th>
                    <th className="px-5 py-3">Dụng cụ</th>
                    <th className="px-5 py-3">Giờ mượn → Giờ trả</th>
                    <th className="px-5 py-3">Phí thuê đã thu</th>
                    <th className="px-5 py-3">Thanh toán</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {returnedLoans.map((loan) => (
                    <tr key={loan.loanId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-slate-500">#{loan.loanId}</td>
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-900">{loan.memberName}</strong>
                        <span className="block text-[11px] text-slate-500">{loan.phone}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {loan.quantity}x {loan.itemName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDateTime(loan.loanedAt)} →{' '}
                        {formatDateTime(loan.returnedAt)}
                      </td>
                      <td className="px-5 py-3.5 font-black text-orange-600 text-sm">
                        {Number(loan.rentalFee || 0).toLocaleString()}đ
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-semibold">
                        {formatMethodLabel(loan.paymentMethod, loan.rentalFee)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                          Đã trả đồ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 3: Equipment Inventory */}
        {activeTab === 'items' && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Danh mục dụng cụ thể thao trong kho</h2>
                <p className="text-xs text-slate-500">Bảng giá niêm yết theo giờ và số lượng khả dụng</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {items.map((item) => (
                <div key={item.itemId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">{item.category}</span>
                      <span className={`text-xs font-bold ${item.availableQuantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {item.availableQuantity > 0 ? `Còn ${item.availableQuantity} chiếc` : 'Hết đồ'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-2">{item.itemName}</h3>
                    <p className="text-xs text-slate-500 mt-1">Tổng kho: {item.totalQuantity} chiếc</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Giá thuê:</span>
                    <strong className="text-sm font-black text-orange-600">
                      {Number(item.rentalPricePerHour || 0) === 0 ? 'Miễn phí' : `${Number(item.rentalPricePerHour).toLocaleString()}đ / giờ`}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Return & Pay Modal */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 !m-0">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Xác nhận trả đồ &amp; Thu phí</h3>
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Hội viên:</span>
                  <strong className="text-slate-900">{returningLoan.memberName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dụng cụ hoàn trả:</span>
                  <strong className="text-slate-900">{returningLoan.quantity}x {returningLoan.itemName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thời gian mượn:</span>
                  <span>{formatDateTime(returningLoan.loanedAt)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thời gian trả:</span>
                  <span>{formatDateTime(new Date())}</span>
                </div>
              </div>

              {calculateFee(returningLoan) > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50 border border-orange-200">
                    <span className="font-bold text-slate-700">Tổng phí thuê theo giờ:</span>
                    <strong className="text-lg font-black text-orange-600">
                      {calculateFee(returningLoan).toLocaleString()}đ
                    </strong>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold uppercase text-slate-600 text-[11px]">Hình thức thu tiền tại quầy</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="CASH">Tiền mặt tại quầy (CASH)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-center">
                  Dụng cụ miễn phí · Không thu phí thuê
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isReturning}
                onClick={handleConfirmReturn}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                {isReturning ? 'Đang xử lý...' : 'Hoàn tất & In biên lai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Equipment Return Receipt Modal */}
      {returnReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white print:static !m-0">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 print:shadow-none print:border-none print:max-w-none print:w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">receipt_long</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Biên Lai Hoàn Trả Dụng Cụ</span>
              </div>
              <button
                type="button"
                onClick={() => setReturnReceipt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-white text-slate-900 font-mono text-[11px] leading-tight space-y-2.5 border border-dashed border-slate-300 rounded-xl print:border-none print:p-0">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-sans font-black text-sm uppercase text-slate-900">F SPORT CENTER</div>
                <div className="font-bold text-xs pt-1 uppercase">BIÊN LAI TRẢ DỤNG CỤ</div>
                <div className="text-[10px] text-slate-500">Phiếu mượn #{returnReceipt.loanId}</div>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Hội viên:</span>
                  <strong>{returnReceipt.memberName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dụng cụ:</span>
                  <strong>{returnReceipt.quantity}x {returnReceipt.itemName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Giờ mượn:</span>
                  <span>{formatDateTime(returnReceipt.loanedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giờ trả:</span>
                  <span>{formatDateTime(returnReceipt.returnedAt)}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>PHÍ THUÊ THU:</span>
                  <span className="text-orange-600">
                    {Number(returnReceipt.rentalFee || 0) > 0
                      ? `${Number(returnReceipt.rentalFee).toLocaleString()}đ`
                      : 'Miễn phí'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Thanh toán:</span>
                  <span>{formatMethodLabel(returnReceipt.paymentMethod, returnReceipt.rentalFee)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>In biên lai</span>
              </button>
              <button
                type="button"
                onClick={() => setReturnReceipt(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </ReceptionistLayout>
  );
}
