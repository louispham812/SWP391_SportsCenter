import React, { useEffect, useState } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { apiRequest } from '../../services/apiClient';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function MemberAIAssistantPage() {
  const [health, setHealth] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    Promise.all([
      apiRequest('/members/me/health'),
      apiRequest('/booking-flow/schedule'),
    ])
      .then(([healthData, scheduleData]) => {
        if (!current) return;
        setHealth(healthData);
        setSchedule(scheduleData);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải dữ liệu hồ sơ và lịch tập.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const measurements = [
    { label: 'Cân nặng', value: health?.weightKg, unit: 'kg' },
    { label: 'Cơ nạc (SMM)', value: health?.smmKg, unit: 'kg' },
    { label: 'Tỷ lệ mỡ (PBF)', value: health?.pbfPercent, unit: '%' },
    { label: 'BMI', value: health?.bmi, unit: '' },
  ];

  return (
    <MemberLayout>
      <div className="space-y-6">
        <header>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
            Hồ sơ và lịch tập đã đồng bộ
          </p>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Tiến Độ Rèn Luyện</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chỉ số thể trạng và lịch của bạn được tải từ dữ liệu đã lưu trên hệ thống.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {loading ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Đang tải hồ sơ...
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="space-y-5 lg:col-span-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {measurements.map(({ label, value, unit }) => (
                  <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-primary">
                      {value ?? 'Chưa có'}{value != null && unit ? ` ${unit}` : ''}
                    </p>
                  </article>
                ))}
              </div>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold uppercase text-slate-900">Thông tin mục tiêu</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Mục tiêu tập luyện</dt>
                    <dd className="mt-1 whitespace-pre-line text-slate-800">{health?.fitnessGoals || 'Chưa được cập nhật.'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Lịch sử chấn thương</dt>
                    <dd className="mt-1 whitespace-pre-line text-slate-800">{health?.injuryHistory || 'Chưa được cập nhật.'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">Cấp độ</dt>
                    <dd className="mt-1 text-slate-800">{health?.fitnessLevel || 'Chưa được cập nhật.'}</dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
              <h2 className="font-bold uppercase text-slate-900">Lịch tập đã đăng ký</h2>
              {schedule.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Bạn chưa có booking nào được lưu.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {schedule.map((entry) => (
                    <li key={`${entry.bookingType}-${entry.bookingId}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="font-bold text-slate-900">{entry.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{entry.sportName} · {entry.location}</p>
                      <p className="mt-1 text-xs text-slate-600">{formatDateTime(entry.startTime)}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-secondary">{entry.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-950">Trợ lý AI chưa được cấu hình</h2>
          <p className="mt-1 text-sm text-amber-900">
            Dịch vụ AI chưa được tích hợp ở backend. Vì vậy ứng dụng không tạo câu trả lời, phân tích InBody hoặc giáo án giả lập.
          </p>
        </aside>
      </div>
    </MemberLayout>
  );
}
