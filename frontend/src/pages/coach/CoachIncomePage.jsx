import { useEffect, useState } from 'react';
import CoachLayout from '../../components/layouts/CoachLayout';
import { TableSkeleton } from '../../components/common/Skeleton';
import { getCoachIncome } from '../../services/coachApi';
import { useApp } from '../../context/AppContext';

export default function CoachIncomePage() {
  const { showToast } = useApp();
  const [incomeData, setIncomeData] = useState(null);
  const [incomeLoading, setIncomeLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCoachIncome()
      .then((data) => {
        if (active && data) {
          setIncomeData(data);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải dữ liệu thù lao huấn luyện viên.');
      })
      .finally(() => {
        if (active) setIncomeLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const commissionPercent =
    incomeData?.commissionRate != null
      ? Number(incomeData.commissionRate) <= 1
        ? Number(incomeData.commissionRate) * 100
        : Number(incomeData.commissionRate)
      : 40;

  const handleExportCsv = () => {
    const sessions = incomeData?.sessions || [];
    if (sessions.length === 0) {
      showToast('Chưa có dữ liệu', 'Chưa có ca dạy nào để xuất bảng kê.', 'warning');
      return;
    }
    const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const headers = [
      'Mã ca',
      'Nội dung ca dạy',
      'Bộ môn',
      'Sân tập',
      'Thời gian bắt đầu',
      'Sĩ số',
      'Đơn giá lớp',
      'Doanh thu lớp',
      `Thù lao HLV (${commissionPercent.toFixed(0)}%)`,
      'Trạng thái',
    ];
    const rows = sessions.map((row) => [
      `SES-${row.sessionId}`,
      row.className || '',
      row.sportName || '',
      row.courtName || '',
      row.startTime ? new Date(row.startTime).toLocaleString('vi-VN') : '',
      row.studentsCount ?? row.enrolledStudents ?? 0,
      Number(row.priceAmount ?? row.classPrice ?? 0),
      Number(row.sessionRevenue ?? row.totalClassRevenue ?? 0),
      Number(row.coachCommission ?? row.coachIncome ?? 0),
      row.status || 'CONFIRMED',
    ]);
    const csvContent = `\uFEFF${[headers, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bang-ke-thu-lao-hlv-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Đã xuất bảng kê', 'Tệp CSV bảng kê thù lao đã được tải xuống.', 'success');
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            F SPORT COACH · THÙ LAO &amp; DOANH THU
          </div>
          <h1 className="font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">
            Thù Lao &amp; Doanh Thu Giảng Dạy
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi thu nhập từng ca dạy, tỷ lệ hoa hồng và bảng kê đối soát tự động theo kỳ chi trả.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
              <span>Tổng thù lao nhận được</span>
              <span className="material-symbols-outlined text-orange-500 text-[20px]">account_balance_wallet</span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              {incomeLoading ? '...' : `${Number(incomeData?.totalIncome || 0).toLocaleString()}₫`}
            </div>
            <div className="mt-1 text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>Định kỳ chi trả ngày 05</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
              <span>Tỷ lệ hoa hồng</span>
              <span className="material-symbols-outlined text-blue-500 text-[20px]">percent</span>
            </div>
            <div className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
              {`${commissionPercent.toFixed(0)}%`}
            </div>
            <div className="mt-1 text-xs text-slate-500">{commissionPercent.toFixed(0)}% doanh thu mỗi lớp nhóm</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
              <span>Tổng số ca giảng dạy</span>
              <span className="material-symbols-outlined text-purple-500 text-[20px]">groups</span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              {incomeLoading ? '...' : `${incomeData?.totalSessions || 0} ca`}
            </div>
            <div className="mt-1 text-xs text-purple-600 font-bold">Thù lao sàn 200.000₫/ca</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
              <span>Trạng thái quyết toán</span>
              <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">TỰ ĐỘNG ĐỐI SOÁT</div>
            <div className="mt-1 text-xs text-slate-500">Hệ thống tính tự động từ lịch dạy</div>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bảng kê chi tiết thù lao giảng dạy</h2>
              <p className="text-xs text-slate-500">Dữ liệu đối soát tự động từ các ca dạy đã điểm danh và doanh thu học viên</p>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Tải Bảng Kê (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {incomeLoading ? (
              <div className="p-4">
                <TableSkeleton rows={4} cols={7} />
              </div>
            ) : !incomeData?.sessions || incomeData.sessions.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl text-slate-300">payments</span>
                <p className="mt-2 text-sm font-semibold">Chưa có dữ liệu thù lao</p>
                <p className="text-xs text-slate-400">Các ca dạy của bạn sẽ được tính thù lao ngay khi hoàn thành.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="px-5 py-3.5">Mã ca</th>
                    <th className="px-5 py-3.5">Nội dung ca dạy</th>
                    <th className="px-5 py-3.5">Thời gian</th>
                    <th className="px-5 py-3.5">Học viên / Sĩ số</th>
                    <th className="px-5 py-3.5">Đơn giá lớp</th>
                    <th className="px-5 py-3.5">Doanh thu lớp</th>
                    <th className="px-5 py-3.5 text-right">Thù lao HLV ({commissionPercent.toFixed(0)}%)</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {incomeData.sessions.map((row) => (
                    <tr key={row.sessionId} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-slate-500 font-bold whitespace-nowrap">SES-{row.sessionId}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900">{row.className}</span>
                        <div className="text-[11px] text-slate-500">
                          {row.sportName || 'Thể thao'} • {row.courtName || 'Sân trung tâm'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {row.startTime ? new Date(row.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold whitespace-nowrap">{row.studentsCount ?? row.enrolledStudents ?? 0} học viên</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{Number(row.priceAmount ?? row.classPrice ?? 0).toLocaleString()}₫</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{Number(row.sessionRevenue ?? row.totalClassRevenue ?? 0).toLocaleString()}₫</td>
                      <td className="px-5 py-3.5 text-right font-black text-orange-600 whitespace-nowrap">{Number(row.coachCommission ?? row.coachIncome ?? 0).toLocaleString()}₫</td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          {row.status || 'ĐÃ XÁC NHẬN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </CoachLayout>
  );
}
