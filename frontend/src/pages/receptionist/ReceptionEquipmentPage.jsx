import React, { useState, useEffect } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';

const EQUIPMENT_ITEMS_KEY = 'sports_center_equipment_items';
const EQUIPMENT_LOANS_KEY = 'sports_center_equipment_loans';

const INITIAL_ITEMS = [
  { itemId: 1, itemName: 'Vợt Tennis Wilson Pro Staff', category: 'Vợt', rentalPricePerHour: 30000, totalQuantity: 20, availableQuantity: 14, status: 'ACTIVE' },
  { itemId: 2, itemName: 'Vợt Pickleball Franklin Ben Johns', category: 'Vợt', rentalPricePerHour: 20000, totalQuantity: 30, availableQuantity: 22, status: 'ACTIVE' },
  { itemId: 3, itemName: 'Giày Thi Đấu Asics Court FF (Size 40-43)', category: 'Giày', rentalPricePerHour: 40000, totalQuantity: 15, availableQuantity: 10, status: 'ACTIVE' },
  { itemId: 4, itemName: 'Khăn Thể Thao Cao Cấp F Sport', category: 'Khăn', rentalPricePerHour: 0, totalQuantity: 50, availableQuantity: 38, status: 'ACTIVE' }, // Miễn phí
  { itemId: 5, itemName: 'Rổ Bóng Tennis 50 Quả (Tập phát bóng)', category: 'Bóng', rentalPricePerHour: 50000, totalQuantity: 10, availableQuantity: 7, status: 'ACTIVE' },
];

const INITIAL_LOANS = [
  {
    loanId: 501,
    memberId: 1,
    memberName: 'Nguyễn Văn Member',
    phone: '0901 234 567',
    itemId: 1,
    itemName: 'Vợt Tennis Wilson Pro Staff',
    quantity: 1,
    rentalPricePerHour: 30000,
    loanedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    returnedAt: null,
    status: 'BORROWED',
  },
  {
    loanId: 500,
    memberId: 2,
    memberName: 'Trần Thị Thu Trang',
    phone: '0912 888 999',
    itemId: 4,
    itemName: 'Khăn Thể Thao Cao Cấp F Sport',
    quantity: 2,
    rentalPricePerHour: 0,
    loanedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    returnedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    rentalFee: 0,
    status: 'RETURNED',
  },
];

