import React, { useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { useApp } from '../../context/AppContext';

export default function ReceptionPOSPage() {
  const { showToast, addAuditLog } = useApp();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qr' | 'pos'
  const [invoiceModal, setInvoiceModal] = useState(null);

  const catalog = [
    { id: 1, type: 'package', name: 'Gói Hội Viên Silver 1 Tháng', price: 1490000, category: 'Gói Tập' },
    { id: 2, type: 'package', name: 'Gói Hội Viên Gold 1 Tháng', price: 2790000, category: 'Gói Tập' },
    { id: 3, type: 'package', name: 'Gói Pickleball Match Pass 10 Buổi', price: 2500000, category: 'Gói Tập' },
    { id: 4, type: 'package', name: 'Vé Tháng Bơi Bốn Mùa 30 Lượt', price: 1800000, category: 'Gói Tập' },
    { id: 5, type: 'item', name: 'Whey Protein Isolate Shake 40g', price: 55000, category: 'Đồ Uống Dinh Dưỡng' },
    { id: 6, type: 'item', name: 'Nước Điện Giải Pocari Sweat 500ml', price: 25000, category: 'Đồ Uống Dinh Dưỡng' },
    { id: 7, type: 'item', name: 'Thuê Vợt Pickleball Pro Carbon (Ca)', price: 50000, category: 'Dịch Vụ Phụ' },
    { id: 8, type: 'item', name: 'Hộp 3 Quả Bóng Tennis US Open', price: 120000, category: 'Dụng Cụ' },
  ];

  const addToCart = (product) => {
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    showToast('Đã thêm giỏ hàng', `${product.name} (+1)`, 'info');
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const [invoiceCounter, setInvoiceCounter] = useState(8920);

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Giỏ hàng trống', 'Vui lòng chọn sản phẩm vào giỏ hàng trước khi thanh toán!', 'warning');
      return;
    }

    const nextInvId = invoiceCounter + 1;
    setInvoiceCounter(nextInvId);

    const invoiceData = {
      invoiceId: `INV-${nextInvId}`,
      date: '19/11/2026',
      time: '08:45 AM',
      items: [...cart],
      total: subtotal,
      method: paymentMethod.toUpperCase(),
      cashier: 'Hoàng Thu Trang',
    };

    setInvoiceModal(invoiceData);
    setCart([]);
    addAuditLog('Thu ngân POS', `Xuất hóa đơn #${invoiceData.invoiceId} tổng tiền ${subtotal.toLocaleString('vi-VN')} ₫`);
    showToast('Thanh toán thành công', `Hóa đơn #${invoiceData.invoiceId} đã được ghi nhận vào doanh thu!`, 'success');
  };

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                FLOW 3: PAYMENT & POS CASHIER
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Điểm Bán Hàng & Thu Ngân (POS Counter)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Đăng ký gói tập trực tiếp tại quầy, bán phụ kiện, nước uống và in hóa đơn VAT.
            </p>
          </div>
        </div>

        {/* 2 Columns: 8 Cols Catalog / 4 Cols Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (8 Cols): Danh mục sản phẩm */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {catalog.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {prod.category}
                    </span>
                    <h3 className="font-headline-sm text-sm font-bold text-slate-900 mt-1 mb-2">
                      {prod.name}
                    </h3>
                    <div className="text-base font-bold text-slate-900 font-headline-sm">
                      {prod.price.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    className="mt-3 w-full py-2 rounded-xl bg-slate-100 hover:bg-[#c3f400] text-slate-950 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                    <span>Thêm</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI (4 Cols): Giỏ Hàng & Thanh Toán */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                Hóa Đơn Bán Hàng
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {cart.reduce((a, b) => a + b.qty, 0)} món
              </span>
            </div>

            {/* Cart Items */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Chưa có sản phẩm trong giỏ hàng.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 truncate">{item.name}</div>
                      <div className="text-slate-500">
                        {item.price.toLocaleString('vi-VN')} ₫ x {item.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <strong className="text-slate-900 font-bold font-mono">
                        {(item.price * item.qty).toLocaleString('vi-VN')} ₫
                      </strong>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal & Method */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-600">Tổng thanh toán:</span>
                <span className="font-headline-xl text-xl font-bold text-primary">
                  {subtotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {[
                  { id: 'cash', label: 'Tiền Mặt', icon: 'payments' },
                  { id: 'qr', label: 'VietQR', icon: 'qr_code' },
                  { id: 'pos', label: 'Quẹt Thẻ', icon: 'credit_card' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 border ${
                      paymentMethod === m.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl bg-[#c3f400] hover:bg-[#abd600] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Xác Nhận & Xuất Hóa Đơn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal Preview */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setInvoiceModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="text-center space-y-1">
              <span className="material-symbols-outlined text-emerald-600 text-[36px]">
                receipt
              </span>
              <h3 className="font-headline-sm text-lg font-bold text-slate-900">
                HÓA ĐƠN ĐIỆN TỬ
              </h3>
              <div className="text-xs font-mono text-slate-500">Mã: {invoiceModal.invoiceId}</div>
              <div className="text-[11px] text-slate-400">
                {invoiceModal.date} · {invoiceModal.time} · Thu ngân: {invoiceModal.cashier}
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2 text-xs">
              {invoiceModal.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-slate-700">
                    {i.name} (x{i.qty})
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {(i.price * i.qty).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline text-sm pt-1">
              <span className="font-bold text-slate-700">TỔNG CỘNG ({invoiceModal.method}):</span>
              <span className="font-bold text-base text-primary font-mono">
                {invoiceModal.total.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  setInvoiceModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>In Hóa Đơn</span>
              </button>
              <button
                onClick={() => setInvoiceModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
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
