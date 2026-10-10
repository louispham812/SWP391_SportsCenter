import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminDashboardPage() {
  const { auditLogs, classes } = useApp();

  const kpis = [
    {
      label: 'Tổng Doanh Thu Tháng',
      value: '450.000.000 ₫',
      change: '+18.4%',
      trend: 'up',
      icon: 'payments',
      sub: 'so với tháng trước',
    },
    {
      label: 'Hội Viên Mới Đăng Ký',
      value: '+128 Hội viên',
      change: '+24.1%',
      trend: 'up',
      icon: 'person_add',
      sub: 'tăng trưởng đều',
    },
    {
      label: 'Tỷ Lệ Lấp Đầy Ca Học',
      value: '88.5%',
      change: '+6.2%',
      trend: 'up',
      icon: 'pie_chart',
      sub: 'vượt chỉ tiêu vận hành',
    },
    {
      label: 'Lớp Đang Hoạt Động',
      value: '36 Lớp / Ngày',
      change: '100% Sân mở',
      trend: 'neutral',
      icon: 'stadium',
      sub: 'công suất tối đa',
    },
  ];

  const sportsBreakdown = [
    { name: 'Gym & Thể Hình Olympic', share: 35, revenue: '157.5M ₫', color: 'bg-primary' },
    { name: 'Cụm Sân Pickleball Pro', share: 28, revenue: '126.0M ₫', color: 'bg-secondary' },
    { name: 'Quần Vợt Tennis Chuẩn ITF', share: 20, revenue: '90.0M ₫', color: 'bg-emerald-600' },
    { name: 'Bơi Lội Bốn Mùa & Yoga', share: 17, revenue: '76.5M ₫', color: 'bg-amber-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                FLOW 3: REPORT & EXECUTIVE DASHBOARD
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Báo Cáo Hiệu Suất & Doanh Thu Trung Tâm
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Tổng hợp thời gian thực dữ liệu tài chính, hội viên và tình trạng vận hành cơ sở.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Kỳ báo cáo:</span>
            <select className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm outline-none">
              <option>Tháng 11 / 2026</option>
              <option>Tháng 10 / 2026</option>
              <option>Quý 4 / 2026</option>
            </select>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-bold text-slate-500">{kpi.label}</span>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">{kpi.icon}</span>
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 font-headline-sm">{kpi.value}</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-2">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>{kpi.change}</span>
                  <span className="text-slate-400 font-normal">{kpi.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2 Bento Columns: Doanh thu & Cơ cấu bộ môn */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (7 cols): Biểu Đồ Doanh Thu 6 Tháng */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                  Biểu Đồ Doanh Thu & Tăng Trưởng (Triệu VNĐ)
                </h3>
                <span className="text-xs text-slate-400">Dữ liệu 6 tháng liên tiếp năm 2026</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Tăng trưởng +28%
              </span>
            </div>

            {/* Simulated CSS Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-slate-100">
              {[
                { month: 'T6', val: 280, height: '55%' },
                { month: 'T7', val: 310, height: '62%' },
                { month: 'T8', val: 350, height: '70%' },
                { month: 'T9', val: 390, height: '78%' },
                { month: 'T10', val: 410, height: '84%' },
                { month: 'T11', val: 450, height: '100%', active: true },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.val}M
                  </span>
                  <div
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ${
                      bar.active
                        ? 'bg-secondary-container border border-secondary shadow-md'
                        : 'bg-primary hover:bg-slate-700'
                    }`}
                    style={{ height: bar.height }}
                  ></div>
                  <span className={`text-xs font-bold ${bar.active ? 'text-primary' : 'text-slate-500'}`}>
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
              <span>Đạt 112% mục tiêu doanh số quý 4</span>
              <strong className="text-slate-900 font-bold">TB: 365 Triệu/tháng</strong>
            </div>
          </div>

          {/* CỘT PHẢI (5 cols): Cơ Cấu Doanh Thu Từng Môn */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
              Tỷ Trọng Doanh Thu Theo Bộ Môn
            </h3>

            <div className="space-y-4">
              {sportsBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.revenue} ({item.share}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${item.color}`}
                      style={{ width: `${item.share}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mt-4 border border-slate-100">
              Pickleball đang là bộ môn tăng trưởng nhanh nhất (+45% số lượt đặt sân trong tháng).
            </div>
          </div>
        </div>

        {/* Báo Cáo Tình Trạng Đăng Ký Lớp & Số Lượng Hội Viên */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (7 cols): Tình Trạng Đăng Ký Lớp Học */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                  Tình Trạng Đăng Ký Lớp Học (Class Enrollment)
                </h3>
                <p className="text-xs text-slate-500">
                  Tỷ lệ lấp đầy và sĩ số học viên thực tế theo từng lớp thể thao
                </p>
              </div>
              <span className="text-xs font-bold text-secondary bg-secondary-container/30 px-2.5 py-1 rounded-full">
                Thời gian thực
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Lớp học</th>
                    <th className="py-2.5 px-3">HLV</th>
                    <th className="py-2.5 px-3 text-center">Đã Đăng Ký</th>
                    <th className="py-2.5 px-3 text-center">Tỷ Lệ</th>
                    <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((cls) => {
                    const fillPercent = Math.round((cls.enrolled / cls.capacity) * 100);
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{cls.title}</div>
                          <div className="text-[11px] text-slate-400">{cls.time} · {cls.room}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {cls.coachName.replace('HLV ', '')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {cls.enrolled} / {cls.capacity}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-mono font-bold ${fillPercent >= 90 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {fillPercent}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              fillPercent >= 100
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : fillPercent >= 80
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {fillPercent >= 100 ? 'Kín chỗ' : fillPercent >= 80 ? 'Sắp đầy' : 'Còn chỗ'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CỘT PHẢI (5 cols): Tăng Trưởng Số Lượng Hội Viên Theo Thời Gian */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
              Tăng Trưởng Hội Viên Theo Thời Gian
            </h3>

            <div className="space-y-3">
              {[
                { period: 'Tháng 11 / 2026', total: 953, added: '+128 mới', pct: 95 },
                { period: 'Tháng 10 / 2026', total: 825, added: '+115 mới', pct: 82 },
                { period: 'Tháng 09 / 2026', total: 710, added: '+90 mới', pct: 71 },
                { period: 'Tháng 08 / 2026', total: 620, added: '+75 mới', pct: 62 },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{item.period}</div>
                    <div className="text-[11px] text-emerald-700 font-bold">{item.added}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-slate-900">{item.total}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Tổng hội viên</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-secondary-container/20 rounded-xl text-xs text-secondary font-bold border border-secondary/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">insights</span>
              <span>Tỷ lệ duy trì & gia hạn thẻ đạt 91.2% (rất tích cực).</span>
            </div>
          </div>
        </div>

        {/* Audit Log / Nhật Ký Hoạt Động Quan Trọng */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                Nhật Ký Thao Tác Hệ Thống (Audit Logs)
              </h3>
              <p className="text-xs text-slate-500">
                Ghi nhận tự động các hành vi phân quyền, thanh toán, thay đổi lịch và kích hoạt gói tập
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Bảo mật bất biến</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-primary text-secondary-container font-bold text-[10px] uppercase">
                    {log.action}
                  </span>
                  <span className="text-slate-800 font-medium">{log.target}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 shrink-0 self-end sm:self-auto">
                  <span className="font-semibold">{log.user}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
