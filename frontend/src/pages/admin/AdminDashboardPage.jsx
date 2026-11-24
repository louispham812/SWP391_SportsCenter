import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import ModalDialog from '../../components/common/ModalDialog';
import { StatCardSkeleton } from '../../components/common/Skeleton';
import { apiRequest } from '../../services/apiClient';
import { exportToCsv } from '../../utils/csvExporter';
import { getPaymentStatus, getRevenueBreakdown, paymentCategory } from '../../utils/adminDashboard';

const dateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const formatDate = (value, time = false) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};
const formatTime = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
const transactionRows = (payments) => [
  [
    'Mã giao dịch',
    'Hội viên',
    'Điện thoại',
    'Email',
    'Dịch vụ',
    'Diễn giải',
    'Phương thức',
    'Người xử lý',
    'Trạng thái',
    'Số tiền (VNĐ)',
    'Thời gian',
  ],
  ...payments.map((p) => [
    p.paymentId,
    p.memberName || 'Khách vãng lai',
    p.phone,
    p.email,
    paymentCategory(p.type),
    p.description,
    p.method,
    p.processedByName || 'Tự thanh toán',
    getPaymentStatus(p.status).label,
    p.amount,
    formatDate(p.createdAt, true),
  ]),
];
const inputClass =
  'min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100';
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
const panelClass = 'min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm';

