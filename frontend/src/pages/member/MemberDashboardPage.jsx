import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import { getMemberBookingSchedule } from '../../services/bookingApi';

const formatBookingTime = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const formatBookingAmount = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

export default function MemberDashboardPage() {
  const { currentUser } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getMemberBookingSchedule()
      .then((schedule) => {
        if (current) {
          const now = Date.now();
          setBookings(schedule.filter((booking) => new Date(booking.endTime).getTime() >= now));
        }
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

  return (
    <MemberLayout>
      <main className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Trang hội viên
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
            Xin chào, {currentUser.name}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Thông tin tài khoản được lấy từ phiên đăng nhập do máy chủ xác thực.
          </p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">Mã tài khoản</dt>
              <dd className="mt-1 font-semibold text-slate-900">{currentUser.id}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="mt-1 break-all font-semibold text-slate-900">{currentUser.email}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">Trạng thái tài khoản</dt>
              <dd className="mt-1 font-semibold text-slate-900">{currentUser.status}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/member/book/court/sports"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <span className="material-symbols-outlined rounded-xl bg-primary p-3 text-2xl text-white">
              sports_tennis
            </span>
            <span>
              <strong className="block text-sm font-bold text-primary">Đặt sân chơi</strong>
              <span className="mt-1 block text-xs text-slate-500">
                Chọn môn, sân và khung giờ còn trống
              </span>
            </span>
          </Link>
          <Link
            to="/member/book/class/sports"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <span className="material-symbols-outlined rounded-xl bg-secondary p-3 text-2xl text-white">
              fitness_center
            </span>
            <span>
              <strong className="block text-sm font-bold text-primary">Booking lớp học</strong>
              <span className="mt-1 block text-xs text-slate-500">
                Chọn môn, lớp và lịch học phù hợp
              </span>
            </span>
          </Link>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-primary">Booking sắp tới</h2>
              <p className="mt-1 text-xs text-slate-500">
                Các lịch sân và lớp đã xác nhận trong cơ sở dữ liệu.
              </p>
            </div>
            <Link
              to="/member/schedule"
              className="text-xs font-bold text-secondary hover:underline"
            >
              Mở thời khóa biểu
            </Link>
          </div>

          {loading ? (
            <p role="status" className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              Đang tải thời khóa biểu...
            </p>
          ) : error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </p>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">Bạn chưa có booking sắp tới.</p>
              <Link
                to="/member/book"
                className="mt-3 inline-flex rounded-xl bg-secondary-container px-4 py-2 text-xs font-bold uppercase text-primary"
              >
                Đặt sân hoặc lớp ngay
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking) => (
                <li
                  key={`${booking.bookingType}-${booking.bookingId}`}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined rounded-lg bg-primary p-2 text-xl text-white">
                      {booking.bookingType === 'COURT' ? 'sports_tennis' : 'fitness_center'}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{booking.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {booking.bookingType === 'COURT' ? 'Đặt sân' : 'Lớp học'} · {booking.sportName}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatBookingTime(booking.startTime)} · {booking.location}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    {formatBookingAmount(booking.amountPaid)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </MemberLayout>
  );
}
