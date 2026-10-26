import React, { useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { getReceptionistReport } from '../../services/receptionistApi';
import { StatCardSkeleton } from '../../components/common/Skeleton';

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              F SPORT RECEPTION · BÁO CÁO CA TRỰC
            </div>
            <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">Báo cáo ca trực &amp; doanh thu</h1>
            <p className="text-sm text-slate-500">Tổng hợp biên lai giao dịch thực tế theo ca và theo ngày của quầy lễ tân.</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-orange-500 text-[18px]">event</span>
            <span>Ngày ca trực:</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-800 outline-none focus:border-orange-500"
            />
          </label>
        </header>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {loading ? (
          <StatCardSkeleton count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />
        ) : report && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs card-hover">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Doanh thu đã thu</p>
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">{currency(report.totalRevenue)}</p>
              </article>
              <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs card-hover">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Giao dịch hoàn tất</p>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">{report.completedPayments}</p>
              </article>
              <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs card-hover">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Hội viên đăng ký mới</p>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">{report.newMembers}</p>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold uppercase tracking-wider text-slate-900">Doanh thu theo phương thức</h2>
              {report.paymentMethods.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {report.paymentMethods.map((method) => (
                    <div key={method.method} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{method.method}</p>
                      <p className="mt-1.5 font-black text-slate-900 text-lg">{currency(method.amount)}</p>
                      <p className="mt-1 text-xs text-slate-400 font-medium">{method.count} giao dịch</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">Chưa có giao dịch hoàn tất trong ngày này.</p>}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold uppercase tracking-wider text-slate-900">Giao dịch trong ngày</h2>
                <p className="mt-0.5 text-xs text-slate-500">Các khoản đang chờ duyệt không được cộng vào doanh thu đã thu.</p>
              </div>
              {report.payments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr><th className="px-5 py-3.5">Hội viên</th><th className="px-5 py-3.5">Thời gian</th><th className="px-5 py-3.5">Phương thức</th><th className="px-5 py-3.5">Trạng thái</th><th className="px-5 py-3.5 text-right">Số tiền</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.payments.map((payment) => (
                        <tr key={payment.paymentId} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-bold text-slate-900">{payment.memberName}</td>
                          <td className="px-5 py-4 text-slate-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td className="px-5 py-4 text-slate-600 font-medium">{payment.method}</td>
                          <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            payment.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{payment.status}</span></td>
                          <td className="px-5 py-4 text-right font-black text-slate-900">{currency(payment.amount)}</td>
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