export default function ReceptionEquipmentPage() {
  const { showToast } = useApp();

  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(EQUIPMENT_ITEMS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [loans, setLoans] = useState(() => {
    try {
      const stored = localStorage.getItem(EQUIPMENT_LOANS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

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
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  useEffect(() => {
    let current = true;
    apiRequest('/receptionist/equipments')
      .then((data) => {
        if (current && Array.isArray(data) && data.length > 0) {
          setItems(data);
          localStorage.setItem(EQUIPMENT_ITEMS_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {});

    apiRequest('/receptionist/equipment-loans')
      .then((data) => {
        if (current && Array.isArray(data) && data.length > 0) {
          setLoans(data);
          localStorage.setItem(EQUIPMENT_LOANS_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {});
    return () => { current = false; };
  }, []);

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

  const saveItems = (updated) => {
    setItems(updated);
    localStorage.setItem(EQUIPMENT_ITEMS_KEY, JSON.stringify(updated));
  };

  const saveLoans = (updated) => {
    setLoans(updated);
    localStorage.setItem(EQUIPMENT_LOANS_KEY, JSON.stringify(updated));
  };

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
    let createdLoan = null;
    try {
      createdLoan = await apiRequest('/receptionist/equipment-loans', {
        method: 'POST',
        body: JSON.stringify({
          memberId: selectedMember.userId,
          itemId: item.itemId,
          quantity: qty,
        }),
      });
    } catch {
      // optimistic fallback
    }

    // Create loan object
    const newLoan = createdLoan || {
      loanId: Date.now(),
      memberId: selectedMember.userId,
      memberName: selectedMember.fullName,
      phone: selectedMember.phone || selectedMember.email,
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: qty,
      rentalPricePerHour: item.rentalPricePerHour,
      loanedAt: new Date().toISOString(),
      returnedAt: null,
      status: 'BORROWED',
    };

    // Deduct stock
    const updatedItems = items.map((i) =>
      i.itemId === item.itemId ? { ...i, availableQuantity: i.availableQuantity - qty } : i
    );

    const updatedLoans = [newLoan, ...loans];
    saveItems(updatedItems);
    saveLoans(updatedLoans);

    showToast(
      'Mượn dụng cụ thành công',
      `Đã ghi nhận mượn ${qty} x "${item.itemName}" cho hội viên ${selectedMember.fullName}.`,
      'success'
    );

    setSelectedMember(null);
    setMemberSearch('');
    setSelectedItemId('');
    setQuantity(1);
    setIsSubmitting(false);
  };

  // Calculate rental fee upon return (hours = CEILING(diff in seconds / 3600))
  const calculateFee = (loan) => {
    if (!loan.rentalPricePerHour || loan.rentalPricePerHour === 0) return 0;
    const startMs = new Date(loan.loanedAt).getTime();
    const nowMs = Date.now();
    const elapsedHours = Math.max(1, Math.ceil((nowMs - startMs) / (1000 * 60 * 60)));
    return elapsedHours * loan.rentalPricePerHour * (loan.quantity || 1);
  };

  const openReturnModal = (loan) => {
    setReturningLoan(loan);
  };

  const handleConfirmReturn = async () => {
    if (!returningLoan) return;
    const fee = calculateFee(returningLoan);

    try {
      await apiRequest(`/receptionist/equipment-loans/${returningLoan.loanId}/return`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod }),
      });
    } catch {
      // optimistic fallback
    }

    // Update loan
    const updatedLoans = loans.map((l) =>
      l.loanId === returningLoan.loanId
        ? {
            ...l,
            returnedAt: new Date().toISOString(),
            rentalFee: fee,
            status: 'RETURNED',
            paymentMethod: fee > 0 ? paymentMethod : null,
          }
        : l
    );

    // Increase stock
    const updatedItems = items.map((i) =>
      i.itemId === returningLoan.itemId
        ? { ...i, availableQuantity: i.availableQuantity + (returningLoan.quantity || 1) }
        : i
    );

    saveLoans(updatedLoans);
    saveItems(updatedItems);

    showToast(
      'Trả đồ hoàn tất',
      `Đã nhận lại ${returningLoan.quantity} x "${returningLoan.itemName}". Phí thu: ${fee.toLocaleString()}đ (${paymentMethod}).`,
      'success'
    );
    setReturningLoan(null);
  };

  const activeLoans = loans.filter((l) => l.status === 'BORROWED');
  const returnedLoans = loans.filter((l) => l.status === 'RETURNED');

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
                  {items.map((i) => (
                    <option key={i.itemId} value={i.itemId} disabled={i.availableQuantity <= 0}>
                      {i.itemName} (Còn {i.availableQuantity}/{i.totalQuantity}) — {i.rentalPricePerHour === 0 ? 'Miễn phí' : `${i.rentalPricePerHour.toLocaleString()}đ/giờ`}
                    </option>
                  ))}
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
                        return (
                          <tr key={loan.loanId} className="hover:bg-slate-50">
                            <td className="px-4 py-3.5">
                              <strong className="block text-slate-900">{loan.memberName}</strong>
                              <span className="text-[11px] text-slate-500">{loan.phone}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold text-slate-800">{loan.quantity}x {loan.itemName}</span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              {new Date(loan.loanedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3.5">
                              {loan.rentalPricePerHour === 0 ? (
                                <span className="text-emerald-700 font-bold">0đ (Miễn phí)</span>
                              ) : (
                                <span className="font-bold text-orange-600">
                                  {loan.rentalPricePerHour.toLocaleString()}đ/h
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
                        {new Date(loan.loanedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} →{' '}
                        {loan.returnedAt ? new Date(loan.returnedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-black text-orange-600 text-sm">
                        {(loan.rentalFee || 0).toLocaleString()}đ
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
                      {item.rentalPricePerHour === 0 ? 'Miễn phí' : `${item.rentalPricePerHour.toLocaleString()}đ / giờ`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
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
                  <span>{new Date(returningLoan.loanedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thời gian trả:</span>
                  <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
                    <label className="font-bold uppercase text-slate-600 text-[11px]">Hình thức thu tiền</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="CASH">Tiền mặt tại quầy (CASH)</option>
                      <option value="VIETQR">Chuyển khoản VietQR</option>
                      <option value="POS">Quẹt thẻ máy POS</option>
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
                onClick={handleConfirmReturn}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Hoàn tất &amp; In biên lai
              </button>
            </div>
          </div>
        </div>
      )}
    </ReceptionistLayout>
  );
}
