import React from 'react';

export default function PaymentMethodSelector({
  selectedMethod = 'VIETQR',
  onChange,
}) {
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
  ];

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
    </div>
  );
}
