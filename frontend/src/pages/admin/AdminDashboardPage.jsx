import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { apiRequest } from '../../services/apiClient';

const dateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeekString = (date) => {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return dateString(monday);
};

const formatPrice = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

const formatTime = (value) => new Date(value).toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

export default function AdminDashboardPage() {
  const [reportDate, setReportDate] = useState(() => dateString(new Date()));
  const [response, setResponse] = useState(null);
  const loading = response?.date !== reportDate;
  const report = response?.date === reportDate ? response.report : null;
  const classes = response?.date === reportDate ? response.classes : [];
  const error = response?.date === reportDate ? response.error : '';

  useEffect(() => {
    let current = true;
    Promise.all([
      apiRequest(`/receptionist/report?date=${reportDate}`),
      apiRequest(`/bookings/receptionist-schedule?weekStart=${startOfWeekString(new Date(`${reportDate}T12:00:00`))}`),
    ])
      .then(([reportData, schedule]) => {
        if (!current) return;
        setResponse({
          date: reportDate,
          report: reportData,
          classes: schedule.filter((item) => item.startTime?.slice(0, 10) === reportDate),
          error: '',
        });
      })
      .catch((requestError) => {
        if (current) {
          setResponse({
            date: reportDate,
            report: null,
            classes: [],
            error: requestError.message || 'Không thể tải báo cáo từ cơ sở dữ liệu.',
          });
        }
      });
    return () => {
      current = false;
    };
  }, [reportDate]);

  const bookedSeats = classes.reduce((total, item) => total + (item.bookedSlots || 0), 0);
  const availableSeats = classes.reduce((total, item) => total + (item.maxSlots || 0), 0);
  const fillPercent = availableSeats
    ? Math.round((bookedSeats / availableSeats) * 100)
    : 0;
  const kpis = [
    { label: 'Doanh thu đã thu', value: formatPrice(report?.totalRevenue), icon: 'payments' },
    { label: 'Hội viên mới', value: report?.newMembers ?? '—', icon: 'person_add' },
    { label: 'Lớp trong ngày', value: classes.length, icon: 'stadium' },
    { label: 'Tỷ lệ lấp đầy', value: `${fillPercent}%`, icon: 'pie_chart' },
  ];

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · BÁO CÁO HIỆU SUẤT
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Báo Cáo Hiệu Suất Trung Tâm
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Doanh thu, đăng ký hội viên mới và hiệu suất phòng học từ cơ sở dữ liệu F Sport.
            </p>
          </div>
          <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-orange-500 text-[18px]">event</span>
            <span>Ngày báo cáo</span>
            <input
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm text-slate-800 font-semibold outline-none focus:border-orange-500"
            />
          </label>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-3xl text-orange-500 animate-spin">progress_activity</span>
            <span>Đang tổng hợp báo cáo vận hành trung tâm...</span>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, idx) => {
                const colorConfig = [
                  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
                  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
                  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
                ][idx % 4];

                return (
                  <article key={kpi.label} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.label}</span>
                      <div className={`w-9 h-9 rounded-xl ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} border flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-[20px]">{kpi.icon}</span>
                      </div>
                    </div>
                    <strong className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</strong>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
              <article className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="font-bold uppercase tracking-wider text-slate-900">Thanh toán trong ngày</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {report?.completedPayments || 0} giao dịch hoàn tất
                </p>
                {report?.paymentMethods?.length ? (
                  <ul className="mt-5 space-y-3">
                    {report.paymentMethods.map((method) => (
                      <li key={method.method} className="flex justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-600">{method.method}</span>
                        <span className="text-right font-bold text-slate-900">
                          {formatPrice(method.amount)} · {method.count} giao dịch
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">Chưa có thanh toán hoàn tất trong ngày này.</p>
                )}
              </article>

              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="font-bold uppercase text-slate-900">Lịch lớp trong ngày</h2>
                  <p className="mt-1 text-xs text-slate-500">Sĩ số được tổng hợp từ booking trong cơ sở dữ liệu.</p>
                </div>
                {classes.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">Không có lớp nào được lên lịch trong ngày này.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Lớp</th>
                          <th className="px-4 py-3">Thời gian</th>
                          <th className="px-4 py-3">HLV</th>
                          <th className="px-4 py-3 text-right">Sĩ số</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classes.map((item) => (
                          <tr key={item.sessionId}>
                            <td className="px-4 py-3">
                              <strong className="text-slate-900">{item.className}</strong>
                              <span className="block text-slate-500">{item.sportName}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {formatTime(item.startTime)}–{formatTime(item.endTime)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.coachName}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">
                              {item.bookedSlots} / {item.maxSlots}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-bold uppercase text-slate-900">Giao dịch trong ngày</h2>
              </div>
              {report?.payments?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Mã giao dịch</th>
                        <th className="px-4 py-3">Hội viên</th>
                        <th className="px-4 py-3">Phương thức</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.payments.map((payment) => (
                        <tr key={payment.paymentId}>
                          <td className="px-4 py-3 font-mono text-slate-700">{payment.paymentId}</td>
                          <td className="px-4 py-3 text-slate-700">{payment.memberName}</td>
                          <td className="px-4 py-3 text-slate-700">{payment.method}</td>
                          <td className="px-4 py-3 text-slate-700">{payment.status}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatPrice(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-5 text-sm text-slate-500">Chưa có giao dịch trong ngày này.</p>
              )}
            </section>
          </>
        )}
      </main>
    </AdminLayout>
  );
}