function Icon({ children, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${className}`}>
      {children}
    </span>
  );
}

function StatusBadge({ value }) {
  const status = getPaymentStatus(value);
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
      {status.label}
    </span>
  );
}

function LoadError({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <span>{message}</span>
      <button type="button" className={buttonClass} onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [today] = useState(() => dateString(new Date()));
  const [period, setPeriod] = useState('day');
  const [reportDate, setReportDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, setYear] = useState(today.slice(0, 4));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleRevision, setScheduleRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const scheduleDate = period === 'day' ? reportDate : today;
  const query = new URLSearchParams({
    period,
    ...(period !== 'all'
      ? {
          date: period === 'day' ? reportDate : period === 'month' ? `${month}-01` : `${year}-01-01`,
        }
      : {}),
  }).toString();
  const periodLabel =
    period === 'day'
      ? `Ngày ${formatDate(reportDate + 'T00:00:00')}`
      : period === 'month'
        ? `Tháng ${month.slice(5)}/${month.slice(0, 4)}`
        : period === 'year'
          ? `Năm ${year}`
          : 'Toàn thời gian';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setReport(null);
    setUpdatedAt(null);
    setError('');
    setSelectedTx(null);
    setPage(1);
    apiRequest(`/receptionist/report?${query}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const requestedPeriod = new URLSearchParams(query).get('period');
        if (requestedPeriod !== 'day' && data?.period !== requestedPeriod) {
          throw new Error('Máy chủ chưa trả về đúng kỳ báo cáo. Vui lòng cập nhật máy chủ và thử lại.');
        }
        setReport(data);
        setUpdatedAt(new Date());
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message || 'Không thể tải báo cáo.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, revision]);

  useEffect(() => {
    const controller = new AbortController();
    const monday = new Date(`${scheduleDate}T12:00:00`);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    setScheduleLoading(true);
    setScheduleError('');
    setSchedule([]);
    apiRequest(`/bookings/receptionist-schedule?weekStart=${dateString(monday)}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setSchedule(Array.isArray(data) ? data.filter((item) => item.startTime?.slice(0, 10) === scheduleDate) : []);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setScheduleError(err.message || 'Không thể tải lịch lớp học.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setScheduleLoading(false);
      });
    return () => controller.abort();
  }, [scheduleDate, scheduleRevision]);

  const payments = useMemo(() => (Array.isArray(report?.payments) ? report.payments : []), [report]);
  const breakdown = useMemo(() => getRevenueBreakdown(payments, report?.totalRevenue), [payments, report]);
  const methods = [
    ...new Set([...payments.map((p) => p.method || 'Khác'), ...(methodFilter !== 'all' ? [methodFilter] : [])]),
  ].sort();
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return payments.filter(
      (p) =>
        (statusFilter === 'all' || getPaymentStatus(p.status).key === statusFilter) &&
        (methodFilter === 'all' || (p.method || 'Khác') === methodFilter) &&
        (!keyword ||
          [p.paymentId, p.memberName, p.phone, p.email, p.description, p.type, paymentCategory(p.type), p.processedByName].some((value) =>
            String(value || '')
              .toLocaleLowerCase('vi')
              .includes(keyword),
          )),
    );
  }, [payments, search, statusFilter, methodFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visiblePayments = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const activeClasses = schedule.filter(
    (item) => !['CANCELLED', 'CANCELED'].includes(String(item.status).toUpperCase()),
  );
  const bookedSeats = activeClasses.reduce((sum, item) => sum + (Number(item.bookedSlots) || 0), 0);
  const capacity = activeClasses.reduce((sum, item) => sum + (Number(item.maxSlots) || 0), 0);
  const fillPercent = capacity ? Math.round((bookedSeats / capacity) * 100) : null;
  const hasFilters = search || statusFilter !== 'all' || methodFilter !== 'all';
  const exportReport = () => {
    if (!report || loading || error) return;
    exportToCsv(
      `BaoCao_TongQuan_${period}_${period === 'day' ? reportDate : period === 'month' ? month : period === 'year' ? year : today}.csv`,
      [
        ['BÁO CÁO TỔNG QUAN F SPORT'],
        ['Kỳ báo cáo', periodLabel],
        ['Thời gian xuất', new Date().toLocaleString('vi-VN')],
        ['Doanh thu giao dịch hoàn tất (VNĐ)', report.totalRevenue],
        ['Giao dịch hoàn tất', report.completedPayments],
        ['Hội viên mới', report.newMembers],
        [],
        ['NGUỒN THU — CHỈ GIAO DỊCH HOÀN TẤT'],
        ['Dịch vụ', 'Số tiền (VNĐ)', 'Số giao dịch', 'Tỷ trọng (%)'],
        ...breakdown.map((item) => [item.category, item.amount, item.count, item.percent]),
        [],
        ['PHƯƠNG THỨC THANH TOÁN — CHỈ GIAO DỊCH HOÀN TẤT'],
        ['Phương thức', 'Số tiền (VNĐ)', 'Số giao dịch'],
        ...(report.paymentMethods || []).map((item) => [item.method, item.amount, item.count]),
        [],
        ['TOÀN BỘ GIAO DỊCH TRONG KỲ — BAO GỒM MỌI TRẠNG THÁI'],
        ...transactionRows(payments),
      ],
    );
  };

  return (
    <AdminLayout
      dashboardQuickAction={{
        label: 'Xuất báo cáo',
        icon: 'download',
        onClick: exportReport,
        disabled: !report || loading || Boolean(error),
      }}
    >
      <main className="space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-600">Trung tâm điều hành</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Tổng quan trung tâm</h1>
            <p className="mt-2 text-sm text-slate-500">Theo dõi doanh thu, hội viên và hoạt động lớp học.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={loading || scheduleLoading}
              onClick={() => {
                setRevision((v) => v + 1);
                setScheduleRevision((v) => v + 1);
              }}
            >
              <Icon>refresh</Icon>Làm mới
            </button>
            <button
              type="button"
              className={`${buttonClass} !border-orange-600 !bg-orange-600 !text-white hover:!bg-orange-700`}
              disabled={!report || loading || Boolean(error)}
              onClick={exportReport}
            >
              <Icon>download</Icon>Xuất báo cáo CSV
            </button>
          </div>
        </header>

        <section aria-label="Thao tác quản trị" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Lịch & sân bãi', 'Xem lịch đặt và quản lý sân', 'stadium', '/admin/facilities'],
            ['Tạo lịch lớp học', 'Sắp xếp lớp và huấn luyện viên', 'event_available', '/admin/classes/new'],
            ['Duyệt nhân sự', 'Xử lý đăng ký nhân viên', 'how_to_reg', '/admin/staff-approvals'],
          ].map(([title, description, icon, path]) => (
            <Link
              key={path}
              to={path}
              className={`${panelClass} group flex items-center gap-2 p-3 transition hover:border-orange-300 hover:bg-orange-50/40 sm:gap-3 sm:p-4`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 sm:h-10 sm:w-10">
                <Icon>{icon}</Icon>
              </span>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 sm:text-sm">{title}</span>
                <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{description}</p>
              </div>
              <Icon className="ml-auto hidden shrink-0 text-slate-400 group-hover:text-orange-600 sm:inline-block">chevron_right</Icon>
            </Link>
          ))}
        </section>

        <section className="space-y-4" aria-labelledby="finance-heading" aria-busy={loading}>
          <div className={`${panelClass} flex flex-col justify-between gap-4 p-4 xl:flex-row xl:items-center`}>
            <div>
              <h2 id="finance-heading" className="font-bold text-slate-900">
                Báo cáo tài chính
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {periodLabel}
                {updatedAt && !loading ? ` · Cập nhật lúc ${formatTime(updatedAt)}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
                aria-label="Kỳ báo cáo"
              >
                {[
                  ['day', 'Ngày'],
                  ['month', 'Tháng'],
                  ['year', 'Năm'],
                  ['all', 'Tất cả'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={period === key}
                    onClick={() => setPeriod(key)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${period === key ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {period === 'day' && (
                <input
                  aria-label="Ngày báo cáo"
                  type="date"
                  className={inputClass}
                  value={reportDate}
                  max={today}
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && e.target.value <= today)
                      setReportDate(e.target.value);
                  }}
                />
              )}
              {period === 'month' && (
                <input
                  aria-label="Tháng báo cáo"
                  type="month"
                  className={inputClass}
                  value={month}
                  max={today.slice(0, 7)}
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}$/.test(e.target.value) && e.target.value <= today.slice(0, 7))
                      setMonth(e.target.value);
                  }}
                />
              )}
              {period === 'year' && (
                <select
                  aria-label="Năm báo cáo"
                  className={inputClass}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  {Array.from(
                    { length: Math.max(1, Number(today.slice(0, 4)) - 2019) },
                    (_, index) => Number(today.slice(0, 4)) - index,
                  ).map((value) => (
                    <option key={value} value={value}>
                      Năm {value}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <div role="status" aria-label="Đang tải báo cáo">
              <StatCardSkeleton count={4} />
            </div>
          ) : error ? (
            <LoadError message={error} onRetry={() => setRevision((v) => v + 1)} />
          ) : (
            report && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    [
                      'Doanh thu đã thu',
                      formatPrice(report.totalRevenue),
                      'Chỉ tính giao dịch hoàn tất',
                      'payments',
                      'bg-orange-50 text-orange-600',
                    ],
                    [
                      'Giao dịch hoàn tất',
                      report.completedPayments ?? 0,
                      `${payments.length} giao dịch trong kỳ`,
                      'receipt_long',
                      'bg-emerald-50 text-emerald-600',
                    ],
                    [
                      'Hội viên mới',
                      report.newMembers ?? 0,
                      'Tài khoản hội viên đăng ký trong kỳ',
                      'person_add',
                      'bg-blue-50 text-blue-600',
                    ],
                    [
                      'Giá trị giao dịch trung bình',
                      report.completedPayments > 0
                        ? formatPrice(Number(report.totalRevenue) / report.completedPayments)
                        : '—',
                      'Doanh thu / giao dịch hoàn tất',
                      'monitoring',
                      'bg-violet-50 text-violet-600',
                    ],
                  ].map(([label, value, description, icon, color]) => (
                    <article key={label} className={`${panelClass} p-5`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                          <Icon>{icon}</Icon>
                        </span>
                      </div>
                      <p className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                      <p className="mt-2 text-xs text-slate-500">{description}</p>
                    </article>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <article className={`${panelClass} p-5`}>
                    <h3 className="font-bold text-slate-900">Doanh thu theo dịch vụ</h3>
                    <p className="mt-1 text-xs text-slate-500">Tỷ trọng từ các giao dịch hoàn tất trong kỳ.</p>
                    {breakdown.length ? (
                      <div className="mt-5 space-y-4">
                        {breakdown.map((item, index) => (
                          <div key={item.category}>
                            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                              <span className="text-slate-600">
                                {item.category} <span className="text-xs text-slate-400">· {item.count} giao dịch</span>
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatPrice(item.amount)}{' '}
                                <span className="text-xs font-normal text-slate-500">({item.percent}%)</span>
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-slate-500'][index % 6]}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, item.percent))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-10 text-center text-sm text-slate-500">
                        Chưa có doanh thu từ giao dịch hoàn tất.
                      </p>
                    )}
                  </article>
                  <article className={`${panelClass} p-5`}>
                    <h3 className="font-bold text-slate-900">Phương thức thanh toán</h3>
                    <p className="mt-1 text-xs text-slate-500">Số tiền và số giao dịch đã hoàn tất.</p>
                    {report.paymentMethods?.length ? (
                      <ul className="mt-5 divide-y divide-slate-100">
                        {report.paymentMethods.map((item) => (
                          <li
                            key={item.method}
                            className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                                <Icon>
                                  {['CASH', 'Tiền mặt'].includes(item.method) ? 'payments' : 'account_balance'}
                                </Icon>
                              </span>
                              <div>
                                <p className="text-sm font-medium text-slate-700">{item.method || 'Khác'}</p>
                                <p className="mt-1 text-xs text-slate-500">{item.count} giao dịch</p>
                              </div>
                            </div>
                            <strong className="text-sm text-slate-900">{formatPrice(item.amount)}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-10 text-center text-sm text-slate-500">Chưa có giao dịch hoàn tất trong kỳ.</p>
                    )}
                  </article>
                </div>

                <section className={`${panelClass} overflow-hidden`} aria-labelledby="transactions-heading">
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 id="transactions-heading" className="font-bold text-slate-900">
                          Giao dịch trong kỳ
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Bao gồm mọi trạng thái. Chọn mã giao dịch để xem chi tiết.
                        </p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {filtered.length} / {payments.length} giao dịch
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                      <input
                        type="search"
                        aria-label="Tìm giao dịch"
                        placeholder="Tìm mã giao dịch, hội viên, SĐT…"
                        className={`${inputClass} flex-1`}
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                      />
                      <select
                        aria-label="Trạng thái giao dịch"
                        className={inputClass}
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(1);
                        }}
                      >
                        {[
                          ['all', 'Tất cả trạng thái'],
                          ['completed', 'Hoàn tất'],
                          ['pending', 'Chờ thanh toán'],
                          ['failed', 'Thất bại'],
                          ['cancelled', 'Đã hủy'],
                          ['refunded', 'Đã hoàn tiền'],
                          ['other', 'Trạng thái khác'],
                        ].map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Phương thức giao dịch"
                        className={inputClass}
                        value={methodFilter}
                        onChange={(e) => {
                          setMethodFilter(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">Tất cả phương thức</option>
                        {methods.map((method) => (
                          <option key={method}>{method}</option>
                        ))}
                      </select>
                      {hasFilters && (
                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                            setMethodFilter('all');
                            setPage(1);
                          }}
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </div>
                  {visiblePayments.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[850px] text-left text-sm">
                        <caption className="sr-only">Danh sách giao dịch — {periodLabel}</caption>
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            {[
                              'Mã giao dịch',
                              'Hội viên',
                              'Dịch vụ',
                              'Phương thức',
                              'Người xử lý',
                              'Thời gian',
                              'Trạng thái',
                              'Số tiền',
                            ].map((label, i) => (
                              <th
                                scope="col"
                                key={label}
                                className={`px-5 py-3 font-semibold ${i === 7 ? 'text-right' : ''}`}
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visiblePayments.map((p) => (
                            <tr key={p.paymentId} className="hover:bg-slate-50">
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  className="font-semibold text-orange-700 underline-offset-4 hover:underline focus-visible:outline-orange-500"
                                  aria-label={`Xem giao dịch ${p.paymentId}`}
                                  onClick={() => setSelectedTx(p)}
                                >
                                  {p.paymentId}
                                </button>
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-medium text-slate-900">{p.memberName || 'Khách vãng lai'}</p>
                                <p className="mt-1 text-xs text-slate-500">{p.phone || '—'}</p>
                              </td>
                              <td className="px-5 py-4 text-slate-600">{paymentCategory(p.type)}</td>
                              <td className="px-5 py-4 text-slate-600">{p.method || 'Khác'}</td>
                              <td className="whitespace-nowrap px-5 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  p.processedByName && p.processedByName !== 'Tự thanh toán'
                                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {p.processedByName || 'Tự thanh toán'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                                {formatDate(p.createdAt, true)}
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge value={p.status} />
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                                {formatPrice(p.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-10 text-center">
                      <Icon className="mb-3 text-4xl text-slate-300">receipt_long</Icon>
                      <p className="text-sm text-slate-500">
                        {payments.length
                          ? 'Không tìm thấy giao dịch phù hợp với bộ lọc.'
                          : 'Chưa có giao dịch trong kỳ báo cáo này.'}
                      </p>
                    </div>
                  )}
                  {filtered.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                      <span>
                        Hiển thị {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, filtered.length)} /{' '}
                        {filtered.length} giao dịch
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={currentPage <= 1}
                          onClick={() => setPage(currentPage - 1)}
                        >
                          Trước
                        </button>
                        <span aria-live="polite">
                          Trang {currentPage} / {pageCount}
                        </span>
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={currentPage >= pageCount}
                          onClick={() => setPage(currentPage + 1)}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )
          )}
        </section>

        <section
          className={`${panelClass} overflow-hidden`}
          aria-labelledby="schedule-heading"
          aria-busy={scheduleLoading}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <h2 id="schedule-heading" className="font-bold text-slate-900">
                Lịch lớp học · {formatDate(`${scheduleDate}T00:00:00`)}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {period === 'day' ? 'Lịch của ngày đang chọn.' : 'Lịch hôm nay, độc lập với kỳ báo cáo tài chính.'} Sĩ
                số cập nhật khi tải lại.
              </p>
            </div>
            <Link
              to="/admin/classes/new"
              className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700"
            >
              Tạo lịch lớp<Icon>arrow_forward</Icon>
            </Link>
          </div>
          {scheduleLoading ? (
            <p role="status" className="p-6 text-sm text-slate-500">
              Đang tải lịch lớp học…
            </p>
          ) : scheduleError ? (
            <div className="p-5">
              <LoadError message={scheduleError} onRetry={() => setScheduleRevision((v) => v + 1)} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-8 gap-y-3 bg-slate-50/70 px-5 py-4 text-sm text-slate-600">
                <span>
                  <strong className="text-slate-900">{activeClasses.length}</strong> lớp chưa hủy
                </span>
                <span>
                  <strong className="text-slate-900">
                    {bookedSeats} / {capacity}
                  </strong>{' '}
                  chỗ đã đặt
                </span>
                <span>
                  Tỷ lệ lấp đầy:{' '}
                  <strong className="text-slate-900">{fillPercent === null ? '—' : `${fillPercent}%`}</strong>
                </span>
                {schedule.length !== activeClasses.length && (
                  <span>{schedule.length - activeClasses.length} lớp đã hủy, không tính vào sĩ số</span>
                )}
              </div>
              {schedule.length ? (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        {['Lớp học / Địa điểm', 'Thời gian', 'Huấn luyện viên', 'Sĩ số', 'Trạng thái'].map((label) => (
                          <th scope="col" key={label} className="px-5 py-3 font-semibold">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedule.map((item) => {
                        const cancelled = ['CANCELLED', 'CANCELED'].includes(String(item.status).toUpperCase());
                        return (
                          <tr
                            key={item.sessionId}
                            className={cancelled ? 'bg-slate-50 text-slate-400' : 'text-slate-700'}
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold">{item.className || 'Lớp học'}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {[item.sportName, item.facilityName].filter(Boolean).join(' · ') || 'Chưa có địa điểm'}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4">
                              {formatTime(item.startTime)}–{formatTime(item.endTime)}
                            </td>
                            <td className="px-5 py-4">{item.coachName || 'Chưa phân công'}</td>
                            <td className="px-5 py-4">
                              {item.bookedSlots ?? 0} / {item.maxSlots ?? 0}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${cancelled || item.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}
                              >
                                {cancelled
                                  ? 'Đã hủy'
                                  : { SCHEDULED: 'Đã xếp lịch', IN_PROGRESS: 'Đang diễn ra', COMPLETED: 'Đã kết thúc' }[
                                      item.status
                                    ] ||
                                    item.status ||
                                    'Chưa xác định'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-slate-500">Không có lớp học trong ngày này.</p>
              )}
            </>
          )}
        </section>
      </main>

      <ModalDialog open={Boolean(selectedTx)} onClose={() => setSelectedTx(null)} titleId="transaction-title">
        {selectedTx && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 id="transaction-title" className="text-lg font-bold text-slate-900">
                  Chi tiết giao dịch
                </h2>
                <p className="mt-1 break-all text-xs text-slate-500">{selectedTx.paymentId}</p>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết giao dịch"
                className={buttonClass}
                onClick={() => setSelectedTx(null)}
              >
                <Icon>close</Icon>
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <strong className="text-2xl text-slate-900">{formatPrice(selectedTx.amount)}</strong>
                <StatusBadge value={selectedTx.status} />
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ['Hội viên', selectedTx.memberName || 'Khách vãng lai'],
                  ['Số điện thoại', selectedTx.phone],
                  ['Email', selectedTx.email],
                  ['Dịch vụ', paymentCategory(selectedTx.type)],
                  ['Diễn giải', selectedTx.description],
                  ['Phương thức', selectedTx.method],
                  ['Người xử lý', selectedTx.processedByName || 'Tự thanh toán'],
                  ['Thời gian', formatDate(selectedTx.createdAt, true)],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[1fr_2fr] gap-4 py-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="break-words text-right font-medium text-slate-800 [overflow-wrap:anywhere]">
                      {value || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                className={buttonClass}
                onClick={() => exportToCsv(`ChiTiet_GiaoDich_${Date.now()}.csv`, transactionRows([selectedTx]))}
              >
                <Icon>download</Icon>Tải chi tiết CSV
              </button>
              <button type="button" className={buttonClass} onClick={() => setSelectedTx(null)}>
                Đóng
              </button>
            </div>
          </>
        )}
      </ModalDialog>
    </AdminLayout>
  );
}
