import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';

const formatPrice = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

export default function ReceptionPOSPage() {
  const [packages, setPackages] = useState([]);
  const [memberSearchResult, setMemberSearchResult] = useState(null);
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let current = true;
    apiRequest('/packages')
      .then((rows) => {
        if (current) setPackages(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải gói tập.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    if (search.trim().length < 2) {
      return () => {
        current = false;
      };
    }
    const timeoutId = window.setTimeout(() => {
      apiRequest(`/receptionist/members?query=${encodeURIComponent(search.trim())}&page=0&size=20`)
        .then((result) => {
          if (current) setMemberSearchResult({ query: search.trim(), members: result.content || [] });
        })
        .catch((requestError) => {
          if (current) setError(requestError.message || 'Không thể tìm hội viên.');
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const members = memberSearchResult?.query === search.trim()
    ? memberSearchResult.members
    : [];
  const selectedMember = members.find((member) => member.userId === Number(memberId));
  const selectedPackage = packages.find((item) => item.packageId === Number(packageId));

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!memberId || !packageId) {
      setError('Vui lòng chọn hội viên và gói tập.');
      return;
    }
    setSaving(true);
    setError('');
    setReceipt(null);
    try {
      const result = await apiRequest('/receptionist/membership-sales', {
        method: 'POST',
        body: JSON.stringify({
          memberId: Number(memberId),
          packageId: Number(packageId),
          paymentMethod,
        }),
      });
      setReceipt(result);
    } catch (requestError) {
      setError(requestError.message || 'Không thể ghi nhận giao dịch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ReceptionistLayout>
      <main className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            F SPORT RECEPTION · THU NGÂN POS
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Thu Ngân &amp; Đăng Ký Gói Tập</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu hội viên, chọn gói thẻ đang mở bán và ghi nhận khoản thanh toán trực tiếp tại quầy F Sport.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {receipt && (
          <section role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-2xl shrink-0">check_circle</span>
            <div>
              Đã ghi nhận giao dịch <strong>#{receipt.paymentId}</strong> cho gói <strong>{receipt.packageName}</strong>: <span className="font-bold text-emerald-700">{formatPrice(receipt.amount)}</span> · <span className="font-semibold uppercase text-xs px-2 py-0.5 rounded-full bg-emerald-100">{receipt.paymentStatus}</span>
            </div>
          </section>
        )}

        <form onSubmit={handleCheckout} className="grid gap-6 lg:grid-cols-5">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <label className="block text-sm font-bold text-slate-800" htmlFor="member-search">
              Tìm hội viên theo tên, email hoặc số điện thoại
            </label>
            <input
              id="member-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setMemberId('');
              }}
              placeholder="Nhập tên, số điện thoại hoặc email (tối thiểu 2 ký tự)..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            {search.trim().length >= 2 && (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2">Không tìm thấy hội viên phù hợp.</p>
                ) : members.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => setMemberId(String(member.userId))}
                    className={`w-full rounded-xl border p-3.5 text-left text-sm transition-all ${
                      memberId === String(member.userId)
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/15'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <strong className="block text-slate-900">{member.fullName}</strong>
                    <span className="text-xs text-slate-500">{member.phone || member.email}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedMember && (
              <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
                <span className="material-symbols-outlined text-orange-600 text-[18px]">account_circle</span>
                <span>Hội viên đã chọn: <strong>{selectedMember.fullName}</strong></span>
              </div>
            )}

            <label className="block pt-3 text-sm font-bold text-slate-800" htmlFor="package-select">
              Gói tập muốn mua / gia hạn
            </label>
            <select
              id="package-select"
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">-- Chọn gói tập --</option>
              {packages.map((item) => (
                <option key={item.packageId} value={item.packageId}>
                  {item.name} · {formatPrice(item.price)} · {item.durationDays} ngày
                </option>
              ))}
            </select>
            {packages.length === 0 && !loading && (
              <p className="text-xs text-slate-500">Chưa có gói tập đang mở bán trong database.</p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="font-bold uppercase tracking-wider text-slate-900">Thanh toán tại quầy</h2>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="payment-method">
                Phương thức thu tiền
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-orange-500"
              >
                <option value="CASH">Tiền mặt tại quầy (CASH)</option>
                <option value="TRANSFER">Chuyển khoản VietQR (TRANSFER)</option>
                <option value="POS">Quẹt thẻ máy POS (POS)</option>
              </select>
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm">
                <span className="font-bold text-slate-600">Tổng thanh toán:</span>
                <strong className="text-xl font-black text-orange-600">{formatPrice(selectedPackage?.price)}</strong>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Giao dịch được đối soát và lưu tức thì vào bảng thanh toán trên máy chủ.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving || loading || packages.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Đang ghi nhận giao dịch...' : 'Xác nhận và in biên lai'}
            </button>
          </section>
        </form>
      </main>
    </ReceptionistLayout>
  );
}
