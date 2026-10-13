import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import {
  checkoutBooking,
  getAvailableCourtSlots,
  getBookableClasses,
  getBookingQuote,
  getBookingSports,
} from '../../services/bookingApi';

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

const formatDate = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function PageFrame({ title, description, children }) {
  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <Link to="/member/book" className="text-xs font-semibold text-slate-500 hover:text-primary">
            ← Booking hội viên
          </Link>
          <h1 className="mt-2 font-headline-xl text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </header>
        {children}
      </div>
    </MemberLayout>
  );
}

function ErrorNotice({ error }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error}
    </div>
  );
}

function BookingHome() {
  return (
    <PageFrame
      title="Bạn muốn đặt dịch vụ nào?"
      description="Chọn đặt sân chơi theo giờ hoặc đăng ký một lớp học có thời khóa biểu cụ thể."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {[
          {
            type: 'court',
            title: 'Đặt sân chơi',
            description: 'Chọn môn thể thao, sân cụ thể và khung giờ 60 phút còn trống.',
            icon: 'sports_tennis',
          },
          {
            type: 'class',
            title: 'Booking lớp học',
            description: 'Chọn môn thể thao, lớp học, lịch học và mức phí của lớp.',
            icon: 'fitness_center',
          },
        ].map((option) => (
          <Link
            key={option.type}
            to={`/member/book/${option.type}/sports`}
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-4xl text-secondary">{option.icon}</span>
            <h2 className="mt-4 text-xl font-bold text-primary">{option.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
              Bắt đầu chọn <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
      <Link to="/member/schedule" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
        Xem thời khóa biểu của tôi
      </Link>
    </PageFrame>
  );
}

function SportPicker({ bookingType }) {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getBookingSports()
      .then((rows) => {
        if (current) setSports(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải danh sách môn thể thao.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const isCourt = bookingType === 'court';
  return (
    <PageFrame
      title="Chọn môn thể thao"
      description={`Bước 1 trong 3 · ${isCourt ? 'Chọn môn để xem sân và khung giờ còn trống.' : 'Chọn môn để xem các lớp và thời khóa biểu.'}`}
    >
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải bộ môn từ hệ thống...</div>
      ) : sports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Database chưa có bộ môn đang hoạt động.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => (
            <button
              key={sport.sportId}
              type="button"
              onClick={() => navigate(`/member/book/${isCourt ? 'courts' : 'classes'}/${sport.sportId}`)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <span className="material-symbols-outlined text-3xl text-secondary">{sport.icon || 'sports'}</span>
              <h2 className="mt-3 font-bold text-primary">{sport.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{sport.subtitle || sport.description}</p>
              <span className="mt-4 block text-xs font-bold text-primary">
                {isCourt ? 'Xem sân và giờ trống →' : 'Xem lớp và lịch học →'}
              </span>
            </button>
          ))}
        </div>
      )}
    </PageFrame>
  );
}

function CourtPicker({ sportId }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    let current = true;
    getAvailableCourtSlots(sportId)
      .then((rows) => {
        if (!current) return;
        setSlots(rows);
        setSelectedDate(rows[0]?.startTime?.slice(0, 10) || '');
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải sân và khung giờ.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [sportId]);

  const dates = useMemo(
    () => [...new Set(slots.map((slot) => slot.startTime.slice(0, 10)))],
    [slots],
  );
  const courts = useMemo(
    () => [...new Set(slots.filter((slot) => slot.startTime.startsWith(selectedDate)).map((slot) => slot.courtId))],
    [slots, selectedDate],
  );

  return (
    <PageFrame title="Chọn sân và khung giờ" description="Mỗi lượt đặt sân kéo dài 60 phút. Giá và giờ trống được kiểm tra lại khi thanh toán.">
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải sân và giờ trống...</div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Hiện không có sân hoặc khung giờ trống trong 14 ngày tới.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${selectedDate === date ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
              >
                {new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {courts.map((courtId) => {
              const courtSlots = slots.filter((slot) => slot.courtId === courtId && slot.startTime.startsWith(selectedDate));
              const court = courtSlots[0];
              return (
                <section key={courtId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-primary">{court.courtName}</h2>
                      <p className="mt-1 text-xs text-slate-500">{court.description}</p>
                    </div>
                    <span className="text-sm font-extrabold text-primary">{formatMoney(court.hourlyRate)} / 60 phút</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {courtSlots.map((slot) => (
                      <button
                        key={`${slot.courtId}-${slot.startTime}`}
                        type="button"
                        onClick={() => {
                          const query = new URLSearchParams({
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                          });
                          navigate(`/member/book/checkout/court/${slot.courtId}?${query}`);
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:border-primary hover:bg-primary hover:text-white"
                      >
                        {new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </PageFrame>
  );
}

function ClassPicker({ sportId }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getBookableClasses(sportId)
      .then((rows) => {
        if (current) setClasses(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải lớp học.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [sportId]);

  return (
    <PageFrame title="Chọn lớp học và thời khóa biểu" description="Chọn đúng lớp, ngày học và mức phí trước khi xác nhận thanh toán.">
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải lớp học từ database...</div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Chưa có lớp sắp diễn ra cho bộ môn này.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((classSession) => {
            const remaining = Math.max(0, classSession.maxSlots - classSession.bookedSlots);
            const alreadyBooked = ['BOOKED', 'CONFIRMED'].includes(classSession.memberBookingStatus);
            return (
              <article key={classSession.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-primary">{classSession.className}</h2>
                    <p className="mt-1 text-xs text-slate-500">{classSession.coachName || `HLV #${classSession.coachId}`}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    Còn {remaining}/{classSession.maxSlots} chỗ
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Bắt đầu</dt><dd className="text-right font-semibold text-slate-800">{formatDate(classSession.startTime)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Kết thúc</dt><dd className="text-right font-semibold text-slate-800">{new Date(classSession.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Giá/lớp</dt><dd className="font-extrabold text-primary">{formatMoney(classSession.priceAmount)}</dd></div>
                </dl>
                <button
                  type="button"
                  disabled={remaining < 1 || alreadyBooked}
                  onClick={() => navigate(`/member/book/checkout/class/${classSession.sessionId}`)}
                  className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {alreadyBooked ? 'Bạn đã đăng ký lớp này' : remaining < 1 ? 'Lớp đã hết chỗ' : 'Chọn lớp & thanh toán'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

function CheckoutPage({ bookingType, itemId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getBookingQuote(bookingType.toUpperCase(), itemId, startTime, endTime)
      .then((result) => {
        if (current) setQuote(result);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể xác nhận giá và lịch booking.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [bookingType, endTime, itemId, startTime]);

  const handleCheckout = async () => {
    setSubmitting(true);
    setError('');
    try {
      const confirmation = await checkoutBooking(
        bookingType.toUpperCase(),
        itemId,
        startTime,
        endTime,
      );
      navigate('/member/book/confirmation', { replace: true, state: { confirmation } });
    } catch (requestError) {
      setError(requestError.message || 'Thanh toán booking thất bại.');
      setSubmitting(false);
    }
  };

  return (
    <PageFrame title="Xác nhận booking & thanh toán" description="Giá được backend tính lại từ dữ liệu trong database trước khi tạo giao dịch.">
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang xác nhận giá và lịch...</div>
      ) : quote ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-xs font-bold uppercase tracking-wide text-secondary">{quote.bookingType === 'COURT' ? 'Đặt sân chơi' : 'Booking lớp học'}</div>
          <h2 className="mt-2 text-2xl font-bold text-primary">{quote.itemName}</h2>
          <p className="mt-1 text-sm text-slate-500">{quote.sportName}</p>
          <dl className="mt-6 space-y-4 border-y border-slate-100 py-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Thời gian</dt><dd className="text-right font-semibold text-slate-800">{formatDate(quote.startTime)}{bookingType === 'court' && quote.endTime ? ` — ${new Date(quote.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Địa điểm / huấn luyện viên</dt><dd className="text-right font-semibold text-slate-800">{quote.location}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Môn thể thao</dt><dd className="text-right font-semibold text-slate-800">{quote.sportName}</dd></div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-4"><dt className="font-bold text-slate-700">Tổng thanh toán</dt><dd className="text-lg font-extrabold text-primary">{formatMoney(quote.amount)}</dd></div>
          </dl>
          <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            Chế độ thanh toán SANDBOX: thao tác xác nhận tạo giao dịch thử nghiệm và booking trong database; chưa trừ tiền thật.
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleCheckout}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Đang xử lý...' : `Xác nhận & thanh toán ${formatMoney(quote.amount)}`}
          </button>
        </div>
      ) : null}
    </PageFrame>
  );
}

function BookingConfirmationPage() {
  const location = useLocation();
  const confirmation = location.state?.confirmation;
  if (!confirmation) {
    return (
      <PageFrame title="Không có thông tin xác nhận" description="Hãy xem lịch booking hoặc bắt đầu một booking mới.">
        <Link to="/member/book" className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">Bắt đầu booking</Link>
      </PageFrame>
    );
  }
  return (
    <PageFrame title="Booking đã xác nhận" description="Giao dịch sandbox và lịch hẹn đã được lưu vào database.">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-sm font-bold text-emerald-700">Thanh toán {confirmation.paymentStatus} · {confirmation.referenceCode}</div>
        <h2 className="mt-3 text-2xl font-bold text-primary">{confirmation.itemName}</h2>
        <p className="mt-1 text-sm text-slate-500">{confirmation.sportName} · {confirmation.location}</p>
        <p className="mt-4 text-sm font-semibold text-slate-800">
          {formatDate(confirmation.startTime)} — {new Date(confirmation.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="mt-2 text-lg font-extrabold text-primary">{formatMoney(confirmation.amountPaid)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/member/schedule" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">Xem trong thời khóa biểu</Link>
          <Link to="/member/book" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">Đặt dịch vụ khác</Link>
        </div>
      </div>
    </PageFrame>
  );
}

export default function MemberBookingFlowPage() {
  const { bookingType, sportId, resourceId } = useParams();
  const path = useLocation().pathname;

  if (path.endsWith('/confirmation')) return <BookingConfirmationPage />;
  if (path.includes('/checkout/')) return <CheckoutPage bookingType={bookingType} itemId={resourceId} />;
  if (path.endsWith('/sports')) return <SportPicker bookingType={bookingType} />;
  if (path.includes('/courts/')) return <CourtPicker sportId={sportId} />;
  if (path.includes('/classes/')) return <ClassPicker sportId={sportId} />;
  return <BookingHome />;
}
