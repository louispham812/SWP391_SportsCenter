import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberBookingSchedule } from '../../services/bookingApi';

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function MemberSchedulePage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getMemberBookingSchedule()
      .then((rows) => {
        if (current) setEntries(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải thời khóa biểu.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const upcomingEntries = entries.filter((entry) => new Date(entry.endTime) >= new Date());

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-secondary">LỊCH BOOKING CỦA BẠN</div>
            <h1 className="mt-1 font-headline-xl text-2xl font-bold text-primary sm:text-3xl">Thời khóa biểu của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">Bao gồm các sân và lớp đã xác nhận thanh toán, lấy từ hệ thống.</p>
          </div>
          <Link to="/member/book" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">
            Đặt sân hoặc booking lớp
          </Link>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Đang tải lịch booking...
          </div>
        ) : upcomingEntries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">event_available</span>
            <h2 className="mt-3 font-bold text-slate-800">Bạn chưa có lịch booking sắp tới</h2>
            <p className="mt-1 text-sm text-slate-500">Chọn môn thể thao để xem sân hoặc lớp học đang mở.</p>
            <Link to="/member/book" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">
              Bắt đầu đặt lịch
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEntries.map((entry) => (
              <article key={`${entry.bookingType}-${entry.bookingId}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-secondary">
                      {entry.bookingType === 'COURT' ? 'ĐẶT SÂN' : 'BOOKING LỚP HỌC'} · {entry.sportName}
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-primary">{entry.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{entry.location}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Đã xác nhận</span>
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <span className="text-slate-500">Thời gian: </span>
                    <strong className="text-slate-800">{formatDateTime(entry.startTime)} – {new Date(entry.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Đã thanh toán: </span>
                    <strong className="text-primary">{formatMoney(entry.amountPaid)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
