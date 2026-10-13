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
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">POS · Giao dịch lưu trong database</p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Thu Ngân &amp; Đăng Ký Gói Tập</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tìm hội viên, chọn gói đang mở bán và ghi nhận khoản thanh toán tại quầy.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {receipt && (
          <section role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Đã ghi nhận giao dịch #{receipt.paymentId} cho gói {receipt.packageName}: {formatPrice(receipt.amount)} · {receipt.paymentStatus}
          </section>
        )}

        <form onSubmit={handleCheckout} className="grid gap-6 lg:grid-cols-5">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
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
              placeholder="Nhập ít nhất 2 ký tự"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            {search.trim().length >= 2 && (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-500">Không tìm thấy hội viên phù hợp.</p>
                ) : members.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => setMemberId(String(member.userId))}
                    className={`w-full rounded-xl border p-3 text-left text-sm ${
                      memberId === String(member.userId)
                        ? 'border-primary bg-slate-50'
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
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                Hội viên đã chọn: <strong>{selectedMember.fullName}</strong>
              </p>
            )}

            <label className="block pt-3 text-sm font-bold text-slate-800" htmlFor="package-select">
              Gói tập
            </label>
            <select
              id="package-select"
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Chọn gói tập</option>
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

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-bold uppercase text-slate-900">Thanh toán tại quầy</h2>
            <label className="block text-xs font-semibold text-slate-600" htmlFor="payment-method">
              Phương thức thanh toán
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="CASH">Tiền mặt</option>
              <option value="TRANSFER">Chuyển khoản</option>
              <option value="POS">Thẻ / POS</option>
            </select>
            <div className="flex justify-between border-t border-slate-100 pt-4 text-sm">
              <span className="font-semibold text-slate-600">Tổng thanh toán</span>
              <strong className="text-lg text-primary">{formatPrice(selectedPackage?.price)}</strong>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Giao dịch chỉ được xác nhận khi backend lưu thành công. Danh mục hàng hóa bán lẻ chưa có bảng dữ liệu nên không được hiển thị như sản phẩm có sẵn.
            </p>
            <button
              type="submit"
              disabled={saving || loading || packages.length === 0}
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Đang ghi giao dịch...' : 'Xác nhận và lưu giao dịch'}
            </button>
          </section>
        </form>
      </main>
    </ReceptionistLayout>
  );
}
