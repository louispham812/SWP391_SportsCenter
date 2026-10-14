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
import { getSportMedia } from '../../utils/mediaMap';

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
          <Link to="/member/book" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-orange-600 transition">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Booking hội viên
          </Link>
          <h1 className="mt-2 font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
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
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span>{error}</span>
    </div>
  );
}

function BookingHome() {
  return (
    <PageFrame
      title="Đặt Lịch & Đăng Ký Dịch Vụ"
      description="Chọn thuê sân chơi thể thao theo khung giờ hoặc đăng ký lớp huấn luyện cùng HLV chuyên nghiệp."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            type: 'court',
            title: 'Thuê Sân Thể Thao',
            description: 'Chọn bộ môn, sân tập tiêu chuẩn và khung giờ thi đấu 60 phút linh hoạt theo nhu cầu của bạn.',
            icon: 'sports_tennis',
            badge: 'Tự do & Chủ động',
            features: ['Khung giờ 60 phút linh hoạt', 'Sân đạt chuẩn thi đấu', 'Xác nhận tức thì qua hệ thống'],
          },
          {
            type: 'class',
            title: 'Đăng Ký Lớp Học Thể Thao',
            description: 'Tham gia các lớp huấn luyện bài bản từ cơ bản đến nâng cao cùng đội ngũ HLV chứng chỉ quốc tế.',
            icon: 'fitness_center',
            badge: 'Có HLV Hướng dẫn',
            features: ['HLV chuyên nghiệp 1-1 / nhóm', 'Giáo trình chuẩn hoá FPT', 'Theo dõi tiến độ tập luyện'],
          },
        ].map((option) => (
          <Link
            key={option.type}
            to={`/member/book/${option.type}/sports`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white shadow-sm">
                  <span className="material-symbols-outlined text-3xl">{option.icon}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {option.badge}
                </span>
              </div>
              <h2 className="mt-5 font-headline-sm text-xl font-bold text-slate-900 transition group-hover:text-orange-600">
                {option.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {option.description}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-500">
                {option.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Bắt đầu lựa chọn
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white group-hover:translate-x-1">
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Bạn đã có lịch đặt trước?</h3>
          <p className="text-xs text-slate-500 mt-0.5">Kiểm tra lại thời gian thi đấu và lớp học đã đăng ký trong thời khóa biểu cá nhân.</p>
        </div>
        <Link
          to="/member/schedule"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          Xem thời khóa biểu của tôi
        </Link>
      </div>
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
      title="Chọn Môn Thể Thao"
      description={`Bước 1 trong 3 · ${isCourt ? 'Chọn bộ môn để xem danh sách sân và khung giờ trống.' : 'Chọn bộ môn để xem các lớp học và thời khóa biểu.'}`}
    >
      <ErrorNotice error={error} />
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4">
              <div className="h-44 w-full rounded-2xl bg-slate-100" />
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : sports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Hiện tại chưa có bộ môn nào đang mở dịch vụ. Vui lòng quay lại sau.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => {
            const media = getSportMedia(sport.slug || sport.code);
            return (
              <button
                key={sport.sportId}
                type="button"
                onClick={() => navigate(`/member/book/${isCourt ? 'courts' : 'classes'}/${sport.sportId}`)}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl cursor-pointer"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={media.image}
                    alt={sport.name}
                    className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
                      <span className="material-symbols-outlined text-[20px]">{sport.icon || 'sports'}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      {media.category}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-headline-sm text-lg font-bold text-slate-900 transition group-hover:text-orange-600">
                    {sport.name}
                  </h2>
                  <p className="mt-1 flex-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {sport.subtitle || sport.description || 'Bộ môn thể thao hiện đại tại F Sport Center.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-orange-600">
                      {isCourt ? 'Xem sân & giờ trống' : 'Xem lớp & thời khóa biểu'}
                    </span>
                    <span className="text-sm font-bold text-orange-600 transition group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </button>
            );
          })}
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
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${selectedDate === date ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
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
                      <h2 className="font-bold text-slate-900">{court.courtName}</h2>
                      <p className="mt-1 text-xs text-slate-500">{court.description}</p>
                    </div>
                    <span className="text-sm font-extrabold text-orange-600">{formatMoney(court.hourlyRate)} / 60 phút</span>
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
                        className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-sm"
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
                    <h2 className="font-bold text-slate-900">{classSession.className}</h2>
                    <p className="mt-1 text-xs text-slate-500">{classSession.coachName || `HLV #${classSession.coachId}`}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    Còn {remaining}/{classSession.maxSlots} chỗ
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Bắt đầu</dt><dd className="text-right font-semibold text-slate-800">{formatDate(classSession.startTime)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Kết thúc</dt><dd className="text-right font-semibold text-slate-800">{new Date(classSession.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Giá/lớp</dt><dd className="font-extrabold text-orange-600">{formatMoney(classSession.priceAmount)}</dd></div>
                </dl>
                <button
                  type="button"
                  disabled={remaining < 1 || alreadyBooked}
                  onClick={() => navigate(`/member/book/checkout/class/${classSession.sessionId}`)}
                  className="mt-5 w-full rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
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
          <div className="text-xs font-bold uppercase tracking-wider text-orange-600">{quote.bookingType === 'COURT' ? 'Đặt sân chơi thể thao' : 'Đăng ký lớp học'}</div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{quote.itemName}</h2>
          <p className="mt-1 text-sm text-slate-500">{quote.sportName}</p>
          <dl className="mt-6 space-y-4 border-y border-slate-100 py-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Thời gian</dt><dd className="text-right font-semibold text-slate-800">{formatDate(quote.startTime)}{bookingType === 'court' && quote.endTime ? ` — ${new Date(quote.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Địa điểm / huấn luyện viên</dt><dd className="text-right font-semibold text-slate-800">{quote.location}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Môn thể thao</dt><dd className="text-right font-semibold text-slate-800">{quote.sportName}</dd></div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-4"><dt className="font-bold text-slate-700">Tổng thanh toán</dt><dd className="text-xl font-extrabold text-orange-600">{formatMoney(quote.amount)}</dd></div>
          </dl>
          <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">info</span>
            <span>Chế độ thanh toán SANDBOX: thao tác xác nhận tạo giao dịch thử nghiệm và booking trong database; chưa trừ tiền thật.</span>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleCheckout}
            className="mt-5 w-full rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 transition disabled:cursor-wait disabled:opacity-60"
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
        <Link to="/member/book" className="inline-flex rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition">Bắt đầu booking</Link>
      </PageFrame>
    );
  }
  return (
    <PageFrame title="Booking đã xác nhận" description="Giao dịch sandbox và lịch hẹn đã được lưu vào database.">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Thanh toán {confirmation.paymentStatus} · {confirmation.referenceCode}
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">{confirmation.itemName}</h2>
        <p className="mt-1 text-sm text-slate-500">{confirmation.sportName} · {confirmation.location}</p>
        <p className="mt-4 text-sm font-semibold text-slate-800">
          {formatDate(confirmation.startTime)} — {new Date(confirmation.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="mt-2 text-2xl font-extrabold text-orange-600">{formatMoney(confirmation.amountPaid)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/member/schedule" className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition">Xem trong thời khóa biểu</Link>
          <Link to="/member/book" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">Đặt dịch vụ khác</Link>
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
