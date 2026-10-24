import React, { useState } from 'react';

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default function PaymentMethodSelector({
  selectedMethod = 'VIETQR',
  onChange,
  amount = 0,
  transferMemo = 'FSPORT',
  accountNumber = '0938765432',
  accountName = 'F SPORT CENTER',
  bankName = 'MB Bank (Ngân hàng Quân Đội)',
  bankBin = '970422',
}) {
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = (text, fieldName) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const methods = [
    {
      id: 'VIETQR',
      name: 'Chuyển khoản VietQR',
      subtitle: 'Napas 247 · Tự động duyệt',
      icon: 'qr_code_2',
      badge: 'Khuyên dùng',
    },
    {
      id: 'CASH_COUNTER',
      name: 'Thanh toán tại quầy',
      subtitle: 'Tiền mặt hoặc POS tại lễ tân',
      icon: 'storefront',
      badge: 'Linh hoạt',
    },
    {
      id: 'VNPAY',
      name: 'Cổng VNPAY-QR',
      subtitle: 'ATM & 40+ ứng dụng ngân hàng',
      icon: 'credit_card',
    },
    {
      id: 'SANDBOX',
      name: 'Ví F Sport Sandbox',
      subtitle: 'Thử nghiệm hệ thống 0đ',
      icon: 'developer_mode',
      badge: 'Dev Mode',
    },
  ];

  // Dynamic VietQR image URL
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${Math.round(
    amount
  )}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Phương thức thanh toán
        </label>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {methods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onChange(method.id)}
                className={`relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                    isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{method.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{method.name}</span>
                    {method.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          isSelected
                            ? 'bg-orange-200 text-orange-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">{method.subtitle}</p>
                </div>
                <div className="shrink-0 self-center">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Method Details */}
      {selectedMethod === 'VIETQR' && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-4 text-xs text-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-lg">qr_code_scanner</span>
              <span className="font-bold text-slate-900">Quét mã chuyển khoản tức thì</span>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
              Napas 24/7
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QR Mockup / Live VietQR */}
            <div className="relative shrink-0 rounded-2xl bg-white p-2.5 shadow-md border border-slate-200 text-center">
              <img
                src={qrUrl}
                alt="Mã VietQR"
                className="h-36 w-36 object-contain rounded-xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(transferMemo);
                }}
              />
              <span className="mt-1 block text-[9px] font-bold uppercase text-slate-500">
                Quét bằng app ngân hàng
              </span>
            </div>

            {/* Bank details with copy buttons */}
            <div className="min-w-0 flex-1 space-y-2 text-xs w-full">
              <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500">Ngân hàng thụ hưởng</div>
                  <div className="font-bold text-slate-900">{bankName}</div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500">Số tài khoản</div>
                  <div className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                    {accountNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, 'accountNumber')}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedField === 'accountNumber' ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedField === 'accountNumber' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500">Chủ tài khoản</div>
                  <div className="font-bold text-slate-900">{accountName}</div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-orange-200 bg-orange-50/30">
                <div>
                  <div className="text-[10px] text-orange-700 font-semibold">Nội dung chuyển khoản</div>
                  <div className="font-mono font-bold text-orange-900 text-sm tracking-wider">
                    {transferMemo}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(transferMemo, 'transferMemo')}
                  className="rounded-lg bg-orange-100 hover:bg-orange-200 px-2.5 py-1 text-[11px] font-semibold text-orange-800 transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedField === 'transferMemo' ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedField === 'transferMemo' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5 pt-1">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
            <span>Sau khi chuyển khoản, bấm nút xác nhận bên dưới để hệ thống cập nhật lịch ngay lập tức.</span>
          </div>
        </div>
      )}

      {selectedMethod === 'CASH_COUNTER' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <span className="material-symbols-outlined text-lg text-emerald-600">storefront</span>
            <span>Thanh toán trực tiếp tại quầy Lễ Tân</span>
          </div>
          <p className="leading-relaxed text-emerald-800">
            Hệ thống sẽ giữ chỗ trước cho bạn. Bạn có thể thanh toán bằng <strong>tiền mặt</strong> hoặc <strong>quẹt thẻ POS</strong> tại Quầy Lễ Tân (Tầng 1 F Sport Center) trước khi vào sân/lớp học.
          </p>
        </div>
      )}

      {selectedMethod === 'VNPAY' && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sky-900">
            <span className="material-symbols-outlined text-lg text-sky-600">credit_card</span>
            <span>Cổng thanh toán quốc dân VNPAY-QR</span>
          </div>
          <p className="leading-relaxed text-sky-800">
            Chuyển hướng an toàn qua cổng VNPAY, hỗ trợ thẻ ATM nội địa của tất cả ngân hàng tại Việt Nam và ví điện tử VNPAY.
          </p>
        </div>
      )}

      {selectedMethod === 'SANDBOX' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span className="material-symbols-outlined text-lg text-amber-600">developer_mode</span>
            <span>Chế độ kiểm thử F Sport Sandbox</span>
          </div>
          <p className="leading-relaxed text-amber-800">
            Giao dịch mô phỏng phục vụ đánh giá tính năng. Hệ thống tự động tạo mã giao dịch thành công và kích hoạt quyền lợi ngay lập tức mà không trừ tiền tài khoản thật.
          </p>
        </div>
      )}
    </div>
  );
}
