import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';
import QrCodeSvg from '../../components/common/QrCodeSvg';

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
  const [showPrintModal, setShowPrintModal] = useState(false);

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
      setReceipt({
        ...result,
        member: selectedMember,
        pkg: selectedPackage,
        paymentMethodName:
          paymentMethod === 'CASH'
            ? 'Tiền mặt tại quầy'
            : paymentMethod === 'TRANSFER'
            ? 'Chuyển khoản VietQR'
            : 'Quẹt thẻ máy POS',
        createdAtFormatted: new Date().toLocaleString('vi-VN'),
      });
      setShowPrintModal(true);
    } catch (requestError) {
      setError(requestError.message || 'Không thể ghi nhận giao dịch.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
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
            Tra cứu hội viên, chọn gói thẻ đang mở bán, tự động gia hạn nối tiếp và in biên lai nhiệt 80mm chuẩn POS.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {receipt && (
          <section role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-3xl shrink-0">check_circle</span>
              <div>
                <div className="font-bold text-base">
                  Giao dịch thành công! Mã hóa đơn: #{receipt.paymentId}
                </div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Gói <strong>{receipt.packageName}</strong> · Số tiền: <strong>{formatPrice(receipt.amount)}</strong> · Trạng thái: <span className="font-bold uppercase text-[11px] px-2 py-0.5 bg-emerald-200/80 rounded-full">{receipt.paymentStatus}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>Xem &amp; In Biên Lai (80mm)</span>
              </button>
            </div>
          </section>
        )}

        <form onSubmit={handleCheckout} className="grid gap-4 lg:grid-cols-5">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-3">
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
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                    className={`w-full rounded-xl border p-3 text-left text-sm transition-all card-hover ${
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
                <span>Hội viên đã chọn: <strong>{selectedMember.fullName}</strong> ({selectedMember.phone || selectedMember.email})</span>
              </div>
            )}

            <label className="block pt-2 text-sm font-bold text-slate-800" htmlFor="package-select">
              Gói tập muốn mua / gia hạn
            </label>
            {loading ? (
              <div className="h-10 w-full rounded-xl skeleton-shimmer" />
            ) : (
              <select
                id="package-select"
                value={packageId}
                onChange={(event) => setPackageId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">-- Chọn gói tập --</option>
                {packages.map((item) => (
                  <option key={item.packageId} value={item.packageId}>
                    {item.name} · {formatPrice(item.price)} · {item.durationDays} ngày
                  </option>
                ))}
              </select>
            )}
            {packages.length === 0 && !loading && (
              <p className="text-xs text-slate-500">Chưa có gói tập đang mở bán trong database.</p>
            )}
            <p className="text-[11px] text-slate-400">
              * Hệ thống tự động phát hiện nếu hội viên đang có gói cùng loại còn hạn để cộng nối tiếp ngày hết hạn.
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
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
                Giao dịch được ghi nhận vào bảng thanh toán, tự động kích hoạt thẻ và sinh biên lai in nhiệt.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving || loading || packages.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Đang ghi nhận giao dịch...' : 'Xác nhận và xuất biên lai POS'}
            </button>
          </section>
        </form>

        {/* Modal Xem & In Hóa Đơn Nhiệt 80mm Chuẩn POS (REC-19) */}
        {showPrintModal && receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">print</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Hóa Đơn Nhiệt POS (80mm)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Template Hóa Đơn Khổ 80mm */}
              <div id="receipt-print-area" className="w-[80mm] max-w-full mx-auto p-4 bg-white text-slate-900 font-mono text-[11px] leading-tight space-y-3 border border-dashed border-slate-300 rounded-xl print:border-none print:p-0">
                <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
                  <div className="font-sans font-black text-sm tracking-wider uppercase text-slate-900">F SPORT CENTER</div>
                  <div className="text-[10px] text-slate-600">Trung Tâm Thể Thao Đa Năng Cao Cấp</div>
                  <div className="text-[9px] text-slate-500">Hotline: 1900 6868 · www.fsport.vn</div>
                  <div className="font-bold text-xs pt-1 uppercase">HÓA ĐƠN THANH TOÁN DỊCH VỤ</div>
                  <div className="text-[10px] text-slate-600">Số HĐ: #HD-{receipt.paymentId}</div>
                  <div className="text-[9px] text-slate-500">{receipt.createdAtFormatted}</div>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Khách hàng:</span>
                    <strong className="text-right">{receipt.member?.fullName || 'Hội viên F Sport'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Số điện thoại:</span>
                    <span>{receipt.member?.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mã hội viên:</span>
                    <span>#{receipt.memberId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thu ngân:</span>
                    <span>Lễ tân ca trực</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px] text-slate-700">
                    <span>TÊN DỊCH VỤ</span>
                    <span>THÀNH TIỀN</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{receipt.packageName}</div>
                      <div className="text-[9px] text-slate-500">Thời hạn: {receipt.pkg?.durationDays || '—'} ngày</div>
                    </div>
                    <strong className="text-right">{formatPrice(receipt.amount)}</strong>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold text-xs">
                    <span>TỔNG TIỀN:</span>
                    <span className="text-orange-600">{formatPrice(receipt.amount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Hình thức:</span>
                    <span>{receipt.paymentMethodName}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Trạng thái:</span>
                    <strong className="uppercase text-emerald-700">ĐÃ THANH TOÁN</strong>
                  </div>
                </div>

                {/* QR Code footer tra cứu */}
                <div className="pt-2 border-t border-dashed border-slate-400 flex flex-col items-center justify-center text-center space-y-1">
                  <QrCodeSvg text={`SPORTHUB-MEMBER-${receipt.memberId}`} size={90} />
                  <div className="text-[8px] text-slate-500">Mã QR Check-in: SPORTHUB-MEMBER-{receipt.memberId}</div>
                  <div className="text-[9px] text-slate-600 font-sans italic pt-1">
                    Cảm ơn quý khách! Chúc quý khách buổi tập nhiều năng lượng!
                  </div>
                </div>
              </div>

              {/* Action buttons in Modal */}
              <div className="pt-2 flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/25"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>In Phiếu Thu (80mm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ReceptionistLayout>
  );
}
