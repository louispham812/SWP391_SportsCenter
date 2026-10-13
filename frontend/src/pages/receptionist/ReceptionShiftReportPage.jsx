import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { getReceptionistReport } from '../../services/receptionistApi';

const todayKey = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const currency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value || 0);

export default function ReceptionShiftReportPage() {
  const [date, setDate] = useState(todayKey);
  const [reportResponse, setReportResponse] = useState(null);
  const loading = reportResponse?.key !== date;
  const report = reportResponse?.key === date ? reportResponse.data : null;
  const error = reportResponse?.key === date ? reportResponse.error : '';

  useEffect(() => {
    let active = true;
    getReceptionistReport(date)
      .then((data) => {
        if (active) setReportResponse({ key: date, data, error: '' });
      })
      .catch((requestError) => {
        if (active) setReportResponse({
          key: date,
          data: null,
          error: requestError.message || 'Không thể tải báo cáo doanh thu.',
        });
      });
    return () => {
      active = false;
    };
  }, [date]);

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 inline-flex rounded bg-secondary-container/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              FLOW 3 · SHIFT &amp; REVENUE
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Báo cáo ca trực &amp; doanh thu</h1>
            <p className="text-sm text-slate-500">Tổng hợp giao dịch thực tế theo ngày đã chọn.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            Ngày báo cáo
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2" />
          </label>
        </header>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải báo cáo...</div>
        ) : report && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Doanh thu đã thu</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{currency(report.totalRevenue)}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Giao dịch hoàn tất</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{report.completedPayments}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hội viên đăng ký mới</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{report.newMembers}</p>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Doanh thu theo phương thức</h2>
              {report.paymentMethods.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {report.paymentMethods.map((method) => (
                    <div key={method.method} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">{method.method}</p>
                      <p className="mt-1 font-bold text-slate-900">{currency(method.amount)}</p>
                      <p className="mt-1 text-xs text-slate-500">{method.count} giao dịch</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">Chưa có giao dịch hoàn tất trong ngày này.</p>}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold text-slate-900">Giao dịch trong ngày</h2>
                <p className="mt-1 text-xs text-slate-500">Các khoản đang chờ duyệt không được cộng vào doanh thu đã thu.</p>
              </div>
              {report.payments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="px-5 py-3">Hội viên</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Phương thức</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Số tiền</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.payments.map((payment) => (
                        <tr key={payment.paymentId}>
                          <td className="px-5 py-4 font-medium text-slate-900">{payment.memberName}</td>
                          <td className="px-5 py-4 text-slate-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td className="px-5 py-4 text-slate-600">{payment.method}</td>
                          <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${
                            payment.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{payment.status}</span></td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-900">{currency(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="p-8 text-center text-sm text-slate-500">Không có giao dịch trong ngày này.</p>}
            </section>
          </>
        )}
      </div>
    </ReceptionistLayout>
  );
}
